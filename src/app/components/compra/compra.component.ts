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
import { CalcularTotalResponse, ProductoItem } from '../../services/compra.service';
import { ProductoService } from '../../services/producto.service';
import { ClienteService } from '../../services/cliente.service';
import { Funcion } from '../../models/funcion.model';
import { Pelicula } from '../../models/pelicula.model';
import { Asiento, EstadoAsiento, TipoAsiento } from '../../models/asiento.model';
import { BoletoCreateRequest } from '../../models/boleto.model';
import { Producto } from '../../models/producto.model';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-compra',
  templateUrl: './compra.component.html',
  styleUrls: ['./compra.component.scss']
})
export class CompraComponent implements OnInit, OnDestroy {
  private static readonly COMPRA_TIMEOUT_MS = 5 * 60 * 1000;
  private static readonly LS_PRESELECT_PRODUCT_ID = 'cinerama_preselect_product_id';

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

  // Chocolatería (opcional)
  productosDisponibles: Producto[] = [];
  productoCantidades: Record<number, number> = {};
  loadingProductos = false;
  resumenTotal: CalcularTotalResponse | null = null;
  
  // Mapa de asientos
  asientosPorFila: { [key: string]: Asiento[] } = {};
  filas: string[] = [];
  
  // WebSocket
  private wsSubscription?: Subscription;
  private asientoUpdateSubscription?: Subscription;

  private readonly fallbackProductoImg = 'https://via.placeholder.com/600x400/1a1a1a/ffffff?text=Producto';

  private preselectedProductoId: number | null = null;

  // Cuenta regresiva de compra
  private countdownSub?: Subscription;
  private compraExpiresAt = 0;
  tiempoRestanteSegundos = 0;
  tiempoRestanteLabel = '05:00';
  compraExpirada = false;
  
  // Métodos de pago
  metodosPago = [
    { value: 'EFECTIVO', label: 'Efectivo (en taquilla)' },
    { value: 'TARJETA', label: 'Tarjeta (crédito/débito)' },
    { value: 'TRANSFERENCIA', label: 'Transferencia (banca móvil/QR)' }
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
    private compraService: CompraService,
    private productoService: ProductoService,
    private clienteService: ClienteService
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

    // Rellenar datos del usuario para una interacción más dinámica
    this.prefillDatosUsuario();
    
    this.route.queryParams.subscribe(params => {
      console.log('Query params recibidos:', params);
      const funcionId = +params['funcionId'];
      const peliculaId = +params['peliculaId'];
      const productoId = +params['productoId'];

      this.preselectedProductoId = (productoId && productoId > 0)
        ? productoId
        : this.leerProductoPreseleccionadoDeStorage();
      
      console.log('FuncionId:', funcionId, 'PeliculaId:', peliculaId);
      
      // Asegurar que estemos en el paso de selección de asientos
      this.currentStep = 0;

      // Limpiar estado de productos/resumen al iniciar una nueva compra
      this.productoCantidades = {};
      this.resumenTotal = null;
      
      if (funcionId && funcionId > 0) {
        console.log('Cargando función:', funcionId);
        this.cargarFuncion(funcionId);
      } else {
        console.warn('No se proporcionó funcionId válido');
        this.error = 'No se especificó una función para comprar';
        this.loading = false;
        this.detenerCuentaRegresiva();
      }
      
      if (peliculaId && peliculaId > 0) {
        console.log('Cargando película:', peliculaId);
        this.cargarPelicula(peliculaId);
      }
    });
  }

  private leerProductoPreseleccionadoDeStorage(): number | null {
    const raw = localStorage.getItem(CompraComponent.LS_PRESELECT_PRODUCT_ID);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private limpiarProductoPreseleccionadoDeStorage(): void {
    localStorage.removeItem(CompraComponent.LS_PRESELECT_PRODUCT_ID);
  }

  private aplicarProductoPreseleccionadoSiCorresponde(): void {
    if (!this.preselectedProductoId) return;
    const productId = this.preselectedProductoId;
    const exists = this.productosDisponibles.some(p => p.id === productId);
    if (!exists) return;

    const actual = this.productoCantidades[productId] || 0;
    if (actual <= 0) {
      this.productoCantidades[productId] = 1;
      this.resumenTotal = null;
    }

    this.preselectedProductoId = null;
    this.limpiarProductoPreseleccionadoDeStorage();
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

          // Iniciar (o reiniciar) cuenta regresiva de compra para esta función
          this.iniciarCuentaRegresiva();
          
          // Cargar película desde la función si no está cargada
          if (this.funcion.pelicula && !this.pelicula) {
            this.pelicula = this.funcion.pelicula;
            console.log('Película cargada desde función:', this.pelicula);
          }
          
          // Cargar asientos
          this.cargarAsientos(id);

          // Cargar productos (Chocolatería) de forma opcional
          this.cargarProductos();
        } else {
          this.error = 'Función no encontrada';
          this.loading = false;
          this.detenerCuentaRegresiva();
        }
      },
      error: (error) => {
        this.error = error.error?.message || 'Error al cargar la función';
        this.loading = false;
        console.error('Error al cargar función:', error);
        this.detenerCuentaRegresiva();
      }
    });
  }

  private iniciarCuentaRegresiva(): void {
    this.detenerCuentaRegresiva();
    this.compraExpirada = false;

    this.compraExpiresAt = Date.now() + CompraComponent.COMPRA_TIMEOUT_MS;
    this.actualizarTiempoRestante();

    this.countdownSub = interval(1000).subscribe(() => {
      this.actualizarTiempoRestante();
      if (this.tiempoRestanteSegundos <= 0) {
        this.detenerCuentaRegresiva();
        this.onTiempoExpirado();
      }
    });
  }

  private detenerCuentaRegresiva(): void {
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
      this.countdownSub = undefined;
    }
  }

  private actualizarTiempoRestante(): void {
    const remainingMs = Math.max(0, this.compraExpiresAt - Date.now());
    this.tiempoRestanteSegundos = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(this.tiempoRestanteSegundos / 60);
    const seconds = this.tiempoRestanteSegundos % 60;
    this.tiempoRestanteLabel = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  get tiempoPorExpirar(): boolean {
    return this.tiempoRestanteSegundos > 0 && this.tiempoRestanteSegundos <= 60;
  }

  private onTiempoExpirado(): void {
    // Si ya se confirmó la compra, no hacer nada
    if (this.currentStep >= 4) return;

    this.compraExpirada = true;

    // Liberar asientos seleccionados (si los hay)
    this.liberarAsientosSeleccionados();

    // Reiniciar estado de la compra
    this.asientosSeleccionados = [];
    this.productoCantidades = {};
    this.resumenTotal = null;
    this.currentStep = 0;

    // Mantener datos del usuario, pero reiniciar pago/terminos
    this.compraForm.patchValue({
      metodoPago: '',
      aceptarTerminos: false
    });

    // Refrescar mapa de asientos
    if (this.funcion?.id) {
      this.cargarAsientos(this.funcion.id);
    }

    // Reiniciar el tiempo de compra (nuevo bloque de 5 minutos)
    this.iniciarCuentaRegresiva();
  }

  private liberarAsientosSeleccionados(): void {
    const asientos = [...this.asientosSeleccionados];
    asientos.forEach(asiento => {
      if (!asiento.id) return;
      this.asientoService.liberarAsiento(asiento.id).subscribe({
        next: () => {},
        error: () => {}
      });
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

  calcularTotalProductosLocal(): number {
    return this.obtenerProductosSeleccionados().reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
  }

  totalGeneral(): number {
    if (this.resumenTotal?.total != null) return this.resumenTotal.total;
    return this.calcularTotal() + this.calcularTotalProductosLocal();
  }

  private prefillDatosUsuario(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    // Prefill básico desde el token/login
    this.patchIfEmpty('email', currentUser.email);
    this.patchIfEmpty('nombre', currentUser.nombreCompleto || currentUser.username);

    // Prefill completo desde Cliente
    if (currentUser.clienteId) {
      this.clienteService.obtenerClientePorId(currentUser.clienteId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const cliente = response.data;
            this.patchIfEmpty('telefono', cliente.telefono);
            this.patchIfEmpty('email', cliente.email);
            this.patchIfEmpty('nombre', `${cliente.nombre} ${cliente.apellido}`.trim());
          }
        },
        error: (error) => {
          console.warn('No se pudo cargar información de cliente para prefill:', error);
        }
      });
    }
  }

  private patchIfEmpty(controlName: string, value: string | undefined | null): void {
    if (!value) return;
    const control = this.compraForm.get(controlName);
    if (!control) return;
    const current = (control.value ?? '').toString().trim();
    if (current.length === 0) {
      control.setValue(value);
    }
  }

  cargarProductos(): void {
    if (this.loadingProductos) return;
    this.loadingProductos = true;

    this.productoService.obtenerProductosActivos().subscribe({
      next: (response) => {
        const data = (response && (response as any).data) ? (response as any).data : [];
        const normalized: Producto[] = Array.isArray(data)
          ? data.map((p: Producto) => ({
              ...p,
              imagenUrl: p.imagenUrl || (p as any).imagen_url
            }))
          : [];

        if (normalized.length > 0) {
          this.productosDisponibles = normalized;
          this.loadingProductos = false;
          this.aplicarProductoPreseleccionadoSiCorresponde();
          return;
        }

        // Fallback: si /activos viene vacío, intentar traer todo el catálogo
        this.productoService.obtenerTodosLosProductos().subscribe({
          next: (allResp) => {
            const allData = (allResp && (allResp as any).data) ? (allResp as any).data : [];
            const allNormalized: Producto[] = Array.isArray(allData)
              ? allData.map((p: Producto) => ({
                  ...p,
                  imagenUrl: p.imagenUrl || (p as any).imagen_url
                }))
              : [];

            // Si existe flag activo, mostrar solo activos; si no, mostrar todo.
            const anyHasActivo = allNormalized.some(p => typeof (p as any).activo === 'boolean');
            this.productosDisponibles = anyHasActivo
              ? allNormalized.filter(p => (p as any).activo !== false)
              : allNormalized;

            this.loadingProductos = false;
            this.aplicarProductoPreseleccionadoSiCorresponde();
          },
          error: (err) => {
            console.error('Error al cargar catálogo de productos:', err);
            this.productosDisponibles = [];
            this.loadingProductos = false;
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar productos activos:', error);

        // Fallback directo a catálogo completo
        this.productoService.obtenerTodosLosProductos().subscribe({
          next: (allResp) => {
            const allData = (allResp && (allResp as any).data) ? (allResp as any).data : [];
            const allNormalized: Producto[] = Array.isArray(allData)
              ? allData.map((p: Producto) => ({
                  ...p,
                  imagenUrl: p.imagenUrl || (p as any).imagen_url
                }))
              : [];

            const anyHasActivo = allNormalized.some(p => typeof (p as any).activo === 'boolean');
            this.productosDisponibles = anyHasActivo
              ? allNormalized.filter(p => (p as any).activo !== false)
              : allNormalized;

            this.loadingProductos = false;
            this.aplicarProductoPreseleccionadoSiCorresponde();
          },
          error: (err) => {
            console.error('Error al cargar catálogo de productos:', err);
            this.productosDisponibles = [];
            this.loadingProductos = false;
          }
        });
      }
    });
  }

  getCantidadProducto(producto: Producto): number {
    const id = producto.id;
    if (!id) return 0;
    return this.productoCantidades[id] || 0;
  }

  incrementarProducto(producto: Producto): void {
    if (!producto.id) return;
    const actual = this.productoCantidades[producto.id] || 0;
    this.productoCantidades[producto.id] = actual + 1;
    this.resumenTotal = null;
  }

  decrementarProducto(producto: Producto): void {
    if (!producto.id) return;
    const actual = this.productoCantidades[producto.id] || 0;
    this.productoCantidades[producto.id] = Math.max(0, actual - 1);
    this.resumenTotal = null;
  }

  obtenerProductosParaRequest(): ProductoItem[] {
    return Object.entries(this.productoCantidades)
      .map(([productoId, cantidad]) => ({ productoId: Number(productoId), cantidad }))
      .filter(p => p.productoId > 0 && p.cantidad > 0);
  }

  obtenerProductosSeleccionados(): { productoId: number; nombre: string; cantidad: number; precioUnitario: number; subtotal: number }[] {
    const mapProductos = new Map<number, Producto>();
    this.productosDisponibles.forEach(p => {
      if (p.id) mapProductos.set(p.id, p);
    });

    return this.obtenerProductosParaRequest().map(item => {
      const p = mapProductos.get(item.productoId);
      const precio = p?.precio ?? 0;
      return {
        productoId: item.productoId,
        nombre: p?.nombre ?? 'Producto',
        cantidad: item.cantidad,
        precioUnitario: precio,
        subtotal: precio * item.cantidad
      };
    });
  }

  private precalcularTotal(): void {
    if (!this.funcion?.id) return;
    const asientoIds: number[] = this.asientosSeleccionados
      .filter(a => a.id)
      .map(a => a.id!);
    const productos = this.obtenerProductosParaRequest();

    this.compraService.calcularTotal({
      funcionId: this.funcion.id,
      asientoIds,
      productos
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.resumenTotal = response.data;
        } else {
          this.resumenTotal = null;
        }
      },
      error: (error) => {
        console.warn('No se pudo precalcular total:', error);
        this.resumenTotal = null;
      }
    });
  }

  siguientePaso(): void {
    if (this.currentStep === 0) {
      if (this.asientosSeleccionados.length === 0) {
        this.error = 'Debes seleccionar al menos un asiento';
        return;
      }
      // Paso 2: Chocolatería (opcional)
      this.currentStep = 1;
    } else if (this.currentStep === 1) {
      // Paso 3: Datos de Compra
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      if (this.compraForm.valid) {
        // Paso 4: Confirmación
        this.currentStep = 3;
        this.precalcularTotal();
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
      productos: this.obtenerProductosParaRequest(),
      metodoPago: this.compraForm.value.metodoPago
    };
    
    console.log('Enviando request de compra:', confirmarRequest);

    // Usar el servicio de compra (orquestador)
    this.compraService.confirmarCompra(confirmarRequest).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.loading = false;
          this.currentStep = 4; // Mostrar confirmación

          // Detener cuenta regresiva al finalizar compra
          this.detenerCuentaRegresiva();
          
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

  obtenerImagenProducto(producto: Producto | null | undefined): string {
    const url = producto?.imagenUrl || (producto as any)?.imagen_url;
    return (url && url.trim().length > 0) ? url : this.fallbackProductoImg;
  }

  onProductoImgError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;
    img.src = this.fallbackProductoImg;
  }

  generarCodigoConfirmacion(): string {
    // Genera un código alfanumérico corto para la confirmación
    return Math.random().toString(36).slice(2, 11).toUpperCase();
  }

  ngOnDestroy(): void {
    this.detenerCuentaRegresiva();

    // Limpiar suscripciones
    if (this.asientoUpdateSubscription) {
      this.asientoUpdateSubscription.unsubscribe();
    }
    
    // Liberar todos los asientos seleccionados al salir (si no se confirmó la compra)
    if (this.currentStep < 4 && this.asientosSeleccionados.length > 0) {
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




