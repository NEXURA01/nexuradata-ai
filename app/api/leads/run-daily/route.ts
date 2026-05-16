import { NextRequest } from "next/server";
import { runDailyLeads } from "@/lib/leads-daily-runner";
import { requireAdminOrResponse } from "@/lib/employe-role";

export async function POST(req: NextRequest) {
  const auth = await requireAdminOrResponse();

  if ("status" in auth) {
    return auth;
  }

  return runDailyLeads(req);
}
