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

    // Cargar funciones disponibles (futuras) usando el endpoint correcto
    this.funcionService.obtenerFuncionesActivas().subscribe({
      next: (response) => {
        console.log('Respuesta de funciones:', response);
        if (response && response.success && response.data) {
          this.funciones = response.data;
          this.aplicarFiltros();
        } else if (response && response.data) {
          // Respuesta sin campo success pero con data
          this.funciones = response.data;
          this.aplicarFiltros();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar funciones disponibles:', error);
        // Si falla con /disponibles, intentar con todas las funciones
        this.funcionService.obtenerTodasLasFunciones().subscribe({
          next: (response) => {
            console.log('Respuesta de todas las funciones:', response);
            if (response && response.data) {
              this.funciones = response.data;
              this.aplicarFiltros();
            }
            this.loading = false;
          },
          error: (err) => {
            console.error('Error al cargar todas las funciones:', err);
            this.error = err.error?.message || 'Error al cargar funciones. Verifica que el servidor esté corriendo.';
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




