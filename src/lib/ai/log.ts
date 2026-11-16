import { createClient } from "@/lib/supabase/server";

// Every AI action gets a row here — what it did, why, and whether a human
// confirmed it — per the project's AI safety rules.
export async function logAiAction(params: {
  orgId: string;
  actionType: string;
  inputSummary: string;
  outputSummary: string;
  performedBy: string;
  confirmed: boolean;
}) {
  const supabase = await createClient();
  await supabase.from("ai_action_log").insert({
    org_id: params.orgId,
    action_type: params.actionType,
    input_summary: params.inputSummary,
    output_summary: params.outputSummary,
    performed_by: params.performedBy,
    confirmed: params.confirmed,
  });
}
