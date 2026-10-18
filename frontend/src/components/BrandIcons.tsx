import React from 'react';

export const WordIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4.5 4.5V19.5H19.5V4.5H4.5Z" fill="#185ABD" />
    <path d="M10 16L11.5 10H13L14.5 16H16L14 9H10.5L9.5 13.5L8.5 9H5L3 16H4.5L5.5 11.5L6.5 16H8L9 11.5L10 16Z" fill="white" />
  </svg>
);

export const JpgIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" fill="#EAB308" />
    <circle cx="8.5" cy="8.5" r="2.5" fill="white" />
    <path d="M21 15L16 10L10 16L7 13L3 17V21H21V15Z" fill="white" />
    <text x="12" y="20" fill="white" fontSize="6" fontWeight="bold" textAnchor="middle">JPG</text>
  </svg>
);

export const MarkdownIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" fill="#4F46E5" />
    <path d="M6 16V8H8L10 12L12 8H14V16H12V11.5L10 14.5L8 11.5V16H6Z" fill="white" />
    <path d="M19 12H17V8H15V12H13L16 16L19 12Z" fill="white" />
  </svg>
);

export const GithubIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

