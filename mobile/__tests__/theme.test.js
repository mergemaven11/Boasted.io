import { colors, navigationTheme } from '../src/theme';

describe('BragStack mobile brand tokens', () => {
  it('uses the canonical mobile brand palette', () => {
    expect(colors.background).toBe('#070B14');
    expect(colors.text).toBe('#F8FAFC');
    expect(colors.primary).toBe('#A6DCFF');
    expect(colors.secondary).toBe('#AD91FF');
    expect(colors.cyan).toBe('#69E4F6');
  });

  it('keeps navigation aligned with the same app palette', () => {
    expect(navigationTheme.dark).toBe(true);
    expect(navigationTheme.colors.primary).toBe(colors.primary);
    expect(navigationTheme.colors.background).toBe(colors.background);
    expect(navigationTheme.colors.notification).toBe(colors.secondary);
  });
});
