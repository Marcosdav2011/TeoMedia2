import type { Display } from 'src/types';

import { useEventListener } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { toggleMediaWindowVisibility } from 'src/helpers/mediaPlayback';
import { postTeoScreenIdentify } from 'src/helpers/teo-outputs';
import { withTimeout } from 'src/utils/general';
import { useAppSettingsStore } from 'stores/app-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useTeoCameraStore } from 'stores/teo-camera';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const SCREEN_FETCH_TIMEOUT_MS = 5000;

/**
 * TEO MEDIA output-screen helper.
 *
 * Screens come straight from Electron, so their order and numbering match what
 * `moveMediaWindow` expects. The screen hosting the main window is never used
 * as an output target, because a fullscreen output window there would cover
 * the app itself.
 */
export const useTeoScreens = () => {
  const { t } = useI18n();
  const appSettings = useAppSettingsStore();
  const currentState = useCurrentStateStore();
  const teoCamera = useTeoCameraStore();
  const { screenPreferences } = storeToRefs(appSettings);

  const { getAllScreens, moveMediaWindow } = globalThis.electronApi;

  const screens = ref<Display[]>([]);
  const loading = ref(false);
  let fetching = false;

  const outputScreens = computed(() =>
    screens.value
      .map((screen, index) => ({ index, screen }))
      .filter(({ screen }) => !screen.mainWindow),
  );

  const hasOutputScreen = computed(() => outputScreens.value.length > 0);

  const defaultOutputScreenIndex = computed(() => {
    const available = outputScreens.value;
    if (!available.length) return null;

    // TEO starts on the physical second screen (monitor 2). If it is the
    // screen hosting the main window, or there is no such screen, fall back
    // to the first usable output screen.
    return (
      available.find(({ screen }) => screen.displayNumber === 2)?.index ??
      available[0]?.index ??
      null
    );
  });

  const preferredScreenIndex = computed(() => {
    const available = outputScreens.value;
    if (!available.length) return null;

    const teoPreferred = available.find(
      ({ index }) => index === teoCamera.preferredOutputScreen,
    );
    return teoPreferred?.index ?? defaultOutputScreenIndex.value;
  });

  const preferredScreen = computed(() => {
    const index = preferredScreenIndex.value;
    return index === null ? null : (screens.value[index] ?? null);
  });

  /**
   * The other external screen. TEO mirrors visual media there so both room
   * monitors always show content; the camera keeps using the primary output.
   */
  const auxiliaryScreenIndex = computed(() => {
    const primary = preferredScreenIndex.value;
    const available = outputScreens.value;
    if (available.length < 2) return null;
    return available.find(({ index }) => index !== primary)?.index ?? null;
  });

  const hasAuxiliaryScreen = computed(
    () => auxiliaryScreenIndex.value !== null,
  );

  const screenNumber = (index: number) =>
    screens.value[index]?.displayNumber ?? index + 1;

  const screenLabel = (index: number) =>
    t('teo-screen', { number: screenNumber(index) });

  const screenDetails = (screen: Display) =>
    `${screen.bounds.width} × ${screen.bounds.height}`;

  const screenOptionLabel = (index: number) => {
    const screen = screens.value[index];
    if (!screen) return screenLabel(index);
    return `${screenLabel(index)} · ${screenDetails(screen)}`;
  };

  const screenOptions = computed(() =>
    outputScreens.value.map(({ index }) => ({
      label: screenOptionLabel(index),
      value: index,
    })),
  );

  const identifyText = (index: number) => {
    const screen = screens.value[index];
    if (!screen) return screenLabel(index);
    return `${screenLabel(index)}\n${screenDetails(screen)}`;
  };

  const setPreferredScreen = (index: null | number) => {
    if (index === null) return;
    const screen = screens.value[index];
    if (!screen || screen.mainWindow) return;
    screenPreferences.value.preferredScreenNumber = index;
    teoCamera.preferredOutputScreen = index;
  };

  /**
   * Whether the output window is already visible, fullscreen, and on the given
   * screen. MMM repositions the window on many events; checking this first
   * keeps TEO from forcing a fullscreen transition (which can interrupt
   * playback) when nothing actually needs to move.
   */
  const isOutputActiveOnScreen = (index: null | number) => {
    if (index === null) return false;
    const screen = screens.value[index];
    if (!screen?.mediaWindow || !screen.mediaWindowVisible) return false;

    const windowBounds = screen.mediaWindowBounds;
    if (!windowBounds) return true;
    return (
      windowBounds.width >= screen.bounds.width - 10 &&
      windowBounds.height >= screen.bounds.height - 10
    );
  };

  const showOutputWindow = (force = false) => {
    // The renderer's `mediaWindowVisible` starts as true while the main
    // process creates the window hidden, so the renderer flag alone cannot
    // decide whether it is actually on screen. `getAllScreens` reports the
    // real visibility.
    if (!force && screens.value.some((screen) => screen.mediaWindowVisible)) {
      return;
    }
    toggleMediaWindowVisibility(true);
  };

  const fetchScreens = async () => {
    if (fetching) return;
    fetching = true;
    loading.value = true;
    try {
      screens.value = await withTimeout(
        getAllScreens(),
        SCREEN_FETCH_TIMEOUT_MS,
        'getAllScreens timed out',
      );
    } catch (error) {
      errorCatcher(error, {
        contexts: { fn: { name: 'fetchTeoScreens' } },
      });
    } finally {
      fetching = false;
      loading.value = false;
    }
  };

  /**
   * Shows the output window on the requested (or preferred) screen and clears
   * any leftover screen-identification overlay. When the window is already
   * visible and fullscreen on that screen, nothing is moved, so media playback
   * is not disturbed by needless fullscreen transitions.
   */
  const activateOutput = (
    requestedIndex?: number,
    options: { force?: boolean } = {},
  ) => {
    const index = requestedIndex ?? preferredScreenIndex.value;
    if (index === null) return null;

    const screen = screens.value[index];
    if (!screen || screen.mainWindow) return null;

    setPreferredScreen(index);

    if (!options.force && isOutputActiveOnScreen(index)) return index;

    // Show first, then move: showing the window triggers MMM's own automatic
    // placement pass, so the explicit target must be requested afterwards to
    // win on setups with three or more screens.
    showOutputWindow(options.force === true);
    postTeoScreenIdentify('');
    moveMediaWindow(index, true);
    return index;
  };

  const activateAuxiliaryOutput = (requestedIndex?: number) => {
    const index = requestedIndex ?? auxiliaryScreenIndex.value;
    if (index === null) return null;

    const screen = screens.value[index];
    if (!screen || screen.mainWindow) return null;
    if (index === preferredScreenIndex.value) return null;

    globalThis.electronApi.toggleAuxiliaryWindow(true, index);
    return index;
  };

  const identifyScreen = (index: number) => {
    const screen = screens.value[index];
    if (!screen || screen.mainWindow) return;

    screenPreferences.value.preferWindowed = false;
    if (activateOutput(index) === null) return;

    if (teoCamera.activeCameraId) {
      teoCamera.setActiveScreen(index);
      return;
    }

    if (currentState.mediaIsPlaying) return;
    postTeoScreenIdentify(identifyText(index));
  };

  /**
   * Moves the output window to the selected screen, shows it, and (when no
   * camera or media is active) briefly displays the screen number so users can
   * map each physical monitor to its entry in the list.
   */
  const selectScreen = (index: number) => {
    const screen = screens.value[index];
    if (!screen || screen.mainWindow) return;

    screenPreferences.value.preferWindowed = false;
    if (activateOutput(index) === null) return;

    if (teoCamera.activeCameraId) {
      teoCamera.setActiveScreen(index);
      return;
    }

    if (!currentState.mediaIsPlaying) {
      postTeoScreenIdentify(identifyText(index));
    }
  };

  // Keep TEO's persisted choice in sync when the screen is changed from
  // MMM's own display dialog instead of the TEO selector.
  watch(
    () => screenPreferences.value.preferredScreenNumber,
    (screenNumberValue) => {
      if (screenNumberValue === undefined) return;
      const isOutputScreen = outputScreens.value.some(
        ({ index }) => index === screenNumberValue,
      );
      if (isOutputScreen) {
        teoCamera.preferredOutputScreen = screenNumberValue;
      }
    },
  );

  useEventListener(
    globalThis,
    'screen-trigger-update',
    () => {
      void fetchScreens();
    },
    { passive: true },
  );

  onMounted(() => {
    void fetchScreens();
  });

  return {
    activateAuxiliaryOutput,
    activateOutput,
    auxiliaryScreenIndex,
    fetchScreens,
    hasAuxiliaryScreen,
    hasOutputScreen,
    identifyScreen,
    loading,
    preferredScreen,
    preferredScreenIndex,
    screenDetails,
    screenLabel,
    screenNumber,
    screenOptions,
    screens,
    selectScreen,
    setPreferredScreen,
    showOutputWindow,
  };
};
