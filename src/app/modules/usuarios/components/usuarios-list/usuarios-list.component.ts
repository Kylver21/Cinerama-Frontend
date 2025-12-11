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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-usuarios-list',
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
    MatTooltipModule,
    MatSlideToggleModule
  ],
  templateUrl: './usuarios-list.component.html',
  styleUrls: ['./usuarios-list.component.scss']
})
export class UsuariosListComponent implements OnInit {
  usuarios = [
    { id: 1, nombre: 'Admin Master', email: 'admin@cinerama.com', rol: 'Administrador', estado: true, fechaCreacion: new Date('2024-01-15') },
    { id: 2, nombre: 'Supervisor Caja', email: 'supervisor@cinerama.com', rol: 'Supervisor', estado: true, fechaCreacion: new Date('2024-02-20') },
    { id: 3, nombre: 'Cajero 1', email: 'cajero1@cinerama.com', rol: 'Cajero', estado: true, fechaCreacion: new Date('2024-03-10') },
    { id: 4, nombre: 'Cajero 2', email: 'cajero2@cinerama.com', rol: 'Cajero', estado: false, fechaCreacion: new Date('2024-03-15') }
  ];

  usuarioForm: FormGroup;
  mostrarFormUsuario = false;
  usuarioEditando: any = null;
  loadingUsuarios = false;
  displayedColumns: string[] = ['nombre', 'email', 'rol', 'estado', 'acciones'];

  constructor(private fb: FormBuilder) {
    this.usuarioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      rol: ['', Validators.required],
      estado: [true]
    });
  }

  ngOnInit(): void {
    // Los usuarios se cargarían desde un servicio
  }

  nuevoUsuario(): void {
    this.usuarioEditando = null;
    this.usuarioForm.reset({ estado: true });
    this.mostrarFormUsuario = true;
  }

  editarUsuario(usuario: any): void {
    this.usuarioEditando = usuario;
    this.usuarioForm.patchValue({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado
    });
    this.mostrarFormUsuario = true;
  }

  cancelarFormUsuario(): void {
    this.mostrarFormUsuario = false;
    this.usuarioEditando = null;
    this.usuarioForm.reset();
  }

  guardarUsuario(): void {
    if (this.usuarioForm.valid) {
      alert('Usuario guardado (Funcionalidad completa en próxima fase)');
      this.mostrarFormUsuario = false;
    }
  }

  eliminarUsuario(usuario: any): void {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      alert('Usuario eliminado (Funcionalidad completa en próxima fase)');
    }
  }

  getRolColor(rol: string): string {
    const colores: { [key: string]: string } = {
      'Administrador': '#667eea',
      'Supervisor': '#764ba2',
      'Cajero': '#43e97b'
    };
    return colores[rol] || '#999';
  }
}
