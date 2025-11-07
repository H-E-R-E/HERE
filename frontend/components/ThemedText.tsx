
import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";

type Props = TextProps & {
  weight?: "regular" | "bold" | "semibold";
  family?: "poppins" | "source"; // default = poppins
};

export default function ThemedText({
  style,
  weight = "regular",
  family = "poppins",
  children,
  ...rest
}: Props) {
  const fontFamilyMap = {
    poppins: {
      regular: "Poppins",
      bold: "PoppinsBold",
      semibold: "PoppinsSemiBold",
    },
    source: {
      regular: "SourceSansPro",
      bold: "SourceSansProBold",
      semibold: "SourceSansProSemiBold",
    },
  };

  const fontFamily = fontFamilyMap[family][weight];

  return (
   <Text style={[styles.base, { fontFamily }, style]} {...rest}>
  {children ?? ""}
</Text>

  );
}

const styles = StyleSheet.create({
  base: {
    color: "#000",
    fontSize: 13,
  },
});
