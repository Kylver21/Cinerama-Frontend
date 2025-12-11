import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuncionService } from '../../services/funcion.service';
import { PeliculaService } from '../../services/pelicula.service';
import { AsientoService } from '../../services/asiento.service';
import { BoletoService } from '../../services/boleto.service';
import { AuthService } from '../../services/auth.service';
import { WebSocketService, AsientoUpdate } from '../../services/websocket.service';
import { CompraService } from '../../services/compra.service';
import { Funcion } from '../../models/funcion.model';
import { Pelicula } from '../../models/pelicula.model';
import { Asiento, EstadoAsiento, TipoAsiento } from '../../models/asiento.model';
import { BoletoCreateRequest } from '../../models/boleto.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-compra',
  templateUrl: './compra.component.html',
  styleUrls: ['./compra.component.scss']
})
export class CompraComponent implements OnInit, OnDestroy {
  // Formulario
  compraForm: FormGroup;
  
  // Datos
  funcion: Funcion | null = null;
  pelicula: Pelicula | null = null;
  asientos: Asiento[] = [];
  asientosSeleccionados: Asiento[] = [];
  
  // Estado
  currentStep = 0;
  loading = false;
  error: string | null = null;
  compraConfirmada: any = null; // Datos de la compra confirmada
  
  // Mapa de asientos
  asientosPorFila: { [key: string]: Asiento[] } = {};
  filas: string[] = [];
  
  // WebSocket
  private wsSubscription?: Subscription;
  private asientoUpdateSubscription?: Subscription;
  
  // Métodos de pago
  metodosPago = [
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'TARJETA', label: 'Tarjeta de Crédito/Débito' },
    { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private funcionService: FuncionService,
    private peliculaService: PeliculaService,
    private asientoService: AsientoService,
    private boletoService: BoletoService,
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private compraService: CompraService
  ) {
    this.compraForm = this.fb.group({
      metodoPago: ['', Validators.required],
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      aceptarTerminos: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    console.log('CompraComponent ngOnInit - Iniciando...');
    
    // Verificar autenticación (doble verificación por seguridad)
    if (!this.authService.isAuthenticated()) {
      console.log('Usuario no autenticado, redirigiendo a login');
      this.router.navigate(['/auth/login'], { 
        queryParams: { 
          returnUrl: '/compra',
          message: 'Debes iniciar sesión para comprar entradas'
        } 
      });
      return;
    }

    console.log('Usuario autenticado, cargando datos de compra');
    
    this.route.queryParams.subscribe(params => {
      console.log('Query params recibidos:', params);
      const funcionId = +params['funcionId'];
      const peliculaId = +params['peliculaId'];
      
      console.log('FuncionId:', funcionId, 'PeliculaId:', peliculaId);
      
      // Asegurar que estemos en el paso de selección de asientos
      this.currentStep = 0;
      
      if (funcionId && funcionId > 0) {
        console.log('Cargando función:', funcionId);
        this.cargarFuncion(funcionId);
      } else {
        console.warn('No se proporcionó funcionId válido');
        this.error = 'No se especificó una función para comprar';
        this.loading = false;
      }
      
      if (peliculaId && peliculaId > 0) {
        console.log('Cargando película:', peliculaId);
        this.cargarPelicula(peliculaId);
      }
    });
  }

  cargarFuncion(id: number): void {
    this.loading = true;
    this.error = null;
    this.currentStep = 0; // Asegurar que estemos en el paso de selección de asientos
    this.asientosSeleccionados = []; // Limpiar selección previa
    this.asientos = []; // Limpiar asientos previos
    this.filas = []; // Limpiar filas previas
    this.asientosPorFila = {}; // Limpiar organización previa
    
    this.funcionService.obtenerFuncionPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.funcion = response.data;
          console.log('Función cargada:', this.funcion);
          
          // Cargar película desde la función si no está cargada
          if (this.funcion.pelicula && !this.pelicula) {
            this.pelicula = this.funcion.pelicula;
            console.log('Película cargada desde función:', this.pelicula);
          }
          
          // Cargar asientos
          this.cargarAsientos(id);
        } else {
          this.error = 'Función no encontrada';
          this.loading = false;
        }
      },
      error: (error) => {
        this.error = error.error?.message || 'Error al cargar la función';
        this.loading = false;
        console.error('Error al cargar función:', error);
      }
    });
  }

  cargarPelicula(id: number): void {
    this.peliculaService.obtenerPeliculaPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pelicula = response.data;
        }
      },
      error: (error) => {
        console.error('Error al cargar película:', error);
      }
    });
  }

  cargarAsientos(funcionId: number): void {
    console.log('Cargando asientos para función:', funcionId);
    this.loading = true;
    
    this.asientoService.obtenerAsientosPorFuncion(funcionId).subscribe({
      next: (asientos) => {
        console.log('Respuesta de asientos:', asientos);
        // El backend devuelve un array directamente, no ApiResponse
        if (asientos && Array.isArray(asientos)) {
          this.asientos = asientos;
          console.log('Asientos cargados:', this.asientos.length);
          
          if (this.asientos.length === 0) {
            console.warn('No hay asientos para esta función, se generarán automáticamente');
            // Intentar generar asientos automáticamente
            this.asientoService.generarAsientos(funcionId).subscribe({
              next: (asientosGenerados) => {
                if (asientosGenerados && Array.isArray(asientosGenerados)) {
                  this.asientos = asientosGenerados;
                  console.log('Asientos generados:', this.asientos.length);
                  this.organizarAsientosPorFila();
                  this.loading = false;
                } else {
                  this.error = 'No se pudieron generar asientos para esta función';
                  this.loading = false;
                }
              },
              error: (genError) => {
                console.error('Error al generar asientos:', genError);
                this.error = 'No se pudieron generar asientos para esta función';
                this.loading = false;
              }
            });
          } else {
            this.organizarAsientosPorFila();
            console.log('Filas organizadas:', this.filas.length);
            this.loading = false;
          }
          
          // Conectar WebSocket y suscribirse a actualizaciones en tiempo real
          this.webSocketService.connect();
          this.webSocketService.subscribeToAsientos(funcionId);
          
          // Escuchar actualizaciones de asientos
          if (this.asientoUpdateSubscription) {
            this.asientoUpdateSubscription.unsubscribe();
          }
          this.asientoUpdateSubscription = this.webSocketService.asientoUpdates$.subscribe(
            (update: AsientoUpdate) => {
              this.actualizarAsientoDesdeWebSocket(update);
            }
          );
        } else {
          console.warn('Respuesta inesperada:', asientos);
          this.error = 'No se pudieron cargar los asientos';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error al cargar asientos:', error);
        this.error = error.error?.message || error.error?.mensaje || error.message || 'Error al cargar asientos';
        this.loading = false;
      }
    });
  }

  actualizarAsientoDesdeWebSocket(update: AsientoUpdate): void {
    const asiento = this.asientos.find(a => a.id === update.asientoId);
    if (asiento) {
      // Actualizar estado del asiento
      asiento.estado = update.estado as EstadoAsiento;
      
      // Si se liberó un asiento que estaba seleccionado, removerlo
      if (update.accion === 'liberar' && this.estaSeleccionado(asiento)) {
        const index = this.asientosSeleccionados.findIndex(a => a.id === asiento.id);
        if (index > -1) {
          this.asientosSeleccionados.splice(index, 1);
        }
      }
      
      // Reorganizar asientos por fila para reflejar cambios
      this.organizarAsientosPorFila();
    }
  }

  organizarAsientosPorFila(): void {
    this.asientosPorFila = {};
    this.filas = [];
    
    this.asientos.forEach(asiento => {
      if (!this.asientosPorFila[asiento.fila]) {
        this.asientosPorFila[asiento.fila] = [];
        this.filas.push(asiento.fila);
      }
      this.asientosPorFila[asiento.fila].push(asiento);
    });
    
    // Ordenar filas alfabéticamente
    this.filas.sort();
  }

  seleccionarAsiento(asiento: Asiento): void {
    // Solo permitir seleccionar asientos disponibles o ya seleccionados por el usuario
    if (asiento.estado !== EstadoAsiento.DISPONIBLE && !this.estaSeleccionado(asiento)) {
      return;
    }

    const index = this.asientosSeleccionados.findIndex(a => a.id === asiento.id);
    
    if (index > -1) {
      // Deseleccionar asiento - liberar vía HTTP
      if (asiento.id) {
        this.asientoService.liberarAsiento(asiento.id).subscribe({
          next: (asientoLiberado) => {
            console.log('Asiento liberado:', asientoLiberado);
            // Actualizar estado local
            asiento.estado = EstadoAsiento.DISPONIBLE;
            this.asientosSeleccionados.splice(index, 1);
          },
          error: (error) => {
            console.error('Error al liberar asiento:', error);
            // Quitar de seleccionados de todas formas
            this.asientosSeleccionados.splice(index, 1);
          }
        });
      } else {
        this.asientosSeleccionados.splice(index, 1);
      }
    } else {
      // Seleccionar asiento - reservar vía HTTP
      if (asiento.id) {
        this.asientoService.reservarAsiento(asiento.id).subscribe({
          next: (asientoReservado) => {
            console.log('Asiento reservado:', asientoReservado);
            // Actualizar estado local
            asiento.estado = EstadoAsiento.RESERVADO;
            this.asientosSeleccionados.push(asiento);
          },
          error: (error) => {
            console.error('Error al reservar asiento:', error);
            this.error = error.error?.mensaje || 'No se pudo reservar el asiento. Puede que ya esté ocupado.';
          }
        });
      }
    }
  }

  estaSeleccionado(asiento: Asiento): boolean {
    return this.asientosSeleccionados.some(a => a.id === asiento.id);
  }

  obtenerClaseAsiento(asiento: Asiento): string {
    let clase = 'seat';
    
    // Verificar si el asiento está seleccionado por el usuario actual
    if (this.estaSeleccionado(asiento)) {
      clase += ' selected';
    } else if (asiento.estado === EstadoAsiento.OCUPADO) {
      clase += ' occupied';
    } else if (asiento.estado === EstadoAsiento.RESERVADO) {
      // Si está reservado por otro usuario (no seleccionado por nosotros), mostrarlo como ocupado
      clase += ' reserved';
    } else {
      clase += ' available';
    }
    
    if (asiento.tipo === TipoAsiento.VIP) {
      clase += ' vip';
    }
    
    return clase;
  }

  calcularTotal(): number {
    if (!this.funcion) return 0;
    // El backend usa precioEntrada, no precio
    const precio = this.funcion.precioEntrada || this.funcion.precio || 0;
    return this.asientosSeleccionados.length * precio;
  }

  siguientePaso(): void {
    if (this.currentStep === 0) {
      if (this.asientosSeleccionados.length === 0) {
        this.error = 'Debes seleccionar al menos un asiento';
        return;
      }
      this.currentStep = 1;
    } else if (this.currentStep === 1) {
      if (this.compraForm.valid) {
        this.currentStep = 2;
      } else {
        this.error = 'Completa todos los campos requeridos';
      }
    }
  }

  pasoAnterior(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  confirmarCompra(): void {
    if (!this.funcion || this.asientosSeleccionados.length === 0) {
      this.error = 'No hay asientos seleccionados';
      return;
    }

    if (this.compraForm.invalid) {
      this.error = 'Por favor completa todos los campos requeridos';
      return;
    }

    this.loading = true;
    this.error = null;

    // Verificar que funcionId y asientoId existan
    if (!this.funcion || !this.funcion.id) {
      this.error = 'Función no válida';
      this.loading = false;
      return;
    }

    const funcionId: number = this.funcion.id;
    const asientoIds: number[] = this.asientosSeleccionados
      .filter(a => a.id)
      .map(a => a.id!);

    if (asientoIds.length === 0) {
      this.error = 'No hay asientos válidos seleccionados';
      this.loading = false;
      return;
    }

    // Obtener clienteId del usuario autenticado
    const currentUser = this.authService.getCurrentUser();
    console.log('Usuario actual:', currentUser);
    
    // El backend requiere clienteId - intentar obtenerlo del usuario
    const clienteId = currentUser?.clienteId;
    
    if (!clienteId) {
      console.error('No se encontró clienteId en el usuario:', currentUser);
      this.error = 'No se pudo obtener la información del cliente. Por favor, cierra sesión e inicia sesión nuevamente.';
      this.loading = false;
      return;
    }

    // Preparar request para el orquestador
    const confirmarRequest = {
      clienteId: clienteId,
      funcionId: funcionId,
      asientoIds: asientoIds,
      productos: [], // TODO: Agregar productos si se implementa
      metodoPago: this.compraForm.value.metodoPago
    };
    
    console.log('Enviando request de compra:', confirmarRequest);

    // Usar el servicio de compra (orquestador)
    this.compraService.confirmarCompra(confirmarRequest).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.loading = false;
          this.currentStep = 3; // Mostrar confirmación
          
          // Guardar datos de la compra confirmada
          this.compraConfirmada = response.data;
          
          // Confirmar asientos vía WebSocket (el backend ya lo hace, pero por seguridad también aquí)
          if (this.funcion && this.funcion.id) {
            this.asientosSeleccionados.forEach(asiento => {
              if (asiento.id) {
                this.webSocketService.confirmarAsiento(asiento.id, this.funcion!.id!);
              }
            });
          }
          
          console.log('Compra confirmada:', response.data);
        } else {
          this.error = response.message || 'Error al confirmar la compra';
          this.loading = false;
        }
      },
      error: (error) => {
        const errorMsg = error.error?.message || error.error?.mensaje || 'Error al procesar la compra';
        this.error = errorMsg;
        this.loading = false;
        console.error('Error al confirmar compra:', error);
      }
    });
  }

  volverAPeliculas(): void {
    this.router.navigate(['/peliculas']);
  }

  formatearHora(fechaHora: string): string {
    return new Date(fechaHora).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearFecha(fechaHora: string): string {
    return new Date(fechaHora).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  obtenerImagenPoster(pelicula: Pelicula | null | undefined): string {
    if (!pelicula) return 'https://via.placeholder.com/500x750/1a1a1a/ffffff?text=No+Poster';
    return pelicula.posterUrl || 'https://via.placeholder.com/500x750/1a1a1a/ffffff?text=No+Poster';
  }

  generarCodigoConfirmacion(): string {
    // Genera un código alfanumérico corto para la confirmación
    return Math.random().toString(36).slice(2, 11).toUpperCase();
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones
    if (this.asientoUpdateSubscription) {
      this.asientoUpdateSubscription.unsubscribe();
    }
    
    // Liberar todos los asientos seleccionados al salir (si no se confirmó la compra)
    if (this.currentStep < 3 && this.asientosSeleccionados.length > 0) {
      this.asientosSeleccionados.forEach(asiento => {
        if (asiento.id) {
          // Liberar via HTTP (fire and forget)
          this.asientoService.liberarAsiento(asiento.id).subscribe({
            next: () => console.log('Asiento liberado al salir:', asiento.id),
            error: (err) => console.error('Error al liberar asiento:', err)
          });
        }
      });
    }
    
    this.webSocketService.disconnect();
  }
}




