import type { BrowserWindow } from 'electron';

import {
  HD_RESOLUTION,
  PLATFORM,
  WINDOW_MOVE_THROTTLE_MS,
} from 'src-electron/constants';
import { getAllScreens } from 'src-electron/main/screen';
import { captureElectronError, getIconPath } from 'src-electron/main/utils';
import { createWindow } from 'src-electron/main/window/window-base';
import { normalizeWindowBounds } from 'src-electron/main/window/window-bounds';
import { log, throttleWithTrailing } from 'src/shared/vanilla';

export const auxiliaryWindowInfo = {
  auxiliaryWindow: null as BrowserWindow | null,
  lastDisplayNr: undefined as number | undefined,
};

const resolveDisplayIndex = (displayNr?: number): number => {
  const screens = getAllScreens();

  if (
    displayNr !== undefined &&
    displayNr >= 0 &&
    displayNr < screens.length &&
    !screens[displayNr]?.mainWindow
  ) {
    return displayNr;
  }

  const mediaScreen = screens.findIndex((screen) => screen.mediaWindow);
  return screens.findIndex(
    (screen, index) => !screen.mainWindow && index !== mediaScreen,
  );
};

export function createAuxiliaryWindow() {
  const existing = auxiliaryWindowInfo.auxiliaryWindow;
  if (existing && !existing.isDestroyed()) return existing;

  const win = createWindow('auxiliary', {
    alwaysOnTop: false,
    backgroundColor: 'black',
    focusable: true,
    frame: false,
    hasShadow: false,
    height: HD_RESOLUTION[1],
    icon: getIconPath('media-player'),
    maximizable: false,
    minHeight: 110,
    minimizable: false,
    minWidth: 195,
    opacity: 1,
    resizable: false,
    roundedCorners: PLATFORM === 'darwin',
    skipTaskbar: true,
    thickFrame: false,
    title: 'TM2 Output',
    webPreferences: {
      additionalArguments: ['--output-role=auxiliary'],
    },
    width: HD_RESOLUTION[0],
  });

  auxiliaryWindowInfo.auxiliaryWindow = win;

  // The main media window owns audio; the mirror output must stay silent.
  win.webContents.setAudioMuted(true);
  win.webContents.on('did-finish-load', () => {
    if (!win.isDestroyed()) win.webContents.setAudioMuted(true);
  });

  win.on('closed', () => {
    auxiliaryWindowInfo.auxiliaryWindow = null;
  });

  log(
    '[createAuxiliaryWindow] Auxiliary output created',
    'electronWindow',
    'log',
  );
  return win;
}

const applyPosition = (win: BrowserWindow, displayNr?: number) => {
  if (win.isDestroyed()) return;

  const screens = getAllScreens();
  const index = resolveDisplayIndex(displayNr);
  const display = screens[index];

  // Fewer than two external screens: nothing to mirror onto.
  if (!display) {
    log(
      '[applyAuxiliaryPosition] No secondary external display available',
      'electronWindow',
      'log',
    );
    return;
  }

  const bounds = normalizeWindowBounds(display.bounds);
  if (!bounds) return;

  auxiliaryWindowInfo.lastDisplayNr = index;
  const current = win.getBounds();
  const alreadyThere =
    Math.abs(current.x - bounds.x) <= 10 &&
    Math.abs(current.y - bounds.y) <= 10 &&
    Math.abs(current.width - bounds.width) <= 10 &&
    Math.abs(current.height - bounds.height) <= 10;

  if (!alreadyThere) {
    // A fullscreen window ignores setBounds on some window managers, so leave
    // fullscreen before moving it and re-enter afterwards.
    if (win.isFullScreen()) win.setFullScreen(false);
    win.setBounds(bounds);
  }
  if (!win.isFullScreen()) win.setFullScreen(true);
};

let positionQueue: Promise<void> = Promise.resolve();

const enqueuePosition = (task: () => void) => {
  positionQueue = positionQueue.then(task).catch((error: unknown) => {
    captureElectronError(error, {
      contexts: { fn: { name: 'applyAuxiliaryPosition' } },
    });
  });
  return positionQueue;
};

export function setAuxiliaryWindowPosition(displayNr?: number): Promise<void> {
  return enqueuePosition(() => {
    const win = auxiliaryWindowInfo.auxiliaryWindow;
    if (win && !win.isDestroyed()) applyPosition(win, displayNr);
  });
}

export function toggleAuxiliaryWindow(
  show: boolean,
  displayNr?: number,
): Promise<void> {
  return enqueuePosition(() => {
    if (!show) {
      const win = auxiliaryWindowInfo.auxiliaryWindow;
      if (win && !win.isDestroyed() && win.isVisible()) win.hide();
      return;
    }

    const win = createAuxiliaryWindow();
    if (win.isDestroyed()) return;

    applyPosition(win, displayNr);
    if (!win.isVisible()) win.showInactive();
    // A window that was just shown can ignore the fullscreen request made
    // while it was hidden; re-apply once it is actually on screen.
    setTimeout(() => {
      if (!win.isDestroyed() && win.isVisible()) applyPosition(win, displayNr);
    }, 300);
  });
}

export const moveAuxiliaryWindowThrottled = throttleWithTrailing(() => {
  const win = auxiliaryWindowInfo.auxiliaryWindow;
  if (!win || win.isDestroyed() || !win.isVisible()) return;
  void setAuxiliaryWindowPosition(auxiliaryWindowInfo.lastDisplayNr);
}, WINDOW_MOVE_THROTTLE_MS);
