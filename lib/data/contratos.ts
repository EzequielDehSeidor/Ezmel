import { randomUUID } from "crypto";
import { isMockMode } from "@/lib/supabase/env";
import { mockContratoStore } from "@/lib/mock/store";
import { createClient } from "@/lib/supabase/server";
import type { ContratoDatos, ContratoRecord } from "@/lib/types/contrato";
import type { SaveContext } from "./legajos";

/**
 * Persiste el contrato. En modo mock queda en memoria del proceso; en modo
 * Supabase real se guarda en la tabla `contratos` (ver supabase/schema.sql).
 */
export async function saveContrato(
  datos: ContratoDatos,
  ctx: SaveContext
): Promise<ContratoRecord> {
  const record: ContratoRecord = {
    ...datos,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    createdBy: ctx.userId,
  };

  if (isMockMode()) {
    mockContratoStore.add(record);
    return record;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contratos").insert({
    id: record.id,
    tenant_id: ctx.tenantId,
    created_by: ctx.userId,
    created_at: record.createdAt,
    datos,
  });
  if (error) throw new Error(error.message);

  return record;
}
