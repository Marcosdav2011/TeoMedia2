import type { Display } from 'src/types';

import { flushPromises, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import { errorCatcher } from 'src/helpers/error-catcher';
import { toggleMediaWindowVisibility } from 'src/helpers/mediaPlayback';
import { useAppSettingsStore } from 'stores/app-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useTeoCameraStore } from 'stores/teo-camera';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import DialogDisplayPopup from '../DialogDisplayPopup.vue';

vi.mock('src/helpers/mediaPlayback', () => ({
  toggleMediaWindowVisibility: vi.fn(),
}));

installQuasarPlugin();
installPinia({ stubActions: false });

const getAllScreensMock = vi.fn<() => Promise<Display[]>>();
const moveMediaWindowMock = vi.fn();

// The component destructures `getAllScreens` from `globalThis.electronApi`
// during setup, so it must be replaced before `mount` runs.
const installElectronApiMocks = () => {
  globalThis.electronApi.getAllScreens = getAllScreensMock;
  globalThis.electronApi.moveMediaWindow = moveMediaWindowMock;
};

let wrapper: ReturnType<typeof mount<typeof DialogDisplayPopup>> | undefined;

// Open the popup the way a user would (closed -> open), which registers the
// screen-trigger-update listener and fires the initial fetchScreens().
const openPopup = async () => {
  wrapper = mount(DialogDisplayPopup, {
    props: { dialogId: 'display-popup', modelValue: false },
  });
  await wrapper.setProps({ modelValue: true });
};

const closePopup = async () => {
  await wrapper?.setProps({ modelValue: false });
  wrapper?.unmount();
  wrapper = undefined;
};

// QMenu teleports its content to document.body, outside the wrapper's tree.
const findButton = (label: string) => {
  const button = Array.from(document.querySelectorAll('button')).find((el) =>
    el.textContent?.includes(label),
  );
  if (!button) throw new Error(`No button found with label "${label}"`);
  return button;
};

const statusLine = () =>
  document.querySelector('.action-popup__status')?.textContent ?? '';

const triggerScreenUpdate = () => {
  globalThis.dispatchEvent(new CustomEvent('screen-trigger-update'));
};

beforeEach(() => {
  vi.clearAllMocks();
  getAllScreensMock.mockReset();
  moveMediaWindowMock.mockReset();
  installElectronApiMocks();
});

afterEach(async () => {
  await closePopup();
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('DialogDisplayPopup - getAllScreens freeze resilience', () => {
  it('does not pile up overlapping getAllScreens IPC calls while one is in flight', async () => {
    let resolveFirst: ((screens: Display[]) => void) | undefined;
    getAllScreensMock.mockImplementationOnce(
      () =>
        new Promise<Display[]>((resolve) => {
          resolveFirst = resolve;
        }),
    );

    await openPopup();
    expect(getAllScreensMock).toHaveBeenCalledTimes(1);

    // A burst of screen-trigger-update events (display churn while the main
    // process is wedged) must not stack up more IPC round-trips.
    for (let i = 0; i < 5; i++) {
      triggerScreenUpdate();
    }
    await flushPromises();

    expect(getAllScreensMock).toHaveBeenCalledTimes(1);

    // Once the in-flight fetch settles, the guard releases and a later event
    // is allowed to start a fresh fetch.
    getAllScreensMock.mockResolvedValue([]);
    resolveFirst?.([]);
    await flushPromises();

    triggerScreenUpdate();
    await flushPromises();

    expect(getAllScreensMock).toHaveBeenCalledTimes(2);
  });

  it('times out a hung getAllScreens and releases the in-flight guard', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    // A wedged main process never answers the invoke.
    getAllScreensMock.mockReturnValue(
      new Promise<Display[]>(() => {
        // Intentionally never settles.
      }),
    );

    await openPopup();
    expect(getAllScreensMock).toHaveBeenCalledTimes(1);

    // The renderer must not wait forever; after the 5s timeout it reports the
    // error and the guard is released in `finally`.
    await vi.advanceTimersByTimeAsync(5000);

    expect(errorCatcher).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'getAllScreens timed out' }),
    );

    getAllScreensMock.mockResolvedValue([]);
    triggerScreenUpdate();
    await vi.advanceTimersByTimeAsync(0);

    expect(getAllScreensMock).toHaveBeenCalledTimes(2);
  });
});

describe('DialogDisplayPopup - custom background picker', () => {
  // The picker's visibility used to be a getter-only computed, so the
  // v-model write from BaseDialog (Esc / backdrop click) was silently
  // ignored and the picker could not be dismissed that way.
  it('closes and clears the import state when BaseDialog requests closing', async () => {
    getAllScreensMock.mockResolvedValue([]);
    await openPopup();

    const state = wrapper?.vm as unknown as {
      jwpubImages: { FilePath: string }[];
      jwpubImportFilePath: string;
    };
    state.jwpubImportFilePath = '/tmp/publication.jwpub';
    state.jwpubImages = [{ FilePath: '/tmp/publication/image.jpg' }];
    await nextTick();

    const picker = wrapper?.findComponent(BaseDialog);
    expect(picker?.props('modelValue')).toBe(true);

    picker?.vm.$emit('update:modelValue', false);
    await nextTick();

    expect(picker?.props('modelValue')).toBe(false);
    expect(state.jwpubImportFilePath).toBe('');
    expect(state.jwpubImages).toEqual([]);
  });
});

describe('DialogDisplayPopup - fixed screen assignments', () => {
  const externalScreen = (id: number, displayNumber: number): Display =>
    ({
      bounds: { height: 1080, width: 1920, x: id * 1920, y: 0 },
      displayNumber,
      id,
      mainWindow: false,
      mediaWindow: false,
      mediaWindowVisible: false,
    }) as Display;

  it('assigns multimedia and camera to different screens and keeps them fixed', async () => {
    getAllScreensMock.mockResolvedValue([
      externalScreen(2, 2),
      { ...externalScreen(1, 1), mainWindow: true },
      externalScreen(3, 3),
    ]);
    await openPopup();
    await flushPromises();

    const state = wrapper?.vm as unknown as {
      cameraScreenModel: null | number;
      mediaScreenModel: null | number;
      screenRoleOptions: { label: string; value: number }[];
    };

    expect(state.screenRoleOptions.map(({ value }) => value)).toEqual([0, 2]);

    state.mediaScreenModel = 2;
    await nextTick();

    const appSettings = useAppSettingsStore();
    const teoCamera = useTeoCameraStore();
    expect(appSettings.screenPreferences.preferredScreenNumber).toBe(2);
    expect(teoCamera.preferredOutputScreen).toBe(2);
    expect(moveMediaWindowMock).toHaveBeenCalledWith(2, true);

    state.cameraScreenModel = 0;
    await nextTick();
    expect(teoCamera.preferredCameraScreen).toBe(0);

    // A projecting camera follows its own screen, so changing the multimedia
    // assignment must not pull the output window away from it.
    teoCamera.activeCameraId = 'camera-1';
    vi.clearAllMocks();
    state.cameraScreenModel = 2;
    await nextTick();
    expect(teoCamera.activeScreenIndex).toBe(2);
    expect(moveMediaWindowMock).toHaveBeenCalledWith(2, true);

    vi.clearAllMocks();
    state.mediaScreenModel = 0;
    await nextTick();
    expect(teoCamera.preferredOutputScreen).toBe(0);
    expect(moveMediaWindowMock).not.toHaveBeenCalled();
  });
});

describe('DialogDisplayPopup - status line and footer', () => {
  it('says whether and where the media display is shown, and shows or hides it from the footer', async () => {
    getAllScreensMock.mockResolvedValue([]);
    const currentState = useCurrentStateStore();
    currentState.mediaWindowVisible = false;
    await openPopup();
    await flushPromises();

    expect(statusLine()).toContain('Inactive · Windowed');
    findButton('Show media display').click();
    expect(toggleMediaWindowVisibility).toHaveBeenLastCalledWith(true);

    currentState.mediaWindowVisible = true;
    await flushPromises();

    expect(statusLine()).toContain('Projecting · Windowed');
    findButton('Hide media display').click();
    expect(toggleMediaWindowVisibility).toHaveBeenLastCalledWith(false);
  });

  it('offers to remove a custom background once one is set', async () => {
    getAllScreensMock.mockResolvedValue([]);
    const currentState = useCurrentStateStore();
    currentState.mediaWindowCustomBackground = 'file:///tmp/background.jpg';
    await openPopup();
    await flushPromises();

    expect(() => findButton('Select a custom background')).toThrow();
    findButton('Remove custom background').click();
    await flushPromises();

    expect(currentState.mediaWindowCustomBackground).toBe('');
    expect(findButton('Select a custom background')).toBeDefined();
  });
});
