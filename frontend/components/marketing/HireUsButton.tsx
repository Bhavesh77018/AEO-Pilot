"use client";

import { useState } from "react";
import { ContactModal } from "./ContactModal";

export function HireUsButton({ className, children }: { className?: string; children: React.ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <button onClick={() => setModalOpen(true)} className={className}>
        {children}
      </button>
      <ContactModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
