import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PeliculaService } from '../../../services/pelicula.service';
import { Pelicula } from '../../../models/pelicula.model';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-peliculas-list',
  templateUrl: './peliculas-list.component.html',
  styleUrls: ['./peliculas-list.component.scss']
})
export class PeliculasListComponent implements OnInit {
  peliculas: Pelicula[] = [];
  
  // Paginación
  currentPage = 0;
  pageSize = 12;
  totalElements = 0;
  totalPages = 0;
  
  // Filtros
  searchControl = new FormControl('');
  selectedGenero: string = '';
  sortBy: string = 'popularidad';
  
  // Estado
  loading = false;
  error: string | null = null;
  
  // Opciones
  generos: string[] = ['Action', 'Adventure', 'Comedy', 'Drama', 'Horror', 'Romance', 'Science Fiction', 'Thriller'];
  sortOptions = [
    { label: 'Popularidad', value: 'popularidad' },
    { label: 'Valoración', value: 'votoPromedio' },
    { label: 'Fecha de Estreno', value: 'fechaEstreno' },
    { label: 'Título', value: 'titulo' }
  ];

  constructor(
    private peliculaService: PeliculaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPeliculas();
    this.setupSearchListener();
  }

  private setupSearchListener(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.currentPage = 0;
        if (searchTerm && searchTerm.trim()) {
          this.buscarPorTitulo(searchTerm);
        } else {
          this.cargarPeliculas();
        }
      });
  }

  cargarPeliculas(page: number = 0): void {
    this.loading = true;
    this.error = null;
    this.currentPage = page;

    if (this.selectedGenero) {
      this.peliculaService.buscarPorGeneroPaginado(this.selectedGenero, page, this.pageSize)
        .subscribe({
          next: (response) => this.handleResponse(response),
          error: (error) => this.handleError(error)
        });
    } else {
      this.peliculaService.obtenerPeliculasPaginadas(page, this.pageSize, this.sortBy)
        .subscribe({
          next: (response) => this.handleResponse(response),
          error: (error) => this.handleError(error)
        });
    }
  }

  buscarPorTitulo(titulo: string): void {
    this.loading = true;
    this.error = null;

    this.peliculaService.buscarPorTituloPaginado(titulo, this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => this.handleResponse(response),
        error: (error) => this.handleError(error)
      });
  }

  private handleResponse(response: any): void {
    if (response && response.success && response.data) {
      if (response.data.content) {
        // Respuesta paginada
        this.peliculas = response.data.content;
        this.currentPage = response.data.pageNumber;
        this.pageSize = response.data.pageSize;
        this.totalElements = response.data.totalElements;
        this.totalPages = response.data.totalPages;
      } else if (Array.isArray(response.data)) {
        // Respuesta directa (array)
        this.peliculas = response.data;
        this.totalElements = response.data.length;
        this.totalPages = Math.ceil(this.totalElements / this.pageSize);
      } else {
        console.warn('Formato de respuesta no reconocido:', response);
        this.peliculas = [];
      }
    } else {
      console.warn('Respuesta sin éxito o sin datos:', response);
      this.peliculas = [];
    }
    this.loading = false;
  }

  private handleError(error: any): void {
    const errorMessage = error.error?.message || error.message || 'Error al cargar películas';
    this.error = errorMessage;
    this.loading = false;
    console.error('Error al cargar películas:', error);
    console.error('Detalles del error:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error
    });
  }

  onGeneroChange(): void {
    this.currentPage = 0;
    this.cargarPeliculas();
  }

  onSortChange(): void {
    this.currentPage = 0;
    this.cargarPeliculas();
  }

  onPageChange(event: PageEvent): void {
    this.cargarPeliculas(event.pageIndex);
  }

  limpiarFiltros(): void {
    this.searchControl.setValue('');
    this.selectedGenero = '';
    this.sortBy = 'popularidad';
    this.currentPage = 0;
    this.cargarPeliculas();
  }

  verDetalle(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/peliculas', id]);
    }
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
}





