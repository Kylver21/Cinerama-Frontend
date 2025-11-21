import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PeliculaService } from '../../services/pelicula.service';
import { Pelicula } from '../../models/pelicula.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  peliculasDestacadas: Pelicula[] = [];
  peliculasEnCartelera: Pelicula[] = [];
  proximosEstrenos: Pelicula[] = [];
  peliculasPopulares: Pelicula[] = [];
  
  loading = false;
  error: string | null = null;

  constructor(
    private peliculaService: PeliculaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.loading = true;
    this.error = null;

    // Cargar películas destacadas (populares)
    this.peliculaService.obtenerPeliculasPopulares().subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.peliculasDestacadas = response.data.slice(0, 5);
          this.peliculasPopulares = response.data.slice(0, 8);
        } else {
          console.warn('Respuesta de películas populares vacía o inválida:', response);
        }
        this.loading = false;
      },
      error: (error) => {
        const errorMessage = error.error?.message || error.message || 'Error al cargar películas destacadas';
        this.error = errorMessage;
        this.loading = false;
        console.error('Error al cargar películas populares:', error);
        // Si falla, intentar cargar todas las películas como fallback
        this.cargarTodasLasPeliculasComoFallback();
      }
    });

    // Cargar películas en cartelera (activas)
    this.peliculaService.obtenerPeliculasActivas().subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.peliculasEnCartelera = response.data.slice(0, 8);
        } else {
          console.warn('Respuesta de películas activas vacía o inválida:', response);
        }
      },
      error: (error) => {
        console.error('Error al cargar películas en cartelera:', error);
      }
    });

    // Cargar próximos estrenos (mejor valoradas)
    this.peliculaService.obtenerMejorValoradas().subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.proximosEstrenos = response.data.slice(0, 6);
        } else {
          console.warn('Respuesta de películas mejor valoradas vacía o inválida:', response);
        }
      },
      error: (error) => {
        console.error('Error al cargar próximos estrenos:', error);
      }
    });
  }

  cargarTodasLasPeliculasComoFallback(): void {
    // Fallback: cargar todas las películas si los endpoints específicos fallan
    this.peliculaService.obtenerTodasLasPeliculas().subscribe({
      next: (response) => {
        if (response && response.success && response.data && response.data.length > 0) {
          this.peliculasDestacadas = response.data.slice(0, 5);
          this.peliculasPopulares = response.data.slice(0, 8);
          this.peliculasEnCartelera = response.data.slice(0, 8);
          this.proximosEstrenos = response.data.slice(0, 6);
        }
      },
      error: (error) => {
        console.error('Error al cargar todas las películas (fallback):', error);
        this.error = 'No se pudieron cargar las películas. Verifica que el backend esté ejecutándose y que haya películas en la base de datos.';
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

  obtenerImagenBackdrop(pelicula: Pelicula): string {
    return pelicula.backdropUrl || 'https://via.placeholder.com/1920x1080/1a1a1a/ffffff?text=No+Backdrop';
  }
}




