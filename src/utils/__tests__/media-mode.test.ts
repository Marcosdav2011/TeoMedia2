import { describe, expect, it } from 'vitest';

import { meetingMediaDisabled } from '../media-mode';

describe('meetingMediaDisabled', () => {
  it('is false for an ordinary profile', () => {
    expect(meetingMediaDisabled({})).toBe(false);
    expect(
      meetingMediaDisabled({
        cameraOnlyMode: false,
        disableMediaFetching: false,
      }),
    ).toBe(false);
  });

  it('is true when automatic media fetching is disabled', () => {
    expect(meetingMediaDisabled({ disableMediaFetching: true })).toBe(true);
  });

  it('is true for camera-only profiles, even without disabling fetching', () => {
    expect(
      meetingMediaDisabled({
        cameraOnlyMode: true,
        disableMediaFetching: false,
      }),
    ).toBe(true);
  });

  it('is false when there are no settings yet', () => {
    expect(meetingMediaDisabled(null)).toBe(false);
    expect(meetingMediaDisabled(undefined)).toBe(false);
  });
});
