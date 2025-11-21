import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Client, Frame, Message } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { environment } from '../../environments/environment';

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
  private client: Client | null = null;
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();
  private asientoUpdatesSubject = new Subject<AsientoUpdate>();
  public asientoUpdates$ = this.asientoUpdatesSubject.asObservable();

  constructor() {}

  connect(): void {
    if (this.client && this.client.connected) {
      return;
    }

    // El WebSocket está en la raíz del servidor, no en /api
    const wsUrl = environment.apiUrl.replace('/api', '').replace('http://', 'ws://').replace('https://', 'wss://');
    
    this.client = new Client({
      webSocketFactory: () => new SockJS(`${wsUrl}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket conectado');
        this.connectedSubject.next(true);
      },
      onDisconnect: () => {
        console.log('WebSocket desconectado');
        this.connectedSubject.next(false);
      },
      onStompError: (frame: Frame) => {
        console.error('Error STOMP:', frame);
      }
    });

    this.client.activate();
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connectedSubject.next(false);
    }
  }

  subscribeToAsientos(funcionId: number): void {
    if (!this.client || !this.client.connected) {
      this.connect();
      // Esperar a que se conecte
      setTimeout(() => {
        this.subscribeToAsientos(funcionId);
      }, 1000);
      return;
    }

    this.client.subscribe(`/topic/asientos/funcion/${funcionId}`, (message: Message) => {
      try {
        const update: AsientoUpdate = JSON.parse(message.body);
        this.asientoUpdatesSubject.next(update);
      } catch (error) {
        console.error('Error al parsear mensaje WebSocket:', error);
      }
    });
  }

  reservarAsiento(asientoId: number, funcionId: number, reservadoPor?: number): void {
    if (!this.client || !this.client.connected) {
      console.error('WebSocket no conectado');
      return;
    }

    const update: AsientoUpdate = {
      asientoId,
      funcionId,
      estado: 'RESERVADO',
      reservadoPor,
      accion: 'reservar'
    };

    this.client.publish({
      destination: '/app/asientos/reservar',
      body: JSON.stringify(update)
    });
  }

  liberarAsiento(asientoId: number, funcionId: number): void {
    if (!this.client || !this.client.connected) {
      console.error('WebSocket no conectado');
      return;
    }

    const update: AsientoUpdate = {
      asientoId,
      funcionId,
      estado: 'DISPONIBLE',
      accion: 'liberar'
    };

    this.client.publish({
      destination: '/app/asientos/liberar',
      body: JSON.stringify(update)
    });
  }

  confirmarAsiento(asientoId: number, funcionId: number): void {
    if (!this.client || !this.client.connected) {
      console.error('WebSocket no conectado');
      return;
    }

    const update: AsientoUpdate = {
      asientoId,
      funcionId,
      estado: 'OCUPADO',
      accion: 'confirmar'
    };

    this.client.publish({
      destination: '/app/asientos/confirmar',
      body: JSON.stringify(update)
    });
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

