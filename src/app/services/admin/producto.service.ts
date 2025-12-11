import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Producto {
  id?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria: string;
  imagenUrl?: string;
  activo?: boolean;
}

export interface CrearProductoDTO {
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria: string;
  imagenUrl?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl: string;

  constructor(private http: HttpClient, private apiService: ApiService) {
    this.apiUrl = `${this.apiService.apiUrl}/productos`;
  }

  obtenerTodosLosProductos(): Observable<ApiResponse<Producto[]>> {
    return this.http.get<ApiResponse<Producto[]>>(this.apiUrl);
  }

  obtenerProductoPorId(id: number): Observable<ApiResponse<Producto>> {
    return this.http.get<ApiResponse<Producto>>(`${this.apiUrl}/${id}`);
  }

  crearProducto(dto: CrearProductoDTO): Observable<ApiResponse<Producto>> {
    return this.http.post<ApiResponse<Producto>>(this.apiUrl, dto);
  }

  actualizarProducto(id: number, dto: CrearProductoDTO): Observable<ApiResponse<Producto>> {
    return this.http.put<ApiResponse<Producto>>(`${this.apiUrl}/${id}`, dto);
  }

  eliminarProducto(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${id}`);
  }
}
