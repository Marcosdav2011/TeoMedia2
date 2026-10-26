<template>
  <div class="teo-camera-panel">
    <div class="teo-camera-panel__grid">
      <section class="teo-camera-card teo-camera-card--preview">
        <div class="teo-camera-card__head">
          <div>
            <div class="teo-camera-card__title">
              {{ t('teo-camera-preview') }}
            </div>
            <div class="teo-camera-card__hint">{{ previewHint }}</div>
          </div>
          <span
            :class="[
              'teo-camera-pill',
              { 'teo-camera-pill--live': previewIsLive },
            ]"
          >
            <span class="teo-camera-pill__dot" />
            {{ previewBadge }}
          </span>
        </div>

        <div class="teo-camera-preview">
          <video
            ref="previewVideo"
            autoplay
            class="teo-camera-preview__video"
            muted
            playsinline
          />
          <div v-if="!previewStream" class="teo-camera-preview__placeholder">
            <q-icon
              :name="teoCamera.activeCameraId ? 'mmm-video' : 'mmm-video-off'"
              size="2rem"
            />
            <div class="text-caption">{{ previewPlaceholderText }}</div>
          </div>
        </div>
      </section>

      <div class="teo-camera-panel__side">
        <section class="teo-camera-card">
          <div class="teo-camera-card__head">
            <div class="teo-camera-card__title">{{ t('teo-camera') }}</div>
          </div>
          <q-select
            v-model="selectedCameraId"
            dense
            emit-value
            :label="t('select-camera')"
            map-options
            option-label="label"
            option-value="deviceId"
            :options="cameraOptions"
            outlined
          />
          <q-btn
            class="full-width"
            :disable="detecting"
            :label="t('teo-detect-cameras')"
            :loading="detecting"
            no-caps
            outline
            @click="detectCameras"
          />
          <div v-if="!cameraOptions.length" class="teo-camera-card__hint">
            {{ t('teo-no-cameras-found') }}
          </div>
        </section>

        <section class="teo-camera-card">
          <div class="teo-camera-card__head">
            <div class="teo-camera-card__title">
              {{ t('teo-output-screen') }}
            </div>
          </div>
          <template v-if="hasOutputScreen">
            <q-select
              v-model="selectedScreenIndex"
              dense
              emit-value
              :label="t('teo-output-screen')"
              map-options
              option-label="label"
              option-value="value"
              :options="screenOptions"
              outlined
            />
            <q-btn
              class="full-width"
              :disable="!canIdentify"
              icon="mmm-eye"
              :label="t('teo-identify-screen')"
              no-caps
              outline
              @click="identifySelectedScreen"
            />
            <div v-if="hasAuxiliaryScreen" class="teo-camera-aux">
              <q-icon name="mmm-fullscreen" size="16px" />
              <span>
                {{ t('teo-auxiliary-output') }} ·
                {{ auxiliaryScreenLabel }}
              </span>
            </div>
            <div v-if="hasAuxiliaryScreen" class="teo-camera-card__hint">
              {{ t('teo-auxiliary-output-hint') }}
            </div>
          </template>
          <div v-else class="teo-camera-card__hint">
            {{ t('teo-no-output-screen') }}
          </div>
        </section>
      </div>
    </div>

    <div class="teo-camera-actions">
      <q-btn
        class="teo-camera-actions__btn"
        color="primary"
        :disable="!canProject"
        icon="mmm-video"
        :label="t('teo-show-camera-on-screen')"
        no-caps
        unelevated
        @click="startProjection"
      />
      <q-btn
        v-if="teoCamera.activeCameraId"
        class="teo-camera-actions__btn"
        color="negative"
        icon="mmm-video-off"
        :label="t('teo-stop-camera')"
        no-caps
        outline
        @click="stopProjection"
      />
      <q-btn
        class="teo-camera-actions__btn"
        :disable="!canCaptureSnapshot"
        icon="mmm-image"
        :label="t('teo-save-snapshot')"
        :loading="savingSnapshot"
        no-caps
        outline
        @click="captureSnapshot"
      />
      <q-btn
        v-if="!cameraOnlyMode"
        class="teo-camera-actions__btn"
        flat
        icon="mmm-media-display-inactive"
        :label="t('show-media-display')"
        no-caps
        @click="showOutput"
      />
    </div>

    <div class="teo-camera-status">
      <div v-if="currentState.mediaIsPlaying" class="text-caption text-warning">
        {{ t('stop-playing-media-first') }}
      </div>
      <div
        v-else-if="teoCamera.activeCameraId"
        class="text-body2 text-positive"
      >
        {{
          t('teo-camera-active', {
            camera: teoCamera.activeCameraLabel,
            screen: activeScreenLabel,
          })
        }}
      </div>
      <div v-if="teoCamera.activeCameraId" class="teo-camera-status__muted">
        {{ t('teo-camera-auto-return') }}
      </div>
      <div class="teo-camera-status__muted">
        {{ t('teo-camera-output-hint') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTeoScreens } from 'src/composables/useTeoScreens';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { useCurrentStateStore } from 'stores/current-state';
import { useTeoCameraStore } from 'stores/teo-camera';
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';

interface CameraOption {
  deviceId: string;
  label: string;
}

const { t } = useI18n();
const currentState = useCurrentStateStore();
const teoCamera = useTeoCameraStore();

// Media playback is not part of a camera-only profile, so the control that
// switches the output back to the media display is hidden there.
const cameraOnlyMode = computed(
  () => !!currentState.currentSettings?.cameraOnlyMode,
);

const {
  activateOutput,
  auxiliaryScreenIndex,
  hasAuxiliaryScreen,
  hasOutputScreen,
  identifyScreen,
  preferredScreenIndex,
  screenLabel,
  screenOptions,
  setPreferredScreen,
} = useTeoScreens();

const devices = ref<CameraOption[]>([]);
const detecting = ref(false);
const previewVideo = useTemplateRef<HTMLVideoElement>('previewVideo');
const previewStream = shallowRef<MediaStream | null>(null);
const previewError = ref('');
const savingSnapshot = ref(false);
let previewToken = 0;
let previewRestartTimer: ReturnType<typeof setTimeout> | undefined;

const activeScreenLabel = computed(() =>
  teoCamera.activeScreenIndex === null
    ? ''
    : screenLabel(teoCamera.activeScreenIndex),
);

const auxiliaryScreenLabel = computed(() =>
  auxiliaryScreenIndex.value === null
    ? ''
    : screenLabel(auxiliaryScreenIndex.value),
);

const previewPlaceholderText = computed(() => {
  if (teoCamera.activeCameraId) return t('teo-camera-preview-paused');
  if (previewError.value) return t('teo-camera-preview-unavailable');
  return t('teo-camera-preview-starting');
});

const cameraOptions = computed(() =>
  devices.value.map((device) => ({
    deviceId: device.deviceId,
    label: device.label,
  })),
);

const selectedCameraId = computed({
  get: () => teoCamera.selectedCameraId ?? '',
  set: (deviceId: string) => {
    teoCamera.selectedCameraId = deviceId || null;
    const option = cameraOptions.value.find(
      (camera) => camera.deviceId === deviceId,
    );
    teoCamera.selectedCameraLabel = option?.label ?? '';
  },
});

const selectedCameraLabel = computed(
  () =>
    cameraOptions.value.find(
      (camera) => camera.deviceId === teoCamera.selectedCameraId,
    )?.label ?? teoCamera.selectedCameraLabel,
);

const previewIsLive = computed(
  () => !!previewStream.value || !!teoCamera.activeCameraId,
);

const previewBadge = computed(() => {
  if (teoCamera.activeCameraId) return t('teo-camera-on-screen');
  return previewStream.value ? t('teo-preview-live') : t('teo-preview-off');
});

const previewHint = computed(() => {
  if (teoCamera.activeCameraId) return t('teo-camera-preview-paused');
  if (previewError.value) return t('teo-camera-preview-unavailable');
  if (!selectedCameraId.value) return t('teo-no-cameras-found');
  return selectedCameraLabel.value || t('teo-camera-preview');
});

const selectedScreenIndex = computed({
  get: () => preferredScreenIndex.value,
  set: (index: null | number) => {
    setPreferredScreen(index);
    if (index === null) return;
    activateOutput(index);
    if (teoCamera.activeCameraId) teoCamera.setActiveScreen(index);
  },
});

const canIdentify = computed(
  () =>
    preferredScreenIndex.value !== null &&
    !currentState.mediaIsPlaying &&
    !teoCamera.activeCameraId,
);

const canProject = computed(
  () =>
    !!selectedCameraId.value &&
    preferredScreenIndex.value !== null &&
    !currentState.mediaIsPlaying,
);

const canCaptureSnapshot = computed(
  () =>
    !!previewStream.value && !teoCamera.activeCameraId && !savingSnapshot.value,
);

const cameraSnapshotFilename = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `teo-camera-${date}-${time}.png`;
};

const stopPreview = () => {
  previewToken++;
  if (previewRestartTimer) {
    clearTimeout(previewRestartTimer);
    previewRestartTimer = undefined;
  }
  previewStream.value?.getTracks().forEach((track) => track.stop());
  previewStream.value = null;
  if (previewVideo.value) {
    previewVideo.value.pause();
    previewVideo.value.srcObject = null;
  }
};

const isExpectedCameraError = (error: unknown) => {
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === 'NotAllowedError' ||
    error.name === 'NotFoundError' ||
    error.name === 'NotReadableError'
  );
};

const startPreview = async () => {
  if (teoCamera.activeCameraId || currentState.mediaIsPlaying) return;

  const deviceId = selectedCameraId.value;
  if (!deviceId) return;

  stopPreview();
  const token = ++previewToken;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { deviceId },
    });

    if (token !== previewToken || teoCamera.activeCameraId) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    previewStream.value = stream;
    previewError.value = '';
    if (previewVideo.value) {
      previewVideo.value.srcObject = stream;
      await previewVideo.value.play();
    }
  } catch (error) {
    if (token !== previewToken) return;
    previewError.value = t('teo-camera-preview-unavailable');
    if (!isExpectedCameraError(error)) {
      errorCatcher(error, {
        contexts: { fn: { name: 'startTeoCameraPreview' } },
      });
    }
  }
};

const schedulePreviewRestart = () => {
  if (previewRestartTimer) clearTimeout(previewRestartTimer);
  // Give the output window a moment to release the camera device.
  previewRestartTimer = setTimeout(() => {
    previewRestartTimer = undefined;
    void startPreview();
  }, 500);
};

const captureSnapshot = async () => {
  const video = previewVideo.value;
  if (!previewStream.value || !video?.videoWidth || !video.videoHeight) {
    createTemporaryNotification({
      icon: 'mmm-video-off',
      message: t('teo-snapshot-no-preview'),
      type: 'warning',
    });
    return;
  }

  savingSnapshot.value = true;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
    if (!blob) {
      createTemporaryNotification({
        icon: 'mmm-image-broken',
        message: t('teo-snapshot-failed'),
        type: 'negative',
      });
      return;
    }

    const result = await globalThis.electronApi.saveFileDialog(
      cameraSnapshotFilename(),
      'png',
    );
    if (result?.canceled || !result?.filePath) return;

    const filePath = result.filePath.toLowerCase().endsWith('.png')
      ? result.filePath
      : `${result.filePath}.png`;
    await globalThis.electronApi.fs.writeFile(
      filePath,
      new Uint8Array(await blob.arrayBuffer()),
    );

    createTemporaryNotification({
      caption: filePath,
      icon: 'mmm-image',
      message: t('teo-snapshot-saved'),
      type: 'positive',
    });
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'captureTeoCameraSnapshot' } },
    });
    createTemporaryNotification({
      icon: 'mmm-image-broken',
      message: t('teo-snapshot-failed'),
      type: 'negative',
    });
  } finally {
    savingSnapshot.value = false;
  }
};

const refreshDevices = async () => {
  try {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = allDevices.filter(
      (device) => device.kind === 'videoinput',
    );

    devices.value = videoInputs.map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label || `${t('teo-camera')} ${index + 1}`,
    }));

    const selected = devices.value.find(
      (device) => device.deviceId === teoCamera.selectedCameraId,
    );
    const fallback = devices.value[0];
    const next = selected ?? fallback;

    teoCamera.selectedCameraId = next?.deviceId ?? null;
    teoCamera.selectedCameraLabel = next?.label ?? '';
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'refreshTeoCameras' } },
    });
  }
};

const detectCameras = async () => {
  // Release the preview first so the probe can open the camera.
  stopPreview();
  detecting.value = true;
  try {
    // Requesting the camera once both unlocks friendly device labels and
    // triggers the OS permission prompt. The stream is stopped immediately;
    // the selected camera is only opened again by the media output window.
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((track) => track.stop());
    await refreshDevices();
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'detectTeoCameras' } },
    });
    createTemporaryNotification({
      caption: t('camera-access-required-explain'),
      icon: 'mmm-video-off',
      message: t('camera-access-required'),
      type: 'negative',
    });
  } finally {
    detecting.value = false;
    if (!teoCamera.activeCameraId) schedulePreviewRestart();
  }
};

const identifySelectedScreen = () => {
  const index = preferredScreenIndex.value;
  if (index === null) return;
  identifyScreen(index);
};

const startProjection = () => {
  const screenIndex = preferredScreenIndex.value;
  if (!selectedCameraId.value || screenIndex === null) return;

  // The output window cannot open a camera the preview is still holding.
  stopPreview();
  const started = teoCamera.startCameraProjection(
    selectedCameraId.value,
    selectedCameraLabel.value,
    screenIndex,
  );

  if (!started) {
    schedulePreviewRestart();
    createTemporaryNotification({
      caption: t('stop-playing-media-first-explain'),
      icon: 'mmm-media',
      message: t('stop-playing-media-first'),
      type: 'warning',
    });
    return;
  }

  createTemporaryNotification({
    caption: t('teo-camera-output-hint'),
    icon: 'mmm-video',
    message: t('teo-camera-sent', {
      screen: screenLabel(screenIndex),
    }),
    type: 'positive',
  });
};

const stopProjection = () => {
  teoCamera.stopCameraProjection();
};

const showOutput = () => {
  teoCamera.stopCameraProjection();
  activateOutput();
};

watch(selectedCameraId, () => {
  if (!teoCamera.activeCameraId) void startPreview();
});

watch(
  () => teoCamera.activeCameraId,
  (activeCameraId) => {
    if (activeCameraId) {
      stopPreview();
      return;
    }
    schedulePreviewRestart();
  },
);

watch(
  () => currentState.mediaIsPlaying,
  (playing) => {
    if (playing) {
      stopPreview();
      return;
    }
    if (!teoCamera.activeCameraId) schedulePreviewRestart();
  },
);

onMounted(async () => {
  await refreshDevices();
  void startPreview();
});

onBeforeUnmount(() => {
  stopPreview();
});
</script>

<style scoped>
.teo-camera-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.teo-camera-panel__grid {
  align-items: start;
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.9fr);
}

.teo-camera-panel__side {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.teo-camera-card {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(12, 52, 60, 0.09);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
}

.teo-camera-card__head {
  align-items: flex-start;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.teo-camera-card__title {
  color: #0c1a24;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.teo-camera-card__hint {
  color: rgba(12, 26, 36, 0.55);
  font-size: 0.76rem;
  line-height: 1.4;
}

.teo-camera-pill {
  align-items: center;
  background: rgba(12, 52, 60, 0.06);
  border-radius: 999px;
  color: rgba(12, 26, 36, 0.6);
  display: inline-flex;
  flex-shrink: 0;
  font-size: 0.68rem;
  font-weight: 600;
  gap: 6px;
  letter-spacing: 0.04em;
  padding: 4px 10px;
  text-transform: uppercase;
}

.teo-camera-pill__dot {
  background: #94a3b8;
  border-radius: 50%;
  height: 7px;
  width: 7px;
}

.teo-camera-pill--live {
  background: rgba(45, 212, 191, 0.14);
  color: #0f766e;
}

.teo-camera-pill--live .teo-camera-pill__dot {
  background: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.18);
}

.teo-camera-preview {
  aspect-ratio: 16 / 9;
  background-color: #05090c;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.teo-camera-preview__video {
  height: 100%;
  object-fit: contain;
  width: 100%;
}

.teo-camera-preview__placeholder {
  align-items: center;
  color: rgb(255 255 255 / 72%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  inset: 0;
  justify-content: center;
  padding: 16px;
  position: absolute;
  text-align: center;
}

.teo-camera-aux {
  align-items: center;
  background: rgba(45, 212, 191, 0.12);
  border-radius: 12px;
  color: #0f766e;
  display: flex;
  font-size: 0.78rem;
  font-weight: 600;
  gap: 8px;
  padding: 8px 10px;
}

.teo-camera-actions {
  align-items: stretch;
  background: rgba(12, 52, 60, 0.035);
  border: 1px dashed rgba(12, 52, 60, 0.14);
  border-radius: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px;
}

.teo-camera-actions__btn {
  flex: 1 1 190px;
  min-height: 40px;
}

.teo-camera-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.teo-camera-status__muted {
  color: rgba(12, 26, 36, 0.55);
  font-size: 0.78rem;
  line-height: 1.45;
}

body.body--dark .teo-camera-card {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

body.body--dark .teo-camera-card__title {
  color: #f4fbfa;
}

body.body--dark .teo-camera-card__hint,
body.body--dark .teo-camera-status__muted {
  color: rgba(226, 240, 238, 0.6);
}

body.body--dark .teo-camera-pill {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(226, 240, 238, 0.72);
}

body.body--dark .teo-camera-pill--live {
  background: rgba(45, 212, 191, 0.16);
  color: #a7f3d0;
}

body.body--dark .teo-camera-aux {
  background: rgba(45, 212, 191, 0.12);
  color: #a7f3d0;
}

body.body--dark .teo-camera-actions {
  background: rgba(255, 255, 255, 0.035);
  border-color: rgba(94, 234, 212, 0.18);
}

@media (max-width: 900px) {
  .teo-camera-panel__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
