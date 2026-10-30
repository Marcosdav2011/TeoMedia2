/**
 * How the camera takes the output window: filling it, as a small inset over
 * the yeartext, or sharing it with the yeartext on one half.
 */
export type TeoCameraLayout = 'fullscreen' | 'pip' | 'split';

/** A named camera setup the operator can start with one button. */
export interface TeoCameraScene {
  cameraId: string;
  cameraLabel: string;
  id: string;
  layout: TeoCameraLayout;
  name: string;
  screenIndex: null | number;
  /** Missing in scenes saved before framing existed. */
  view?: TeoCameraView;
}

/**
 * The part of the camera picture the audience sees: zoom crops the edges and
 * the pan moves the crop, both relative to the camera picture.
 */
export interface TeoCameraView {
  panX: number;
  panY: number;
  zoom: number;
}
