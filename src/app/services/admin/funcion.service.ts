import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Funcion {
  id?: number;
  pelicula: any;
  sala: any;
  fechaHora: string;
  precioEntrada: number;
  asientosTotales: number;
  asientosDisponibles?: number;
  activa?: boolean;
}

export interface CrearFuncionDTO {
  peliculaId: number;
  salaId: number;
  fechaHora: string;
  precioEntrada: number;
  asientosTotales: number;
}

export interface ActualizarFuncionDTO {
  fechaHora?: string;
  precioEntrada?: number;
  asientosDisponibles?: number;
  asientosTotales?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FuncionService {
  private apiUrl: string;

  constructor(private http: HttpClient, private apiService: ApiService) {
    this.apiUrl = `${this.apiService.apiUrl}/funciones`;
  }

  obtenerTodasLasFunciones(): Observable<ApiResponse<Funcion[]>> {
    return this.http.get<ApiResponse<Funcion[]>>(this.apiUrl);
  }

  obtenerFuncionPorId(id: number): Observable<ApiResponse<Funcion>> {
    return this.http.get<ApiResponse<Funcion>>(`${this.apiUrl}/${id}`);
  }

  obtenerFuncionesPorPelicula(peliculaId: number): Observable<ApiResponse<Funcion[]>> {
    return this.http.get<ApiResponse<Funcion[]>>(`${this.apiUrl}/pelicula/${peliculaId}`);
  }

  crearFuncion(dto: CrearFuncionDTO): Observable<ApiResponse<Funcion>> {
    return this.http.post<ApiResponse<Funcion>>(this.apiUrl, dto);
  }

  actualizarFuncion(id: number, dto: ActualizarFuncionDTO): Observable<ApiResponse<Funcion>> {
    return this.http.put<ApiResponse<Funcion>>(`${this.apiUrl}/${id}`, dto);
  }

  eliminarFuncion(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${id}`);
  }
}
