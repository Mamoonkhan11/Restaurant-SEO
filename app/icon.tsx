import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#2563eb',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '8px',
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 4H5a2 2 0 0 0-2 2v3" />
          <path d="M16 4h3a2 2 0 0 1 2 2v3" />
          <path d="M8 20H5a2 2 0 0 1-2-2v-3" />
          <path d="M16 20h3a2 2 0 0 0 2-2v-3" />
          <path d="M7 14a5 5 0 0 1 10 0" />
          <path d="M6 14h12" />
          <path d="M12 9V7" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
