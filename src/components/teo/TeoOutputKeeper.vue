<template>
  <span aria-hidden="true" class="teo-output-keeper" />
</template>

<script setup lang="ts">
import type { Display } from 'src/types';

import { useBroadcastChannel } from '@vueuse/core';
import { useTeoScreens } from 'src/composables/useTeoScreens';
import { createTemporaryNotification } from 'src/helpers/notifications';
import {
  TEO_CAPTURE_STATUS_CHANNEL,
  type TeoCaptureStatusMessage,
} from 'src/helpers/teo-outputs';
import { syncZoomOutputSharing } from 'src/helpers/zoom';
import { useCurrentStateStore } from 'stores/current-state';
import { useTeoCameraStore } from 'stores/teo-camera';
import { useTeoCaptureStore } from 'stores/teo-capture';
import { onBeforeUnmount, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const currentState = useCurrentStateStore();
const teoCamera = useTeoCameraStore();
const teoCapture = useTeoCaptureStore();

const {
  activateAuxiliaryOutput,
  activateOutput,
  auxiliaryScreenIndex,
  cameraScreenIndex,
  fetchScreens,
  preferredScreenIndex,
  screens,
} = useTeoScreens();

const screenLayoutSignature = (list: Display[]) =>
  list
    .map(
      (screen) =>
        `${screen.id}:${screen.bounds.x},${screen.bounds.y},${screen.bounds.width},${screen.bounds.height}`,
    )
    .join('|');

const { data: captureStatus } = useBroadcastChannel<
  TeoCaptureStatusMessage,
  TeoCaptureStatusMessage
>({ name: TEO_CAPTURE_STATUS_CHANNEL });

let lastScreenLayout = '';
const activationTimers: ReturnType<typeof setTimeout>[] = [];

/**
 * The camera, a window capture and the multimedia output share one window, so
 * when either is projecting (and media is not playing) the window must stay on
 * its screen instead of being pulled back to the multimedia screen.
 */
const activatePrimaryOutput = (options: { force?: boolean } = {}) => {
  if (!currentState.mediaIsPlaying && teoCapture.activeSourceId) {
    teoCapture.resumeCaptureProjection();
    return;
  }
  if (!currentState.mediaIsPlaying && teoCamera.activeCameraId) {
    teoCamera.resumeCameraProjection();
    return;
  }
  activateOutput(undefined, options);
};

/**
 * Refreshes the screen list before activating, because `mediaWindowVisible`
 * and the window bounds are reported by the main process. `force` shows the
 * window even when a cached snapshot still reports it as visible.
 */
const scheduleActivation = (
  delay: number,
  options: { force?: boolean } = {},
) => {
  const timer = setTimeout(() => {
    void (async () => {
      await fetchScreens();
      activatePrimaryOutput(options);
      activateAuxiliaryOutput();
    })();
  }, delay);
  activationTimers.push(timer);
};

// TEO keeps the output window active from startup on the selected screen, and
// follows monitor additions/removals without reacting to ordinary refreshes
// (moving the window itself triggers those refreshes).
watch(
  screens,
  (list) => {
    if (!list.length) return;
    const layout = screenLayoutSignature(list);
    if (layout === lastScreenLayout) return;
    lastScreenLayout = layout;
    // A monitor was added or removed: a camera that was on a now-disconnected
    // screen moves to the assigned camera screen, and a capture to the
    // multimedia screen the panel falls back to.
    if (teoCamera.activeCameraId) {
      const screenIndex = cameraScreenIndex.value;
      if (screenIndex !== null) teoCamera.setActiveScreen(screenIndex);
    }
    if (teoCapture.activeSourceId) {
      const screenIndex = preferredScreenIndex.value;
      if (screenIndex !== null) teoCapture.setActiveScreen(screenIndex);
    }
    activatePrimaryOutput();
    activateAuxiliaryOutput();
  },
  { immediate: true },
);

// Moving the primary output to another screen must move the mirror to the
// remaining external screen instead of leaving both windows on the same one.
watch(auxiliaryScreenIndex, (index) => {
  if (index === null) return;
  activateAuxiliaryOutput(index);
});

watch(
  () => currentState.mediaIsPlaying,
  (playing, wasPlaying) => {
    if (playing && !wasPlaying) {
      // The camera and a capture must not cover projected media; keep the
      // assignment so they can come back when playback ends.
      teoCamera.suspendCameraProjection();
      teoCapture.suspendCapture();
      // Pin the output after the original app's start-of-playback placement
      // pass.
      scheduleActivation(0);
      scheduleActivation(600);
      return;
    }

    if (wasPlaying && !playing) {
      scheduleActivation(0);
      teoCapture.resumeCaptureProjection();
      teoCamera.resumeCameraProjection();
    }
  },
);

// A camera or a capture taking the output, or handing it back, starts or
// stops the Zoom Meeting Manager share, which stays the same one across media
// changes. Ending a capture also hands the window back to the multimedia
// screen.
watch(
  () => teoCapture.activeSourceId,
  (sourceId, previousSourceId) => {
    void syncZoomOutputSharing();
    if (!sourceId && previousSourceId) scheduleActivation(0);
  },
);
watch(
  () => teoCamera.activeCameraId,
  () => {
    void syncZoomOutputSharing();
  },
);

// The media window cannot open a capture whose window closed or whose screen
// was unplugged; it reports that back so the assignment is dropped instead of
// leaving a frozen frame and a panel that still says "capturing".
watch(captureStatus, (status) => {
  if (!status || status.ok) return;
  if (status.sourceId !== teoCapture.activeSourceId) return;
  teoCapture.stopCapture();
  createTemporaryNotification({
    caption: t('teo-capture-failed-explain'),
    group: 'teo-capture',
    icon: 'mmm-media-display-inactive',
    message: t('teo-capture-failed'),
    type: 'warning',
  });
});

// The original app hides the output after playback, when no congregation is
// active, or from its own display dialog. TEO keeps it showing the yeartext.
watch(
  () => currentState.mediaWindowVisible,
  (visible) => {
    if (visible) return;
    scheduleActivation(300, { force: true });
  },
);

onMounted(() => {
  // The media window can be created slightly after this component mounts;
  // retry so the output is actually shown at startup.
  scheduleActivation(0);
  scheduleActivation(750);
  scheduleActivation(2000);
  scheduleActivation(5000);
});

onBeforeUnmount(() => {
  activationTimers.forEach((timer) => clearTimeout(timer));
});
</script>

<style scoped>
.teo-output-keeper {
  display: none;
}
</style>
