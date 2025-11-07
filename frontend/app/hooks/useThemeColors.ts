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
      chatBubble: string;
      placeholderText: string;
      inputBgColor: string;
      bottomTabBorderColor: string;
      };


const Colors: Record<ThemeName, ThemeColors> = {
          dark: {
            text: '#fff',          
            title: '#fff', 
              background: '#1a1a1aff',
              navBackground: '#201e2b',
              border: '#7851A966',
              primary: '#7851A9',
              warning: '#E74C3C',
              statusBar: "light",
              chatBubble: "#E7E5EA",
              placeholderText: "#ffffff59",
              inputBgColor: "#2A2833",
              bottomTabBorderColor: "#2A2A2E",
              
          },
          light: {
              text: '#000',
              title: '#000',
              background: '#f8f8f8ff',
              navBackground: '#e8e7ef',
              border: '#7851A966',
              primary: '#7851A9',
              warning: '#E74C3C',
              statusBar: "dark",
              chatBubble: "",
              placeholderText: "#00000059",
              inputBgColor: "#E9E6EE",
              bottomTabBorderColor: "#E5E5EA",
          }
      }


export default function useThemeColors(): ThemeColors {
      const colorScheme = useColorScheme() as ThemeName
      const theme =  Colors.dark
      return theme;
}


