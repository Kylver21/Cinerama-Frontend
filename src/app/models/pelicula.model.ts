export interface Pelicula {
  id?: number;
  tmdbId?: number;
  titulo: string;
  tituloOriginal?: string;
  idiomaOriginal?: string;
  genero?: string;
  duracion?: number;
  clasificacion?: string;
  sinopsis?: string;
  resumen?: string;
  popularidad?: number;
  posterUrl?: string;
  backdropUrl?: string;
  fechaEstreno?: string;
  votoPromedio?: number;
  totalVotos?: number;
  adult?: boolean;
  activa?: boolean;
}

export interface PeliculaCreateRequest {
  titulo: string;
  genero?: string;
  duracion?: number;
  clasificacion?: string;
  sinopsis?: string;
  posterUrl?: string;
  backdropUrl?: string;
  popularidad?: number;
  votoPromedio?: number;
  fechaEstreno?: string;
  activa?: boolean;
}

