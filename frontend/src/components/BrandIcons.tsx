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
