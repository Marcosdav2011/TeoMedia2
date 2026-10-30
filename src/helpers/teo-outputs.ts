import type { TeoCameraLayout, TeoCameraView } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';

/**
 * TEO MEDIA output channels.
 *
 * TEO owns the camera output, so it uses its own channel instead of MMM's
 * `camera-stream`. MMM publishes a display camera there automatically
 * (`displayCameraId`), which would replace the yeartext on the output screen
 * even when no camera was assigned in TEO. `teo-screen-identify` shows a
 * temporary screen number on the output window.
 */
export const TEO_CAMERA_CHANNEL = 'teo-camera-stream';
export const TEO_CAMERA_LAYOUT_CHANNEL = 'teo-camera-layout';
export const TEO_CAMERA_VIEW_CHANNEL = 'teo-camera-view';
export const TEO_CAPTURE_CHANNEL = 'teo-capture-source';
export const TEO_CAPTURE_STATUS_CHANNEL = 'teo-capture-status';
export const TEO_SCREEN_IDENTIFY_CHANNEL = 'teo-screen-identify';

/**
 * The yeartext is also mirrored into shared localStorage. BroadcastChannel
 * only reaches windows that are already listening, so an output window
 * created late (or one that missed its startup request) could otherwise stay
 * black until the yeartext happened to change again.
 */
export const TEO_YEARTEXT_CACHE_KEY = 'teo-yeartext';

export const cacheYeartext = (yeartext: null | string | undefined) => {
  try {
    localStorage.setItem(TEO_YEARTEXT_CACHE_KEY, yeartext ?? '');
  } catch {
    // Storage can be unavailable in restricted windows; the broadcast below
    // still carries the value to every listening output.
  }
};

/**
 * The media window reports back when it could not open a captured source, or
 * when the source goes away (its window closed, the screen was unplugged).
 * Without it the main window would keep claiming the capture is running while
 * the output stays black or frozen.
 */
export interface TeoCaptureStatusMessage {
  ok: boolean;
  sourceId: string;
}

export interface TeoScreenIdentifyMessage {
  label: string;
  /**
   * Monotonic token so sending the same screen twice still counts as a new
   * message in the media window. Without it, Vue would skip the watcher when
   * the label string is unchanged and the overlay would not reappear.
   */
  token: number;
}

let cameraChannel: BroadcastChannel | null = null;
let cameraLayoutChannel: BroadcastChannel | null = null;
let cameraViewChannel: BroadcastChannel | null = null;
let captureChannel: BroadcastChannel | null = null;
let captureStatusChannel: BroadcastChannel | null = null;
let identifyChannel: BroadcastChannel | null = null;

const getChannel = (
  name: string,
  cached: BroadcastChannel | null,
): BroadcastChannel | null => {
  if (cached) return cached;
  if (typeof BroadcastChannel === 'undefined') return null;

  try {
    return new BroadcastChannel(name);
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { channel: name, name: 'getTeoOutputChannel' } },
    });
    return null;
  }
};

export const postTeoCamera = (deviceId: string) => {
  try {
    cameraChannel = getChannel(TEO_CAMERA_CHANNEL, cameraChannel);
    cameraChannel?.postMessage(deviceId);
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'postTeoCamera' } },
    });
  }
};

export const postTeoCameraLayout = (layout: '' | TeoCameraLayout) => {
  try {
    cameraLayoutChannel = getChannel(
      TEO_CAMERA_LAYOUT_CHANNEL,
      cameraLayoutChannel,
    );
    cameraLayoutChannel?.postMessage(layout);
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'postTeoCameraLayout' } },
    });
  }
};

export const postTeoCameraView = (view: TeoCameraView) => {
  try {
    cameraViewChannel = getChannel(TEO_CAMERA_VIEW_CHANNEL, cameraViewChannel);
    cameraViewChannel?.postMessage(view);
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'postTeoCameraView' } },
    });
  }
};

export const postTeoCapture = (sourceId: string) => {
  try {
    captureChannel = getChannel(TEO_CAPTURE_CHANNEL, captureChannel);
    captureChannel?.postMessage(sourceId);
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'postTeoCapture' } },
    });
  }
};

export const postTeoCaptureStatus = (message: TeoCaptureStatusMessage) => {
  try {
    captureStatusChannel = getChannel(
      TEO_CAPTURE_STATUS_CHANNEL,
      captureStatusChannel,
    );
    captureStatusChannel?.postMessage(message);
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'postTeoCaptureStatus' } },
    });
  }
};

export const postTeoScreenIdentify = (text: string) => {
  try {
    identifyChannel = getChannel(TEO_SCREEN_IDENTIFY_CHANNEL, identifyChannel);
    identifyChannel?.postMessage({
      label: text,
      token: Date.now(),
    } satisfies TeoScreenIdentifyMessage);
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'postTeoScreenIdentify' } },
    });
  }
};
