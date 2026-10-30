import type { TeoCameraView } from 'src/types';

export const IDENTITY_TEO_CAMERA_VIEW: Readonly<TeoCameraView> = {
  panX: 0,
  panY: 0,
  zoom: 1,
};

export const TEO_CAMERA_MAX_ZOOM = 3;

/**
 * The transform shows the video scaled about its centre and then shifted by a
 * percentage of its own size, so the largest shift that still covers the frame
 * is half the overflow the zoom creates: `50 * (zoom - 1)` percent.
 */
const PAN_LIMIT_FACTOR = 50;

const finiteOr = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Clamps stored or received framing to values the output can draw: a zoom
 * between 1x and 3x, and a pan that never shows the empty space past the
 * camera picture.
 */
export const normalizeTeoCameraView = (
  view?: null | Partial<TeoCameraView>,
): TeoCameraView => {
  const zoom = round(
    clamp(
      finiteOr(view?.zoom, IDENTITY_TEO_CAMERA_VIEW.zoom),
      1,
      TEO_CAMERA_MAX_ZOOM,
    ),
  );
  const panLimit = round(PAN_LIMIT_FACTOR * (zoom - 1));
  return {
    panX: round(clamp(finiteOr(view?.panX, 0), -panLimit, panLimit)),
    panY: round(clamp(finiteOr(view?.panY, 0), -panLimit, panLimit)),
    zoom,
  };
};

export const teoCameraViewTransform = (view: TeoCameraView) =>
  `translate(${view.panX}%, ${view.panY}%) scale(${view.zoom})`;

export const teoCameraViewsEqual = (a: TeoCameraView, b: TeoCameraView) =>
  a.panX === b.panX && a.panY === b.panY && a.zoom === b.zoom;
