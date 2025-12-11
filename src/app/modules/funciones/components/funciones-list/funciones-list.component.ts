import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FuncionService, Funcion, ApiResponse } from '../../../../services/funcion.service';
import { PeliculaService, Pelicula } from '../../../../services/pelicula.service';
import { SalaService, Sala } from '../../../../services/sala.service';

@Component({
  selector: 'app-funciones-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './funciones-list.component.html',
  styleUrls: ['./funciones-list.component.scss']
})
export class FuncionesListComponent implements OnInit {
  funciones: Funcion[] = [];
  peliculas: Pelicula[] = [];
  salas: Sala[] = [];
  funcionForm: FormGroup;
  mostrarFormFuncion = false;
  funcionEditando: Funcion | null = null;
  loadingFunciones = false;
  displayedColumns: string[] = ['pelicula', 'sala', 'horaInicio', 'precio', 'estado', 'acciones'];

  constructor(
    private funcionService: FuncionService,
    private peliculaService: PeliculaService,
    private salaService: SalaService,
    private fb: FormBuilder
  ) {
    this.funcionForm = this.fb.group({
      peliculaId: ['', Validators.required],
      salaId: ['', Validators.required],
      horaInicio: ['', Validators.required],
      precio: ['', [Validators.required, Validators.min(0)]],
      activa: [true]
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loadingFunciones = true;

    this.funcionService.obtenerTodasLasFunciones().subscribe({
      next: (response: ApiResponse<Funcion[]>) => {
        if (response.success) {
          this.funciones = response.data.filter(f => new Date(f.fechaHora) > new Date());
        }
        this.loadingFunciones = false;
      },
      error: (error: any) => {
        console.error('Error:', error);
        alert('Error al cargar funciones: ' + (error.message || JSON.stringify(error)));
        this.loadingFunciones = false;
      }
    });

    this.peliculaService.obtenerTodasLasPeliculas().subscribe({
      next: (response: ApiResponse<Pelicula[]>) => {
        if (response.success) {
          this.peliculas = response.data;
        }
      },
      error: (error: any) => console.error('Error cargando películas:', error)
    });

    this.salaService.obtenerTodasLasSalas().subscribe({
      next: (response: ApiResponse<Sala[]>) => {
        if (response.success) {
          this.salas = response.data;
        }
      },
      error: (error: any) => console.error('Error cargando salas:', error)
    });
  }

  nuevaFuncion(): void {
    this.funcionEditando = null;
    this.funcionForm.reset({ activa: true });
    this.mostrarFormFuncion = true;
  }

  editarFuncion(funcion: Funcion): void {
    this.funcionEditando = funcion;
    this.funcionForm.patchValue({
      peliculaId: funcion.pelicula.id,
      salaId: funcion.sala.id,
      horaInicio: this.formatDateTimeLocal(new Date(funcion.fechaHora)),
      precio: funcion.precioEntrada,
      activa: funcion.activa
    });
    this.mostrarFormFuncion = true;
  }

  cancelarFormFuncion(): void {
    this.mostrarFormFuncion = false;
    this.funcionEditando = null;
    this.funcionForm.reset();
  }

  guardarFuncion(): void {
    if (this.funcionForm.valid) {
      const formValue = this.funcionForm.value;
      const dto = {
        peliculaId: Number(formValue.peliculaId),
        salaId: Number(formValue.salaId),
        fechaHora: new Date(formValue.horaInicio).toISOString(),
        precioEntrada: Number(formValue.precio),
        asientosTotales: 100,
        asientosDisponibles: 100
      };

      if (this.funcionEditando && this.funcionEditando.id) {
        this.funcionService.actualizarFuncion(this.funcionEditando.id, dto).subscribe({
          next: (response: ApiResponse<Funcion>) => {
            if (response.success) {
              this.cargarDatos();
              alert('Función actualizada exitosamente');
              this.mostrarFormFuncion = false;
            }
          },
          error: (error: any) => {
            console.error('Error:', error);
            alert('Error al actualizar la función: ' + (error.message || JSON.stringify(error)));
          }
        });
      } else {
        this.funcionService.crearFuncion(dto).subscribe({
          next: (response: ApiResponse<Funcion>) => {
            if (response.success) {
              this.cargarDatos();
              alert('Función creada exitosamente');
              this.mostrarFormFuncion = false;
            }
          },
          error: (error: any) => {
            console.error('Error:', error);
            alert('Error al crear la función: ' + (error.message || JSON.stringify(error)));
          }
        });
      }
    }
  }

  eliminarFuncion(funcion: Funcion): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta función?')) {
      if (funcion.id == null) {
        console.error('Función id no definido', funcion);
        alert('No se puede eliminar la función: id indefinido');
        return;
      }
      this.funcionService.eliminarFuncion(funcion.id).subscribe({
        next: (response: ApiResponse<any>) => {
          if (response.success) {
            this.cargarDatos();
            alert('Función eliminada exitosamente');
          }
        },
        error: (error: any) => {
          console.error('Error:', error);
          alert('Error al eliminar la función: ' + (error.message || JSON.stringify(error)));
        }
      });
    }
  }

  getNombrePelicula(peliculaId: number): string {
    return this.peliculas.find(p => p.id === peliculaId)?.titulo || 'N/A';
  }

  getNombreSala(salaId: number): string {
    return this.salas.find(s => s.id === salaId)?.nombre || 'N/A';
  }

  formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  formatDateTime(date: string): string {
    const d = new Date(date);
    return d.toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoClase(funcion: Funcion): string {
    if (!funcion.activa) return 'cancelada';
    const now = new Date();
    const horaInicio = new Date(funcion.fechaHora);
    if (horaInicio < now) return 'pasada';
    return 'proxima';
  }

  getEstadoLabel(funcion: Funcion): string {
    if (!funcion.activa) return 'Cancelada';
    const now = new Date();
    const horaInicio = new Date(funcion.fechaHora);
    if (horaInicio < now) return 'Pasada';
    return 'Próxima';
  }
}
