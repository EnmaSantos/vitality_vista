import { useEffect } from 'react';

export const vitalityPalette = {
  vistaBlue: '#083d77',
  trailBrown: '#806443',
  mintMist: '#b6d6cc',
  vitalityGreen: '#0c8346',
  deepTeal: '#0d5d56',
} as const;

export interface PageTheme {
  name: string;
  primary: string;
  primaryDark: string;
  primary2: string;
  secondary: string;
  accent: string;
  accent2: string;
  canvas: string;
  surface: string;
  surfaceSoft: string;
  surfaceMuted: string;
  line: string;
  lineStrong: string;
  ink: string;
  muted: string;
  shadow: string;
  navColor: string;
  navActive: string;
  navTint: string;
}

export const themePalette = {
  dashboard: {
    name: 'Dashboard',
    primary: vitalityPalette.vistaBlue,
    primaryDark: '#052a52',
    primary2: vitalityPalette.deepTeal,
    secondary: vitalityPalette.trailBrown,
    accent: vitalityPalette.mintMist,
    accent2: vitalityPalette.vitalityGreen,
    canvas: '#e8f1f7',
    surface: '#fbfdff',
    surfaceSoft: '#eef5fa',
    surfaceMuted: '#dceaf2',
    line: '#ccdde8',
    lineStrong: '#adc6d8',
    ink: '#062b52',
    muted: '#536a79',
    shadow: '0 18px 46px rgba(8, 61, 119, 0.11)',
    navColor: vitalityPalette.vistaBlue,
    navActive: vitalityPalette.vistaBlue,
    navTint: 'rgba(8, 61, 119, 0.13)',
  },
  foodLog: {
    name: 'Food Log',
    primary: vitalityPalette.trailBrown,
    primaryDark: '#4e3b27',
    primary2: vitalityPalette.deepTeal,
    secondary: vitalityPalette.vistaBlue,
    accent: vitalityPalette.mintMist,
    accent2: vitalityPalette.vitalityGreen,
    canvas: '#f0ece5',
    surface: '#fffdf9',
    surfaceSoft: '#f5f0e9',
    surfaceMuted: '#ece3d9',
    line: '#dfd2c3',
    lineStrong: '#cab8a4',
    ink: '#3e3021',
    muted: '#6f6252',
    shadow: '0 18px 46px rgba(128, 100, 67, 0.12)',
    navColor: vitalityPalette.trailBrown,
    navActive: vitalityPalette.trailBrown,
    navTint: 'rgba(128, 100, 67, 0.15)',
  },
  workouts: {
    name: 'Workouts',
    primary: vitalityPalette.vitalityGreen,
    primaryDark: '#07522c',
    primary2: vitalityPalette.deepTeal,
    secondary: vitalityPalette.vistaBlue,
    accent: vitalityPalette.mintMist,
    accent2: vitalityPalette.trailBrown,
    canvas: '#e9f6ef',
    surface: '#fbfefc',
    surfaceSoft: '#eef8f2',
    surfaceMuted: '#d9eee3',
    line: '#c6dfd2',
    lineStrong: '#9fcab3',
    ink: '#064225',
    muted: '#536f61',
    shadow: '0 18px 46px rgba(12, 131, 70, 0.11)',
    navColor: vitalityPalette.vitalityGreen,
    navActive: vitalityPalette.vitalityGreen,
    navTint: 'rgba(12, 131, 70, 0.13)',
  },
  recipes: {
    name: 'Recipes',
    primary: vitalityPalette.deepTeal,
    primaryDark: '#073b36',
    primary2: vitalityPalette.vitalityGreen,
    secondary: vitalityPalette.trailBrown,
    accent: vitalityPalette.mintMist,
    accent2: vitalityPalette.vistaBlue,
    canvas: '#e8f3f0',
    surface: '#fbfefd',
    surfaceSoft: '#edf7f4',
    surfaceMuted: '#d9ece7',
    line: '#c4ddd6',
    lineStrong: '#9dc6bd',
    ink: '#073d38',
    muted: '#536d68',
    shadow: '0 18px 46px rgba(13, 93, 86, 0.12)',
    navColor: vitalityPalette.deepTeal,
    navActive: vitalityPalette.deepTeal,
    navTint: 'rgba(13, 93, 86, 0.14)',
  },
  progress: {
    name: 'Progress',
    primary: vitalityPalette.deepTeal,
    primaryDark: '#073b36',
    primary2: vitalityPalette.vistaBlue,
    secondary: vitalityPalette.vitalityGreen,
    accent: vitalityPalette.mintMist,
    accent2: vitalityPalette.trailBrown,
    canvas: '#e7f2ee',
    surface: '#fbfefd',
    surfaceSoft: '#eef6f3',
    surfaceMuted: '#dcece7',
    line: '#c7ded7',
    lineStrong: '#a9cac0',
    ink: '#073d38',
    muted: '#526d67',
    shadow: '0 18px 46px rgba(182, 214, 204, 0.34)',
    navColor: vitalityPalette.mintMist,
    navActive: vitalityPalette.deepTeal,
    navTint: 'rgba(182, 214, 204, 0.42)',
  },
} satisfies Record<string, PageTheme>;

const routeThemes: Array<{ matches: string[]; theme: PageTheme }> = [
  { matches: ['/', '/dashboard'], theme: themePalette.dashboard },
  { matches: ['/food-log'], theme: themePalette.foodLog },
  { matches: ['/exercises', '/my-plans', '/workout-history', '/workout/session'], theme: themePalette.workouts },
  { matches: ['/recipes'], theme: themePalette.recipes },
  { matches: ['/progress'], theme: themePalette.progress },
];

const pathMatches = (pathname: string, match: string) => (
  match === '/'
    ? pathname === '/' || pathname === '/dashboard'
    : pathname === match || pathname.startsWith(`${match}/`)
);

export const getPageThemeForPath = (pathname: string) => (
  routeThemes.find(({ matches }) => matches.some((match) => pathMatches(pathname, match)))?.theme
  ?? themePalette.dashboard
);

export const getThemeVariables = (theme: PageTheme): Record<string, string> => ({
  '--vv-canvas': theme.canvas,
  '--vv-surface': theme.surface,
  '--vv-surface-soft': theme.surfaceSoft,
  '--vv-surface-muted': theme.surfaceMuted,
  '--vv-line': theme.line,
  '--vv-line-strong': theme.lineStrong,
  '--vv-ink': theme.ink,
  '--vv-muted': theme.muted,
  '--vv-primary': theme.primary,
  '--vv-primary-2': theme.primary2,
  '--vv-accent': theme.accent,
  '--vv-accent-2': theme.accent2,
  '--vv-shadow': theme.shadow,
  '--color-bg': theme.surfaceSoft,
  '--color-primary': theme.primary,
  '--color-primary-dark': theme.primaryDark,
  '--color-secondary': theme.secondary,
  '--color-accent': theme.accent,
  '--color-surface': theme.surface,
});

export const usePageTheme = (theme: PageTheme) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const themeVariables = getThemeVariables(theme);
    const previousValues = new Map<string, string>();

    Object.entries(themeVariables).forEach(([name, value]) => {
      previousValues.set(name, root.style.getPropertyValue(name));
      root.style.setProperty(name, value);
    });

    return () => {
      Object.keys(themeVariables).forEach((name) => {
        const previousValue = previousValues.get(name);
        if (previousValue) {
          root.style.setProperty(name, previousValue);
        } else {
          root.style.removeProperty(name);
        }
      });
    };
  }, [theme]);
};
