import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Asiento, EstadisticasAsientos, EstadoAsiento, TipoAsiento } from '../models/asiento.model';

@Injectable({
  providedIn: 'root'
})
export class AsientoService {
  private apiUrl = `${environment.apiUrl}/asientos`;

  constructor(private http: HttpClient) {}

  // El backend devuelve List<Asiento> directamente, no ApiResponse
  obtenerAsientosPorFuncion(funcionId: number): Observable<Asiento[]> {
    return this.http.get<Asiento[]>(`${this.apiUrl}/funcion/${funcionId}`);
  }

  obtenerEstadisticasAsientos(funcionId: number): Observable<EstadisticasAsientos> {
    return this.http.get<EstadisticasAsientos>(`${this.apiUrl}/estadisticas/${funcionId}`);
  }

  verificarDisponibilidad(funcionId: number, fila: string, numero: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/disponible/${funcionId}/${fila}/${numero}`);
  }

  obtenerAsientosPorEstado(funcionId: number, estado: EstadoAsiento): Observable<Asiento[]> {
    return this.http.get<Asiento[]>(`${this.apiUrl}/funcion/${funcionId}/estado/${estado}`);
  }

  obtenerAsientosPorTipo(funcionId: number, tipo: TipoAsiento): Observable<Asiento[]> {
    return this.http.get<Asiento[]>(`${this.apiUrl}/funcion/${funcionId}/tipo/${tipo}`);
  }

  // ===== ACCIONES DE USUARIO =====

  reservarAsiento(asientoId: number): Observable<Asiento> {
    return this.http.post<Asiento>(`${this.apiUrl}/reservar/${asientoId}`, {});
  }

  confirmarAsiento(asientoId: number): Observable<Asiento> {
    return this.http.post<Asiento>(`${this.apiUrl}/confirmar/${asientoId}`, {});
  }

  liberarAsiento(asientoId: number): Observable<Asiento> {
    return this.http.post<Asiento>(`${this.apiUrl}/liberar/${asientoId}`, {});
  }

  // ===== ADMIN =====

  generarAsientos(funcionId: number): Observable<Asiento[]> {
    return this.http.post<Asiento[]>(`${this.apiUrl}/generar/${funcionId}`, {});
  }
}




