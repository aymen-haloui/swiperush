import React from 'react';

type Props = {
  size?: number; // px
  progress: number; // 0-100
  src?: string | null;
  alt?: string;
  strokeWidth?: number; // px
  ringColor?: string;
  bgColor?: string;
};

// SVG-based circular progress ring centered around an image.
// The image is centered using flex and absolute positioning so no manual pixel offsets are required.
const AvatarWithProgress: React.FC<Props> = ({
  size = 96,
  progress,
  src = null,
  alt = 'avatar',
  strokeWidth = 8,
  ringColor = '#4f46e5', // indigo-600
  bgColor = '#e6e6ff',
}) => {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const dashoffset = circumference * (1 - clamped / 100);
  const innerSize = Math.max(0, size - strokeWidth * 2);

  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        role="img"
        aria-hidden={false}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* background ring (subtle) */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
          style={{ vectorEffect: 'non-scaling-stroke' }}
        />

        {/* progress ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashoffset}
          transform={`rotate(-90 ${cx} ${cy})`} /* start at top */
          style={{ vectorEffect: 'non-scaling-stroke', transition: 'stroke-dashoffset 350ms ease' }}
        />
      </svg>

      {/* Avatar image centered inside the ring. We size it to fit inside the ring by subtracting the strokeWidth. */}
      <div
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
        }}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '60%', height: '60%', borderRadius: '50%', background: '#c7c7ff' }} />
        )}
      </div>
    </div>
  );
};

export default AvatarWithProgress;
