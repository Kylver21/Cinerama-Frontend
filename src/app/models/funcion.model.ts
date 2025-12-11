import { Pelicula } from './pelicula.model';
import { Sala } from './sala.model';

export interface Funcion {
  id?: number;
  pelicula: Pelicula;
  sala: Sala;
  fechaHora: string;
  precioEntrada: number; // Campo principal del backend
  precio?: number; // Alias para compatibilidad
  activa?: boolean;
  asientosTotales?: number;
  asientosDisponibles?: number;
  asientosOcupados?: number;
}

export interface FuncionCreateRequest {
  peliculaId: number;
  salaId: number;
  fechaHora: string;
  precioEntrada: number;
  asientosTotales: number;
}




