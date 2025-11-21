import { Funcion } from './funcion.model';

export enum EstadoAsiento {
  DISPONIBLE = 'DISPONIBLE',
  RESERVADO = 'RESERVADO',
  OCUPADO = 'OCUPADO'
}

export enum TipoAsiento {
  REGULAR = 'REGULAR',
  VIP = 'VIP',
  PREFERENCIAL = 'PREFERENCIAL'
}

export interface Asiento {
  id?: number;
  funcion: Funcion;
  fila: string;
  numero: number;
  estado: EstadoAsiento;
  tipo: TipoAsiento;
  precio?: number;
}

export interface EstadisticasAsientos {
  total: number;
  disponibles: number;
  reservados: number;
  ocupados: number;
  porcentajeOcupacion: number;
}




