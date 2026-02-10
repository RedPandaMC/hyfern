/**
 * Material Symbols Rounded Icon Component
 * Wraps Google's Material Symbols Rounded font
 */

import React from 'react';

interface MaterialIconProps {
  icon: string;
  className?: string;
  fill?: boolean;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  grade?: -25 | 0 | 200;
  opticalSize?: 20 | 24 | 40 | 48;
  style?: React.CSSProperties;
}

export function MaterialIcon({
  icon,
  className = '',
  fill = false,
  weight = 400,
  grade = 0,
  opticalSize = 24,
  style,
}: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-rounded ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`,
        fontSize: 'inherit',
        lineHeight: 1,
        ...style,
      }}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}
