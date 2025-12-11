import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

// Declarar global para compatibilidad con SockJS en el navegador
declare var global: any;
if (typeof global === 'undefined') {
  (window as any).global = window;
}

export interface AsientoUpdate {
  asientoId: number;
  funcionId: number;
  estado: string;
  reservadoPor?: number;
  accion: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();
  private asientoUpdatesSubject = new Subject<AsientoUpdate>();
  public asientoUpdates$ = this.asientoUpdatesSubject.asObservable();
  
  // WebSocket deshabilitado temporalmente - usar polling como fallback
  private pollingEnabled = false;

  constructor() {
    console.log('WebSocketService inicializado (modo fallback)');
  }

  connect(): void {
    // WebSocket deshabilitado temporalmente
    console.log('WebSocket: conexión omitida (modo fallback)');
    this.connectedSubject.next(false);
  }

  disconnect(): void {
    this.connectedSubject.next(false);
  }

  subscribeToAsientos(funcionId: number): void {
    console.log('WebSocket: suscripción omitida para función', funcionId);
  }

  reservarAsiento(asientoId: number, funcionId: number, reservadoPor?: number): void {
    console.log('WebSocket: reserva omitida, usar HTTP');
  }

  liberarAsiento(asientoId: number, funcionId: number): void {
    console.log('WebSocket: liberación omitida, usar HTTP');
  }

  confirmarAsiento(asientoId: number, funcionId: number): void {
    console.log('WebSocket: confirmación omitida, usar HTTP');
  }

  isConnected(): boolean {
    return false;
  }
}

