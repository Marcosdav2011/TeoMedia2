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
export const TEO_SCREEN_IDENTIFY_CHANNEL = 'teo-screen-identify';

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
