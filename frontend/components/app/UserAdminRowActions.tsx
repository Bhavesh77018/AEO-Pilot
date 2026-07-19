"use client";

import { useTransition } from "react";
import { updateUserProfile } from "@/app/(app)/app/admin/actions";

export function UserAdminRowActions({
  user,
}: {
  user: { id: string; role: string; plan: string };
}) {
  const [isPending, startTransition] = useTransition();

  function handleSetPremium() {
    startTransition(async () => {
      await updateUserProfile(user.id, { plan: "growth" });
    });
  }

  function handleRevokePremium() {
    startTransition(async () => {
      await updateUserProfile(user.id, { plan: "free" });
    });
  }

  function handleMakeAdmin() {
    startTransition(async () => {
      await updateUserProfile(user.id, { role: "admin" });
    });
  }

  function handleRevokeAdmin() {
    startTransition(async () => {
      await updateUserProfile(user.id, { role: "user" });
    });
  }

  return (
    <div className="flex gap-2 justify-end">
      {user.plan === "free" ? (
        <button
          onClick={handleSetPremium}
          disabled={isPending}
          className="text-[11px] font-medium bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-md hover:bg-emerald-500/25 transition disabled:opacity-50"
        >
          Give Premium
        </button>
      ) : (
        <button
          onClick={handleRevokePremium}
          disabled={isPending}
          className="text-[11px] font-medium bg-white/10 text-white/70 px-2.5 py-1 rounded-md hover:bg-white/20 transition disabled:opacity-50"
        >
          Revoke Premium
        </button>
      )}

      {user.role === "user" ? (
        <button
          onClick={handleMakeAdmin}
          disabled={isPending}
          className="text-[11px] font-medium bg-brand-500/15 text-brand-300 px-2.5 py-1 rounded-md hover:bg-brand-500/25 transition disabled:opacity-50"
        >
          Make Admin
        </button>
      ) : (
        <button
          onClick={handleRevokeAdmin}
          disabled={isPending}
          className="text-[11px] font-medium bg-white/10 text-white/70 px-2.5 py-1 rounded-md hover:bg-white/20 transition disabled:opacity-50"
        >
          Revoke Admin
        </button>
      )}
    </div>
  );
}
