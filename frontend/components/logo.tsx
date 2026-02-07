import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export function Logo({ size = 64, showText = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      {/* White squircle with potted plant cutout */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className="flex-shrink-0 drop-shadow-lg"
      >
        <defs>
          {/* Mask for the plant cutout */}
          <mask id={`plant-mask-${size}`}>
            {/* White background (visible area) */}
            <rect width="64" height="64" fill="white" />

            {/* Black cutouts (transparent areas) */}
            {/* Pot body */}
            <path
              d="M 20 40 L 18 52 Q 18 54 20 56 L 44 56 Q 46 54 46 52 L 44 40 Z"
              fill="black"
            />

            {/* Pot rim */}
            <rect x="18" y="38" width="28" height="3" fill="black" />

            {/* Soil */}
            <ellipse cx="32" cy="40" rx="13" ry="3" fill="black" />

            {/* Plant stem */}
            <path
              d="M 32 40 Q 32 28 28 18"
              stroke="black"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Plant leaves - left side */}
            <ellipse cx="24" cy="24" rx="4" ry="6" fill="black" transform="rotate(-35 24 24)" />
            <ellipse cx="22" cy="30" rx="3.5" ry="5" fill="black" transform="rotate(-55 22 30)" />

            {/* Plant leaves - right side */}
            <ellipse cx="32" cy="20" rx="4" ry="6" fill="black" transform="rotate(25 32 20)" />
            <ellipse cx="36" cy="28" rx="3.5" ry="5" fill="black" transform="rotate(50 36 28)" />

            {/* Center top leaf */}
            <ellipse cx="30" cy="16" rx="3" ry="5.5" fill="black" transform="rotate(-10 30 16)" />
          </mask>
        </defs>

        {/* Squircle background with mask applied */}
        <path
          d="M 16 4 Q 12 12 12 24 Q 12 36 12 48 Q 12 56 16 60 Q 24 64 32 64 Q 40 64 48 60 Q 52 56 52 48 Q 52 36 52 24 Q 52 12 48 4 Q 40 0 32 0 Q 24 0 16 4 Z"
          fill="white"
          mask={`url(#plant-mask-${size})`}
        />
      </svg>

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
