import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Funcion, FuncionCreateRequest } from '../models/funcion.model';

@Injectable({
  providedIn: 'root'
})
export class FuncionService {
  private apiUrl = `${environment.apiUrl}/funciones`;

  constructor(private http: HttpClient) {}

  obtenerTodasLasFunciones(): Observable<ApiResponse<Funcion[]>> {
    return this.http.get<ApiResponse<Funcion[]>>(this.apiUrl);
  }

  obtenerFuncionPorId(id: number): Observable<ApiResponse<Funcion>> {
    return this.http.get<ApiResponse<Funcion>>(`${this.apiUrl}/${id}`);
  }

  obtenerFuncionesPorPelicula(peliculaId: number): Observable<ApiResponse<Funcion[]>> {
    return this.http.get<ApiResponse<Funcion[]>>(`${this.apiUrl}/pelicula/${peliculaId}`);
  }

  obtenerFuncionesPorSala(salaId: number): Observable<ApiResponse<Funcion[]>> {
    return this.http.get<ApiResponse<Funcion[]>>(`${this.apiUrl}/sala/${salaId}`);
  }

  obtenerFuncionesActivas(): Observable<ApiResponse<Funcion[]>> {
    return this.http.get<ApiResponse<Funcion[]>>(`${this.apiUrl}/activas`);
  }

  // ===== ADMIN =====

  crearFuncion(funcion: FuncionCreateRequest): Observable<ApiResponse<Funcion>> {
    return this.http.post<ApiResponse<Funcion>>(this.apiUrl, funcion);
  }

  actualizarFuncion(id: number, funcion: FuncionCreateRequest): Observable<ApiResponse<Funcion>> {
    return this.http.put<ApiResponse<Funcion>>(`${this.apiUrl}/${id}`, funcion);
  }

  eliminarFuncion(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${id}`);
  }
}

