import type { CaptureSource } from 'src/types';

import { BrowserWindow, desktopCapturer, type WebContents } from 'electron';
import { captureElectronError } from 'src-electron/main/utils';

// Enough detail to recognize a window in the picker without shipping a
// full-size screenshot across the bridge for every source.
const THUMBNAIL_SIZE = { height: 180, width: 320 };

/**
 * Windows and screens the operator can project. TM2's own windows are left
 * out: capturing one of them would put the output inside its own input.
 */
export const getCaptureSources = async (
  sender: WebContents,
): Promise<CaptureSource[]> => {
  try {
    const windows = BrowserWindow.getAllWindows().filter(
      (window) => !window.isDestroyed(),
    );
    const ownSourceIds = new Set(
      windows.map((window) => sender.getMediaSourceId(window.webContents)),
    );
    const ownTitles = new Set(
      windows.map((window) => window.getTitle()).filter(Boolean),
    );

    const sources = await desktopCapturer.getSources({
      thumbnailSize: THUMBNAIL_SIZE,
      types: ['screen', 'window'],
    });

    return sources
      .filter(
        (source) => !ownSourceIds.has(source.id) && !ownTitles.has(source.name),
      )
      .map((source) => ({
        displayId: source.display_id,
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.isEmpty()
          ? ''
          : source.thumbnail.toDataURL(),
        type: source.id.startsWith('screen:') ? 'screen' : 'window',
      }));
  } catch (error) {
    captureElectronError(error, {
      contexts: { fn: { name: 'getCaptureSources' } },
    });
    return [];
  }
};
