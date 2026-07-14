"use client";

import { ScanProgress } from "@/components/app/ScanProgress";

export default function PreviewPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <ScanProgress domain="yourbrand.com" />
    </div>
  );
}
