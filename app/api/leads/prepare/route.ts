import { NextRequest } from "next/server";
import { runDailyLeads } from "@/lib/leads-daily-runner";

export async function POST(req: NextRequest) {
  return runDailyLeads(req, "prepare");
}
