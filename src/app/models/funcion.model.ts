import { Pelicula } from './pelicula.model';
import { Sala } from './sala.model';

export interface Funcion {
  id?: number;
  pelicula: Pelicula;
  sala: Sala;
  fechaHora: string;
  precio: number;
  activa?: boolean;
  asientosDisponibles?: number;
  asientosOcupados?: number;
}

export interface FuncionCreateRequest {
  peliculaId: number;
  salaId: number;
  fechaHora: string;
  precio: number;
  activa?: boolean;
}




