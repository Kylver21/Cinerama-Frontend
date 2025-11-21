import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { VentaProducto, VentaCreateRequest, DetalleVentaProducto } from '../models/venta.model';

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private apiUrl = `${environment.apiUrl}/ventas-productos`;

  constructor(private http: HttpClient) {}

  obtenerTodasLasVentas(): Observable<ApiResponse<VentaProducto[]>> {
    return this.http.get<ApiResponse<VentaProducto[]>>(this.apiUrl);
  }

  obtenerVentaPorId(id: number): Observable<ApiResponse<VentaProducto>> {
    return this.http.get<ApiResponse<VentaProducto>>(`${this.apiUrl}/${id}`);
  }

  obtenerVentasPorCliente(clienteId: number): Observable<ApiResponse<VentaProducto[]>> {
    return this.http.get<ApiResponse<VentaProducto[]>>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  // ===== ACCIONES DE USUARIO =====

  crearVenta(venta: VentaCreateRequest): Observable<ApiResponse<VentaProducto>> {
    return this.http.post<ApiResponse<VentaProducto>>(this.apiUrl, venta);
  }

  completarVenta(id: number): Observable<ApiResponse<VentaProducto>> {
    return this.http.post<ApiResponse<VentaProducto>>(`${this.apiUrl}/${id}/completar`, {});
  }

  // ===== DETALLES DE VENTA =====

  obtenerTodosLosDetalles(): Observable<ApiResponse<DetalleVentaProducto[]>> {
    return this.http.get<ApiResponse<DetalleVentaProducto[]>>(`${this.apiUrl}/detalles`);
  }

  obtenerDetallePorId(id: number): Observable<ApiResponse<DetalleVentaProducto>> {
    return this.http.get<ApiResponse<DetalleVentaProducto>>(`${this.apiUrl}/detalles/${id}`);
  }

  obtenerDetallesPorVenta(ventaId: number): Observable<ApiResponse<DetalleVentaProducto[]>> {
    return this.http.get<ApiResponse<DetalleVentaProducto[]>>(`${this.apiUrl}/detalles/venta/${ventaId}`);
  }

  crearDetalleVenta(detalle: DetalleVentaProducto): Observable<ApiResponse<DetalleVentaProducto>> {
    return this.http.post<ApiResponse<DetalleVentaProducto>>(`${this.apiUrl}/detalles`, detalle);
  }

  actualizarDetalleVenta(id: number, detalle: DetalleVentaProducto): Observable<ApiResponse<DetalleVentaProducto>> {
    return this.http.put<ApiResponse<DetalleVentaProducto>>(`${this.apiUrl}/detalles/${id}`, detalle);
  }

  eliminarDetalleVenta(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/detalles/${id}`);
  }
}




