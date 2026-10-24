import { useBroadcastChannel } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useTeoScreens } from 'src/composables/useTeoScreens';
import { toggleMediaWindowVisibility } from 'src/helpers/mediaPlayback';
import { createTemporaryNotification } from 'src/helpers/notifications';
import {
  type MediaPlayingState,
  useCurrentStateStore,
} from 'stores/current-state';
import { useTeoCameraStore } from 'stores/teo-camera';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export const TEO_TEST_MEDIA_UNIQUE_ID = 'teo-output-test';

// Bundled with the app (public/demo), so the check never depends on a
// congregation profile, a download, or a network connection.
const TEO_TEST_MEDIA_URL = 'demo/teo-demo-video.mp4';

const emptyMediaPlayingState = (): MediaPlayingState => ({
  action: '',
  currentPosition: 0,
  currentPositionUpdatedAt: 0,
  duration: 0,
  pan: { x: 0, y: 0 },
  playbackConfirmedToken: 0,
  playbackRate: 1,
  playToken: 0,
  seekTo: 0,
  shouldLoop: false,
  slideshowAudioUrl: '',
  subtitlesUrl: '',
  uniqueId: '',
  url: '',
  zoom: 1,
});

/**
 * Sends a short bundled video straight to the output window, bypassing the
 * meeting media pipeline. Useful to confirm that the output screen is wired
 * up before a meeting, and as the first thing to try when playback is
 * reported as broken.
 */
export const useTeoPlaybackTest = () => {
  const { t } = useI18n();
  const currentState = useCurrentStateStore();
  const teoCamera = useTeoCameraStore();
  const { mediaIsPlaying, mediaPlaying } = storeToRefs(currentState);

  const { activateOutput, hasOutputScreen, preferredScreenIndex, screenLabel } =
    useTeoScreens();

  const { post: postMediaAction } = useBroadcastChannel<string, string>({
    name: 'main-window-media-action',
  });
  const { post: postMediaUrl } = useBroadcastChannel<string, string>({
    name: 'media-url',
  });

  const isTesting = computed(
    () =>
      mediaPlaying.value.uniqueId === TEO_TEST_MEDIA_UNIQUE_ID &&
      !!mediaPlaying.value.url,
  );

  // A freshly created output window may still be loading when the first post
  // goes out, so repeat the state a few times while the test is active.
  const postTestState = () => {
    postMediaUrl(TEO_TEST_MEDIA_URL);
    postMediaAction('play');
  };

  const postTestStateWithRetries = () => {
    postTestState();
    for (const delay of [300, 900, 1800]) {
      setTimeout(() => {
        if (isTesting.value) postTestState();
      }, delay);
    }
  };

  const stopTest = () => {
    if (!isTesting.value) return;
    postMediaAction('');
    postMediaUrl('');
    mediaPlaying.value = emptyMediaPlayingState();
    // Keep the output on screen with the yeartext, as TEO always does.
    toggleMediaWindowVisibility(true);
  };

  const startTest = () => {
    if (!hasOutputScreen.value) return false;

    if (mediaIsPlaying.value && !isTesting.value) {
      createTemporaryNotification({
        caption: t('stop-playing-media-first-explain'),
        icon: 'mmm-media',
        message: t('stop-playing-media-first'),
        type: 'warning',
      });
      return false;
    }

    // Keep the camera assignment so it can come back when the test ends.
    teoCamera.suspendCameraProjection();

    const screenIndex = preferredScreenIndex.value;
    mediaPlaying.value = {
      ...emptyMediaPlayingState(),
      action: 'play',
      shouldLoop: true,
      uniqueId: TEO_TEST_MEDIA_UNIQUE_ID,
      url: TEO_TEST_MEDIA_URL,
    };

    if (screenIndex !== null) activateOutput(screenIndex);
    toggleMediaWindowVisibility(true);
    postTestStateWithRetries();

    const screen =
      screenIndex === null ? t('teo-output-screen') : screenLabel(screenIndex);
    createTemporaryNotification({
      caption: t('teo-test-running'),
      icon: 'mmm-fullscreen',
      message: t('teo-test-sent', { screen }),
      timeout: 8000,
      type: 'positive',
    });
    return true;
  };

  return {
    hasOutputScreen,
    isTesting,
    startTest,
    stopTest,
  };
};
