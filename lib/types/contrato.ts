export interface ContratoDatos {
  // Mutuario (deudor)
  mutuarioNombre: string;
  mutuarioDni: string;
  mutuarioDomicilio: string;
  mutuarioEmail: string;

  // Préstamo
  montoPrestado: number;
  montoADevolver: number;
  cantidadCuotas: number;
  importeCuota: number;
  periodicidadPago: "mensual" | "quincenal" | "semanal";
  fechaPrimeraCuota: string;
  diasHabilesPago: number;

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
