export enum TipoDocumento {
  DNI = 'DNI',
  PASAPORTE = 'PASAPORTE',
  CEDULA = 'CEDULA'
}

export interface Cliente {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  numeroDocumento: string;
  tipoDocumento: TipoDocumento;
  activo?: boolean;
  fechaRegistro?: string;
}




