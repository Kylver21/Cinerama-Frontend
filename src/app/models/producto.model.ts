export interface Producto {
  id?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria?: string;
  imagenUrl?: string;
  activo?: boolean;
}

export interface ProductoCreateRequest {
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria?: string;
  imagenUrl?: string;
  activo?: boolean;
}




