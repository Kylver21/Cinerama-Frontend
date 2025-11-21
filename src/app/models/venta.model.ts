import { Cliente } from './cliente.model';
import { Producto } from './producto.model';

export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  TARJETA = 'TARJETA',
  TRANSFERENCIA = 'TRANSFERENCIA'
}

export interface VentaProducto {
  id?: number;
  cliente: Cliente;
  fechaVenta: string;
  total: number;
  metodoPago: MetodoPago;
  estado: string;
  detalles: DetalleVentaProducto[];
}

export interface DetalleVentaProducto {
  id?: number;
  ventaProducto: VentaProducto;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaCreateRequest {
  clienteId: number;
  metodoPago: MetodoPago;
  detalles: DetalleVentaCreateRequest[];
}

export interface DetalleVentaCreateRequest {
  productoId: number;
  cantidad: number;
}




