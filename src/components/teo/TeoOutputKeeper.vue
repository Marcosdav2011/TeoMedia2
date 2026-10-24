<template>
  <span aria-hidden="true" class="teo-output-keeper" />
</template>

<script setup lang="ts">
import type { Display } from 'src/types';

import { useTeoScreens } from 'src/composables/useTeoScreens';
import { useCurrentStateStore } from 'stores/current-state';
import { useTeoCameraStore } from 'stores/teo-camera';
import { onBeforeUnmount, onMounted, watch } from 'vue';

const currentState = useCurrentStateStore();
const teoCamera = useTeoCameraStore();

const {
  activateAuxiliaryOutput,
  activateOutput,
  auxiliaryScreenIndex,
  fetchScreens,
  screens,
} = useTeoScreens();

const screenLayoutSignature = (list: Display[]) =>
  list
    .map(
      (screen) =>
        `${screen.id}:${screen.bounds.x},${screen.bounds.y},${screen.bounds.width},${screen.bounds.height}`,
    )
    .join('|');

let lastScreenLayout = '';
const activationTimers: ReturnType<typeof setTimeout>[] = [];

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
      activateOutput(undefined, options);
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
    activateOutput();
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
      // The camera must not cover projected media; keep the assignment so it
      // can come back when playback ends.
      teoCamera.suspendCameraProjection();
      // Pin the output after the original app's start-of-playback placement
      // pass.
      scheduleActivation(0);
      scheduleActivation(600);
      return;
    }

    if (wasPlaying && !playing) {
      scheduleActivation(0);
      teoCamera.resumeCameraProjection();
    }
  },
);

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
