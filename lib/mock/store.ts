import type { LegajoRecord } from "@/lib/types/legajo";

// globalThis para sobrevivir al hot-reload de Next.js en desarrollo.
const g = globalThis as unknown as { __ezmelMockLegajos?: LegajoRecord[] };
g.__ezmelMockLegajos ??= [];

export const mockLegajoStore = {
  all(): LegajoRecord[] {
    return g.__ezmelMockLegajos!;
  },
  add(record: LegajoRecord): void {
    g.__ezmelMockLegajos!.push(record);
  },
};
