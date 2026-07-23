import { describe, expect, it } from 'vitest';
import { formatExerciseName } from './formatExerciseName';

describe('formatExerciseName', () => {
  it('uses readable title casing while preserving minor words', () => {
    expect(formatExerciseName('barbell pullover to press')).toBe('Barbell Pullover to Press');
  });

  it('capitalizes both parts of hyphenated exercise names', () => {
    expect(formatExerciseName('3/4 sit-up')).toBe('3/4 Sit-Up');
  });

  it('capitalizes the start of parenthetical descriptions', () => {
    expect(formatExerciseName('cable row (with rope) (male)')).toBe('Cable Row (With Rope) (Male)');
  });

  it('normalizes common exercise acronyms and version labels', () => {
    expect(formatExerciseName('ez bar curl v. 2')).toBe('EZ Bar Curl V2');
    expect(formatExerciseName('trx sldl')).toBe('TRX SLDL');
  });

  it('corrects known spelling mistakes from the source data', () => {
    expect(formatExerciseName('curtsey squat')).toBe('Curtsy Squat');
    expect(formatExerciseName('barbell sitted alternate leg raise')).toBe(
      'Barbell Seated Alternating Leg Raise',
    );
    expect(formatExerciseName('alternate heel touchers')).toBe('Alternating Heel Touches');
  });

  it('repairs compound modifiers and corrupted degree symbols', () => {
    expect(formatExerciseName('dumbbell one arm snatch')).toBe('Dumbbell One-Arm Snatch');
    expect(formatExerciseName('sled 45в° leg press (back pov)')).toBe(
      'Sled 45° Leg Press (Back POV)',
    );
  });

  it('removes stray whitespace', () => {
    expect(formatExerciseName('  dumbbell   front raise  ')).toBe('Dumbbell Front Raise');
  });
});
