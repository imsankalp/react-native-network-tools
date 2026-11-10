import { formatDuration } from '../util/formatDuration';

describe('formatDuration', () => {
  it('rounds fractional milliseconds below one second', () => {
    expect(formatDuration(7.968017578125)).toBe('8ms');
  });

  it('rounds the milliseconds part at and above one second', () => {
    expect(formatDuration(1244.0390625)).toBe('1s 244ms');
    expect(formatDuration(61244.0390625)).toBe('1m 1s 244ms');
    expect(formatDuration(3661244.0390625)).toBe('1h 1m 1s 244ms');
  });

  it('keeps whole values unchanged', () => {
    expect(formatDuration(522)).toBe('522ms');
    expect(formatDuration(1000)).toBe('1s');
  });
});
