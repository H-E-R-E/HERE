
import React from "react";
import { View, Image } from "react-native";
const BlurryEllipse = () => {
  //This is the blurry thing at the top left from the design.
  return (
    
        <View>
        <Image
        source={require('../assets/Ellipse 3.png')}
        style={{ position: "absolute", top: 0, left: 0 }}
        />
    </View>
  )
}

export default BlurryEllipse
