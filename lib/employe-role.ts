import "server-only";

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export type EmployeRole = "admin" | "employe";

type EmployeContext = {
  userId: string;
  role: EmployeRole;
  email: string | null;
};

function normalizeRole(value: unknown): EmployeRole {
  return value === "admin" ? "admin" : "employe";
}

export async function getEmployeContext(): Promise<EmployeContext | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const role = normalizeRole(user.app_metadata?.role);

  return {
    userId: user.id,
    role,
    email: user.email ?? null,
  };
}

export async function requireAdminOrResponse(): Promise<EmployeContext | NextResponse> {
  const context = await getEmployeContext();

  if (!context) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (context.role !== "admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  return context;
}
