import type { LegajoRecord } from "@/lib/types/legajo";
import type { ContratoRecord } from "@/lib/types/contrato";

// globalThis para sobrevivir al hot-reload de Next.js en desarrollo.
const g = globalThis as unknown as {
  __ezmelMockLegajos?: LegajoRecord[];
  __ezmelMockContratos?: ContratoRecord[];
};
g.__ezmelMockLegajos ??= [];
g.__ezmelMockContratos ??= [];

export const mockLegajoStore = {
  all(): LegajoRecord[] {
    return g.__ezmelMockLegajos!;
  },
  add(record: LegajoRecord): void {
    g.__ezmelMockLegajos!.push(record);
  },
};

export const mockContratoStore = {
  all(): ContratoRecord[] {
    return g.__ezmelMockContratos!;
  },
  add(record: ContratoRecord): void {
    g.__ezmelMockContratos!.push(record);
  },
};
