import { randomUUID } from "crypto";
import { isMockMode } from "@/lib/supabase/env";
import { mockLegajoStore } from "@/lib/mock/store";
import { createClient } from "@/lib/supabase/server";
import type { LegajoFileCategoryKey, LegajoFormValues, LegajoRecord } from "@/lib/types/legajo";

/** Quién guarda y en qué tenant: sale de la sesión verificada en el servidor, nunca del cliente. */
export interface SaveContext {
  tenantId: string;
  userId: string;
}

export interface FileUpload {
  key: LegajoFileCategoryKey;
  name: string;
  type: string;
  buffer: Buffer;
}

/**
 * Persiste el legajo. En modo mock queda en memoria del proceso (sin los
 * binarios de los archivos); en modo Supabase real sube los archivos al
 * bucket `legajo-files` (carpeta del tenant) y guarda las filas en `legajos` /
 * `legajo_files`. La base aplica RLS con la sesión del usuario: sólo puede guardar
 * en su propio tenant y si su rol lo permite.
 */
export async function saveLegajo(
  values: LegajoFormValues,
  files: FileUpload[],
  ctx: SaveContext
): Promise<LegajoRecord> {
  const id = randomUUID();
  const fileNames: Partial<Record<LegajoFileCategoryKey, string[]>> = {};
  for (const f of files) (fileNames[f.key] ??= []).push(f.name);

  const record: LegajoRecord = {
    ...values,
    id,
    createdAt: new Date().toISOString(),
    createdBy: ctx.userId,
    fileNames,
  };

  if (isMockMode()) {
    mockLegajoStore.add(record);
    return record;
  }

  const supabase = await createClient();

  const { error: insertError } = await supabase.from("legajos").insert({
    id,
    tenant_id: ctx.tenantId,
    created_by: ctx.userId,
    created_at: record.createdAt,
    data: values,
    file_names: fileNames,
  });
  if (insertError) throw new Error(insertError.message);

  const indexByKey: Partial<Record<LegajoFileCategoryKey, number>> = {};
  for (const file of files) {
    const index = (indexByKey[file.key] ?? 0) + 1;
    indexByKey[file.key] = index;
    // Carpeta del tenant primero: las policies de Storage aíslan por esa carpeta.
    const safeName = file.name.replace(/[^w.-]+/g, "_").slice(-120);
    const path = `${ctx.tenantId}/${id}/${file.key}-${index}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("legajo-files")
      .upload(path, file.buffer, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const observaciones = (values as unknown as Record<string, string>)[`${file.key}Obs`] ?? "";
    const { error: fileRowError } = await supabase.from("legajo_files").insert({
      tenant_id: ctx.tenantId,
      legajo_id: id,
      slot_key: file.key,
      file_name: file.name,
      storage_path: path,
      observaciones,
    });
    if (fileRowError) throw new Error(fileRowError.message);
  }

  return record;
}
