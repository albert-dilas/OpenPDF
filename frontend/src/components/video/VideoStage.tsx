'use client';

import React from 'react';

interface VideoStageProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  src: string;
  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
  onPause: () => void;
}

export default function VideoStage({
  videoRef,
  src,
  onLoadedMetadata,
  onTimeUpdate,
  onPause,
}: VideoStageProps) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-black overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        controls
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onPause={onPause}
        className="w-full max-h-[420px] mx-auto bg-black"
      />
    </div>
  );
}
