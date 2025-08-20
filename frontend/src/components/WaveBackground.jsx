import React from 'react';
const WaveBackground = () => (
    <svg
      className="absolute inset-0 w-full h-full z-0"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern
          id="wavePattern"
          x="0"
          y="0"
          width="100"
          height="100"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 0 50 Q 25 0 50 50 T 100 50"
            fill="transparent"
            stroke="#444"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wavePattern)" />
    </svg>
  );
  
  export default WaveBackground;
  