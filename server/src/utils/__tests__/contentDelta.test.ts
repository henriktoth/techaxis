import { describe, expect, it } from 'vitest';

import { parseContentDelta } from '../contentDelta';

describe('parseContentDelta', () => {
  it('returns undefined for empty input', () => {
    expect(parseContentDelta(undefined)).toBeUndefined();
    expect(parseContentDelta(null)).toBeUndefined();
    expect(parseContentDelta('')).toBeUndefined();
  });

  it('parses valid JSON string', () => {
    const input = '{"ops":[{"insert":"Hello"}]}';

    expect(parseContentDelta(input)).toEqual({ ops: [{ insert: 'Hello' }] });
  });

  it('returns undefined for invalid JSON string', () => {
    expect(parseContentDelta('{invalid')).toBeUndefined();
  });

  it('returns non-string input as-is', () => {
    const input = { ops: [{ insert: 'World' }] };

    expect(parseContentDelta(input)).toEqual(input);
  });
});
