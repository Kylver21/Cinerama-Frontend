import { Cliente } from './cliente.model';
import { Funcion } from './funcion.model';
import { Asiento } from './asiento.model';

export enum EstadoBoleto {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADO = 'CONFIRMADO',
  PAGADO = 'PAGADO',
  CANCELADO = 'CANCELADO',
  USADO = 'USADO'
}

export interface Boleto {
  id?: number;
  cliente?: Cliente;
  funcion?: Funcion & { 
    pelicula?: { 
      id?: number; 
      titulo?: string; 
      posterUrl?: string; 
    };
    sala?: { 
      id?: number; 
      nombre?: string; 
    };
    fechaHora?: string;
  };
  asiento?: Asiento & { 
    codigoAsiento?: string; 
  };
  precio: number;
  estado: EstadoBoleto | string;
  fechaCompra: string;
  codigoQR?: string;
}

export interface BoletoCreateRequest {
  clienteId: number;
  funcionId: number;
  asientoId: number;
  precio: number;
}




