import { Cliente } from './cliente.model';
import { Funcion } from './funcion.model';
import { Asiento } from './asiento.model';

export enum EstadoBoleto {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADO = 'CONFIRMADO',
  CANCELADO = 'CANCELADO',
  USADO = 'USADO'
}

export interface Boleto {
  id?: number;
  cliente: Cliente;
  funcion: Funcion;
  asiento: Asiento;
  precio: number;
  estado: EstadoBoleto;
  fechaCompra: string;
  codigoQR?: string;
}

export interface BoletoCreateRequest {
  clienteId: number;
  funcionId: number;
  asientoId: number;
  precio: number;
}




