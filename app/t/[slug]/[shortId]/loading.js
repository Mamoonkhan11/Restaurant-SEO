import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#07080B] flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="relative flex items-center justify-center mb-6">
        {/* Pulsing Outer Red/Orange Glow */}
        <div className="w-16 h-16 rounded-full bg-red-500/20 animate-ping absolute inset-0" />
        {/* Pulsing Brand Red Spinner Container */}
        <div className="w-16 h-16 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center relative z-10">
          <div className="w-6 h-6 rounded-full bg-red-500 animate-pulse" />
        </div>
      </div>
      <h2 className="text-xl font-extrabold text-white tracking-tight mb-1 animate-pulse">
        Redirecting to Menu...
      </h2>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
        RestDigi Contactless Dining
      </p>
    </div>
  );
}
