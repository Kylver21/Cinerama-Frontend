import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Boleto, BoletoCreateRequest, EstadoBoleto } from '../models/boleto.model';

@Injectable({
  providedIn: 'root'
})
export class BoletoService {
  private apiUrl = `${environment.apiUrl}/boletos`;

  constructor(private http: HttpClient) {}

  obtenerTodosLosBoletos(): Observable<ApiResponse<Boleto[]>> {
    return this.http.get<ApiResponse<Boleto[]>>(this.apiUrl);
  }

  obtenerBoletoPorId(id: number): Observable<ApiResponse<Boleto>> {
    return this.http.get<ApiResponse<Boleto>>(`${this.apiUrl}/${id}`);
  }

  obtenerBoletosPorCliente(clienteId: number): Observable<ApiResponse<Boleto[]>> {
    return this.http.get<ApiResponse<Boleto[]>>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  obtenerBoletosPorFuncion(funcionId: number): Observable<ApiResponse<Boleto[]>> {
    return this.http.get<ApiResponse<Boleto[]>>(`${this.apiUrl}/funcion/${funcionId}`);
  }

  obtenerBoletosPorEstado(estado: EstadoBoleto): Observable<ApiResponse<Boleto[]>> {
    return this.http.get<ApiResponse<Boleto[]>>(`${this.apiUrl}/estado/${estado}`);
  }

  // ===== ACCIONES DE USUARIO =====

  crearBoleto(boleto: BoletoCreateRequest): Observable<ApiResponse<Boleto>> {
    return this.http.post<ApiResponse<Boleto>>(this.apiUrl, boleto);
  }

  actualizarBoleto(id: number, boleto: BoletoCreateRequest): Observable<ApiResponse<Boleto>> {
    return this.http.put<ApiResponse<Boleto>>(`${this.apiUrl}/${id}`, boleto);
  }

  cancelarBoleto(id: number): Observable<ApiResponse<Boleto>> {
    return this.http.put<ApiResponse<Boleto>>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  eliminarBoleto(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${id}`);
  }
}




