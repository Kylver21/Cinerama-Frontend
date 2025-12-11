import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PeliculaService, Pelicula, ApiResponse } from '../../../../services/pelicula.service';

@Component({
  selector: 'app-peliculas-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './peliculas-list.component.html',
  styleUrls: ['./peliculas-list.component.scss']
})
export class PeliculasListComponent implements OnInit {
  peliculas: Pelicula[] = [];
  peliculaForm: FormGroup;
  mostrarFormPelicula = false;
  peliculaEditando: Pelicula | null = null;
  loadingPeliculas = false;

  constructor(
    private peliculaService: PeliculaService,
    private fb: FormBuilder
  ) {
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
  }

  ngOnInit(): void {
    this.cargarPeliculas();
  }

  cargarPeliculas(): void {
    this.loadingPeliculas = true;
    this.peliculaService.obtenerTodasLasPeliculas().subscribe({
      next: (response: ApiResponse<Pelicula[]>) => {
        if (response.success) {
          this.peliculas = response.data;
        }
        this.loadingPeliculas = false;
      },
      error: (error: any) => {
        console.error('Error:', error);
        alert('Error al cargar películas: ' + (error.message || JSON.stringify(error)));
        this.loadingPeliculas = false;
      }
    });
  }

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
      backdropUrl: pelicula.backdropUrl,
      sinopsis: pelicula.sinopsis,
      activa: pelicula.activa
    });
    this.mostrarFormPelicula = true;
  }

  cancelarFormPelicula(): void {
    this.mostrarFormPelicula = false;
    this.peliculaEditando = null;
    this.peliculaForm.reset();
  }

  guardarPelicula(): void {
    if (this.peliculaForm.valid) {
      const dto = this.peliculaForm.value;
      if (this.peliculaEditando && this.peliculaEditando.id) {
        this.peliculaService.actualizarPelicula(this.peliculaEditando.id, dto).subscribe({
          next: (response: ApiResponse<Pelicula>) => {
            if (response.success) {
              this.cargarPeliculas();
              alert('Película actualizada exitosamente');
              this.mostrarFormPelicula = false;
            }
          },
          error: (error: any) => {
            console.error('Error:', error);
            alert('Error al actualizar la película: ' + (error.message || JSON.stringify(error)));
          }
        });
      } else {
        this.peliculaService.crearPelicula(dto).subscribe({
          next: (response: ApiResponse<Pelicula>) => {
            if (response.success) {
              this.cargarPeliculas();
              alert('Película creada exitosamente');
              this.mostrarFormPelicula = false;
            }
          },
          error: (error: any) => {
            console.error('Error:', error);
            alert('Error al crear la película: ' + (error.message || JSON.stringify(error)));
          }
        });
      }
    }
  }

  eliminarPelicula(pelicula: Pelicula): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta película?')) {
      if (pelicula.id !== undefined) {
        this.peliculaService.eliminarPelicula(pelicula.id).subscribe({
          next: (response: ApiResponse<any>) => {
            if (response.success) {
              this.cargarPeliculas();
              alert('Película eliminada exitosamente');
            }
          },
          error: (error: any) => {
            console.error('Error:', error);
            alert('Error al eliminar la película: ' + (error.message || JSON.stringify(error)));
          }
        });
      }
    }
  }

  onImageError(event: any): void {
    const imageElement = event.target as HTMLImageElement;
    imageElement.src = 'https://via.placeholder.com/150x225?text=Sin+Imagen';
  }
}
