import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PeliculaService } from '../../../services/pelicula.service';
import { FuncionService } from '../../../services/funcion.service';
import { AuthService } from '../../../services/auth.service';
import { Pelicula } from '../../../models/pelicula.model';
import { Funcion } from '../../../models/funcion.model';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-pelicula-detalle',
  templateUrl: './pelicula-detalle.component.html',
  styleUrls: ['./pelicula-detalle.component.scss']
})
export class PeliculaDetalleComponent implements OnInit {
  pelicula: Pelicula | null = null;
  funciones: Funcion[] = [];
  loadingFunciones = false;
  
  loading = false;
  error: string | null = null;
  
  // Tabs
  selectedTab = 0;

  private static readonly LS_PRESELECT_PRODUCT_ID = 'cinerama_preselect_product_id';
  private static readonly LS_LAST_COMPRA_CONTEXT = 'cinerama_last_compra_context';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private peliculaService: PeliculaService,
    private funcionService: FuncionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.cargarPelicula(id);
        this.cargarFunciones(id);
      }
    });
  }

  cargarPelicula(id: number): void {
    this.loading = true;
    this.error = null;

    this.peliculaService.obtenerPeliculaPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pelicula = response.data;
        } else {
          this.error = 'Película no encontrada';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Error al cargar la película';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  cargarFunciones(peliculaId: number): void {
    this.loadingFunciones = true;
    // Preferir el endpoint de funciones disponibles (futuras) para evitar filtrar mal en frontend.
    this.funcionService.obtenerFuncionesDisponiblesPorPelicula(peliculaId).pipe(
      // Fallback por compatibilidad si el backend no expone /pelicula/:id/disponibles
      catchError(() => this.funcionService.obtenerFuncionesPorPelicula(peliculaId)),
      catchError((error) => {
        console.error('Error al cargar funciones:', error);
        return of({ success: false, message: 'Error', data: [] } as any);
      })
    ).subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          // Filtrar solo funciones futuras; si "activa" viene undefined, no excluir.
          const ahora = new Date();
          const data = Array.isArray(response.data) ? response.data : [];
          this.funciones = data.filter((f: Funcion) => {
            if (f.activa === false) return false;
            const fechaFuncion = new Date(f.fechaHora);
            return fechaFuncion > ahora;
          });
        } else {
          this.funciones = [];
        }
        this.loadingFunciones = false;
      },
      error: (error) => {
        console.error('Error al cargar funciones:', error);
        this.funciones = [];
        this.loadingFunciones = false;
      }
    });
  }

  obtenerGeneros(pelicula: Pelicula): string[] {
    return pelicula.genero ? pelicula.genero.split(', ') : [];
  }

  formatearDuracion(duracion: number | undefined): string {
    if (!duracion) return '';
    const horas = Math.floor(duracion / 60);
    const minutos = duracion % 60;
    return `${horas}h ${minutos}m`;
  }

  obtenerImagenPoster(pelicula: Pelicula): string {
    return pelicula.posterUrl || 'https://via.placeholder.com/500x750/1a1a1a/ffffff?text=No+Poster';
  }

  obtenerTipoSala(sala: any): string | undefined {
    return sala?.tipo;
  }

  obtenerImagenBackdrop(pelicula: Pelicula): string {
    return pelicula.backdropUrl || 'https://via.placeholder.com/1920x1080/1a1a1a/ffffff?text=No+Backdrop';
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  comprarEntrada(funcion: Funcion): void {
    // Guardar contexto de compra para poder volver desde Chocolatería
    localStorage.setItem(
      PeliculaDetalleComponent.LS_LAST_COMPRA_CONTEXT,
      JSON.stringify({ funcionId: funcion.id, peliculaId: this.pelicula?.id })
    );

    const raw = localStorage.getItem(PeliculaDetalleComponent.LS_PRESELECT_PRODUCT_ID);
    const productoId = raw ? Number(raw) : NaN;
    const productoIdPreseleccionado = Number.isFinite(productoId) && productoId > 0 ? productoId : null;

    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      // Redirigir al login
      this.router.navigate(['/auth/login'], { 
        queryParams: { 
          returnUrl: '/compra',
          funcionId: funcion.id,
          peliculaId: this.pelicula?.id,
          productoId: productoIdPreseleccionado,
          message: 'Debes iniciar sesión para comprar entradas'
        } 
      });
      return;
    }
    
    // Usuario autenticado, proceder con la compra
    this.router.navigate(['/compra'], { 
      queryParams: { 
        funcionId: funcion.id,
        peliculaId: this.pelicula?.id,
        productoId: productoIdPreseleccionado
      } 
    });
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  volverAtras(): void {
    this.router.navigate(['/peliculas']);
  }

  obtenerFuncionesPorFecha(): { [key: string]: Funcion[] } {
    const funcionesPorFecha: { [key: string]: Funcion[] } = {};
    
    this.funciones.forEach(funcion => {
      const fecha = new Date(funcion.fechaHora).toDateString();
      if (!funcionesPorFecha[fecha]) {
        funcionesPorFecha[fecha] = [];
      }
      funcionesPorFecha[fecha].push(funcion);
    });
    
    return funcionesPorFecha;
  }

  obtenerFechasOrdenadas(): string[] {
    const fechas = Object.keys(this.obtenerFuncionesPorFecha());
    return fechas.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }

  formatearHora(fechaHora: string): string {
    return new Date(fechaHora).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearFechaCompleta(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}




