import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export function Logo({ size = 64, showText = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      {/* White squircle with Material Symbols potted_plant icon cutout */}
      <div
        className="relative flex-shrink-0 drop-shadow-lg"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          className="absolute inset-0"
        >
          <defs>
            {/* Mask using Material Symbols icon */}
            <mask id={`icon-mask-${size}`}>
              <rect width="64" height="64" fill="white" />
              <foreignObject x="12" y="12" width="40" height="40">
                <div
                  className="flex items-center justify-center h-full"
                  style={{ fontSize: '32px' }}
                >
                  <span
                    className="material-symbols-rounded"
                    style={{
                      fontSize: 'inherit',
                      fontVariationSettings: '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 48'
                    }}
                  >
                    potted_plant
                  </span>
                </div>
              </foreignObject>
            </mask>
          </defs>

          {/* Squircle with mask applied */}
          <path
            d="M 16 4 Q 12 12 12 24 Q 12 36 12 48 Q 12 56 16 60 Q 24 64 32 64 Q 40 64 48 60 Q 52 56 52 48 Q 52 36 52 24 Q 52 12 48 4 Q 40 0 32 0 Q 24 0 16 4 Z"
            fill="white"
            mask={`url(#icon-mask-${size})`}
          />
        </svg>
      </div>

      {/* Text variant */}
      {showText && (
        <span
          className="font-bitter font-bold text-white"
          style={{ fontSize: `${size * 0.7}px` }}
        >
          Hyfern
        </span>
      )}
    </div>
  );
}
