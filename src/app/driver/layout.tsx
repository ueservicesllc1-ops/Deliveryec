'use client';

import React from 'react';

// Driver layout is just a bare wrapper — the page is fully self-contained (no sidebar)
export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
