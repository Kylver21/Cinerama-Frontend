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

import { ProductoService, Producto, ApiResponse } from '../../../../services/producto.service';

@Component({
  selector: 'app-productos-list',
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
  templateUrl: './productos-list.component.html',
  styleUrls: ['./productos-list.component.scss']
})
export class ProductosListComponent implements OnInit {
  productos: Producto[] = [];
  productoForm: FormGroup;
  mostrarFormProducto = false;
  productoEditando: Producto | null = null;
  loadingProductos = false;
  displayedColumns: string[] = ['nombre', 'categoria', 'precio', 'stock', 'acciones'];

  constructor(
    private productoService: ProductoService,
    private fb: FormBuilder
  ) {
    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      categoria: ['', Validators.required],
      precio: ['', [Validators.required, Validators.min(0)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      descripcion: [''],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.loadingProductos = true;
    this.productoService.obtenerTodosLosProductos().subscribe({
      next: (response: ApiResponse<Producto[]>) => {
        if (response.success) {
          this.productos = response.data;
        }
        this.loadingProductos = false;
      },
      error: (error: any) => {
        console.error('Error:', error);
        alert('Error al cargar productos: ' + (error.message || JSON.stringify(error)));
        this.loadingProductos = false;
      }
    });
  }

  nuevoProducto(): void {
    this.productoEditando = null;
    this.productoForm.reset({ activo: true });
    this.mostrarFormProducto = true;
  }

  editarProducto(producto: Producto): void {
    this.productoEditando = producto;
    this.productoForm.patchValue({
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio: producto.precio,
      stock: producto.stock,
      descripcion: producto.descripcion,
      activo: producto.activo
    });
    this.mostrarFormProducto = true;
  }

  cancelarFormProducto(): void {
    this.mostrarFormProducto = false;
    this.productoEditando = null;
    this.productoForm.reset();
  }

  guardarProducto(): void {
    if (this.productoForm.valid) {
      const dto = this.productoForm.value;
      if (this.productoEditando && this.productoEditando.id) {
        this.productoService.actualizarProducto(this.productoEditando.id, dto).subscribe({
          next: (response: ApiResponse<Producto>) => {
            if (response.success) {
              this.cargarProductos();
              alert('Producto actualizado exitosamente');
              this.mostrarFormProducto = false;
            }
          },
          error: (error: any) => {
            console.error('Error:', error);
            alert('Error al actualizar el producto: ' + (error.message || JSON.stringify(error)));
          }
        });
      } else {
        this.productoService.crearProducto(dto).subscribe({
          next: (response: ApiResponse<Producto>) => {
            if (response.success) {
              this.cargarProductos();
              alert('Producto creado exitosamente');
              this.mostrarFormProducto = false;
            }
          },
          error: (error: any) => {
            console.error('Error:', error);
            alert('Error al crear el producto: ' + (error.message || JSON.stringify(error)));
          }
        });
      }
    }
  }

  eliminarProducto(producto: Producto): void {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      if (producto.id == null) {
        console.error('Error: producto.id está indefinido', producto);
        alert('No se puede eliminar: producto sin identificador.');
        return;
      }
      this.productoService.eliminarProducto(producto.id).subscribe({
        next: (response: ApiResponse<any>) => {
          if (response.success) {
            this.cargarProductos();
            alert('Producto eliminado exitosamente');
          }
        },
        error: (error: any) => {
          console.error('Error:', error);
          alert('Error al eliminar el producto: ' + (error.message || JSON.stringify(error)));
        }
      });
    }
  }

  getCategoriaColor(categoria: string): string {
    const colores: { [key: string]: string } = {
      'Bebidas': '#667eea',
      'Snacks': '#764ba2',
      'Chocolate': '#f093fb',
      'Dulces': '#f5576c',
      'Palomitas': '#43e97b'
    };
    return colores[categoria] || '#999';
  }
}
