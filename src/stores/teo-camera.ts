import { defineStore } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { toggleMediaWindowVisibility } from 'src/helpers/mediaPlayback';
import { postTeoCamera, postTeoScreenIdentify } from 'src/helpers/teo-outputs';
import { useCurrentStateStore } from 'stores/current-state';

interface Store {
  activeCameraId: null | string;
  activeCameraLabel: string;
  activeScreenIndex: null | number;
  preferredOutputScreen: null | number;
  selectedCameraId: null | string;
  selectedCameraLabel: string;
}

export const useTeoCameraStore = defineStore('teo-camera', {
  actions: {
    resumeCameraProjection() {
      const screenIndex = this.activeScreenIndex;
      if (!this.activeCameraId || screenIndex === null) return;

      try {
        // Playback may have hidden the output window meanwhile. Only request
        // showing it when it is actually hidden: showing an already visible
        // window would steal focus from the main window.
        if (!useCurrentStateStore().mediaWindowVisible) {
          toggleMediaWindowVisibility(true);
        }
        globalThis.electronApi.moveMediaWindow(screenIndex, true);
        postTeoScreenIdentify('');
        postTeoCamera(this.activeCameraId);
      } catch (error) {
        errorCatcher(error, {
          contexts: {
            fn: { name: 'resumeCameraProjection', screenIndex },
          },
        });
      }
    },

    setActiveScreen(index: number) {
      if (this.activeCameraId) this.activeScreenIndex = index;
    },

    startCameraProjection(
      deviceId: string,
      label: string,
      screenIndex: number,
    ): boolean {
      try {
        const currentState = useCurrentStateStore();
        if (currentState.mediaIsPlaying) return false;

        this.selectedCameraId = deviceId;
        this.selectedCameraLabel = label;
        this.activeCameraId = deviceId;
        this.activeCameraLabel = label;
        this.activeScreenIndex = screenIndex;

        // Show the output window first, then move it explicitly: showing it
        // runs MMM's automatic placement pass, which the explicit target must
        // override on multi-screen setups. Always request showing because the
        // window is created hidden while `mediaWindowVisible` starts as true.
        toggleMediaWindowVisibility(true);
        globalThis.electronApi.moveMediaWindow(screenIndex, true);
        postTeoScreenIdentify('');
        postTeoCamera(deviceId);
        return true;
      } catch (error) {
        errorCatcher(error, {
          contexts: {
            fn: {
              name: 'startCameraProjection',
              screenIndex,
            },
          },
        });
        return false;
      }
    },

    stopCameraProjection() {
      try {
        postTeoCamera('');
        postTeoScreenIdentify('');
        this.activeCameraId = null;
        this.activeCameraLabel = '';
        this.activeScreenIndex = null;
      } catch (error) {
        errorCatcher(error, {
          contexts: { fn: { name: 'stopCameraProjection' } },
        });
      }
    },

    /**
     * Hides the camera layer while media plays but keeps the assignment, so
     * `resumeCameraProjection` can bring it back when playback ends.
     */
    suspendCameraProjection() {
      if (!this.activeCameraId) return;
      try {
        postTeoCamera('');
      } catch (error) {
        errorCatcher(error, {
          contexts: { fn: { name: 'suspendCameraProjection' } },
        });
      }
    },
  },
  persist: {
    pick: ['preferredOutputScreen', 'selectedCameraId', 'selectedCameraLabel'],
  },
  state: (): Store => ({
    activeCameraId: null,
    activeCameraLabel: '',
    activeScreenIndex: null,
    preferredOutputScreen: null,
    selectedCameraId: null,
    selectedCameraLabel: '',
  }),
});
