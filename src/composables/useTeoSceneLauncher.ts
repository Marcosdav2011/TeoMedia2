import type { TeoCameraScene } from 'src/types';

import { useTeoScreens } from 'src/composables/useTeoScreens';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { useCurrentStateStore } from 'stores/current-state';
import { useTeoCameraStore } from 'stores/teo-camera';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface SceneCamera {
  deviceId: string;
  label: string;
}

/**
 * Starts saved camera scenes from anywhere in the app. Shared by the Cameras
 * page and the action island so a scene behaves the same in both places.
 *
 * `teoScreens` lets a caller that already tracks screens pass its own
 * instance instead of starting a second screen watcher.
 */
export const useTeoSceneLauncher = (
  teoScreens: ReturnType<typeof useTeoScreens> = useTeoScreens(),
) => {
  const { t } = useI18n();
  const currentState = useCurrentStateStore();
  const teoCamera = useTeoCameraStore();
  const { cameraScreenIndex, screenLabel, screenOptions } = teoScreens;

  const canActivateScene = computed(
    () => cameraScreenIndex.value !== null && !currentState.mediaIsPlaying,
  );

  /** Camera IDs can differ between sessions; the label is the fallback. */
  const resolveSceneCamera = async (
    scene: TeoCameraScene,
  ): Promise<null | SceneCamera> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === 'videoinput');
      const match =
        cameras.find((camera) => camera.deviceId === scene.cameraId) ??
        cameras.find((camera) => camera.label === scene.cameraLabel);
      return match ? { deviceId: match.deviceId, label: match.label } : null;
    } catch {
      return null;
    }
  };

  const sceneScreenIndex = (scene: TeoCameraScene) => {
    // A fixed camera screen assignment wins over whatever the scene saved.
    if (teoCamera.preferredCameraScreen !== null) {
      return cameraScreenIndex.value;
    }
    const requested = scene.screenIndex;
    if (requested === null) return cameraScreenIndex.value;
    const stillConnected = screenOptions.value.some(
      (option) => option.value === requested,
    );
    return stillConnected ? requested : cameraScreenIndex.value;
  };

  const notifyCameraStarted = (screenIndex: number) => {
    createTemporaryNotification({
      caption: t('teo-camera-output-hint'),
      icon: 'mmm-video',
      message: t('teo-camera-sent', {
        screen: screenLabel(screenIndex),
      }),
      type: 'positive',
    });
  };

  const notifyMediaPlaying = () => {
    createTemporaryNotification({
      caption: t('stop-playing-media-first-explain'),
      icon: 'mmm-media',
      message: t('stop-playing-media-first'),
      type: 'warning',
    });
  };

  /**
   * Resolves the scene's camera and screen again before starting it, because
   * the device id can change between sessions and the scene may name a
   * monitor that is no longer connected.
   */
  const launchScene = async (scene: TeoCameraScene): Promise<boolean> => {
    if (currentState.mediaIsPlaying) {
      notifyMediaPlaying();
      return false;
    }

    const camera = await resolveSceneCamera(scene);
    if (!camera) {
      createTemporaryNotification({
        icon: 'mmm-video-off',
        message: t('teo-scene-camera-missing'),
        type: 'warning',
      });
      return false;
    }

    const screenIndex = sceneScreenIndex(scene);
    if (screenIndex === null) return false;

    scene.cameraId = camera.deviceId;
    scene.cameraLabel = camera.label;

    if (!teoCamera.activateScene(scene.id, screenIndex)) {
      notifyMediaPlaying();
      return false;
    }

    notifyCameraStarted(screenIndex);
    return true;
  };

  return { canActivateScene, launchScene, notifyCameraStarted };
};
