"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserProfile(userId: string, data: { role?: string; plan?: string }) {
  const supabase = await createClient();
  
  // Verify that the caller is an admin
  const { data: userAuth } = await supabase.auth.getUser();
  if (!userAuth.user) throw new Error("Not authenticated");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userAuth.user.id)
    .single();

  if (me?.role !== "admin") {
    throw new Error("Unauthorized: Only admins can update profiles.");
  }

  // Ensure we are only updating allowed fields
  const allowedData: { role?: string; plan?: string } = {};
  if (data.role) allowedData.role = data.role;
  if (data.plan) allowedData.plan = data.plan;

  const { error } = await supabase
    .from("profiles")
    .update(allowedData)
    .eq("id", userId);

  if (error) {
    console.error("Failed to update profile", error);
    throw new Error(error.message);
  }

  revalidatePath("/app/admin");
}
