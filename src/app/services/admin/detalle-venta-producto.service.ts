import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../../models/api-response.model';
import { Producto } from './producto.service';

export interface DetalleVentaProducto {
  id?: number;
  ventaProducto?: { id?: number };
  producto?: Producto;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class DetalleVentaProductoService {
  private apiUrl: string;

  constructor(private http: HttpClient, private apiService: ApiService) {
    this.apiUrl = `${this.apiService.apiUrl}/detalle-ventas-productos`;
  }

  obtenerTodos(): Observable<ApiResponse<DetalleVentaProducto[]>> {
    return this.http.get<ApiResponse<DetalleVentaProducto[]>>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<ApiResponse<DetalleVentaProducto>> {
    return this.http.get<ApiResponse<DetalleVentaProducto>>(`${this.apiUrl}/${id}`);
  }

  buscarPorVenta(ventaProductoId: number): Observable<ApiResponse<DetalleVentaProducto[]>> {
    return this.http.get<ApiResponse<DetalleVentaProducto[]>>(`${this.apiUrl}/venta/${ventaProductoId}`);
  }
}
