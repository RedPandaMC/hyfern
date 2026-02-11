'use client';

import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export function Logo({ size = 64, showText = false }: LogoProps) {
  const iconSize = Math.round(size * 0.55);
  const borderRadius = Math.round(size * 0.22);

  return (
    <div className="flex items-center gap-3">
      {/* White squircle with potted_plant icon */}
      <div
        className="relative flex-shrink-0 flex items-center justify-center bg-white drop-shadow-lg"
        style={{
          width: size,
          height: size,
          borderRadius,
        }}
      >
        <span
          className="material-symbols-rounded text-[hsl(222,47%,11%)]"
          style={{
            fontSize: `${iconSize}px`,
            fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48",
          }}
        >
          potted_plant
        </span>
      </div>

      {/* Text variant */}
      {showText && (
        <span
          className="font-bitter font-bold text-white"
          style={{ fontSize: `${size * 0.55}px` }}
        >
          HyFern
        </span>
      )}
    </div>
  );
}
