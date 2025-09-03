import { useColorScheme } from "react-native";

type ThemeName = "light" | "dark";
  
type ThemeColors = {
      text: string;
      title: string;
      navBackground: string;
      background: string;
      border: string;
      primary: string;
      warning: string;
      statusBar: "light" | "dark";
      };

const Colors: Record<ThemeName, ThemeColors> = {
          dark: {
            text: '#fff',          
            title: '#fff', 
              background: '#252231',
              navBackground: '#201e2b',
              border: '#7851A966',
              primary: '#7851A9',
              warning: '#cc475a',
              statusBar: "light",
          },
          light: {
              text: '#000',
              title: '#000',
              background: '#F8F8F8',
              navBackground: '#e8e7ef',
              border: '#7851A966',
              primary: '#7851A9',
              warning: '#cc475a',
              statusBar: "dark",
          }
      }


export default function useThemeColors(): ThemeColors {
      const colorScheme = useColorScheme() as ThemeName
      const theme =  Colors[colorScheme] ?? Colors.light
      return theme;
}