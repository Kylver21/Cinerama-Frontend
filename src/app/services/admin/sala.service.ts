import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Sala {
  id?: number;
  nombre: string;
  capacidad: number;
  tipo: 'NORMAL' | 'CINE_2D';
  descripcion?: string;
  activa?: boolean;
}

export interface CrearSalaDTO {
  nombre: string;
  capacidad: number;
  tipo: 'NORMAL' | 'CINE_2D';
  descripcion?: string;
  activa?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SalaService {
  private apiUrl: string;

  constructor(private http: HttpClient, private apiService: ApiService) {
    this.apiUrl = `${this.apiService.apiUrl}/salas`;
  }

  obtenerTodasLasSalas(): Observable<ApiResponse<Sala[]>> {
    return this.http.get<ApiResponse<Sala[]>>(this.apiUrl);
  }

  obtenerSalaPorId(id: number): Observable<ApiResponse<Sala>> {
    return this.http.get<ApiResponse<Sala>>(`${this.apiUrl}/${id}`);
  }

  crearSala(dto: CrearSalaDTO): Observable<ApiResponse<Sala>> {
    return this.http.post<ApiResponse<Sala>>(this.apiUrl, dto);
  }

  actualizarSala(id: number, dto: CrearSalaDTO): Observable<ApiResponse<Sala>> {
    return this.http.put<ApiResponse<Sala>>(`${this.apiUrl}/${id}`, dto);
  }

  eliminarSala(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${id}`);
  }
}
