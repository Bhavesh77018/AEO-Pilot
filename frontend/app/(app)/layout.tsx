import { FeedbackButton } from "@/components/app/FeedbackButton";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function getUserEmail(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.email ?? null;
  } catch {
    return null;
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const email = await getUserEmail();

  return (
    <div className="h-screen overflow-hidden bg-ink-900">
      {children}
      <FeedbackButton />
    </div>
  );
}
