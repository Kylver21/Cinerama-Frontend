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

import { SalaService, Sala, ApiResponse } from '../../../../services/sala.service';

@Component({
  selector: 'app-salas-list',
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
  templateUrl: './salas-list.component.html',
  styleUrls: ['./salas-list.component.scss']
})
export class SalasListComponent implements OnInit {
  salas: Sala[] = [];
  salaForm: FormGroup;
  mostrarFormSala = false;
  salaEditando: Sala | null = null;
  loadingSalas = false;
  displayedColumns: string[] = ['nombre', 'tipo', 'capacidad', 'acciones'];

  constructor(
    private salaService: SalaService,
    private fb: FormBuilder
  ) {
    this.salaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      tipo: ['', Validators.required],
      capacidad: ['', [Validators.required, Validators.min(1)]],
      activa: [true]
    });
  }

  ngOnInit(): void {
    this.cargarSalas();
  }

  cargarSalas(): void {
    this.loadingSalas = true;
    this.salaService.obtenerTodasLasSalas().subscribe({
      next: (response: ApiResponse<Sala[]>) => {
        if (response.success) {
          this.salas = response.data;
        }
        this.loadingSalas = false;
      },
      error: (error: any) => {
        console.error('Error:', error);
        alert('Error al cargar salas: ' + (error.message || JSON.stringify(error)));
        this.loadingSalas = false;
      }
    });
  }

  nuevaSala(): void {
    this.salaEditando = null;
    this.salaForm.reset({ activa: true });
    this.mostrarFormSala = true;
  }

  editarSala(sala: Sala): void {
    this.salaEditando = sala;
    this.salaForm.patchValue({
      nombre: sala.nombre,
      tipo: sala.tipo,
      capacidad: sala.capacidad,
      activa: sala.activa
    });
    this.mostrarFormSala = true;
  }

  cancelarFormSala(): void {
    this.mostrarFormSala = false;
    this.salaEditando = null;
    this.salaForm.reset();
  }

  guardarSala(): void {
    if (this.salaForm.valid) {
      const dto = this.salaForm.value;
      if (this.salaEditando && this.salaEditando.id) {
        this.salaService.actualizarSala(this.salaEditando.id, dto).subscribe({
          next: (response: ApiResponse<Sala>) => {
            if (response.success) {
              this.cargarSalas();
              alert('Sala actualizada exitosamente');
              this.mostrarFormSala = false;
            }
          },
          error: (error: any) => {
            console.error('Error:', error);
            alert('Error al actualizar la sala: ' + (error.message || JSON.stringify(error)));
          }
        });
      } else {
        this.salaService.crearSala(dto).subscribe({
          next: (response: ApiResponse<Sala>) => {
            if (response.success) {
              this.cargarSalas();
              alert('Sala creada exitosamente');
              this.mostrarFormSala = false;
            }
          },
          error: (error: any) => {
            console.error('Error:', error);
            alert('Error al crear la sala: ' + (error.message || JSON.stringify(error)));
          }
        });
      }
    }
  }

  eliminarSala(sala: Sala): void {
    const id = sala.id;
    if (id == null) {
      console.error('Error: id de sala inválido', sala);
      alert('No se puede eliminar la sala: id inválido.');
      return;
    }

    if (confirm('¿Estás seguro de que deseas eliminar esta sala?')) {
      this.salaService.eliminarSala(id).subscribe({
        next: (response: ApiResponse<any>) => {
          if (response.success) {
            this.cargarSalas();
            alert('Sala eliminada exitosamente');
          }
        },
        error: (error: any) => {
          console.error('Error:', error);
          alert('Error al eliminar la sala: ' + (error.message || JSON.stringify(error)));
        }
      });
    }
  }

  getTipoSalaLabel(tipo: string): string {
    const tipos: { [key: string]: string } = {
      '2D': 'Sala 2D',
      '3D': 'Sala 3D',
      'VIP': 'Sala VIP',
      'IMAX': 'IMAX'
    };
    return tipos[tipo] || tipo;
  }
}
