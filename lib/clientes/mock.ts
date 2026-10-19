// Datos de prueba para ver la pantalla; se reemplazan cuando haya clientes reales.
export type EstadoCliente = "Activo" | "En mora" | "Cancelado" | "Inactivo";

export interface ClienteMock {
  id: string;
  estado: EstadoCliente;
  // Datos personales (los pide el legajo)
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  direccion: string;
  codigoPostal: string;
  referencias: string;
  // Sin contrato hasta que se cargue uno para ese cliente
  contrato?: {
    montoPrestado: number;
    montoADevolver: number;
    cantidadCuotas: number;
    importeCuota: number;
    periodicidad: string;
    fechaPrimeraCuota: string;
    fechaContrato: string;
    fechaVencimientoPagare: string;
  };
}

export const CLIENTES_MOCK: ClienteMock[] = [
  {
    id: "c-1",
    estado: "Activo",
    nombre: "Ezequiel",
    apellido: "Dehnike",
    dni: "36315016",
    email: "ezequieldehnike@gmail.com",
    telefono: "11 5555-0123",
    direccion: "Av. Corrientes 1234, CABA",
    codigoPostal: "C1043",
    referencias: "Timbre B, portería de 8 a 18 h",
    contrato: {
      montoPrestado: 300000,
      montoADevolver: 390000,
      cantidadCuotas: 6,
      importeCuota: 65000,
      periodicidad: "Mensual",
      fechaPrimeraCuota: "01/11/2026",
      fechaContrato: "01/10/2026",
      fechaVencimientoPagare: "01/04/2027",
    },
  },
];
