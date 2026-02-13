'use client';

import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

/**
 * HyFern Logo - White squircle with potted_plant icon cutout.
 * Uses the official Material Symbols Rounded potted_plant (filled) SVG path
 * as a mask cutout, revealing the background behind it.
 */
export function Logo({ size = 64, showText = false }: LogoProps) {
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
        >
          <defs>
            <mask id={maskId}>
              {/* White = visible, black = cutout */}
              <rect width="100" height="100" fill="white" />
              {/* Material Symbols Rounded: potted_plant (FILL 1, wght 400)
                  Original viewBox: 0 -960 960 960
                  Transform: scale to ~60% of squircle, center at 50,50 */}
              <g transform="translate(50,50) scale(0.063) translate(-480, 480)">
                <path
                  fill="black"
                  d="M317-80q-20 0-36.5-12.5T259-125l-52-205h546l-52 205q-5 20-21.5 32.5T643-80H317Zm163-561q5-88 67-150t149-83q4-1 7.5-.5t6.5 3.5q3 3 4 6.5t0 7.5q-17 79-71 138t-133 74v95h300q13 0 21.5 8.5T840-520v100q0 25-17.5 42.5T780-360H180q-25 0-42.5-17.5T120-420v-100q0-13 8.5-21.5T150-550h300v-95q-79-15-133-74t-71-138q-1-4 0-7.5t4-6.5q3-3 6.5-4t7.5 0q88 20 150 83t66 151Z"
                />
              </g>
            </mask>
          </defs>
          {/* Squircle shape with mask applied */}
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
            mask={`url(#${maskId})`}
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
