import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface CalcularTotalRequest {
  funcionId: number;
  asientoIds: number[];
  productos?: ProductoItem[];
}

export interface ProductoItem {
  productoId: number;
  cantidad: number;
}

export interface CalcularTotalResponse {
  subtotalBoletos: number;
  subtotalProductos: number;
  total: number;
  boletos: BoletoItem[];
  productos: ProductoDetalle[];
}

export interface BoletoItem {
  asientoId: number;
  codigoAsiento: string;
  precio: number;
}

export interface ProductoDetalle {
  productoId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface ConfirmarCompraRequest {
  clienteId: number; // Requerido por el backend
  funcionId: number;
  asientoIds: number[];
  productos?: ProductoItem[];
  metodoPago: string;
  tipoComprobante?: string;
}

export interface ConfirmarCompraResponse {
  numeroConfirmacion: string;
  fechaCompra: string;
  total: number;
  metodoPago: string;
  tipoComprobante: string;
  boletos: BoletoResumen[];
  productos: ProductoDetalle[];
  pelicula: PeliculaResumen;
  funcion: FuncionResumen;
}

export interface BoletoResumen {
  boletoId: number;
  codigoAsiento: string;
  precio: number;
}

export interface PeliculaResumen {
  id: number;
  titulo: string;
  posterUrl: string;
}

export interface FuncionResumen {
  id: number;
  fechaHora: string;
  salaNombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class CompraService {
  private apiUrl = `${environment.apiUrl}/compras`;

  constructor(private http: HttpClient) {}

  /**
   * Calcula el total de una compra antes de confirmar
   */
  calcularTotal(request: CalcularTotalRequest): Observable<ApiResponse<CalcularTotalResponse>> {
    return this.http.post<ApiResponse<CalcularTotalResponse>>(
      `${this.apiUrl}/calcular-total`,
      request
    );
  }

  /**
   * Confirma una compra (crea boletos, productos y pago de forma atómica)
   */
  confirmarCompra(request: ConfirmarCompraRequest): Observable<ApiResponse<ConfirmarCompraResponse>> {
    return this.http.post<ApiResponse<ConfirmarCompraResponse>>(
      `${this.apiUrl}/confirmar`,
      request
    );
  }
}


