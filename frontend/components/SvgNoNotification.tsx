import * as React from "react";
import Svg, { Path, Circle } from "react-native-svg";

const SvgNoNotifications = (props: any) => (
  <Svg
    width={250}
    height={250}
    viewBox="0 0 500 400"
    {...props}
  >
    {/* Floor Line */}
    <Path 
      d="M 50 350 L 450 350" 
      stroke="#707070" 
      strokeWidth="2" 
      strokeLinecap="round" 
    />

    {/* --- THE BELL (Empty State) --- */}
    {/* Bell Top Hanger */}
    <Path d="M 185 140 C 185 120, 215 120, 215 140 Z" fill="#bab7c9" />
    
    {/* Bell Body */}
    <Path 
      d="M 200 140 C 160 140, 150 180, 150 220 Q 140 240, 130 240 L 270 240 Q 260 240, 250 220 C 250 180, 240 140, 200 140 Z" 
      fill="#e6e6e6" 
    />
    
    {/* Bell Shadow Highlight */}
    <Path 
      d="M 200 140 C 160 140, 150 180, 150 220 Q 140 240, 130 240 L 200 240 Z" 
      fill="#f2f2f2" 
      opacity="0.6" 
    />
    
    {/* Bell Clapper */}
    <Path d="M 185 240 C 185 260, 215 260, 215 240 Z" fill="#bab7c9" />

    {/* "0" Notifications Badge */}
    <Circle cx="248" cy="152" r="16" fill="#3f3d56" />
    <Path 
      d="M 244 152 C 244 144, 252 144, 252 152 C 252 160, 244 160, 244 152 Z" 
      stroke="#fff" 
      strokeWidth="2" 
      fill="none" 
    />

    {/* Floating "Zzz" symbols for silence */}
    <Path d="M 110 130 L 130 130 L 110 150 L 130 150" stroke="#bab7c9" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Path d="M 80 90 L 110 90 L 80 120 L 110 120" stroke="#bab7c9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

    {/* --- THE CHARACTER --- */}
    {/* Back Arm (Right Arm in pocket) */}
    <Path d="M 370 170 C 390 200, 390 230, 375 250" stroke="#7851A9" strokeWidth="12" strokeLinecap="round" fill="none" />
    <Circle cx="375" cy="250" r="6" fill="#f1a1a4" />

    {/* Neck */}
    <Path d="M 343 145 L 357 145 L 357 165 L 343 165 Z" fill="#f1a1a4" />

    {/* Legs / Pants */}
    <Path d="M 320 250 L 380 250 L 375 340 L 355 340 L 350 280 L 345 340 L 325 340 Z" fill="#2f2e43" />

    {/* Shoes */}
    <Path d="M 325 340 L 310 350 L 345 350 L 345 340 Z" fill="#bab7c9" />
    <Path d="M 375 340 L 390 350 L 355 350 L 355 340 Z" fill="#bab7c9" />

    {/* Torso / Shirt */}
    <Path d="M 320 250 C 320 250, 330 160, 350 160 C 370 160, 380 250, 380 250 Z" fill="#7851A9" />

    {/* Head */}
    <Circle cx="350" cy="130" r="20" fill="#f1a1a4" />

    {/* Hair (Slightly stylized swoop) */}
    <Path d="M 325 130 C 325 95, 385 100, 375 135 C 375 150, 360 120, 350 120 C 340 120, 325 150, 325 130 Z" fill="#2f2e43" />

    {/* Front Arm (Left Arm resting on the Bell) */}
    <Path d="M 330 170 C 310 200, 290 210, 260 220" stroke="#7851A9" strokeWidth="12" strokeLinecap="round" fill="none" />
    <Circle cx="260" cy="220" r="6" fill="#f1a1a4" />

    {/* Empty Message Bubble (Floating UI Accent) */}
    <Path d="M 400 90 C 400 70, 440 70, 440 90 C 440 110, 420 110, 410 120 C 410 110, 400 110, 400 90 Z" fill="#e6e6e6" />
    <Circle cx="413" cy="90" r="2" fill="#bab7c9" />
    <Circle cx="420" cy="90" r="2" fill="#bab7c9" />
    <Circle cx="427" cy="90" r="2" fill="#bab7c9" />

  </Svg>
);

export default SvgNoNotifications;