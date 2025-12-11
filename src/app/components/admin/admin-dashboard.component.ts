import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { FuncionService, Funcion, CrearFuncionDTO } from '../../services/admin/funcion.service';
import { PeliculaService, Pelicula } from '../../services/admin/pelicula.service';
import { SalaService, Sala } from '../../services/admin/sala.service';
import { ProductoService, Producto } from '../../services/admin/producto.service';
import { BoletoService } from '../../services/boleto.service';
import { DetalleVentaProductoService, DetalleVentaProducto } from '../../services/admin/detalle-venta-producto.service';
import { TMDbService, TMDbMovie } from '../../services/tmdb.service';
import { environment } from '../../../environments/environment';

interface TopFuncionStat {
  funcionId: number;
  titulo: string;
  sala: string;
  totalBoletos: number;
  totalIngresos: number;
  proximaFecha?: string;
}

interface TopProductoStat {
  productoId: number;
  nombre: string;
  categoria: string;
  totalVendidos: number;
  totalIngresos: number;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  adminEmail = '';
  environment = environment;
  placeholderImg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><rect width="300" height="450" fill="%23f1f1f5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="Arial" font-size="18">Sin imagen</text></svg>';
  tabIndex = 0;
  activeSection: 'dashboard' | 'funciones' | 'peliculas' | 'salas' | 'productos' = 'dashboard';

  topFunciones: TopFuncionStat[] = [];
  topProductos: TopProductoStat[] = [];
  loadingStats = false;
  enableStats = false; // backend de estadísticas pendiente
  tmdbUpcoming: TMDbMovie[] = [];
  tmdbLoading = false;
  tmdbPage = 1;

  // Estadísticas
  estadisticas = {
    totalPeliculas: 0,
    totalFunciones: 0,
    totalSalas: 0,
    totalProductos: 0
  };

  // Funciones
  funciones: Funcion[] = [];
  funcionesFiltradas: Funcion[] = [];
  funcionForm: FormGroup;
  mostrarFormFuncion = false;
  funcionEditando: Funcion | null = null;
  loadingFunciones = false;
  filtroFecha: 'asc' | 'desc' = 'desc';

  // Películas
  peliculas: Pelicula[] = [];
  peliculaForm: FormGroup;
  mostrarFormPelicula = false;
  peliculaEditando: Pelicula | null = null;
  loadingPeliculas = false;
  salas: Sala[] = [];
  
  // Productos
  productos: Producto[] = [];
  productoForm: FormGroup;
  mostrarFormProducto = false;
  productoEditando: Producto | null = null;
  loadingProductos = false;

  // Salas
  salaForm: FormGroup;
  mostrarFormSala = false;
  salaEditando: Sala | null = null;

  constructor(
    private fb: FormBuilder,
    private funcionService: FuncionService,
    private peliculaService: PeliculaService,
    private salaService: SalaService,
    private productoService: ProductoService,
    private boletoService: BoletoService,
    private detalleVentaProductoService: DetalleVentaProductoService,
    private tmdbService: TMDbService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.funcionForm = this.fb.group({
      peliculaId: ['', Validators.required],
      salaId: ['', Validators.required],
      fechaHora: ['', Validators.required],
      precioEntrada: ['', [Validators.required, Validators.min(0.01)]],
      asientosTotales: ['', [Validators.required, Validators.min(1), Validators.max(500)]]
    });

    this.funcionForm.get('salaId')?.valueChanges.subscribe((salaId) => {
      const sala = this.salas.find((s) => s.id === salaId);
      if (sala && (!this.funcionForm.get('asientosTotales')?.dirty || !this.funcionEditando)) {
        this.funcionForm.patchValue({ asientosTotales: sala.capacidad }, { emitEvent: false });
      }
    });

    this.peliculaForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      genero: ['', Validators.required],
      duracion: ['', [Validators.required, Validators.min(1)]],
      clasificacion: ['', Validators.required],
      fechaEstreno: ['', Validators.required],
      posterUrl: ['', Validators.required],
      backdropUrl: [''],
      sinopsis: ['', [Validators.required, Validators.minLength(10)]],
      activa: [true]
    });

    this.salaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      capacidad: [50, [Validators.required, Validators.min(1), Validators.max(500)]],
      tipo: ['NORMAL', Validators.required],
      descripcion: [''],
      activa: [true]
    });

    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: [''],
      precio: [0, [Validators.required, Validators.min(0.1)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      categoria: ['', Validators.required],
      imagenUrl: [''],
      activo: [true]
    });
  }

  ngOnInit(): void {
    // Solo acceder a localStorage si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      // Verificar token de la URL primero
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      
      if (tokenFromUrl) {
        localStorage.setItem('adminToken', tokenFromUrl);
        localStorage.setItem('auth_token', tokenFromUrl);
        // Limpiar URL
        window.history.replaceState({}, '', window.location.pathname);
      }
      
      this.adminEmail = localStorage.getItem('adminEmail') || 'Administrador';
      
      // Verificar que hay token
      const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
      if (!token) {
        this.router.navigate(['/admin-login']);
        return;
      }
    }
    this.cargarDatos();
  }

  onTabChange(index: number): void {
    this.tabIndex = index;
    const map: Record<number, typeof this.activeSection> = {
      0: 'funciones',
      1: 'peliculas',
      2: 'salas',
      3: 'productos'
    };
    this.activeSection = map[index] || 'dashboard';
  }

  cargarDatos(): void {
    this.loadingFunciones = true;
    
    this.peliculaService.obtenerTodasLasPeliculas().subscribe({
      next: (response) => {
        if (response.success) {
          this.peliculas = response.data as Pelicula[];
          console.log('Películas cargadas:', this.peliculas.length);
          this.estadisticas.totalPeliculas = this.peliculas.length;
        }
      },
      error: (error) => {
        console.error('Error cargando películas:', error);
        alert('Error al cargar películas: ' + error.message);
      }
    });

    this.salaService.obtenerTodasLasSalas().subscribe({
      next: (response) => {
        if (response.success) {
          this.salas = response.data as Sala[];
          console.log('Salas cargadas:', this.salas.length);
          this.estadisticas.totalSalas = this.salas.length;
        }
      },
      error: (error) => {
        console.error('Error cargando salas:', error);
        alert('Error al cargar salas: ' + error.message);
      }
    });

    this.funcionService.obtenerTodasLasFunciones().subscribe({
      next: (response) => {
        if (response.success) {
          this.funciones = response.data as Funcion[];
          console.log('Funciones cargadas:', this.funciones.length);
          this.estadisticas.totalFunciones = this.funciones.length;
          this.aplicarFiltros();
        }
      },
      error: (error) => {
        console.error('Error cargando funciones:', error);
        alert('Error al cargar funciones: ' + error.message);
        this.loadingFunciones = false;
      },
      complete: () => {
        this.loadingFunciones = false;
      }
    });

    this.productoService.obtenerTodosLosProductos().subscribe({
      next: (response) => {
        if (response.success) {
          this.productos = response.data as Producto[];
          console.log('Productos cargados:', this.productos.length);
          this.estadisticas.totalProductos = this.productos.length;
        }
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        alert('Error al cargar productos: ' + error.message);
      }
    });

    if (this.enableStats) {
      this.cargarEstadisticas();
    }
    this.cargarProximosEstrenos();
  }

  // ===== GESTIÓN DE FUNCIONES =====

  nuevaFuncion(): void {
    this.funcionEditando = null;
    const defaultDate = new Date();
    defaultDate.setMinutes(defaultDate.getMinutes() + 30);
    this.funcionForm.reset({
      peliculaId: this.peliculas[0]?.id || '',
      salaId: this.salas[0]?.id || '',
      fechaHora: this.toLocalDateTimeInput(defaultDate),
      precioEntrada: 12,
      asientosTotales: this.salas[0]?.capacidad || 80
    });
    this.mostrarFormFuncion = true;
  }

  editarFuncion(funcion: Funcion): void {
    this.funcionEditando = funcion;
    const fechaHora = funcion.fechaHora ? this.toLocalDateTimeInput(new Date(funcion.fechaHora)) : '';
    this.funcionForm.patchValue({
      peliculaId: funcion.pelicula?.id || '',
      salaId: funcion.sala?.id || '',
      fechaHora: fechaHora,
      precioEntrada: funcion.precioEntrada || '',
      asientosTotales: funcion.asientosTotales || ''
    });
    this.mostrarFormFuncion = true;
  }

  private toLocalDateTimeInput(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  cancelarFormFuncion(): void {
    this.mostrarFormFuncion = false;
    this.funcionEditando = null;
    this.funcionForm.reset();
  }

  guardarFuncion(): void {
    if (this.funcionForm.valid) {
      const dto: CrearFuncionDTO = this.funcionForm.value;
      console.log('Enviando DTO:', dto);

      if (this.funcionEditando && this.funcionEditando.id) {
        this.funcionService.actualizarFuncion(this.funcionEditando.id, dto).subscribe({
          next: (response) => {
            if (response.success) {
              this.cargarDatos();
              this.cancelarFormFuncion();
              alert('Función actualizada exitosamente');
            }
          },
          error: (error) => {
            console.error('Error detallado:', error);
            alert('Error al actualizar la función: ' + (error.message || JSON.stringify(error)));
          }
        });
      } else {
        this.funcionService.crearFuncion(dto).subscribe({
          next: (response) => {
            if (response.success) {
              this.cargarDatos();
              this.cancelarFormFuncion();
              alert('Función creada exitosamente');
            }
          },
          error: (error) => {
            console.error('Error detallado:', error);
            alert('Error al crear la función: ' + (error.message || JSON.stringify(error)));
          }
        });
      }
    } else {
      alert('Por favor, completa todos los campos requeridos');
    }
  }

  eliminarFuncion(funcion: Funcion): void {
    if (confirm('¿Estás seguro de eliminar esta función?')) {
      if (funcion.id) {
        this.funcionService.eliminarFuncion(funcion.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.cargarDatos();
              alert('Función eliminada exitosamente');
            }
          },
          error: (error) => {
            console.error('Error detallado:', error);
            alert('Error al eliminar la función: ' + (error.message || JSON.stringify(error)));
          }
        });
      }
    }
  }

  aplicarFiltros(): void {
    const copia = [...this.funciones];
    this.funcionesFiltradas = copia.sort((a, b) => {
      const fechaA = a.fechaHora ? new Date(a.fechaHora).getTime() : 0;
      const fechaB = b.fechaHora ? new Date(b.fechaHora).getTime() : 0;
      return this.filtroFecha === 'asc' ? fechaA - fechaB : fechaB - fechaA;
    });
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  obtenerNombrePelicula(peliculaId: number | undefined): string {
    const pelicula = this.peliculas.find(p => p.id === peliculaId);
    return pelicula ? pelicula.titulo : 'Sin película';
  }

  obtenerNombreSala(salaId: number | undefined): string {
    const sala = this.salas.find(s => s.id === salaId);
    return sala ? sala.nombre : 'Sin sala';
  }

  cargarEstadisticas(): void {
    if (!this.enableStats) {
      this.loadingStats = false;
      return;
    }
    this.loadingStats = true;

    forkJoin({
      boletos: this.boletoService.obtenerTodosLosBoletos(),
      detalles: this.detalleVentaProductoService.obtenerTodos()
    }).subscribe({
      next: ({ boletos, detalles }) => {
        this.topFunciones = this.calcularTopFunciones(boletos.data || []);
        this.topProductos = this.calcularTopProductos(detalles.data || []);
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
      },
      complete: () => {
        this.loadingStats = false;
      }
    });
  }

  private calcularTopFunciones(boletos: any[]): TopFuncionStat[] {
    const mapa = new Map<number, TopFuncionStat>();

    boletos.forEach((boleto) => {
      const funcion = boleto.funcion;
      if (!funcion?.id) return;

      const existente = mapa.get(funcion.id) || {
        funcionId: funcion.id,
        titulo: funcion.pelicula?.titulo || 'Función',
        sala: funcion.sala?.nombre || 'Sala',
        totalBoletos: 0,
        totalIngresos: 0,
        proximaFecha: funcion.fechaHora
      };

      existente.totalBoletos += 1;
      existente.totalIngresos += boleto.precio || 0;
      if (funcion.fechaHora) {
        existente.proximaFecha = funcion.fechaHora;
      }

      mapa.set(funcion.id, existente);
    });

    return Array.from(mapa.values())
      .sort((a, b) => b.totalBoletos - a.totalBoletos)
      .slice(0, 5);
  }

  private calcularTopProductos(detalles: DetalleVentaProducto[]): TopProductoStat[] {
    const mapa = new Map<number, TopProductoStat>();

    detalles.forEach((detalle) => {
      const producto = detalle.producto;
      if (!producto?.id) return;

      const existente = mapa.get(producto.id) || {
        productoId: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria || 'General',
        totalVendidos: 0,
        totalIngresos: 0
      };

      const cantidad = detalle.cantidad || 0;
      const precio = producto.precio || 0;

      existente.totalVendidos += cantidad;
      existente.totalIngresos += precio * cantidad;

      mapa.set(producto.id, existente);
    });

    return Array.from(mapa.values())
      .sort((a, b) => b.totalVendidos - a.totalVendidos)
      .slice(0, 5);
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(valor || 0);
  }

  cargarProximosEstrenos(): void {
    this.tmdbLoading = true;
    this.tmdbService.obtenerProximamente(this.tmdbPage).subscribe({
      next: (response) => {
        if (response.success) {
          this.tmdbUpcoming = response.data || [];
        }
      },
      error: (error) => {
        console.error('Error cargando estrenos TMDB:', error);
      },
      complete: () => {
        this.tmdbLoading = false;
      }
    });
  }

  refrescarTmdb(): void {
    this.tmdbPage = 1;
    this.cargarProximosEstrenos();
  }

  onTmdbImageError(event: any): void {
    const img = event.target as HTMLImageElement;
    img.src = this.placeholderImg;
  }

  navigateSection(section: typeof this.activeSection): void {
    this.activeSection = section;
    const tabMap: Record<typeof this.activeSection, number> = {
      dashboard: 0,
      funciones: 0,
      peliculas: 1,
      salas: 2,
      productos: 3
    };
    if (section !== 'dashboard') {
      this.tabIndex = tabMap[section];
      this.scrollTo('tabsAnchor');
    } else {
      this.scrollTo('dashboard');
    }
  }

  private scrollTo(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  importarDesdeTmdb(movie: TMDbMovie): void {
    const posterUrl = movie.posterPath ? `${environment.tmdbImageBaseUrl}/w500${movie.posterPath}` : '';
    const backdropUrl = movie.backdropPath ? `${environment.tmdbImageBaseUrl}/w780${movie.backdropPath}` : '';

    const dto = {
      titulo: movie.title,
      genero: movie.originalLanguage || 'Sin género',
      duracion: 120,
      clasificacion: 'PG-13',
      sinopsis: movie.overview || 'Sin sinopsis',
      posterUrl,
      backdropUrl,
      fechaEstreno: movie.releaseDate,
      activa: true
    } as any;

    this.peliculaService.crearPelicula(dto).subscribe({
      next: (response) => {
        if (response.success) {
          this.cargarDatos();
          alert(`Película "${movie.title}" importada`);
        }
      },
      error: (error) => {
        console.error('Error importando película TMDB:', error);
        alert('No se pudo importar la película');
      }
    });
  }

  // ===== GESTIÓN DE PELÍCULAS =====

  nuevaPelicula(): void {
    this.peliculaEditando = null;
    this.peliculaForm.reset({ activa: true });
    this.mostrarFormPelicula = true;
  }

  editarPelicula(pelicula: Pelicula): void {
    this.peliculaEditando = pelicula;
    this.peliculaForm.patchValue({
      titulo: pelicula.titulo,
      genero: pelicula.genero,
      duracion: pelicula.duracion,
      clasificacion: pelicula.clasificacion,
      fechaEstreno: pelicula.fechaEstreno,
      posterUrl: pelicula.posterUrl,
      backdropUrl: pelicula.backdropUrl || '',
      sinopsis: pelicula.sinopsis,
      activa: pelicula.activa || true
    });
    this.mostrarFormPelicula = true;
  }

  cancelarFormPelicula(): void {
    this.mostrarFormPelicula = false;
    this.peliculaEditando = null;
    this.peliculaForm.reset({ activa: true });
  }

  guardarPelicula(): void {
    if (this.peliculaForm.valid) {
      const dto = this.peliculaForm.value;

      if (this.peliculaEditando && this.peliculaEditando.id) {
        this.peliculaService.actualizarPelicula(this.peliculaEditando.id, dto).subscribe({
          next: (response) => {
            if (response.success) {
              this.cargarDatos();
              this.cancelarFormPelicula();
              alert('Película actualizada exitosamente');
            }
          },
          error: (error) => {
            console.error('Error:', error);
            alert('Error al actualizar la película: ' + (error.message || JSON.stringify(error)));
          }
        });
      } else {
        this.peliculaService.crearPelicula(dto).subscribe({
          next: (response) => {
            if (response.success) {
              this.cargarDatos();
              this.cancelarFormPelicula();
              alert('Película creada exitosamente');
            }
          },
          error: (error) => {
            console.error('Error:', error);
            alert('Error al crear la película: ' + (error.message || JSON.stringify(error)));
          }
        });
      }
    } else {
      alert('Por favor, completa todos los campos requeridos');
    }
  }

  eliminarPelicula(pelicula: Pelicula): void {
    if (confirm('¿Estás seguro de eliminar esta película?')) {
      if (pelicula.id) {
        this.peliculaService.eliminarPelicula(pelicula.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.cargarDatos();
              alert('Película eliminada exitosamente');
            }
          },
          error: (error) => {
            console.error('Error:', error);
            alert('Error al eliminar la película: ' + (error.message || JSON.stringify(error)));
          }
        });
      }
    }
  }

  onImageError(event: any): void {
    const imageElement = event.target as HTMLImageElement;
    imageElement.src = this.placeholderImg;
  }

  // ===== GESTIÓN DE SALAS =====

  nuevaSala(): void {
    this.salaEditando = null;
    this.salaForm.reset({ activa: true, tipo: 'NORMAL', capacidad: 50 });
    this.mostrarFormSala = true;
  }

  editarSala(sala: Sala): void {
    this.salaEditando = sala;
    this.salaForm.patchValue({
      nombre: sala.nombre,
      capacidad: sala.capacidad,
      tipo: sala.tipo || 'NORMAL',
      descripcion: sala.descripcion || '',
      activa: sala.activa ?? true
    });
    this.mostrarFormSala = true;
  }

  cancelarFormSala(): void {
    this.mostrarFormSala = false;
    this.salaEditando = null;
    this.salaForm.reset({ activa: true, tipo: 'NORMAL', capacidad: 50 });
  }

  guardarSala(): void {
    if (!this.salaForm.valid) {
      alert('Completa los datos de sala');
      return;
    }

    const dto = this.salaForm.value;
    if (this.salaEditando?.id) {
      this.salaService.actualizarSala(this.salaEditando.id, dto).subscribe({
        next: (response) => {
          if (response.success) {
            this.cargarDatos();
            this.cancelarFormSala();
            alert('Sala actualizada');
          }
        },
        error: (error) => {
          console.error('Error sala:', error);
          alert('No se pudo actualizar la sala');
        }
      });
    } else {
      this.salaService.crearSala(dto).subscribe({
        next: (response) => {
          if (response.success) {
            this.cargarDatos();
            this.cancelarFormSala();
            alert('Sala creada');
          }
        },
        error: (error) => {
          console.error('Error sala:', error);
          alert('No se pudo crear la sala');
        }
      });
    }
  }

  eliminarSala(sala: Sala): void {
    if (sala.id && confirm('¿Eliminar sala?')) {
      this.salaService.eliminarSala(sala.id).subscribe({
        next: () => {
          this.cargarDatos();
        },
        error: (error) => {
          console.error('Error eliminando sala:', error);
          alert('No se pudo eliminar la sala');
        }
      });
    }
  }

  // ===== GESTIÓN DE PRODUCTOS =====

  nuevoProducto(): void {
    this.productoEditando = null;
    this.productoForm.reset({ activo: true, stock: 0, precio: 0 });
    this.mostrarFormProducto = true;
  }

  editarProducto(producto: Producto): void {
    this.productoEditando = producto;
    this.productoForm.patchValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      stock: producto.stock,
      categoria: producto.categoria,
      imagenUrl: producto.imagenUrl || '',
      activo: producto.activo ?? true
    });
    this.mostrarFormProducto = true;
  }

  cancelarFormProducto(): void {
    this.mostrarFormProducto = false;
    this.productoEditando = null;
    this.productoForm.reset({ activo: true, stock: 0, precio: 0 });
  }

  guardarProducto(): void {
    if (!this.productoForm.valid) {
      alert('Completa los datos del producto');
      return;
    }

    const dto = {
      ...this.productoForm.value,
      imagenUrl: (this.productoForm.value.imagenUrl || '').trim() || undefined
    };
    if (this.productoEditando?.id) {
      this.productoService.actualizarProducto(this.productoEditando.id, dto).subscribe({
        next: (response) => {
          if (response.success) {
            this.cargarDatos();
            this.cancelarFormProducto();
            alert('Producto actualizado');
          }
        },
        error: (error) => {
          console.error('Error producto:', error);
          alert('No se pudo actualizar el producto');
        }
      });
    } else {
      this.productoService.crearProducto(dto).subscribe({
        next: (response) => {
          if (response.success) {
            this.cargarDatos();
            this.cancelarFormProducto();
            alert('Producto creado');
          }
        },
        error: (error) => {
          console.error('Error producto:', error);
          alert('No se pudo crear el producto');
        }
      });
    }
  }

  eliminarProducto(producto: Producto): void {
    if (producto.id && confirm('¿Eliminar producto?')) {
      this.productoService.eliminarProducto(producto.id).subscribe({
        next: () => this.cargarDatos(),
        error: (error) => {
          console.error('Error eliminando producto:', error);
          alert('No se pudo eliminar el producto');
        }
      });
    }
  }

  onProductoImageError(event: any): void {
    const img = event.target as HTMLImageElement;
    img.src = this.placeholderImg;
  }

  logout(): void {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    this.router.navigate(['/login']);
  }

  volverAlHome(): void {
    this.router.navigate(['/home']);
  }
}
