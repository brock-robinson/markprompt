/* eslint-disable @typescript-eslint/no-empty-function */
import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
} from 'react';

import useProject from '../hooks/use-project';
import { useLocalStorage } from '../hooks/utils/use-localstorage';
import {
  defaultTheme,
  findMatchingTheme,
  Theme,
  ThemeColorKeys,
  ThemeColors,
} from '../themes';

export type State = {
  theme: Theme;
  colors: ThemeColors;
  isDark: boolean;
  placeholder: string;
  referencesHeading: string;
  loadingHeading: string;
  includeBranding: boolean;
  setColor: (colorKey: ThemeColorKeys, value: string) => void;
  setTheme: (theme: Theme) => void;
  setDark: (dark: boolean) => void;
  setSize: (size: Theme['size']) => void;
  setPlaceholder: (placeholder: string) => void;
  setReferencesHeading: (referencesHeading: string) => void;
  setLoadingHeading: (loadingHeading: string) => void;
  setIncludeBranding: (includeBranding: boolean) => void;
};

const initialState: State = {
  theme: defaultTheme,
  colors: defaultTheme.colors.light,
  isDark: false,
  placeholder: '',
  referencesHeading: '',
  loadingHeading: '',
  includeBranding: true,
  setColor: () => {},
  setTheme: () => {},
  setDark: () => {},
  setSize: () => {},
  setPlaceholder: () => {},
  setReferencesHeading: () => {},
  setLoadingHeading: () => {},
  setIncludeBranding: () => {},
};

const ConfigContextProvider = (props: PropsWithChildren) => {
  const { project } = useProject();

  const [theme, setTheme] = useLocalStorage<Theme>(
    `${project?.id ?? 'undefined'}:playground-theme`,
    defaultTheme,
  );

  const [isDark, setDark] = useLocalStorage<boolean>(
    `${project?.id ?? 'undefined'}:playground-model-dark`,
    false,
  );

  const [placeholder, setPlaceholder] = useLocalStorage<string>(
    `${project?.id ?? 'undefined'}:playground-placeholder`,
    'Ask me anything…',
  );

  const [referencesHeading, setReferencesHeading] = useLocalStorage<string>(
    `${project?.id ?? 'undefined'}:playground-references-heading`,
    'Summary generated from the following sources:',
  );

  const [loadingHeading, setLoadingHeading] = useLocalStorage<string>(
    `${project?.id ?? 'undefined'}:playground-loading-heading`,
    'Gathering sources...',
  );

  const [includeBranding, setIncludeBranding] = useLocalStorage<boolean>(
    `${project?.id ?? 'undefined'}:includeBranding`,
    true,
  );

  const updateOrCreateCustomTheme = useCallback(
    (newTheme: Theme) => {
      const found = findMatchingTheme(newTheme);
      if (found) {
        setTheme(found);
      } else {
        setTheme({
          isCustom: true,
          ...newTheme,
        });
      }
    },
    [setTheme],
  );

  const setColor = useCallback(
    (colorKey: ThemeColorKeys, value: string) => {
      const colors = isDark ? theme.colors.dark : theme.colors.light;
      const updatedTheme = {
        ...theme,
        colors: {
          ...theme.colors,
          [isDark ? 'dark' : 'light']: {
            ...colors,
            [colorKey]: value,
          },
        },
      };
      updateOrCreateCustomTheme(updatedTheme);
    },
    [isDark, theme, updateOrCreateCustomTheme],
  );

  const setSize = useCallback(
    (size: Theme['size']) => {
      const updatedTheme = { ...theme, size };
      updateOrCreateCustomTheme(updatedTheme);
    },
    [theme, updateOrCreateCustomTheme],
  );

  return (
    <ConfigContext.Provider
      value={{
        theme,
        isDark,
        placeholder,
        referencesHeading,
        loadingHeading,
        includeBranding,
        colors: isDark ? theme.colors.dark : theme.colors.light,
        setTheme: updateOrCreateCustomTheme,
        setColor,
        setDark,
        setSize,
        setPlaceholder,
        setReferencesHeading,
        setLoadingHeading,
        setIncludeBranding,
      }}
      {...props}
    />
  );
};

export const useConfigContext = (): State => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error(
      `useConfigContext must be used within a ConfigContextProvider`,
    );
  }
  return context;
};

export const ConfigContext = createContext<State>(initialState);

ConfigContext.displayName = 'ConfigContext';

export const ManagedConfigContext: FC<PropsWithChildren> = ({ children }) => (
  <ConfigContextProvider>{children}</ConfigContextProvider>
);
