import { Component, OnInit } from '@angular/core';
import { ProductoService } from '../../services/producto.service';

interface Producto {
  id?: number;
  nombre: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  categoria?: string;
  imagenUrl?: string;
  activo?: boolean;
  icono?: string;
  etiqueta?: string;
}

@Component({
  selector: 'app-chocolateria',
  templateUrl: './chocolateria.component.html',
  styleUrls: ['./chocolateria.component.scss']
})
export class ChocolateriaComponent implements OnInit {
  productos: Producto[] = [];

  constructor(private productoService: ProductoService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.productoService.obtenerTodosLosProductos().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Mapear productos del backend a formato de la UI
          this.productos = response.data.map(p => ({
            id: p.id,
            nombre: p.nombre,
            descripcion: p.descripcion,
            precio: p.precio,
            stock: p.stock,
            categoria: p.categoria,
            imagenUrl: p.imagenUrl,
            activo: p.activo,
            icono: 'shopping_bag', // Icono por defecto
            etiqueta: p.categoria || ''
          }));
        }
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        // Cargar productos por defecto si falla
        this.cargarProductosPorDefecto();
      }
    });
  }

  cargarProductosPorDefecto(): void {
    this.productos = [
      {
        nombre: 'Combo Dulce Clásico',
        descripcion: 'Cancha grande, gaseosa y chocolate clásico para compartir.',
        icono: 'local_cafe',
        etiqueta: 'Más vendido'
      },
      {
        nombre: 'Choco Fan',
        descripcion: 'Variedad de chocolates premium para acompañar tu función.',
        icono: 'favorite',
        etiqueta: 'Nuevo'
      },
      {
        nombre: 'Dulce Familiar',
        descripcion: 'Cancha, gaseosas y chocolates para toda la familia.',
        icono: 'group',
        etiqueta: 'Family'
      }
    ];
  }
}
