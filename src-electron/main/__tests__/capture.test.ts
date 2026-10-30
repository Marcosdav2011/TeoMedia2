import type { WebContents } from 'electron';

import { describe, expect, it, vi } from 'vitest';

interface FakeWindow {
  getTitle: () => string;
  isDestroyed: () => boolean;
  title: string;
  webContents: object;
}

const { captureElectronErrorMock, getSourcesMock, windows } = vi.hoisted(
  () => ({
    captureElectronErrorMock: vi.fn(),
    getSourcesMock: vi.fn(),
    windows: [] as FakeWindow[],
  }),
);

vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: () => windows,
  },
  desktopCapturer: { getSources: getSourcesMock },
}));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: captureElectronErrorMock,
}));

const makeSource = (
  id: string,
  name: string,
  options: { displayId?: string; emptyThumbnail?: boolean } = {},
) => ({
  display_id: options.displayId ?? '',
  id,
  name,
  thumbnail: {
    isEmpty: () => !!options.emptyThumbnail,
    toDataURL: () => `data:image/png;base64,${id}`,
  },
});

const sender = {
  getMediaSourceId: (webContents: unknown) =>
    `window-of-${String(webContents)}`,
} as unknown as WebContents;

const ownWindow = (title: string): FakeWindow => {
  const webContents = { owner: title };
  return {
    getTitle: () => title,
    isDestroyed: () => false,
    title,
    webContents,
  };
};

describe('getCaptureSources', () => {
  it('offers screens and windows, with their thumbnail and type', async () => {
    windows.length = 0;
    getSourcesMock.mockResolvedValue([
      makeSource('screen:0:0', 'Screen 1', { displayId: '2528732444' }),
      makeSource('window:10:0', 'PowerPoint', { emptyThumbnail: true }),
    ]);
    const { getCaptureSources } = await import('../capture');

    const sources = await getCaptureSources(sender);

    expect(getSourcesMock).toHaveBeenCalledWith({
      thumbnailSize: { height: 180, width: 320 },
      types: ['screen', 'window'],
    });
    expect(sources).toEqual([
      {
        displayId: '2528732444',
        id: 'screen:0:0',
        name: 'Screen 1',
        thumbnail: 'data:image/png;base64,screen:0:0',
        type: 'screen',
      },
      {
        displayId: '',
        id: 'window:10:0',
        name: 'PowerPoint',
        thumbnail: '',
        type: 'window',
      },
    ]);
  });

  it("leaves out the app's own windows, so the output cannot capture itself", async () => {
    const media = ownWindow('TM2');
    const main = ownWindow('TM2 main');
    windows.length = 0;
    windows.push(media, main);
    getSourcesMock.mockResolvedValue([
      makeSource('screen:0:0', 'Screen 1'),
      // Same id as one of our windows...
      makeSource(
        sender.getMediaSourceId(media.webContents as WebContents),
        'TM2',
      ),
      // ...and another that only shares the title.
      makeSource('window:99:0', 'TM2 main'),
      makeSource('window:10:0', 'PowerPoint'),
    ]);
    const { getCaptureSources } = await import('../capture');

    const sources = await getCaptureSources(sender);

    expect(sources.map((source) => source.id)).toEqual([
      'screen:0:0',
      'window:10:0',
    ]);
  });

  it('ignores windows the app already closed', async () => {
    const destroyed = { ...ownWindow('TM2'), isDestroyed: () => true };
    windows.length = 0;
    windows.push(destroyed);
    getSourcesMock.mockResolvedValue([makeSource('window:99:0', 'TM2')]);
    const { getCaptureSources } = await import('../capture');

    const sources = await getCaptureSources(sender);

    expect(sources.map((source) => source.id)).toEqual(['window:99:0']);
  });

  it('reports the error and offers nothing when the list cannot be read', async () => {
    const error = new Error('no access');
    getSourcesMock.mockRejectedValue(error);
    const { getCaptureSources } = await import('../capture');

    expect(await getCaptureSources(sender)).toEqual([]);

    expect(captureElectronErrorMock).toHaveBeenCalledWith(error, {
      contexts: { fn: { name: 'getCaptureSources' } },
    });
  });
});
