import React from 'react';

export function TornioEmblem({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Squircle obsidiana coincidente con prepare_assets.py */}
      <rect
        x="2"
        y="2"
        width="32"
        height="32"
        rx="8.5"
        fill="#111214"
        stroke="rgba(255, 255, 255, 0.14)"
        strokeWidth="1"
      />
      {/* Arco de eje de precision */}
      <path
        d="M 7.6 12 A 12 12 0 1 1 28.4 24"
        stroke="rgba(255, 255, 255, 0.18)"
        strokeWidth="0.95"
        strokeLinecap="round"
      />
      {/* Barra arquitectonica superior de la T */}
      <rect x="9.2" y="9.9" width="17.6" height="3.8" rx="1" fill="#FFFFFF" />
      {/* Eje vertical central de la T */}
      <rect x="15.95" y="13.3" width="4.1" height="13.2" rx="1" fill="#FFFFFF" />
      {/* Punto de calibracion bermellon */}
      <circle cx="24.3" cy="23.4" r="2.3" fill="#E04826" />
    </svg>
  );
}
