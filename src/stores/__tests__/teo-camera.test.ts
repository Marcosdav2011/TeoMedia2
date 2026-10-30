import { installPinia } from 'app/test/vitest/mocks/pinia';
import { toggleMediaWindowVisibility } from 'src/helpers/mediaPlayback';
import {
  postTeoCamera,
  postTeoCameraLayout,
  postTeoCameraView,
  postTeoScreenIdentify,
} from 'src/helpers/teo-outputs';
import { useCurrentStateStore } from 'stores/current-state';
import { useTeoCameraStore } from 'stores/teo-camera';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/helpers/mediaPlayback', () => ({
  toggleMediaWindowVisibility: vi.fn(),
}));

vi.mock('src/helpers/teo-outputs', () => ({
  postTeoCamera: vi.fn(),
  postTeoCameraLayout: vi.fn(),
  postTeoCameraView: vi.fn(),
  postTeoScreenIdentify: vi.fn(),
}));

installPinia({ stubActions: false });

const moveMediaWindowMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  moveMediaWindowMock.mockReset();
  globalThis.electronApi.moveMediaWindow = moveMediaWindowMock;
  useCurrentStateStore().mediaPlaying.url = '';
  useCurrentStateStore().mediaWindowVisible = true;
  useTeoCameraStore().$reset();
});

describe('teo-camera store', () => {
  it('shows, moves and hands the camera to the output window', () => {
    const store = useTeoCameraStore();

    expect(store.startCameraProjection('camera-1', 'USB Camera', 2)).toBe(true);

    expect(store.selectedCameraId).toBe('camera-1');
    expect(store.activeCameraId).toBe('camera-1');
    expect(store.activeCameraLabel).toBe('USB Camera');
    expect(store.activeScreenIndex).toBe(2);
    expect(toggleMediaWindowVisibility).toHaveBeenCalledWith(true);
    expect(moveMediaWindowMock).toHaveBeenCalledWith(2, true);
    expect(postTeoCamera).toHaveBeenCalledWith('camera-1');
  });

  it('refuses to project while media is playing', () => {
    useCurrentStateStore().mediaPlaying.url = 'file:///media/video.mp4';
    const store = useTeoCameraStore();

    expect(store.startCameraProjection('camera-1', 'USB Camera', 1)).toBe(
      false,
    );
    expect(store.activeCameraId).toBeNull();
    expect(toggleMediaWindowVisibility).not.toHaveBeenCalled();
    expect(moveMediaWindowMock).not.toHaveBeenCalled();
    expect(postTeoCamera).not.toHaveBeenCalled();
  });

  it('stops the camera but keeps the selection for the next projection', () => {
    const store = useTeoCameraStore();
    store.startCameraProjection('camera-1', 'USB Camera', 1);
    vi.clearAllMocks();

    store.stopCameraProjection();

    expect(postTeoCamera).toHaveBeenCalledWith('');
    expect(postTeoScreenIdentify).toHaveBeenCalledWith('');
    expect(store.activeCameraId).toBeNull();
    expect(store.activeScreenIndex).toBeNull();
    expect(store.selectedCameraId).toBe('camera-1');
    expect(store.selectedCameraLabel).toBe('USB Camera');
  });

  it('hides the camera for playback but keeps the assignment to resume it', () => {
    const store = useTeoCameraStore();
    store.startCameraProjection('camera-1', 'USB Camera', 2);
    vi.clearAllMocks();

    store.suspendCameraProjection();

    expect(postTeoCamera).toHaveBeenCalledWith('');
    expect(store.activeCameraId).toBe('camera-1');
    expect(store.activeScreenIndex).toBe(2);

    store.resumeCameraProjection();
    expect(postTeoCamera).toHaveBeenCalledWith('camera-1');
  });

  it('returns the camera to its screen after projected media ends', () => {
    const store = useTeoCameraStore();
    store.startCameraProjection('camera-1', 'USB Camera', 2);
    vi.clearAllMocks();

    store.resumeCameraProjection();

    expect(toggleMediaWindowVisibility).not.toHaveBeenCalled();
    expect(moveMediaWindowMock).toHaveBeenCalledWith(2, true);
    expect(postTeoCamera).toHaveBeenCalledWith('camera-1');
    expect(postTeoScreenIdentify).toHaveBeenCalledWith('');
  });

  it('shows the output window again when playback had hidden it', () => {
    const store = useTeoCameraStore();
    store.startCameraProjection('camera-1', 'USB Camera', 2);
    vi.clearAllMocks();
    useCurrentStateStore().mediaWindowVisible = false;

    store.resumeCameraProjection();

    expect(toggleMediaWindowVisibility).toHaveBeenCalledWith(true);
    expect(moveMediaWindowMock).toHaveBeenCalledWith(2, true);
    expect(postTeoCamera).toHaveBeenCalledWith('camera-1');
  });

  it('does nothing on playback end when no camera was active', () => {
    const store = useTeoCameraStore();

    store.resumeCameraProjection();

    expect(toggleMediaWindowVisibility).not.toHaveBeenCalled();
    expect(moveMediaWindowMock).not.toHaveBeenCalled();
    expect(postTeoCamera).not.toHaveBeenCalled();
  });

  it('follows the output window when it moves to another screen', () => {
    const store = useTeoCameraStore();

    store.setActiveScreen(2);
    expect(store.activeScreenIndex).toBeNull();

    store.startCameraProjection('camera-1', 'USB Camera', 1);
    store.setActiveScreen(2);
    expect(store.activeScreenIndex).toBe(2);
  });

  it('saves the selected camera and layout as a scene', () => {
    const store = useTeoCameraStore();
    store.selectedCameraId = 'camera-1';
    store.selectedCameraLabel = 'USB Camera';
    store.selectedLayout = 'pip';
    store.preferredOutputScreen = 2;

    const scene = store.addScene('  Pulpit  ');

    expect(scene).toMatchObject({
      cameraId: 'camera-1',
      cameraLabel: 'USB Camera',
      layout: 'pip',
      name: 'Pulpit',
      screenIndex: 2,
    });
    expect(store.scenes).toEqual([scene]);
  });

  it('needs a name and a camera to save a scene', () => {
    const store = useTeoCameraStore();
    store.selectedCameraId = 'camera-1';

    expect(store.addScene('   ')).toBeNull();
    store.selectedCameraId = null;
    expect(store.addScene('Pulpit')).toBeNull();
    expect(store.scenes).toHaveLength(0);
  });

  it('starts a scene with its camera, screen and layout', () => {
    const store = useTeoCameraStore();
    store.selectedCameraId = 'camera-1';
    store.selectedCameraLabel = 'USB Camera';
    store.selectedLayout = 'split';
    const scene = store.addScene('Split view');
    if (!scene) throw new Error('scene was not saved');
    vi.clearAllMocks();

    expect(store.activateScene(scene.id, 2)).toBe(true);

    expect(store.activeCameraId).toBe('camera-1');
    expect(store.activeSceneId).toBe(scene.id);
    expect(store.activeScreenIndex).toBe(2);
    expect(postTeoCameraLayout).toHaveBeenCalledWith('split');
    expect(postTeoCamera).toHaveBeenCalledWith('camera-1');
  });

  it('changes the layout of a running camera without reopening it', () => {
    const store = useTeoCameraStore();
    store.startCameraProjection('camera-1', 'USB Camera', 2, 'fullscreen');
    vi.clearAllMocks();

    store.setSelectedLayout('pip');

    expect(postTeoCameraLayout).toHaveBeenCalledWith('pip');
    expect(postTeoCamera).not.toHaveBeenCalled();
    expect(store.activeCameraId).toBe('camera-1');
  });

  it('keeps the camera running when its scene is deleted', () => {
    const store = useTeoCameraStore();
    store.selectedCameraId = 'camera-1';
    const scene = store.addScene('Pulpit');
    if (!scene) throw new Error('scene was not saved');
    store.activateScene(scene.id, 2);

    store.removeScene(scene.id);

    expect(store.scenes).toHaveLength(0);
    expect(store.activeSceneId).toBeNull();
    expect(store.activeCameraId).toBe('camera-1');
  });

  it('keeps the framing within what the zoom can cover', () => {
    const store = useTeoCameraStore();

    store.setCameraView({ panX: 90, panY: -90, zoom: 2 });
    expect(store.view).toEqual({ panX: 50, panY: -50, zoom: 2 });

    store.setCameraView({ panX: 0, panY: 0, zoom: 9 });
    expect(store.view).toEqual({ panX: 0, panY: 0, zoom: 3 });

    store.setCameraView({ zoom: 0.5 });
    expect(store.view).toEqual({ panX: 0, panY: 0, zoom: 1 });
  });

  it('saves the current framing with a scene and restores it', () => {
    const store = useTeoCameraStore();
    store.selectedCameraId = 'camera-1';
    store.setCameraView({ panX: 5, panY: -4, zoom: 2 });

    const scene = store.addScene('Pulpit');
    if (!scene) throw new Error('scene was not saved');
    expect(scene.view).toEqual({ panX: 5, panY: -4, zoom: 2 });

    store.setCameraView({ panX: 0, panY: 0, zoom: 1 });
    vi.clearAllMocks();

    expect(store.activateScene(scene.id, 2)).toBe(true);
    expect(store.view).toEqual({ panX: 5, panY: -4, zoom: 2 });
    expect(postTeoCameraView).toHaveBeenCalledWith({
      panX: 5,
      panY: -4,
      zoom: 2,
    });
  });

  it('changes the framing of a running camera live', () => {
    const store = useTeoCameraStore();
    store.selectedCameraId = 'camera-1';
    const scene = store.addScene('Pulpit');
    if (!scene) throw new Error('scene was not saved');
    store.activateScene(scene.id, 2);
    vi.clearAllMocks();

    store.setCameraView({ panX: 10, panY: 0, zoom: 1.5 });

    expect(postTeoCameraView).toHaveBeenCalledWith({
      panX: 10,
      panY: 0,
      zoom: 1.5,
    });
    expect(store.activeSceneId).toBeNull();
    expect(store.activeCameraId).toBe('camera-1');
  });

  it('restores the framing when the camera returns after playback', () => {
    const store = useTeoCameraStore();
    store.setCameraView({ panX: 4, panY: -3, zoom: 2 });
    store.startCameraProjection('camera-1', 'USB Camera', 2);
    vi.clearAllMocks();

    store.resumeCameraProjection();

    expect(postTeoCameraView).toHaveBeenCalledWith({
      panX: 4,
      panY: -3,
      zoom: 2,
    });
  });

  it('overwrites a saved scene with the current setup', () => {
    const store = useTeoCameraStore();
    store.selectedCameraId = 'camera-1';
    store.selectedCameraLabel = 'USB Camera';
    store.selectedLayout = 'fullscreen';
    store.preferredOutputScreen = 2;
    const scene = store.addScene('Pulpit');
    if (!scene) throw new Error('scene was not saved');

    store.selectedCameraId = 'camera-2';
    store.selectedCameraLabel = 'HDMI Camera';
    store.selectedLayout = 'split';
    store.preferredOutputScreen = 1;
    store.setCameraView({ panX: 10, panY: 0, zoom: 2 });

    expect(store.updateScene(scene.id)).toBe(true);
    expect(store.scenes[0]).toMatchObject({
      cameraId: 'camera-2',
      cameraLabel: 'HDMI Camera',
      layout: 'split',
      name: 'Pulpit',
      screenIndex: 1,
      view: { panX: 10, panY: 0, zoom: 2 },
    });
  });

  it('updates a scene with the live output screen while its camera runs', () => {
    const store = useTeoCameraStore();
    store.selectedCameraId = 'camera-1';
    store.selectedCameraLabel = 'USB Camera';
    const scene = store.addScene('Pulpit');
    if (!scene) throw new Error('scene was not saved');
    store.startCameraProjection('camera-1', 'USB Camera', 2);
    store.setActiveScreen(0);

    expect(store.updateScene(scene.id)).toBe(true);
    expect(store.scenes[0]?.screenIndex).toBe(0);
  });

  it('needs an existing scene and a camera to update it', () => {
    const store = useTeoCameraStore();
    store.selectedCameraId = 'camera-1';
    const scene = store.addScene('Pulpit');
    if (!scene) throw new Error('scene was not saved');

    expect(store.updateScene('missing-scene')).toBe(false);
    store.selectedCameraId = null;
    expect(store.updateScene(scene.id)).toBe(false);
    expect(store.scenes[0]?.cameraId).toBe('camera-1');
  });

  it('hands the output back to the multimedia screen when the camera stops', () => {
    const store = useTeoCameraStore();
    store.preferredOutputScreen = 1;
    store.startCameraProjection('camera-1', 'USB Camera', 2);
    vi.clearAllMocks();

    store.stopCameraProjection();

    expect(moveMediaWindowMock).toHaveBeenCalledWith(1, true);
  });

  it('saves scenes on the assigned camera screen, not the media screen', () => {
    const store = useTeoCameraStore();
    store.selectedCameraId = 'camera-1';
    store.preferredOutputScreen = 1;
    store.preferredCameraScreen = 2;

    const scene = store.addScene('Pulpit');

    expect(scene?.screenIndex).toBe(2);
  });

  it('updates scenes with the assigned camera screen while idle', () => {
    const store = useTeoCameraStore();
    store.selectedCameraId = 'camera-1';
    store.preferredOutputScreen = 1;
    store.preferredCameraScreen = 2;
    const scene = store.addScene('Pulpit');
    if (!scene) throw new Error('scene was not saved');

    store.preferredOutputScreen = 0;

    expect(store.updateScene(scene.id)).toBe(true);
    expect(store.scenes[0]?.screenIndex).toBe(2);
  });
});
