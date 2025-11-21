import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FuncionService } from '../../services/funcion.service';
import { PeliculaService } from '../../services/pelicula.service';
import { AuthService } from '../../services/auth.service';
import { Funcion } from '../../models/funcion.model';
import { Pelicula } from '../../models/pelicula.model';

@Component({
  selector: 'app-funciones',
  templateUrl: './funciones.component.html',
  styleUrls: ['./funciones.component.scss']
})
export class FuncionesComponent implements OnInit {
  funciones: Funcion[] = [];
  peliculas: Pelicula[] = [];
  
  loading = false;
  error: string | null = null;
  
  // Filtros
  peliculaFiltro: number | null = null;
  fechaFiltro: Date | null = null;

  constructor(
    private funcionService: FuncionService,
    private peliculaService: PeliculaService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarFunciones();
    this.cargarPeliculas();
  }

  cargarFunciones(): void {
    this.loading = true;
    this.error = null;

    // Cargar funciones activas (solo las futuras)
    this.funcionService.obtenerFuncionesActivas().subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.funciones = response.data;
          this.aplicarFiltros();
        } else {
          // Si no hay funciones activas, intentar cargar todas
          this.funcionService.obtenerTodasLasFunciones().subscribe({
            next: (responseAll) => {
              if (responseAll && responseAll.success && responseAll.data) {
                this.funciones = responseAll.data;
          this.aplicarFiltros();
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Error al cargar funciones';
        this.loading = false;
            }
          });
        }
        this.loading = false;
      },
      error: (error) => {
        // Si falla, intentar cargar todas las funciones
        this.funcionService.obtenerTodasLasFunciones().subscribe({
          next: (response) => {
            if (response && response.success && response.data) {
              this.funciones = response.data;
              this.aplicarFiltros();
            }
            this.loading = false;
          },
          error: (err) => {
            this.error = err.error?.message || 'Error al cargar funciones';
            this.loading = false;
          }
        });
      }
    });
  }

  cargarPeliculas(): void {
    this.peliculaService.obtenerPeliculasActivas().subscribe({
      next: (response) => {
        if (response.success) {
          this.peliculas = response.data;
        }
      },
      error: (error) => {
        console.error('Error al cargar películas:', error);
      }
    });
  }

  aplicarFiltros(): void {
    let funcionesFiltradas = [...this.funciones];

    if (this.peliculaFiltro) {
      funcionesFiltradas = funcionesFiltradas.filter(f => f.pelicula.id === this.peliculaFiltro);
    }

    if (this.fechaFiltro) {
      const fechaFiltroStr = this.fechaFiltro.toDateString();
      funcionesFiltradas = funcionesFiltradas.filter(f => 
        new Date(f.fechaHora).toDateString() === fechaFiltroStr
      );
    }

    this.funciones = funcionesFiltradas;
  }

  onFiltroChange(): void {
    this.cargarFunciones();
  }

  comprarEntrada(funcion: Funcion): void {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      // Redirigir al login con mensaje
      this.router.navigate(['/auth/login'], { 
        queryParams: { 
          returnUrl: '/compra',
          funcionId: funcion.id,
          peliculaId: funcion.pelicula.id,
          message: 'Debes iniciar sesión para comprar entradas'
        } 
      });
      return;
    }
    
    // Usuario autenticado, proceder con la compra
    this.router.navigate(['/compra'], { 
      queryParams: { 
        funcionId: funcion.id,
        peliculaId: funcion.pelicula.id 
      } 
    });
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
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

  obtenerImagenPoster(pelicula: Pelicula): string {
    return pelicula.posterUrl || 'https://via.placeholder.com/500x750/1a1a1a/ffffff?text=No+Poster';
  }
}




