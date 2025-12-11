import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Pelicula {
  id?: number;
  titulo: string;
  genero: string;
  duracion: number;
  clasificacion: string;
  sinopsis: string;
  posterUrl: string;
  backdropUrl?: string;
  popularidad?: number;
  votoPromedio?: number;
  fechaEstreno: string;
  activa?: boolean;
}

export interface CrearPeliculaDTO {
  titulo: string;
  genero: string;
  duracion: number;
  clasificacion: string;
  sinopsis: string;
  posterUrl: string;
  backdropUrl?: string;
  fechaEstreno: string;
  activa?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PeliculaService {
  private apiUrl: string;

  constructor(private http: HttpClient, private apiService: ApiService) {
    this.apiUrl = `${this.apiService.apiUrl}/peliculas`;
  }

  obtenerTodasLasPeliculas(): Observable<ApiResponse<Pelicula[]>> {
    return this.http.get<ApiResponse<Pelicula[]>>(this.apiUrl);
  }

  obtenerPeliculaPorId(id: number): Observable<ApiResponse<Pelicula>> {
    return this.http.get<ApiResponse<Pelicula>>(`${this.apiUrl}/${id}`);
  }

  crearPelicula(dto: CrearPeliculaDTO): Observable<ApiResponse<Pelicula>> {
    return this.http.post<ApiResponse<Pelicula>>(this.apiUrl, dto);
  }

  actualizarPelicula(id: number, dto: CrearPeliculaDTO): Observable<ApiResponse<Pelicula>> {
    return this.http.put<ApiResponse<Pelicula>>(`${this.apiUrl}/${id}`, dto);
  }

  eliminarPelicula(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${id}`);
  }
}
