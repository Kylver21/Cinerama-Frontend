export enum TipoSala {
  NORMAL = 'NORMAL',
  CINE_2D = 'CINE_2D'
}

export interface Sala {
  id?: number;
  nombre: string;
  capacidad: number;
  tipo?: TipoSala | string;
  activa?: boolean;
  descripcion?: string;
}




