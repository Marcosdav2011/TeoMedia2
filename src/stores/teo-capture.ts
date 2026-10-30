import type { CaptureSource } from 'src/types';

import { defineStore } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { toggleMediaWindowVisibility } from 'src/helpers/mediaPlayback';
import { postTeoCapture, postTeoScreenIdentify } from 'src/helpers/teo-outputs';
import { useCurrentStateStore } from 'stores/current-state';
import { useTeoCameraStore } from 'stores/teo-camera';

interface Store {
  activeScreenIndex: null | number;
  /** The desktopCapturer id projected to the output; empty when idle. */
  activeSourceId: string;
  activeSourceName: string;
  activeSourceType: 'screen' | 'window' | null;
}

/**
 * Window/screen capture projected to an output. The stream is opened inside
 * the media window (a MediaStream can't cross windows), so this store only
 * tracks the assignment and tells that window which source to capture.
 */
export const useTeoCaptureStore = defineStore('teo-capture', {
  actions: {
    resumeCaptureProjection() {
      const screenIndex = this.activeScreenIndex;
      if (!this.activeSourceId || screenIndex === null) return;

      try {
        if (!useCurrentStateStore().mediaWindowVisible) {
          toggleMediaWindowVisibility(true);
        }
        globalThis.electronApi.moveMediaWindow(screenIndex, true);
        postTeoScreenIdentify('');
        postTeoCapture(this.activeSourceId);
      } catch (error) {
        errorCatcher(error, {
          contexts: {
            fn: { name: 'resumeCaptureProjection', screenIndex },
          },
        });
      }
    },

    setActiveScreen(index: number) {
      if (this.activeSourceId) this.activeScreenIndex = index;
    },

    startCapture(source: CaptureSource, screenIndex: number): boolean {
      try {
        if (useCurrentStateStore().mediaIsPlaying) return false;

        // The camera and a capture share the output, and only one of them
        // can be what the audience sees.
        const teoCamera = useTeoCameraStore();
        if (teoCamera.activeCameraId) teoCamera.stopCameraProjection();

        this.activeSourceId = source.id;
        this.activeSourceName = source.name;
        this.activeSourceType = source.type;
        this.activeScreenIndex = screenIndex;

        toggleMediaWindowVisibility(true);
        globalThis.electronApi.moveMediaWindow(screenIndex, true);
        postTeoScreenIdentify('');
        postTeoCapture(source.id);
        return true;
      } catch (error) {
        errorCatcher(error, {
          contexts: {
            fn: { name: 'startCapture', screenIndex },
          },
        });
        return false;
      }
    },

    stopCapture() {
      try {
        postTeoCapture('');
        postTeoScreenIdentify('');
        this.activeSourceId = '';
        this.activeSourceName = '';
        this.activeSourceType = null;
        this.activeScreenIndex = null;

        // Hand the output back to the multimedia screen, as stopping the
        // camera does. When no multimedia screen was ever assigned, the output
        // keeper re-homes the window once it notices the capture ended.
        const mediaScreen = useTeoCameraStore().preferredOutputScreen;
        if (mediaScreen !== null) {
          globalThis.electronApi.moveMediaWindow(mediaScreen, true);
        }
      } catch (error) {
        errorCatcher(error, {
          contexts: { fn: { name: 'stopCapture' } },
        });
      }
    },

    /** Hides the capture while media plays but keeps the assignment. */
    suspendCapture() {
      if (!this.activeSourceId) return;
      try {
        postTeoCapture('');
      } catch (error) {
        errorCatcher(error, {
          contexts: { fn: { name: 'suspendCapture' } },
        });
      }
    },
  },
  state: (): Store => ({
    activeScreenIndex: null,
    activeSourceId: '',
    activeSourceName: '',
    activeSourceType: null,
  }),
});
