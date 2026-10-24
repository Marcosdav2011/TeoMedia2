import { installPinia } from 'app/test/vitest/mocks/pinia';
import { toggleMediaWindowVisibility } from 'src/helpers/mediaPlayback';
import { postTeoCamera, postTeoScreenIdentify } from 'src/helpers/teo-outputs';
import { useCurrentStateStore } from 'stores/current-state';
import { useTeoCameraStore } from 'stores/teo-camera';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/helpers/mediaPlayback', () => ({
  toggleMediaWindowVisibility: vi.fn(),
}));

vi.mock('src/helpers/teo-outputs', () => ({
  postTeoCamera: vi.fn(),
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
});
