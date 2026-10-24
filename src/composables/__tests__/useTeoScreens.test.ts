import type { Display, ElectronApi } from 'src/types';

import { flushPromises, mount } from '@vue/test-utils';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { toggleMediaWindowVisibility } from 'src/helpers/mediaPlayback';
import { postTeoScreenIdentify } from 'src/helpers/teo-outputs';
import { useAppSettingsStore } from 'stores/app-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useTeoCameraStore } from 'stores/teo-camera';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { useTeoScreens } from '../useTeoScreens';

vi.mock('src/helpers/mediaPlayback', () => ({
  toggleMediaWindowVisibility: vi.fn(),
}));

vi.mock('src/helpers/teo-outputs', () => ({
  postTeoCamera: vi.fn(),
  postTeoScreenIdentify: vi.fn(),
}));

installPinia();

const getAllScreensMock = vi.fn<() => Promise<Display[]>>();
const moveMediaWindowMock = vi.fn<ElectronApi['moveMediaWindow']>();
const toggleAuxiliaryWindowMock = vi.fn<ElectronApi['toggleAuxiliaryWindow']>();

const display = (
  id: number,
  x: number,
  y: number,
  width: number,
  height: number,
  mainWindow = false,
  displayNumber = 0,
  mediaWindow = false,
  mediaWindowVisible = false,
) =>
  ({
    bounds: { height, width, x, y },
    displayNumber,
    id,
    mainWindow,
    mediaWindow,
    mediaWindowBounds: mediaWindow ? { height, width, x, y } : undefined,
    mediaWindowVisible,
  }) as Display;

// Same order `getAllScreens` returns: sorted left-to-right, with the OS
// display number retained separately.
const screens: Display[] = [
  display(2, -1920, 0, 1920, 1080, false, 2),
  display(1, 0, 0, 1920, 1080, true, 1),
  display(3, 1920, 0, 1024, 768, false, 3),
];

const mountComposable = async () => {
  let teo!: ReturnType<typeof useTeoScreens>;
  const wrapper = mount(
    defineComponent({
      setup() {
        teo = useTeoScreens();
        return () => h('div');
      },
    }),
  );
  await flushPromises();
  return { teo, wrapper };
};

beforeEach(() => {
  vi.clearAllMocks();
  getAllScreensMock.mockReset();
  getAllScreensMock.mockResolvedValue(screens);
  moveMediaWindowMock.mockReset();
  toggleAuxiliaryWindowMock.mockReset();
  globalThis.electronApi.getAllScreens = getAllScreensMock;
  globalThis.electronApi.moveMediaWindow = moveMediaWindowMock;
  globalThis.electronApi.toggleAuxiliaryWindow = toggleAuxiliaryWindowMock;
  useCurrentStateStore().mediaPlaying.url = '';
  useAppSettingsStore().screenPreferences.preferredScreenNumber = 0;
  useTeoCameraStore().$reset();
});

describe('useTeoScreens', () => {
  it('defaults to physical screen 2 and skips the main-window screen', async () => {
    const { teo } = await mountComposable();

    expect(teo.screenOptions.value).toEqual([
      { label: 'Screen 2 · 1920 × 1080', value: 0 },
      { label: 'Screen 3 · 1024 × 768', value: 2 },
    ]);
    expect(teo.preferredScreenIndex.value).toBe(0);
    expect(teo.hasOutputScreen.value).toBe(true);
  });

  it('keeps a previously chosen output screen', async () => {
    useTeoCameraStore().preferredOutputScreen = 2;

    const { teo } = await mountComposable();

    expect(teo.preferredScreenIndex.value).toBe(2);
  });

  it('moves and shows the output window on the chosen screen', async () => {
    const { teo } = await mountComposable();
    const appSettings = useAppSettingsStore();
    const teoCamera = useTeoCameraStore();

    teo.selectScreen(2);

    expect(appSettings.screenPreferences.preferredScreenNumber).toBe(2);
    expect(teoCamera.preferredOutputScreen).toBe(2);
    expect(toggleMediaWindowVisibility).toHaveBeenCalledWith(true);
    expect(moveMediaWindowMock).toHaveBeenCalledWith(2, true);

    // The main-window screen must never become an output target.
    vi.clearAllMocks();
    teo.selectScreen(1);
    expect(toggleMediaWindowVisibility).not.toHaveBeenCalled();
    expect(moveMediaWindowMock).not.toHaveBeenCalled();
  });

  it('activates the output on the default screen and persists it', async () => {
    const { teo } = await mountComposable();
    const teoCamera = useTeoCameraStore();

    expect(teo.activateOutput()).toBe(0);

    expect(toggleMediaWindowVisibility).toHaveBeenCalledWith(true);
    expect(moveMediaWindowMock).toHaveBeenCalledWith(0, true);
    expect(postTeoScreenIdentify).toHaveBeenCalledWith('');
    expect(teoCamera.preferredOutputScreen).toBe(0);
  });

  it('does not move an output already active fullscreen on the chosen screen', async () => {
    getAllScreensMock.mockResolvedValue([
      display(2, -1920, 0, 1920, 1080, false, 2, true, true),
      display(1, 0, 0, 1920, 1080, true, 1),
      display(3, 1920, 0, 1024, 768, false, 3),
    ]);
    const { teo } = await mountComposable();
    vi.clearAllMocks();

    expect(teo.activateOutput()).toBe(0);

    // A needless fullscreen transition here would interrupt playback.
    expect(toggleMediaWindowVisibility).not.toHaveBeenCalled();
    expect(moveMediaWindowMock).not.toHaveBeenCalled();
  });

  it('shows the output again when it is on screen but hidden', async () => {
    getAllScreensMock.mockResolvedValue([
      display(2, -1920, 0, 1920, 1080, false, 2, true, false),
      display(1, 0, 0, 1920, 1080, true, 1),
      display(3, 1920, 0, 1024, 768, false, 3),
    ]);
    const { teo } = await mountComposable();
    vi.clearAllMocks();

    expect(teo.activateOutput()).toBe(0);

    expect(toggleMediaWindowVisibility).toHaveBeenCalledWith(true);
    expect(moveMediaWindowMock).toHaveBeenCalledWith(0, true);
  });

  it('activates a requested monitor and persists it', async () => {
    const { teo } = await mountComposable();
    const teoCamera = useTeoCameraStore();
    vi.clearAllMocks();

    expect(teo.activateOutput(2)).toBe(2);

    expect(teoCamera.preferredOutputScreen).toBe(2);
    expect(moveMediaWindowMock).toHaveBeenCalledWith(2, true);
  });

  it('uses the remaining external screen as the second output', async () => {
    const { teo } = await mountComposable();

    expect(teo.hasAuxiliaryScreen.value).toBe(true);
    expect(teo.auxiliaryScreenIndex.value).toBe(2);

    expect(teo.activateAuxiliaryOutput()).toBe(2);
    expect(toggleAuxiliaryWindowMock).toHaveBeenCalledWith(true, 2);
  });

  it('moves the second output to the other screen when the primary moves', async () => {
    useTeoCameraStore().preferredOutputScreen = 2;
    const { teo } = await mountComposable();

    expect(teo.auxiliaryScreenIndex.value).toBe(0);
    expect(teo.activateAuxiliaryOutput()).toBe(0);
    expect(toggleAuxiliaryWindowMock).toHaveBeenCalledWith(true, 0);
  });

  it('has no second output with only one external screen', async () => {
    getAllScreensMock.mockResolvedValue([
      display(2, -1920, 0, 1920, 1080, false, 2),
      display(1, 0, 0, 1920, 1080, true, 1),
    ]);
    const { teo } = await mountComposable();

    expect(teo.hasAuxiliaryScreen.value).toBe(false);
    expect(teo.auxiliaryScreenIndex.value).toBeNull();
    expect(teo.activateAuxiliaryOutput()).toBeNull();
    expect(toggleAuxiliaryWindowMock).not.toHaveBeenCalled();
  });

  it('identifies the screen only while idle', async () => {
    const { teo } = await mountComposable();
    const currentState = useCurrentStateStore();
    const teoCamera = useTeoCameraStore();

    teo.identifyScreen(2);
    expect(postTeoScreenIdentify).toHaveBeenCalledWith('Screen 3\n1024 × 768');

    vi.clearAllMocks();
    currentState.mediaPlaying.url = 'file:///media/video.mp4';
    teo.identifyScreen(2);
    // Activation clears any leftover overlay but must not show the number
    // over running media.
    expect(postTeoScreenIdentify).toHaveBeenCalledTimes(1);
    expect(postTeoScreenIdentify).toHaveBeenCalledWith('');
    expect(moveMediaWindowMock).toHaveBeenCalledWith(2, true);

    vi.clearAllMocks();
    currentState.mediaPlaying.url = '';
    teoCamera.activeCameraId = 'camera-1';
    teo.identifyScreen(2);
    expect(postTeoScreenIdentify).toHaveBeenCalledTimes(1);
    expect(postTeoScreenIdentify).toHaveBeenCalledWith('');
  });
});
