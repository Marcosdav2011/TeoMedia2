<template>
  <ActionPopup
    v-model="open"
    :status-color="statusColor"
    :status-icon="statusIcon"
    :status-text="statusText"
    :title="t('media-display-settings')"
  >
    <template v-if="screenList?.length > 1">
      <p class="card-section-title text-dark-grey q-px-md q-pt-sm">
        {{ t('window-type') }}
      </p>
      <div class="row q-px-md q-pb-sm q-col-gutter-sm">
        <div class="col-6">
          <q-btn
            class="full-width full-height"
            color="primary"
            :disable="screenList?.length < 2"
            icon="mmm-fullscreen"
            :label="t('full-screen')"
            :outline="
              screenList?.length < 2 || screenPreferences.preferWindowed
            "
            unelevated
            @click="
              () => {
                log('🔍 [Full Screen Button] Clicked', 'display');
                screenPreferences.preferWindowed = false;
                log(
                  '🔍 [Full Screen Button] Calling moveMediaWindow with:',
                  'display',
                  'log',
                  {
                    screen: screenPreferences.preferredScreenNumber,
                    fullscreen: true,
                  },
                );
                moveMediaWindow(windowScreenIndex, true);
              }
            "
          />
        </div>
        <div class="col-6">
          <q-btn
            class="full-width full-height"
            color="primary"
            :disable="screenList?.length < 2"
            icon="mmm-window"
            :label="t('windowed')"
            :outline="
              !(screenList?.length < 2 || screenPreferences.preferWindowed)
            "
            :text-color="
              screenList?.length < 2 || screenPreferences.preferWindowed
                ? ''
                : 'primary'
            "
            unelevated
            @click="
              () => {
                log('🔍 [Windowed Button] Clicked', 'display');
                screenPreferences.preferWindowed = true;
                log(
                  '🔍 [Windowed Button] Calling moveMediaWindow with:',
                  'display',
                  'log',
                  {
                    screen: screenPreferences.preferredScreenNumber,
                    fullscreen: false,
                  },
                );
                moveMediaWindow(windowScreenIndex, false);
              }
            "
          />
        </div>
      </div>
      <template v-if="screenRoleOptions.length">
        <q-separator class="bg-accent-200 q-my-sm" />
        <p class="card-section-title text-dark-grey q-px-md q-pt-sm">
          {{ t('teo-screen-roles') }}
        </p>
        <div class="column q-gutter-sm q-px-md q-pb-sm">
          <q-select
            v-model="mediaScreenModel"
            dense
            emit-value
            :label="t('teo-screen-role-media')"
            map-options
            option-label="label"
            option-value="value"
            :options="screenRoleOptions"
            outlined
          >
            <template #prepend>
              <q-icon name="mmm-media-display-active" />
            </template>
          </q-select>
          <q-select
            v-model="cameraScreenModel"
            dense
            emit-value
            :label="t('teo-screen-role-camera')"
            map-options
            option-label="label"
            option-value="value"
            :options="screenRoleOptions"
            outlined
          >
            <template #prepend>
              <q-icon name="mmm-video" />
            </template>
          </q-select>
          <q-select
            v-model="speakerScreenModel"
            dense
            emit-value
            :label="t('teo-screen-role-speaker')"
            map-options
            option-label="label"
            option-value="value"
            :options="screenRoleOptions"
            outlined
          >
            <template #prepend>
              <q-icon name="mmm-alarm" />
            </template>
          </q-select>
          <div class="text-body2 text-dark-grey">
            {{ t('teo-screen-roles-hint') }}
          </div>
        </div>
      </template>
      <q-separator class="bg-accent-200 q-my-sm" />
      <template
        v-if="!screenPreferences.preferWindowed && screenList?.length > 2"
      >
        <p class="card-section-title text-dark-grey q-px-md q-pt-sm">
          {{ t('display') }}
        </p>
        <div class="q-px-md q-pb-sm">
          <div
            class="display-map"
            :style="{
              position: 'relative',
              width: '100%',
              aspectRatio: virtualBounds.width + ' / ' + virtualBounds.height,
              overflow: 'hidden',
              '--screen-gap': '1%',
            }"
          >
            <template v-for="(screen, index) in screenList" :key="screen.id">
              <q-btn
                class="screen-rect column items-center justify-center"
                :class="{
                  'border-dashed': screen.mainWindow,
                }"
                :color="!screen.mainWindow ? 'primary' : 'secondary'"
                :disable="screen.mainWindow"
                :outline="!isScreenSelected(index, screen)"
                :style="{
                  position: 'absolute',
                  left:
                    'calc(' +
                    (screenRects[index]?.left ?? 0) +
                    '% + var(--screen-gap))',
                  top:
                    'calc(' +
                    (screenRects[index]?.top ?? 0) +
                    '% + var(--screen-gap))',
                  width:
                    'calc(' +
                    (screenRects[index]?.width ?? 0) +
                    '% - (var(--screen-gap) * 2))',
                  height:
                    'calc(' +
                    (screenRects[index]?.height ?? 0) +
                    '% - (var(--screen-gap) * 2))',
                  borderRadius: '6px',
                }"
                unelevated
                @click="selectMediaScreenFromMap(index)"
              >
                <q-tooltip v-if="screen.mainWindow" :delay="1000">
                  {{ t('main-window-is-on-this-screen') }}
                </q-tooltip>
                <div
                  v-if="screen.mainWindow && scaledMainWindowRect(index)"
                  class="main-window-rect"
                  :style="{
                    position: 'absolute',
                    left: scaledMainWindowRect(index)?.left + '%',
                    top: scaledMainWindowRect(index)?.top + '%',
                    width: scaledMainWindowRect(index)?.width + '%',
                    height: scaledMainWindowRect(index)?.height + '%',
                    pointerEvents: 'none',
                  }"
                >
                  <q-icon
                    name="mmm-logo"
                    size="sm"
                    style="pointer-events: none; color: var(--q-primary)"
                  />
                </div>
                <q-icon
                  v-if="!screen.mainWindow"
                  class="q-mr-sm"
                  name="mmm-media-display-active"
                  size="xs"
                />
                {{ !screen.mainWindow ? t('display') + ' ' + (index + 1) : '' }}
              </q-btn>
            </template>
          </div>
        </div>
        <q-separator class="bg-accent-200 q-my-sm" />
      </template>
    </template>
    <template v-if="currentSettings">
      <div class="row items-center no-wrap q-px-md q-py-sm">
        <div class="col q-pr-md">
          <div class="text-subtitle2">
            {{ t('enableMediaPreview') }}
          </div>
          <div class="text-body2 text-dark-grey">
            {{ t('enableMediaPreview-explain') }}
          </div>
        </div>
        <q-toggle
          v-model="currentSettings.enableMediaPreview"
          checked-icon="mmm-check"
          color="primary"
        />
      </div>
      <q-separator class="bg-accent-200 q-my-sm" />
    </template>
    <p class="card-section-title text-dark-grey q-px-md q-pt-sm">
      {{ t('custom-background') }}
    </p>
    <div class="q-px-md q-pb-sm">
      <q-btn
        v-if="mediaWindowCustomBackground"
        class="full-width"
        color="negative"
        flat
        icon="mmm-reset"
        :label="t('reset-custom-background')"
        no-caps
        @click="chooseCustomBackground(true)"
      />
      <q-btn
        v-else
        class="full-width"
        color="primary"
        icon="mmm-background"
        :label="t('set-custom-background')"
        no-caps
        outline
        @click="chooseCustomBackground(false)"
      />
    </div>
    <template v-if="currentLangObject?.isSignLanguage && cameras.length">
      <q-separator class="bg-accent-200 q-my-sm" />
      <p class="card-section-title text-dark-grey q-px-md q-pt-sm">
        {{ t('camera-as-background') }}
      </p>
      <div class="row q-px-md q-pb-sm">
        <q-select
          v-model="displayCameraId"
          clearable
          emit-value
          :label="t('select-camera')"
          map-options
          :options="cameras"
          outlined
          style="width: 100%"
        />
      </div>
    </template>

    <template #footer>
      <q-btn
        v-if="mediaWindowVisible"
        class="full-width"
        color="primary"
        icon="mmm-media-display-inactive"
        :label="t('hide-media-display')"
        unelevated
        @click="toggleMediaWindowVisibility(false)"
      />
      <q-btn
        v-else
        class="full-width"
        color="primary"
        icon="mmm-media-display-active"
        :label="t('show-media-display')"
        unelevated
        @click="toggleMediaWindowVisibility(true)"
      />
    </template>
  </ActionPopup>
  <BaseDialog v-model="showCustomBackgroundPicker" :dialog-id="props.dialogId">
    <div class="bg-secondary-contrast flex q-px-none" style="flex-flow: column">
      <div
        class="row items-center no-wrap text-bigger text-semibold text-primary q-px-md q-pt-lg"
      >
        <div class="icon-chip q-mr-sm">
          <q-icon name="mmm-background" size="xs" />
        </div>
        {{ t('choose-an-image') }}
      </div>
      <div class="row q-px-md q-py-md">
        {{ t('select-a-custom-background') }}
      </div>
      <div class="q-px-md overflow-auto row flex">
        <template
          v-for="(jwpubImage, index) in jwpubImages"
          :key="jwpubImage.FilePath"
        >
          <q-item
            class="row items-center full-width"
            clickable
            @click="setManagedMediaBackground(jwpubImage.FilePath)"
          >
            <div class="row q-mr-md">
              <q-img
                v-ripple
                class="rounded-borders"
                fit="contain"
                :src="getFileUrlFromPath(jwpubImage.FilePath)"
                style="width: 150px"
              />
            </div>
            <div class="col">
              <div class="row">{{ getBasename(jwpubImage.FilePath) }}</div>
            </div>
          </q-item>
          <q-separator
            v-if="index < jwpubImages.length - 1"
            class="bg-accent-200 q-mt-md"
          />
        </template>
        <q-inner-loading
          :showing="!!jwpubImportFilePath && !jwpubImages.length"
        />
      </div>
      <div class="q-px-md q-py-md row justify-end">
        <q-btn flat @click="showCustomBackgroundPicker = false">
          {{ t('cancel') }}
        </q-btn>
      </div>
    </div>
  </BaseDialog>
</template>
<script setup lang="ts">
import type { Display, MultimediaItem } from 'src/types';

import {
  useBroadcastChannel,
  useEventListener,
  watchImmediate,
  whenever,
} from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import ActionPopup from 'components/ui/ActionPopup.vue';
import { storeToRefs } from 'pinia';
import { useScreenLayout } from 'src/composables/useScreenLayout';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  copyToDatedAdditionalMedia,
  getMemorialBackground,
  stageUserJwpubForRead,
  unzipJwpub,
} from 'src/helpers/jw-media';
import { toggleMediaWindowVisibility } from 'src/helpers/mediaPlayback';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { log } from 'src/shared/vanilla';
import { convertImageIfNeeded } from 'src/utils/converters';
import { getTempPath } from 'src/utils/fs';
import { withTimeout } from 'src/utils/general';
import { isImage, isJwpub } from 'src/utils/media';
import { findDb } from 'src/utils/sqlite';
import { useAppSettingsStore } from 'stores/app-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useTeoCameraStore } from 'stores/teo-camera';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const screenList = ref<Display[]>([]);

const appSettings = useAppSettingsStore();
const { displayCameraId, screenPreferences, timerPreferences } =
  storeToRefs(appSettings);

const currentState = useCurrentStateStore();
const teoCamera = useTeoCameraStore();
const {
  currentCongregation,
  currentLangObject,
  currentSettings,
  mediaWindowCustomBackground,
  mediaWindowVisible,
  selectedDate,
  timerWindowVisible,
} = storeToRefs(currentState);

const props = defineProps<{
  dialogId: string;
}>();

const open = defineModel<boolean>({ default: false });

const {
  basename,
  fs,
  getAllScreens,
  join,
  moveMediaWindow,
  moveTimerWindow,
  openFileDialog,
  pathToFileURL,
} = globalThis.electronApi;

const { copyFile } = fs;

// "Projecting · External screen": whether the media display is shown, and
// where.
const statusText = computed(() => {
  const visibility = mediaWindowVisible.value ? t('projecting') : t('inactive');
  const windowed =
    (screenList.value?.length ?? 0) < 2 ||
    screenPreferences.value.preferWindowed;
  const placement = windowed ? t('windowed') : t('external-screen');
  return [visibility, placement].join(' · ');
});

const statusIcon = computed(() =>
  mediaWindowVisible.value
    ? 'mmm-media-display-active'
    : 'mmm-media-display-inactive',
);

const statusColor = computed(() =>
  mediaWindowVisible.value ? 'positive' : 'grey',
);

// Fixed screen roles: the multimedia screen shows the yeartext and media
// whenever the camera is not projecting, and the camera screen hosts the
// camera. Both assignments are persisted separately, so they stay put across
// restarts and monitor changes.
const outputScreens = computed(() =>
  screenList.value
    .map((screen, index) => ({ index, screen }))
    .filter(({ screen }) => !screen.mainWindow),
);

const isOutputScreen = (index: null | number | undefined): index is number =>
  typeof index === 'number' &&
  !!screenList.value[index] &&
  !screenList.value[index]?.mainWindow;

const defaultMediaScreenIndex = computed(() => {
  const available = outputScreens.value;
  if (!available.length) return null;
  return (
    available.find(({ screen }) => screen.displayNumber === 2)?.index ??
    available[0]?.index ??
    null
  );
});

const mediaScreenIndex = computed<null | number>(() => {
  const configured = screenPreferences.value.preferredScreenNumber;
  if (isOutputScreen(configured)) return configured;
  return defaultMediaScreenIndex.value;
});

const cameraScreenIndex = computed<null | number>(() => {
  const configured = teoCamera.preferredCameraScreen;
  if (isOutputScreen(configured)) return configured;
  const other = outputScreens.value.find(
    ({ index }) => index !== mediaScreenIndex.value,
  );
  return other?.index ?? mediaScreenIndex.value;
});

// The speaker monitor (timer window) gets its own screen too. Falls back to
// the first screen that is neither the multimedia nor the camera screen.
const speakerScreenIndex = computed<null | number>(() => {
  const configured = timerPreferences.value.preferredScreenNumber;
  if (isOutputScreen(configured)) return configured;
  const other = outputScreens.value.find(
    ({ index }) =>
      index !== mediaScreenIndex.value && index !== cameraScreenIndex.value,
  );
  return other?.index ?? cameraScreenIndex.value;
});

const screenRoleOptions = computed(() =>
  outputScreens.value.map(({ index, screen }) => ({
    label: `${t('teo-screen', {
      number: screen.displayNumber ?? index + 1,
    })} · ${screen.bounds.width} × ${screen.bounds.height}`,
    value: index,
  })),
);

const mediaScreenModel = computed({
  get: () => mediaScreenIndex.value,
  set: (index: null | number) => {
    if (!isOutputScreen(index)) return;
    screenPreferences.value.preferredScreenNumber = index;
    teoCamera.preferredOutputScreen = index;
    // While a camera is projecting, the output window belongs to the camera
    // screen; this assignment applies as soon as the camera stops.
    if (teoCamera.activeCameraId && !currentState.mediaIsPlaying) return;
    moveMediaWindow(index, !screenPreferences.value.preferWindowed);
  },
});

const cameraScreenModel = computed({
  get: () => cameraScreenIndex.value,
  set: (index: null | number) => {
    if (!isOutputScreen(index)) return;
    teoCamera.preferredCameraScreen = index;
    if (!teoCamera.activeCameraId) return;
    teoCamera.setActiveScreen(index);
    if (!currentState.mediaIsPlaying) moveMediaWindow(index, true);
  },
});

const speakerScreenModel = computed({
  get: () => speakerScreenIndex.value,
  set: (index: null | number) => {
    if (!isOutputScreen(index)) return;
    timerPreferences.value.preferredScreenNumber = index;
    if (!timerWindowVisible.value) return;
    moveTimerWindow(index, !timerPreferences.value.preferWindowed);
  },
});

// The fullscreen/windowed buttons must not pull a projecting camera back to
// the multimedia screen.
const windowScreenIndex = computed<number | undefined>(() => {
  const activeCameraScreen = teoCamera.activeScreenIndex;
  if (
    teoCamera.activeCameraId &&
    !currentState.mediaIsPlaying &&
    activeCameraScreen !== null
  ) {
    return activeCameraScreen;
  }
  return mediaScreenIndex.value ?? undefined;
});

const selectMediaScreenFromMap = (index: number) => {
  if (!isOutputScreen(index)) return;
  screenPreferences.value.preferredScreenNumber = index;
  teoCamera.preferredOutputScreen = index;
  if (teoCamera.activeCameraId && !currentState.mediaIsPlaying) {
    teoCamera.setActiveScreen(index);
  }
  moveMediaWindow(index, !screenPreferences.value.preferWindowed);
};

const getBasename = (filename: string) => {
  if (!filename) return '';
  return basename(filename);
};

const getFileUrlFromPath = (filepath: string) => {
  if (!filepath) return '';
  return pathToFileURL(filepath);
};

// Virtual desktop extents and per-screen rectangles for the screen map
const { screenRects, virtualBounds } = useScreenLayout(screenList);

const scaledMainWindowRect = (index: number) => {
  const list = screenList.value ?? [];
  const screen = list[index];
  if (!screen?.mainWindowBounds) return undefined;

  const b = screen.bounds;
  const mw = screen.mainWindowBounds;

  const inset = 3;
  const minSize = 4;

  let left = ((mw.x - b.x) / b.width) * 100 + inset;
  let top = ((mw.y - b.y) / b.height) * 100 + inset;
  let width = (mw.width / b.width) * 100 - inset * 2;
  let height = (mw.height / b.height) * 100 - inset * 2;

  left = Math.max(inset, Math.min(left, 100 - inset));
  top = Math.max(inset, Math.min(top, 100 - inset));
  width = Math.max(minSize, Math.min(width, 100 - left - inset));
  height = Math.max(minSize, Math.min(height, 100 - top - inset));

  return { height, left, top, width };
};

// Selected when media window is on this screen and it's not the app's main window
const isScreenSelected = (_index: number, screen: Display) => {
  return !!screen.mediaWindow && !screen.mainWindow;
};

const jwpubImportFilePath = ref('');
const jwpubImages = ref<{ FilePath: string }[]>([]);

// The picker's visibility is derived from the import state, so closing it
// (Cancel, Esc or a backdrop click through BaseDialog's v-model) must clear
// that state. A getter-only computed would silently ignore the write and
// leave the dialog open.
const showCustomBackgroundPicker = computed({
  get: () => !!jwpubImportFilePath.value || jwpubImages.value.length > 0,
  set: (value: boolean) => {
    if (value) return;
    jwpubImportFilePath.value = '';
    jwpubImages.value = [];
  },
});

const processJwpubBackground = async (filepath: string) => {
  jwpubImportFilePath.value = filepath;
  const stagedFilepath = await stageUserJwpubForRead(filepath);
  if (!stagedFilepath) return;
  const unzipDir = await unzipJwpub(stagedFilepath);
  if (!unzipDir) throw new Error('Failed to unzip: ' + filepath);

  const db = await findDb(unzipDir);
  if (!db) throw new Error('No db file found: ' + filepath);

  const query =
    "SELECT FilePath FROM Multimedia WHERE CategoryType >= 0 AND CategoryType <> 9 AND FilePath <> '';";
  const results = await globalThis.electronApi.executeQuery<
    Partial<MultimediaItem>
  >(db, query);

  jwpubImages.value = results.map((multimediaItem) => ({
    FilePath: join(unzipDir, multimediaItem.FilePath ?? ''),
  }));

  if (jwpubImages.value.length === 0) {
    notifyInvalidBackgroundFile();
    // Without this, showCustomBackgroundPicker/q-inner-loading's
    // `!!jwpubImportFilePath` condition never goes false again since
    // nothing else clears it on this particular (no-throw, just empty-
    // results) path - unlike the catch blocks elsewhere in this file that
    // already reset it - so the loading spinner would stay stuck forever
    // instead of settling into the empty-state message below.
    jwpubImportFilePath.value = '';
  }
};

const processFileBackground = async (filepath: string) => {
  const tempDirectory = await getTempPath();
  const tempFilepath = join(tempDirectory, basename(filepath));
  await copyFile(filepath, tempFilepath);

  const workingTempFilepath = await convertImageIfNeeded(tempFilepath);
  if (isImage(workingTempFilepath)) {
    const managedFilepath = await copyToDatedAdditionalMedia(
      workingTempFilepath,
      undefined,
      false,
    );
    if (managedFilepath) {
      setMediaBackground(managedFilepath);
    } else {
      throw new Error('Problem with image file');
    }
  } else {
    throw new Error(
      'Invalid file type: ' + workingTempFilepath.split('/').pop(),
    );
  }
};

const setManagedMediaBackground = async (filepath: string) => {
  try {
    const managedFilepath = await copyToDatedAdditionalMedia(
      filepath,
      undefined,
      false,
    );
    if (!managedFilepath) throw new Error('Problem with image file');
    setMediaBackground(managedFilepath);
  } catch (error) {
    errorCatcher(error);
    notifyInvalidBackgroundFile();
    jwpubImages.value = [];
    jwpubImportFilePath.value = '';
  }
};

const chooseCustomBackground = async (reset?: boolean) => {
  if (reset) {
    mediaWindowCustomBackground.value = '';
    notifyCustomBackgroundRemoved();
    return;
  }

  try {
    const backgroundPicker = await openFileDialog(true, 'jwpub+image+pdf');
    if (!backgroundPicker || backgroundPicker.canceled) return;

    if (!backgroundPicker.filePaths.length) {
      notifyInvalidBackgroundFile();
      return;
    }

    const filepath = backgroundPicker.filePaths[0];
    if (!filepath) return;

    if (isJwpub(filepath)) {
      await processJwpubBackground(filepath);
    } else {
      await processFileBackground(filepath);
    }
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes('Invalid file type')
    ) {
      errorCatcher(error, {
        contexts: {
          fn: {
            args: {
              mediaWindowCustomBackground: mediaWindowCustomBackground.value,
              reset,
            },
            name: 'chooseCustomBackground',
          },
        },
      });
    }
    notifyInvalidBackgroundFile();
  }
};

const SCREEN_FETCH_TIMEOUT_MS = 5000;

// Guards against piling up overlapping getAllScreens() IPC round-trips -
// e.g. several 'screen-trigger-update' events landing while the popup is
// open and a previous fetch is still in flight - and against ever leaving
// the popup waiting forever if the main process is slow to reply.
let fetchingScreens = false;

const fetchScreens = async () => {
  if (fetchingScreens) return;
  fetchingScreens = true;
  try {
    screenList.value = await withTimeout(
      getAllScreens(),
      SCREEN_FETCH_TIMEOUT_MS,
      'getAllScreens timed out',
    );
  } catch (error) {
    errorCatcher(error);
  } finally {
    fetchingScreens = false;
  }
};

const cameras = ref<{ label: string; value: string }[]>([]);

const getCameras = async () => {
  // Only enumerate devices if it's a sign language congregation or a camera is already selected
  // This avoids triggering the Video Capture service for the vast majority of users
  if (!currentLangObject.value?.isSignLanguage && !displayCameraId.value) {
    log(
      '🎬 [getCameras] Skipping camera enumeration (not a sign language congregation and no camera selected)',
      'display',
      'log',
    );
    return;
  }

  try {
    log('🎬 [getCameras] Enumerating video input devices', 'display', 'log');
    // enumerateDevices() has been known to hang indefinitely on some systems
    // (misbehaving virtual-camera drivers, privacy/AV software intercepting
    // device access) - bound it so the popup doesn't wait on it forever.
    cameras.value = (
      await withTimeout(
        navigator.mediaDevices.enumerateDevices(),
        4000,
        'enumerateDevices timed out',
      )
    )
      .filter((d) => d.kind === 'videoinput')
      .map((d) => ({ label: d.label, value: d.deviceId }));
  } catch (error) {
    errorCatcher(error);
  }
};

const { post: postCameraStream } = useBroadcastChannel<
  null | string,
  null | string
>({
  name: 'camera-stream',
});

// Listen for requests to get current media window variables
const { data: getCurrentMediaWindowVariables } = useBroadcastChannel<
  string,
  string
>({
  name: 'get-current-media-window-variables',
});

const notifyInvalidBackgroundFile = () => {
  createTemporaryNotification({
    message: t('please-use-image-or-jwpub'),
    type: 'negative',
  });
  mediaWindowCustomBackground.value = '';
  jwpubImportFilePath.value = '';
};

const notifyCustomBackgroundSet = () => {
  createTemporaryNotification({
    caption: t('custom-background-will-not-persist'),
    icon: 'mmm-background',
    message: t('custom-background-set'),
    type: 'positive',
  });
};

const notifyCustomBackgroundRemoved = () => {
  createTemporaryNotification({
    icon: 'mmm-background-remove',
    message: t('custom-background-removed'),
    type: 'positive',
  });
};
const setMediaBackground = (filepath: string) => {
  try {
    if (filepath) {
      mediaWindowCustomBackground.value = pathToFileURL(filepath);
      notifyCustomBackgroundSet();
    } else {
      throw new Error('Problem with image file');
    }
  } catch (error) {
    errorCatcher(error);
    if (filepath) notifyInvalidBackgroundFile();
    mediaWindowCustomBackground.value = '';
  } finally {
    jwpubImages.value = [];
    jwpubImportFilePath.value = '';
  }
};

const { post: postCustomBackground } = useBroadcastChannel<string, string>({
  name: 'custom-background',
});

const loadMemorialBackground = async (newMediaBackground?: string) => {
  let bg: string | undefined = newMediaBackground;
  if (
    !newMediaBackground &&
    selectedDate.value &&
    selectedDate.value === currentSettings.value?.memorialDate
  ) {
    bg = await getMemorialBackground();
    if (bg) {
      createTemporaryNotification({
        group: 'memorial-fetch-bg',
        message: t('memorialFetchBgSuccess'),
        type: 'positive',
      });
    } else {
      createTemporaryNotification({
        group: 'memorial-fetch-bg',
        message: t('memorialFetchErrorNoBg'),
        type: 'negative',
      });
    }
  }
  postCustomBackground(bg ?? '');
};

const stopListeningToScreens = ref<(() => void) | null>(null);

watch(
  () => mediaWindowCustomBackground.value,
  (newMediaBackground) => {
    void loadMemorialBackground(newMediaBackground);
  },
);

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      if (!stopListeningToScreens.value) {
        log(
          '🔍 [DialogDisplayPopup] Starting screen update listener',
          'display',
          'log',
        );
        stopListeningToScreens.value = useEventListener(
          globalThis,
          'screen-trigger-update',
          () => {
            void fetchScreens();
          },
          {
            passive: true,
          },
        );
      }
    } else if (stopListeningToScreens.value) {
      log(
        '🔍 [DialogDisplayPopup] Stopping screen update listener',
        'display',
        'log',
      );
      stopListeningToScreens.value();
      stopListeningToScreens.value = null;
    }
  },
  { immediate: true },
);

whenever(
  () => open.value,
  () => {
    void fetchScreens();
    void getCameras();
  },
);

watchImmediate(
  () => getCurrentMediaWindowVariables.value,
  () => {
    // Push current camera stream when requested
    if (displayCameraId.value) {
      postCameraStream(displayCameraId.value);
    }
  },
);

watchImmediate(
  () => [
    currentSettings.value?.enableMediaDisplayButton,
    currentCongregation.value,
  ],
  ([newMediaDisplayEnabled, newCongregation]) => {
    toggleMediaWindowVisibility(!!newCongregation && !!newMediaDisplayEnabled);
  },
);
</script>
<style scoped>
.screen-rect {
  transition:
    left 180ms ease,
    top 180ms ease,
    width 180ms ease,
    height 180ms ease;
}

.main-window-rect {
  align-items: center;
  border: 2px dashed var(--q-primary);
  border-radius: 4px;
  display: flex;
  justify-content: center;
  transition:
    left 180ms ease,
    top 180ms ease,
    width 180ms ease,
    height 180ms ease;
}

.border-dashed::before {
  border-style: dashed;
}
</style>
