<template>
  <q-page class="teo-page" :class="{ 'teo-page--camera-only': cameraOnlyMode }">
    <section class="teo-hero">
      <div class="teo-hero__body">
        <div class="teo-eyebrow">
          <q-icon name="mmm-video" size="16px" />
          {{ t('teo-studio-eyebrow') }}
        </div>
        <h1 class="teo-hero__title">{{ t('teo-cameras-and-screens') }}</h1>
        <p class="teo-hero__subtitle">{{ t('teo-cameras-subtitle') }}</p>
        <div class="teo-hero__chips">
          <span class="teo-chip" :class="{ 'teo-chip--live': cameraOnlyMode }">
            <q-icon name="mmm-video" size="15px" />
            {{
              cameraOnlyMode ? t('teo-camera-only') : t('teo-media-and-cameras')
            }}
          </span>
          <span class="teo-chip teo-chip--live">
            <span class="teo-chip__dot" />
            {{ outputLabel }}
          </span>
          <span class="teo-chip">
            <q-icon name="mmm-video" size="15px" />
            {{ cameraLabel }}
          </span>
          <span v-if="hasAuxiliaryScreen" class="teo-chip">
            <q-icon name="mmm-fullscreen" size="15px" />
            {{ t('teo-auxiliary-output') }} · {{ auxiliaryScreenLabel }}
          </span>
        </div>
      </div>

      <div class="teo-cameras__actions">
        <q-btn
          v-if="isTesting"
          color="negative"
          icon="mmm-stop"
          :label="t('teo-test-stop')"
          no-caps
          outline
          @click="stopTest"
        />
        <q-btn
          v-else
          color="primary"
          :disable="!hasOutputScreen || mediaIsPlaying"
          icon="mmm-play"
          :label="t('teo-test-output')"
          no-caps
          unelevated
          @click="startTest"
        />
        <span class="teo-cameras__test-hint">{{ t('teo-test-hint') }}</span>
      </div>
    </section>

    <section class="teo-panel">
      <div class="teo-panel__header">
        <div>
          <div class="teo-panel__title">{{ t('teo-camera-control') }}</div>
          <div class="teo-panel__hint">{{ t('teo-camera-output-hint') }}</div>
        </div>
      </div>
      <div class="teo-cameras__panel-body">
        <CameraPanel />
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import CameraPanel from 'src/components/CameraPanel.vue';
import { useTeoPlaybackTest } from 'src/composables/useTeoPlaybackTest';
import { useTeoScreens } from 'src/composables/useTeoScreens';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useTeoCameraStore } from 'src/stores/teo-camera';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const currentState = useCurrentStateStore();
const teoCamera = useTeoCameraStore();

const { hasOutputScreen, isTesting, startTest, stopTest } =
  useTeoPlaybackTest();
const {
  auxiliaryScreenIndex,
  hasAuxiliaryScreen,
  preferredScreenIndex,
  screenLabel,
} = useTeoScreens();

const outputLabel = computed(() =>
  preferredScreenIndex.value === null
    ? t('teo-no-output-screen')
    : screenLabel(preferredScreenIndex.value),
);

const auxiliaryScreenLabel = computed(() =>
  auxiliaryScreenIndex.value === null
    ? t('teo-no-output-screen')
    : screenLabel(auxiliaryScreenIndex.value),
);

const cameraLabel = computed(() =>
  teoCamera.activeCameraId
    ? t('teo-camera-active', {
        camera: teoCamera.activeCameraLabel,
        screen:
          teoCamera.activeScreenIndex === null
            ? t('teo-output-screen')
            : screenLabel(teoCamera.activeScreenIndex),
      })
    : t('teo-camera-idle'),
);

const mediaIsPlaying = computed(() => currentState.mediaIsPlaying);

const cameraOnlyMode = computed(
  () => !!currentState.currentSettings?.cameraOnlyMode,
);
</script>

<style scoped>
.teo-page {
  padding-bottom: 104px;
}

.teo-page--camera-only {
  padding-bottom: 32px;
}

.teo-cameras__actions {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 8px;
}

.teo-cameras__test-hint {
  color: rgba(12, 26, 36, 0.55);
  font-size: 0.78rem;
  max-width: 230px;
  text-align: right;
}

.teo-cameras__panel-body {
  margin-inline: auto;
  max-width: 1120px;
}

body.body--dark .teo-cameras__test-hint {
  color: rgba(226, 240, 238, 0.6);
}

@media (max-width: 760px) {
  .teo-cameras__actions {
    align-items: flex-start;
  }

  .teo-cameras__test-hint {
    text-align: left;
  }
}
</style>
