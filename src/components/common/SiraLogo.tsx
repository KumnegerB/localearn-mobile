import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface SiraLogoProps {
  width?: number;
  height?: number;
  textColor?: string;
  briefcaseColor?: string;
}

export const SiraLogo: React.FC<SiraLogoProps> = ({
  width = 120,
  height,
  textColor = '#103B31',
  briefcaseColor = '#FF6B3D',
}) => {
  // Original aspect ratio: 270 / 176 ≈ 1.534
  const calculatedHeight = height || Math.round(width * (176 / 270));

  return (
    <Svg
      width={width}
      height={calculatedHeight}
      viewBox="0 0 270 176"
      fill="none"
    >
      {/* First Amharic character: ስ */}
      <Path
        d="M23 26H53C51 33 52 39 57 47L66 61C91 66 103 82 103 107V171C103 174 101 176 98 176H80C77 176 75 174 75 171V106C75 83 67 72 51 72C35 72 28 86 28 111V171C28 174 26 176 23 176H5C2 176 0 174 0 171V114C0 87 11 68 32 60L18 39C14 32 16 26 23 26Z"
        fill={textColor}
      />
      {/* Second Amharic character: ራ */}
      <Path
        d="M188 42L211 38C217 37 221 41 221 48C221 69 206 85 184 103C165 119 150 131 150 148C150 156 155 159 168 158L178 156C180 134 190 124 209 117C221 113 236 110 258 108H262V124C262 132 265 137 269 140C257 145 242 143 235 136L233 129C217 130 207 137 207 152V158L169 172C151 178 134 176 124 165C116 157 116 143 121 131C129 113 147 100 168 82C183 69 190 59 188 51C186 49 184 47 184 46L188 42Z"
        fill={textColor}
      />
      {/* Orange Briefcase Icon */}
      <Path
        d="M113.5 14.4V8.4C113.5 3.6 117.25 0 122.25 0H127.25C132.25 0 136 3.6 136 8.4V14.4H146C151.5 14.4 156 18.72 156 24V44.4C156 49.68 151.5 54 146 54H101C95.5 54 91 49.68 91 44.4V24C91 18.72 95.5 14.4 101 14.4H113.5ZM119.75 14.4H129.75V8.4C129.75 6.96 128.75 6 127.25 6H122.25C120.75 6 119.75 6.96 119.75 8.4V14.4ZM91 31.2H117.25V34.8H91V31.2ZM129.75 31.2H156V34.8H129.75V31.2Z"
        fillRule="evenodd"
        clipRule="evenodd"
        fill={briefcaseColor}
      />
    </Svg>
  );
};
