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

        <div
          class="teo-camera-preview"
          :class="{
            'is-panning': isPanning,
            'teo-camera-preview--pannable': canPan,
          }"
          @pointercancel="endPan"
          @pointerdown="startPan"
          @pointermove="movePan"
          @pointerup="endPan"
        >
          <video
            ref="previewVideo"
            autoplay
            class="teo-camera-preview__video"
            muted
            playsinline
            :style="previewVideoStyle"
          />
          <div v-if="!previewStream" class="teo-camera-preview__placeholder">
            <q-icon
              :name="teoCamera.activeCameraId ? 'mmm-video' : 'mmm-video-off'"
              size="2rem"
            />
            <div class="text-caption">{{ previewPlaceholderText }}</div>
          </div>
        </div>

        <div class="teo-framing">
          <div class="teo-framing__head">
            <div class="teo-framing__label">{{ t('teo-camera-zoom') }}</div>
            <span class="teo-framing__value">{{ zoomLabel }}</span>
            <q-btn
              :aria-label="t('teo-camera-framing-reset')"
              :disable="framingIsIdentity"
              flat
              icon="mmm-reset"
              round
              size="sm"
              @click="resetFraming"
            >
              <q-tooltip :delay="500">
                {{ t('teo-camera-framing-reset') }}
              </q-tooltip>
            </q-btn>
          </div>
          <q-slider
            v-model="zoom"
            dense
            :max="TEO_CAMERA_MAX_ZOOM"
            :min="1"
            :step="0.05"
          />
          <div class="teo-camera-card__hint">
            {{ t('teo-camera-framing-hint') }}
          </div>
        </div>
      </section>

      <section class="teo-camera-card teo-camera-card--camera">
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
        <q-select
          v-model="selectedLayout"
          dense
          emit-value
          :label="t('teo-camera-layout')"
          map-options
          option-label="label"
          option-value="value"
          :options="layoutOptions"
          outlined
        />
        <div v-if="!cameraOptions.length" class="teo-camera-card__hint">
          {{ t('teo-no-cameras-found') }}
        </div>
      </section>
    </div>

    <div class="teo-camera-panel__row">
      <section class="teo-camera-card teo-camera-card--screen">
        <div class="teo-camera-card__head">
          <div class="teo-camera-card__title">
            {{ t('teo-camera-screen') }}
          </div>
        </div>
        <template v-if="hasOutputScreen">
          <q-select
            v-model="selectedScreenIndex"
            dense
            emit-value
            :label="t('teo-camera-screen')"
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

      <section class="teo-camera-card teo-camera-card--capture">
        <div class="teo-camera-card__head">
          <div class="teo-camera-card__title">
            {{ t('teo-capture-windows') }}
          </div>
          <q-btn
            :aria-label="t('teo-capture-refresh')"
            dense
            flat
            icon="mmm-refresh"
            :loading="loadingCaptureSources"
            round
            size="sm"
            @click="loadCaptureSources"
          >
            <q-tooltip :delay="500">{{ t('teo-capture-refresh') }}</q-tooltip>
          </q-btn>
        </div>
        <template v-if="hasOutputScreen">
          <q-select
            v-model="selectedCaptureSourceId"
            dense
            emit-value
            :label="t('teo-capture-source')"
            map-options
            option-label="label"
            option-value="value"
            :options="captureSourceOptions"
            outlined
          />
          <q-select
            v-model="selectedCaptureScreenIndex"
            dense
            emit-value
            :label="t('teo-capture-screen')"
            map-options
            option-label="label"
            option-value="value"
            :options="screenOptions"
            outlined
          />
          <div
            v-if="!captureSourceOptions.length"
            class="teo-camera-card__hint"
          >
            {{ t('teo-capture-empty') }}
          </div>
          <div v-if="captureSourceIsOutputScreen" class="teo-camera-alert">
            <q-icon name="warning" size="18px" />
            <span>{{ t('teo-capture-mirror-hint') }}</span>
          </div>
          <div v-if="teoCapture.activeSourceId" class="teo-camera-aux">
            <q-icon name="mmm-media-display-active" size="16px" />
            <span>
              {{
                t('teo-capture-active', {
                  source: teoCapture.activeSourceName,
                })
              }}
            </span>
          </div>
          <q-btn
            v-if="teoCapture.activeSourceId"
            class="full-width"
            color="negative"
            icon="mmm-media-display-inactive"
            :label="t('teo-capture-stop')"
            no-caps
            outline
            @click="stopCapture"
          />
          <q-btn
            v-else
            class="full-width"
            :disable="!canStartCapture"
            icon="mmm-media-display-active"
            :label="t('teo-capture-start')"
            no-caps
            outline
            @click="startCapture"
          />
          <div class="teo-camera-card__hint">{{ t('teo-capture-hint') }}</div>
        </template>
        <div v-else class="teo-camera-card__hint">
          {{ t('teo-no-output-screen') }}
        </div>
      </section>

      <section class="teo-camera-card teo-camera-card--scenes">
        <div class="teo-camera-card__head">
          <div class="teo-camera-card__title">
            {{ t('teo-camera-scenes') }}
          </div>
        </div>
        <div v-if="teoCamera.scenes.length" class="teo-scenes">
          <div
            v-for="scene in teoCamera.scenes"
            :key="scene.id"
            class="teo-scene"
            :class="{ 'teo-scene--active': isSceneActive(scene) }"
          >
            <q-btn
              class="teo-scene__start"
              :disable="!canActivateScene"
              no-caps
              outline
              @click="activateScene(scene)"
            >
              <span class="teo-scene__text">
                <span class="teo-scene__name">{{ scene.name }}</span>
                <span class="teo-scene__meta">
                  {{ scene.cameraLabel }} · {{ layoutLabel(scene.layout) }}
                </span>
              </span>
              <q-icon
                :name="
                  isSceneActive(scene) ? 'mmm-media-display-active' : 'mmm-play'
                "
                size="18px"
              />
            </q-btn>
            <q-btn
              :aria-label="t('teo-scene-update')"
              class="teo-scene__update"
              :disable="!selectedCameraId"
              flat
              icon="mmm-refresh"
              round
              @click="updateScene(scene)"
            >
              <q-tooltip :delay="500">{{ t('teo-scene-update') }}</q-tooltip>
            </q-btn>
            <q-btn
              :aria-label="t('teo-scene-delete')"
              class="teo-scene__delete"
              color="negative"
              flat
              icon="mmm-delete"
              round
              @click="removeScene(scene)"
            >
              <q-tooltip :delay="500">{{ t('teo-scene-delete') }}</q-tooltip>
            </q-btn>
          </div>
        </div>
        <div v-else class="teo-camera-card__hint">
          {{ t('teo-scene-empty') }}
        </div>
        <q-input
          v-model="sceneName"
          dense
          :label="t('teo-scene-name')"
          outlined
          @keyup.enter="saveScene"
        />
        <q-btn
          class="full-width"
          :disable="!canSaveScene"
          icon="mmm-check"
          :label="t('teo-scene-save')"
          no-caps
          outline
          @click="saveScene"
        />
        <div class="teo-camera-card__hint">
          {{ t('teo-camera-scenes-hint') }}
        </div>
      </section>
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
import type { CaptureSource, TeoCameraLayout, TeoCameraScene } from 'src/types';

import { useTeoCameraLayouts } from 'src/composables/useTeoCameraLayouts';
import { useTeoSceneLauncher } from 'src/composables/useTeoSceneLauncher';
import { useTeoScreens } from 'src/composables/useTeoScreens';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import {
  IDENTITY_TEO_CAMERA_VIEW,
  normalizeTeoCameraView,
  TEO_CAMERA_MAX_ZOOM,
  teoCameraViewTransform,
} from 'src/helpers/teo-camera-view';
import { useCurrentStateStore } from 'stores/current-state';
import { useTeoCameraStore } from 'stores/teo-camera';
import { useTeoCaptureStore } from 'stores/teo-capture';
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
const teoCapture = useTeoCaptureStore();

// Media playback is not part of a camera-only profile, so the control that
// switches the output back to the media display is hidden there.
const cameraOnlyMode = computed(
  () => !!currentState.currentSettings?.cameraOnlyMode,
);

const teoScreens = useTeoScreens();

const {
  activateOutput,
  auxiliaryScreenIndex,
  cameraScreenIndex,
  hasAuxiliaryScreen,
  hasOutputScreen,
  identifyScreen,
  preferredScreenIndex,
  screenLabel,
  screenOptions,
  screens,
  setCameraScreen,
} = teoScreens;

const devices = ref<CameraOption[]>([]);
const detecting = ref(false);
const captureSources = ref<CaptureSource[]>([]);
const loadingCaptureSources = ref(false);
const captureScreenIndex = ref<null | number>(null);
const selectedCaptureSourceId = ref('');
const previewVideo = useTemplateRef<HTMLVideoElement>('previewVideo');
const previewStream = shallowRef<MediaStream | null>(null);
const previewError = ref('');
const savingSnapshot = ref(false);
const isPanning = ref(false);
let previewToken = 0;
let previewRestartTimer: ReturnType<typeof setTimeout> | undefined;
let panStart: null | {
  height: number;
  panX: number;
  panY: number;
  pointerId: number;
  width: number;
  x: number;
  y: number;
} = null;

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

const captureSourceOptions = computed(() =>
  captureSources.value.map((source) => ({
    label: source.name,
    value: source.id,
  })),
);

// Where the capture goes: the multimedia output unless another screen is
// picked here.
const selectedCaptureScreenIndex = computed<null | number>({
  get: () => captureScreenIndex.value ?? preferredScreenIndex.value,
  set: (index: null | number) => {
    captureScreenIndex.value = index;
  },
});

const canStartCapture = computed(
  () =>
    !!selectedCaptureSourceId.value &&
    selectedCaptureScreenIndex.value !== null &&
    !currentState.mediaIsPlaying,
);

// The output window and its mirror both show the capture, so capturing the
// screen either of them sits on feeds the image back into itself. Those
// screens stay selectable; the panel just warns about the mirror effect.
const captureSourceIsOutputScreen = computed(() => {
  const source = captureSources.value.find(
    (candidate) => candidate.id === selectedCaptureSourceId.value,
  );
  if (!source?.displayId) return false;
  return [selectedCaptureScreenIndex.value, auxiliaryScreenIndex.value].some(
    (index) => {
      const screen = index === null ? undefined : screens.value[index];
      return !!screen && String(screen.id) === source.displayId;
    },
  );
});

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

const { layoutLabel, layoutOptions } = useTeoCameraLayouts();

const selectedLayout = computed<TeoCameraLayout>({
  get: () => teoCamera.selectedLayout,
  set: (layout) => teoCamera.setSelectedLayout(layout),
});

const cameraView = computed(() => normalizeTeoCameraView(teoCamera.view));

const zoom = computed<number>({
  get: () => cameraView.value.zoom,
  set: (value) => teoCamera.setCameraView({ ...cameraView.value, zoom: value }),
});

const zoomLabel = computed(() => `${cameraView.value.zoom}×`);

const previewVideoStyle = computed(() => ({
  transform: teoCameraViewTransform(cameraView.value),
}));

const framingIsIdentity = computed(
  () =>
    cameraView.value.zoom === 1 &&
    cameraView.value.panX === 0 &&
    cameraView.value.panY === 0,
);

const canPan = computed(
  () => !!previewStream.value && cameraView.value.zoom > 1,
);

const startPan = (event: PointerEvent) => {
  if (!canPan.value) return;
  const element = event.currentTarget as HTMLElement;
  if (!element.clientWidth || !element.clientHeight) return;
  panStart = {
    height: element.clientHeight,
    panX: cameraView.value.panX,
    panY: cameraView.value.panY,
    pointerId: event.pointerId,
    width: element.clientWidth,
    x: event.clientX,
    y: event.clientY,
  };
  isPanning.value = true;
  element.setPointerCapture(event.pointerId);
  event.preventDefault();
};

const movePan = (event: PointerEvent) => {
  if (!panStart || event.pointerId !== panStart.pointerId) return;
  teoCamera.setCameraView({
    panX: panStart.panX + ((event.clientX - panStart.x) / panStart.width) * 100,
    panY:
      panStart.panY + ((event.clientY - panStart.y) / panStart.height) * 100,
    zoom: cameraView.value.zoom,
  });
};

const endPan = (event: PointerEvent) => {
  if (!panStart) return;
  const element = event.currentTarget as HTMLElement;
  if (element.hasPointerCapture(panStart.pointerId)) {
    element.releasePointerCapture(panStart.pointerId);
  }
  panStart = null;
  isPanning.value = false;
};

const resetFraming = () => {
  teoCamera.setCameraView(IDENTITY_TEO_CAMERA_VIEW);
};

const sceneName = ref('');

const canSaveScene = computed(
  () => !!selectedCameraId.value && !!sceneName.value.trim(),
);

const { canActivateScene, launchScene, notifyCameraStarted } =
  useTeoSceneLauncher(teoScreens);

const isSceneActive = (scene: TeoCameraScene) =>
  !!teoCamera.activeCameraId && teoCamera.activeSceneId === scene.id;

const saveScene = () => {
  const scene = teoCamera.addScene(sceneName.value);
  if (!scene) return;
  sceneName.value = '';
  createTemporaryNotification({
    icon: 'mmm-check',
    message: t('teo-scene-saved'),
    type: 'positive',
  });
};

const removeScene = (scene: TeoCameraScene) => {
  teoCamera.removeScene(scene.id);
};

const updateScene = (scene: TeoCameraScene) => {
  if (!teoCamera.updateScene(scene.id)) return;
  createTemporaryNotification({
    icon: 'mmm-refresh',
    message: t('teo-scene-updated'),
    type: 'positive',
  });
};

const activateScene = async (scene: TeoCameraScene) => {
  teoCapture.stopCapture();
  // The output window cannot open a camera the preview is still holding.
  stopPreview();
  if (!(await launchScene(scene))) schedulePreviewRestart();
};

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
  get: () => cameraScreenIndex.value,
  set: (index: null | number) => setCameraScreen(index),
});

const canIdentify = computed(
  () =>
    cameraScreenIndex.value !== null &&
    !currentState.mediaIsPlaying &&
    !teoCamera.activeCameraId,
);

const canProject = computed(
  () =>
    !!selectedCameraId.value &&
    cameraScreenIndex.value !== null &&
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
  if (
    teoCamera.activeCameraId ||
    teoCapture.activeSourceId ||
    currentState.mediaIsPlaying
  ) {
    return;
  }

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
  const index = cameraScreenIndex.value;
  if (index === null) return;
  identifyScreen(index, { persist: false });
};

const loadCaptureSources = async () => {
  if (loadingCaptureSources.value) return;
  loadingCaptureSources.value = true;
  try {
    captureSources.value = await globalThis.electronApi.getCaptureSources();
    const stillAvailable = captureSourceOptions.value.some(
      (source) => source.value === selectedCaptureSourceId.value,
    );
    if (!stillAvailable) {
      selectedCaptureSourceId.value =
        captureSourceOptions.value[0]?.value ?? '';
    }
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'loadCaptureSources' } },
    });
  } finally {
    loadingCaptureSources.value = false;
  }
};

const startCapture = () => {
  const source = captureSources.value.find(
    (candidate) => candidate.id === selectedCaptureSourceId.value,
  );
  const screenIndex = selectedCaptureScreenIndex.value;
  if (!source || screenIndex === null) return;

  stopPreview();
  if (!teoCapture.startCapture(source, screenIndex)) {
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
    icon: 'mmm-media-display-active',
    message: t('teo-capture-started'),
    type: 'positive',
  });
};

const stopCapture = () => {
  teoCapture.stopCapture();
};

const startProjection = () => {
  const screenIndex = cameraScreenIndex.value;
  if (!selectedCameraId.value || screenIndex === null) return;

  teoCapture.stopCapture();
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

  notifyCameraStarted(screenIndex);
};

const stopProjection = () => {
  teoCamera.stopCameraProjection();
};

const showOutput = () => {
  teoCamera.stopCameraProjection();
  teoCapture.stopCapture();
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

// The preview and the capture both need the panel's video resources, and a
// capture can only run while no camera is projected. Once the capture ends,
// bring the preview back without making the user pick the camera again.
watch(
  () => teoCapture.activeSourceId,
  (sourceId) => {
    if (sourceId) {
      stopPreview();
      return;
    }
    schedulePreviewRestart();
  },
);

onMounted(async () => {
  await refreshDevices();
  void startPreview();
  void loadCaptureSources();
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
  grid-template-columns: minmax(0, 1.6fr) minmax(260px, 1fr);
}

.teo-camera-panel__row {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

.teo-camera-preview--pannable {
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.teo-camera-preview--pannable.is-panning {
  cursor: grabbing;
}

.teo-camera-preview__video {
  height: 100%;
  object-fit: cover;
  transform-origin: center center;
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

.teo-framing {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.teo-framing__head {
  align-items: center;
  display: flex;
  gap: 8px;
}

.teo-framing__label {
  color: rgba(12, 26, 36, 0.55);
  flex: 1 1 auto;
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.teo-framing__value {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
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

.teo-camera-alert {
  align-items: flex-start;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 12px;
  color: #92400e;
  display: flex;
  font-size: 0.78rem;
  gap: 8px;
  line-height: 1.4;
  padding: 8px 10px;
}

.teo-scenes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.teo-scene {
  align-items: center;
  display: flex;
  gap: 6px;
}

.teo-scene__start {
  flex: 1 1 auto;
  min-width: 0;
}

.teo-scene__start :deep(.q-btn__content) {
  flex: 1 1 auto;
  gap: 10px;
  justify-content: space-between;
  min-width: 0;
}

.teo-scene__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  text-align: left;
}

.teo-scene__name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.teo-scene__meta {
  color: rgba(12, 26, 36, 0.55);
  font-size: 0.7rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.teo-scene--active .teo-scene__start {
  background: rgba(45, 212, 191, 0.08);
  color: var(--q-primary);
}

.teo-scene--active .teo-scene__meta {
  color: var(--q-primary);
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
body.body--dark .teo-camera-status__muted,
body.body--dark .teo-framing__label,
body.body--dark .teo-scene__meta {
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

body.body--dark .teo-camera-alert {
  background: rgba(245, 158, 11, 0.16);
  border-color: rgba(245, 158, 11, 0.4);
  color: #fcd34d;
}

body.body--dark .teo-camera-actions {
  background: rgba(255, 255, 255, 0.035);
  border-color: rgba(94, 234, 212, 0.18);
}

@media (max-width: 1040px) {
  .teo-camera-panel__row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .teo-camera-panel__grid,
  .teo-camera-panel__row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
