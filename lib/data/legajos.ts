import { randomUUID } from "crypto";
import { isMockMode } from "@/lib/supabase/env";
import { mockLegajoStore } from "@/lib/mock/store";
import { createClient } from "@/lib/supabase/server";
import type { LegajoFileCategoryKey, LegajoFormValues, LegajoRecord } from "@/lib/types/legajo";

export interface FileUpload {
  key: LegajoFileCategoryKey;
  name: string;
  type: string;
  buffer: Buffer;
}

/**
 * Persiste el legajo. En modo mock queda en memoria del proceso (sin los
 * binarios de los archivos); en modo Supabase real sube los archivos al
 * bucket `legajo-files` y guarda las filas en `legajos` / `legajo_files`.
 */
export async function saveLegajo(
  values: LegajoFormValues,
  files: FileUpload[],
  createdBy: string | null
): Promise<LegajoRecord> {
  const id = randomUUID();
  const fileNames: Partial<Record<LegajoFileCategoryKey, string[]>> = {};
  for (const f of files) (fileNames[f.key] ??= []).push(f.name);

  const record: LegajoRecord = {
    ...values,
    id,
    createdAt: new Date().toISOString(),
    createdBy,
    fileNames,
  };

  if (isMockMode()) {
    mockLegajoStore.add(record);
    return record;
  }

  const supabase = await createClient();

  const { error: insertError } = await supabase.from("legajos").insert({
    id,
    created_by: createdBy,
    created_at: record.createdAt,
    data: values,
    file_names: fileNames,
  });
  if (insertError) throw new Error(insertError.message);

  const indexByKey: Partial<Record<LegajoFileCategoryKey, number>> = {};
  for (const file of files) {
    const index = (indexByKey[file.key] ?? 0) + 1;
    indexByKey[file.key] = index;
    const path = `${id}/${file.key}-${index}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("legajo-files")
      .upload(path, file.buffer, { contentType: file.type, upsert: true });
    if (uploadError) throw new Error(uploadError.message);

    const observaciones = (values as unknown as Record<string, string>)[`${file.key}Obs`] ?? "";
    const { error: fileRowError } = await supabase.from("legajo_files").insert({
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
