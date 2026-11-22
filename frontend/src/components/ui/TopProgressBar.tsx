'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSystemStore } from '@/store/useSystemStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useJobsStore } from '@/store/useJobsStore';

export default function TopProgressBar() {
  const pathname = usePathname() || '/';
  const prevPathRef = useRef(pathname);
  const [navActive, setNavActive] = useState(false);

  const engineStatus = useSystemStore((s) => s.engineState.status);
  const updateStatus = useSystemStore((s) => s.updateState.status);
  const assetsStatus = useWorkspaceStore((s) => s.assetsState.status);
  const inspectStatus = useWorkspaceStore((s) => s.inspectState.status);
  const jobsStatus = useJobsStore((s) => s.jobsState.status);

  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    setNavActive(true);
    const timer = setTimeout(() => setNavActive(false), 320);
    return () => clearTimeout(timer);
  }, [pathname]);

  const busy =
    navActive ||
    engineStatus === 'loading' ||
    engineStatus === 'revalidating' ||
    updateStatus === 'loading' ||
    updateStatus === 'revalidating' ||
    assetsStatus === 'loading' ||
    assetsStatus === 'revalidating' ||
    assetsStatus === 'fetchingNextPage' ||
    inspectStatus === 'pending' ||
    jobsStatus === 'loading' ||
    jobsStatus === 'revalidating' ||
    jobsStatus === 'fetchingNextPage';

  if (!busy) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[80] h-[2px] pointer-events-none bg-transparent tornio-indeterminate"
    />
  );
}
