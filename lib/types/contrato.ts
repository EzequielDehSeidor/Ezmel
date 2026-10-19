export interface ContratoDatos {
  // Contrato
  numeroContrato: string;

  // Mutuario (deudor)
  mutuarioNombre: string;
  mutuarioDni: string;
  mutuarioDomicilio: string;
  mutuarioEmail: string;
  mutuarioCbu: string;
  mutuarioAlias: string;

  // Préstamo
  montoPrestado: number;
  montoADevolver: number;
  cantidadCuotas: number;
  importeCuota: number;
  periodicidadPago: "mensual" | "quincenal" | "semanal";
  fechaPrimeraCuota: string;

  // Tasas (en %, tal como figuran en el contrato)
  tna: number;
  tem: number;
  tea: number;
  cftea: number;

  // Fechas del instrumento
  fechaContrato: string;
  fechaVencimientoPagare: string;

  // Garante (opcional, "si hubiere")
  garanteNombre: string;
  garanteDni: string;
}

export interface ContratoRecord extends ContratoDatos {
  id: string;
  createdAt: string;
  createdBy: string | null;
}
