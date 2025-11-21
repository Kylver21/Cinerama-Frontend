import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Asiento, EstadisticasAsientos, EstadoAsiento, TipoAsiento } from '../models/asiento.model';

@Injectable({
  providedIn: 'root'
})
export class AsientoService {
  private apiUrl = `${environment.apiUrl}/asientos`;

  constructor(private http: HttpClient) {}

  obtenerAsientosPorFuncion(funcionId: number): Observable<ApiResponse<Asiento[]>> {
    return this.http.get<ApiResponse<Asiento[]>>(`${this.apiUrl}/funcion/${funcionId}`);
  }

  obtenerEstadisticasAsientos(funcionId: number): Observable<ApiResponse<EstadisticasAsientos>> {
    return this.http.get<ApiResponse<EstadisticasAsientos>>(`${this.apiUrl}/estadisticas/${funcionId}`);
  }

  verificarDisponibilidad(funcionId: number, fila: string, numero: number): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/disponible/${funcionId}/${fila}/${numero}`);
  }

  obtenerAsientosPorEstado(funcionId: number, estado: EstadoAsiento): Observable<ApiResponse<Asiento[]>> {
    return this.http.get<ApiResponse<Asiento[]>>(`${this.apiUrl}/funcion/${funcionId}/estado/${estado}`);
  }

  obtenerAsientosPorTipo(funcionId: number, tipo: TipoAsiento): Observable<ApiResponse<Asiento[]>> {
    return this.http.get<ApiResponse<Asiento[]>>(`${this.apiUrl}/funcion/${funcionId}/tipo/${tipo}`);
  }

  // ===== ACCIONES DE USUARIO =====

  reservarAsiento(asientoId: number): Observable<ApiResponse<Asiento>> {
    return this.http.post<ApiResponse<Asiento>>(`${this.apiUrl}/reservar/${asientoId}`, {});
  }

  confirmarAsiento(asientoId: number): Observable<ApiResponse<Asiento>> {
    return this.http.post<ApiResponse<Asiento>>(`${this.apiUrl}/confirmar/${asientoId}`, {});
  }

  liberarAsiento(asientoId: number): Observable<ApiResponse<Asiento>> {
    return this.http.post<ApiResponse<Asiento>>(`${this.apiUrl}/liberar/${asientoId}`, {});
  }

  // ===== ADMIN =====

  generarAsientos(funcionId: number): Observable<ApiResponse<Asiento[]>> {
    return this.http.post<ApiResponse<Asiento[]>>(`${this.apiUrl}/generar/${funcionId}`, {});
  }
}




