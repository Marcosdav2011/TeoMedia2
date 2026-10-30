import type { Display, ElectronApi } from 'src/types';

import { flushPromises, mount } from '@vue/test-utils';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { createTemporaryNotification } from 'src/helpers/notifications';
import {
  postTeoCamera,
  postTeoCameraLayout,
  postTeoCameraView,
} from 'src/helpers/teo-outputs';
import { useCurrentStateStore } from 'stores/current-state';
import { useTeoCameraStore } from 'stores/teo-camera';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { useTeoSceneLauncher } from '../useTeoSceneLauncher';

vi.mock('src/helpers/mediaPlayback', () => ({
  toggleMediaWindowVisibility: vi.fn(),
}));

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: vi.fn(),
}));

vi.mock('src/helpers/teo-outputs', () => ({
  postTeoCamera: vi.fn(),
  postTeoCameraLayout: vi.fn(),
  postTeoCameraView: vi.fn(),
  postTeoScreenIdentify: vi.fn(),
}));

installPinia({ stubActions: false });

const getAllScreensMock = vi.fn<() => Promise<Display[]>>();
const moveMediaWindowMock = vi.fn<ElectronApi['moveMediaWindow']>();
const toggleAuxiliaryWindowMock = vi.fn<ElectronApi['toggleAuxiliaryWindow']>();
const enumerateDevicesMock = vi.fn<() => Promise<MediaDeviceInfo[]>>();

const display = (
  id: number,
  x: number,
  width: number,
  mainWindow = false,
  displayNumber = 0,
) =>
  ({
    bounds: { height: 1080, width, x, y: 0 },
    displayNumber,
    id,
    mainWindow,
  }) as Display;

const screens: Display[] = [
  display(2, -1920, 1920, false, 2),
  display(1, 0, 1920, true, 1),
];

const camera = (deviceId: string, label: string) =>
  ({ deviceId, kind: 'videoinput', label }) as MediaDeviceInfo;

const mountLauncher = async () => {
  let launcher!: ReturnType<typeof useTeoSceneLauncher>;
  const wrapper = mount(
    defineComponent({
      setup() {
        launcher = useTeoSceneLauncher();
        return () => h('div');
      },
    }),
  );
  await flushPromises();
  return { launcher, wrapper };
};

const createScene = (
  layout: 'fullscreen' | 'pip' | 'split',
  screenIndex = 0,
) => {
  const store = useTeoCameraStore();
  store.selectedCameraId = 'old-camera-id';
  store.selectedCameraLabel = 'USB Camera';
  store.selectedLayout = layout;
  store.preferredOutputScreen = screenIndex;
  const scene = store.addScene('Pulpit');
  if (!scene) throw new Error('scene was not saved');
  return scene;
};

beforeEach(() => {
  vi.clearAllMocks();
  getAllScreensMock.mockReset();
  getAllScreensMock.mockResolvedValue(screens);
  moveMediaWindowMock.mockReset();
  toggleAuxiliaryWindowMock.mockReset();
  enumerateDevicesMock.mockReset();
  globalThis.electronApi.getAllScreens = getAllScreensMock;
  globalThis.electronApi.moveMediaWindow = moveMediaWindowMock;
  globalThis.electronApi.toggleAuxiliaryWindow = toggleAuxiliaryWindowMock;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { enumerateDevices: enumerateDevicesMock },
  });
  useCurrentStateStore().mediaPlaying.url = '';
  useTeoCameraStore().$reset();
});

describe('useTeoSceneLauncher', () => {
  it('starts a scene with the camera whose id changed and its saved setup', async () => {
    const scene = createScene('split');
    enumerateDevicesMock.mockResolvedValue([
      camera('new-camera-id', 'USB Camera'),
    ]);
    const { launcher } = await mountLauncher();

    await expect(launcher.launchScene(scene)).resolves.toBe(true);

    const store = useTeoCameraStore();
    expect(store.activeCameraId).toBe('new-camera-id');
    expect(store.activeSceneId).toBe(scene.id);
    expect(store.activeScreenIndex).toBe(0);
    expect(postTeoCamera).toHaveBeenCalledWith('new-camera-id');
    expect(postTeoCameraLayout).toHaveBeenCalledWith('split');
    expect(postTeoCameraView).toHaveBeenCalled();
  });

  it('refuses to start a scene while media is playing', async () => {
    const scene = createScene('pip');
    useCurrentStateStore().mediaPlaying.url = 'file:///media/video.mp4';
    const { launcher } = await mountLauncher();

    await expect(launcher.launchScene(scene)).resolves.toBe(false);

    expect(useTeoCameraStore().activeCameraId).toBeNull();
    expect(postTeoCamera).not.toHaveBeenCalled();
    expect(createTemporaryNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'warning' }),
    );
  });

  it('falls back to the preferred screen when the saved one is gone', async () => {
    const scene = createScene('pip', 7);
    enumerateDevicesMock.mockResolvedValue([camera('camera-1', 'USB Camera')]);
    const { launcher } = await mountLauncher();

    await expect(launcher.launchScene(scene)).resolves.toBe(true);

    expect(useTeoCameraStore().activeScreenIndex).toBe(0);
    expect(moveMediaWindowMock).toHaveBeenCalledWith(0, true);
  });

  it('warns and does nothing when the scene camera is not connected', async () => {
    const scene = createScene('fullscreen');
    enumerateDevicesMock.mockResolvedValue([
      camera('other-camera', 'Other Camera'),
    ]);
    const { launcher } = await mountLauncher();

    await expect(launcher.launchScene(scene)).resolves.toBe(false);

    expect(useTeoCameraStore().activeCameraId).toBeNull();
    expect(postTeoCamera).not.toHaveBeenCalled();
    expect(createTemporaryNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'warning' }),
    );
  });
});
