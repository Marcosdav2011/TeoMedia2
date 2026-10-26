import type { SettingsValues } from 'src/types';

/**
 * Whether meeting media is out of the picture entirely: automatic media
 * fetching is turned off, or the profile runs in camera-only mode and hides
 * the media side (calendar, downloads, website) altogether.
 *
 * Kept in its own module (rather than in utils/settings) so importing it can't
 * pull in the settings/helpers graph from low-level helpers like date.ts.
 */
export const meetingMediaDisabled = (
  settings: null | Partial<SettingsValues> | undefined,
): boolean =>
  !!settings && (!!settings.cameraOnlyMode || !!settings.disableMediaFetching);
