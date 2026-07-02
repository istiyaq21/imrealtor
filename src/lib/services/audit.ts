// Best-effort audit logging for admin actions (approvals, rejections,
// status/role changes, etc). Uses the service-role client because
// audit_logs has no INSERT policy for a plain authenticated admin session
// (see rls.sql audit_logs_insert_admin — it exists, but writing via the
// admin client here keeps this helper usable from any admin action
// regardless of RLS wiring, and audit logging should never depend on the
// same trust boundary as the action it's recording).
//
// Never throws and never blocks the caller — a failed audit write should
// not fail the underlying admin action, just get logged to the server
// console for follow-up.

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/database.types";

export interface AuditEventInput {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Json;
}

export async function logAuditEvent(input: AuditEventInput): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const { error } = await supabase.from("audit_logs").insert({
    actor_id: input.actorId ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("[services/audit] failed to write audit log:", error.message);
  }
}
