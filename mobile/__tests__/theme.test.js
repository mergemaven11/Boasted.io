import { colors, navigationTheme } from '../src/theme';

describe('BragStack mobile brand tokens', () => {
  it('uses the canonical authenticated-app palette', () => {
    expect(colors.background).toBe('#090909');
    expect(colors.text).toBe('#F7F4EE');
    expect(colors.primary).toBe('#FFB184');
  });

  it('keeps navigation aligned with the same app palette', () => {
    expect(navigationTheme.dark).toBe(true);
    expect(navigationTheme.colors.primary).toBe(colors.primary);
    expect(navigationTheme.colors.background).toBe(colors.background);
  });
});
