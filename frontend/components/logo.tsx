'use client';

import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

/**
 * HyFern Logo - White squircle with potted_plant icon cutout.
 * The icon is masked out of the squircle, revealing the background behind it.
 */
export function Logo({ size = 64, showText = false }: LogoProps) {
  const iconSize = Math.round(size * 0.55);
  const maskId = React.useId();

  return (
    <div className="flex items-center gap-3">
      <div
        className="relative flex-shrink-0 drop-shadow-lg"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          className="block"
        >
          <defs>
            <mask id={`logo-mask-${maskId}`}>
              {/* White = visible, black = cut out */}
              <rect width="100" height="100" fill="white" />
              <foreignObject x="0" y="0" width="100" height="100">
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    className="material-symbols-rounded"
                    style={{
                      fontSize: `${iconSize * (100 / size)}px`,
                      color: 'black',
                      fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48",
                    }}
                  >
                    potted_plant
                  </span>
                </div>
              </foreignObject>
            </mask>
          </defs>
          {/* Squircle path with icon cutout mask */}
          <path
            d="M 50 0
               C 78 0, 100 0, 100 22
               C 100 22, 100 50, 100 50
               C 100 78, 100 100, 78 100
               C 78 100, 50 100, 50 100
               C 22 100, 0 100, 0 78
               C 0 78, 0 50, 0 50
               C 0 22, 0 0, 22 0
               C 22 0, 50 0, 50 0 Z"
            fill="white"
            mask={`url(#logo-mask-${maskId})`}
          />
        </svg>
      </div>

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
