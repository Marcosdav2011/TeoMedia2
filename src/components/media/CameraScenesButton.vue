<template>
  <q-btn
    v-if="showButton"
    class="super-rounded"
    :class="classes"
    :color="color"
    icon="mmm-video"
    rounded
    :text-color="textColor"
    unelevated
  >
    <q-tooltip
      v-if="!menuOpen"
      anchor="bottom left"
      :delay="1000"
      :offset="[14, 22]"
      self="top left"
    >
      {{ t('teo-camera-scenes') }}
    </q-tooltip>
    <q-menu
      v-model="menuOpen"
      anchor="bottom middle"
      class="teo-scene-menu"
      :offset="[0, 10]"
      self="top middle"
    >
      <q-list padding>
        <q-item-label class="teo-scene-menu__title" header>
          {{ t('teo-camera-scenes') }}
        </q-item-label>
        <q-item
          v-for="scene in teoCamera.scenes"
          :key="scene.id"
          v-close-popup
          :active="isSceneActive(scene)"
          clickable
          :disable="!canActivateScene"
          @click="selectScene(scene)"
        >
          <q-item-section avatar>
            <q-icon
              :name="
                isSceneActive(scene) ? 'mmm-media-display-active' : 'mmm-play'
              "
              size="18px"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ scene.name }}</q-item-label>
            <q-item-label caption>
              {{ scene.cameraLabel }} · {{ layoutLabel(scene.layout) }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <template v-if="teoCamera.activeCameraId">
          <q-separator />
          <q-item v-close-popup clickable @click="stopCamera">
            <q-item-section avatar>
              <q-icon name="mmm-video-off" size="18px" />
            </q-item-section>
            <q-item-section>{{ t('teo-stop-camera') }}</q-item-section>
          </q-item>
        </template>
        <q-item-label
          v-if="currentState.mediaIsPlaying"
          caption
          class="teo-scene-menu__hint"
        >
          {{ t('stop-playing-media-first') }}
        </q-item-label>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import type { TeoCameraScene } from 'src/types';

import {
  type IslandButtonStatus,
  useIslandButton,
} from 'src/composables/useIslandButton';
import { useTeoCameraLayouts } from 'src/composables/useTeoCameraLayouts';
import { useTeoSceneLauncher } from 'src/composables/useTeoSceneLauncher';
import { useCurrentStateStore } from 'stores/current-state';
import { useTeoCameraStore } from 'stores/teo-camera';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const { t } = useI18n();
const route = useRoute();
const currentState = useCurrentStateStore();
const teoCamera = useTeoCameraStore();
const { layoutLabel } = useTeoCameraLayouts();
const { canActivateScene, launchScene } = useTeoSceneLauncher();

const menuOpen = ref(false);

// The Cameras page already has the scene card, and its preview would be
// holding the camera the output window needs.
const showButton = computed(
  () => teoCamera.scenes.length > 0 && !route.fullPath.includes('/cameras'),
);

const { classes, color, textColor } = useIslandButton(
  computed<IslandButtonStatus>(() =>
    teoCamera.activeCameraId ? 'normal' : 'off',
  ),
  menuOpen,
);

const isSceneActive = (scene: TeoCameraScene) =>
  !!teoCamera.activeCameraId && teoCamera.activeSceneId === scene.id;

const selectScene = (scene: TeoCameraScene) => {
  void launchScene(scene);
};

const stopCamera = () => {
  teoCamera.stopCameraProjection();
};
</script>

<style scoped>
.teo-scene-menu {
  min-width: 280px;
}

.teo-scene-menu__title {
  color: rgba(12, 26, 36, 0.55);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.teo-scene-menu__hint {
  padding: 8px 16px;
}

body.body--dark .teo-scene-menu__title {
  color: rgba(226, 240, 238, 0.6);
}
</style>
