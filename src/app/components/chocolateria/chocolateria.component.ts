import { Component, OnInit } from '@angular/core';
import { ProductoService } from '../../services/producto.service';
import { Router } from '@angular/router';

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

  private readonly fallbackImg = 'https://via.placeholder.com/600x400/1a1a1a/ffffff?text=Producto';
  private static readonly LS_PRESELECT_PRODUCT_ID = 'cinerama_preselect_product_id';
  private static readonly LS_LAST_COMPRA_CONTEXT = 'cinerama_last_compra_context';

  constructor(
    private productoService: ProductoService,
    private router: Router
  ) {}

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
            imagenUrl: p.imagenUrl || (p as any).imagen_url,
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
        imagenUrl: this.fallbackImg,
        icono: 'local_cafe',
        etiqueta: 'Más vendido'
      },
      {
        nombre: 'Choco Fan',
        descripcion: 'Variedad de chocolates premium para acompañar tu función.',
        imagenUrl: this.fallbackImg,
        icono: 'favorite',
        etiqueta: 'Nuevo'
      },
      {
        nombre: 'Dulce Familiar',
        descripcion: 'Cancha, gaseosas y chocolates para toda la familia.',
        imagenUrl: this.fallbackImg,
        icono: 'group',
        etiqueta: 'Family'
      }
    ];
  }

  obtenerImagenProducto(producto: Producto | null | undefined): string {
    const url = producto?.imagenUrl || (producto as any)?.imagen_url;
    return (url && url.trim().length > 0) ? url : this.fallbackImg;
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;
    img.src = this.fallbackImg;
  }

  elegirCombo(producto: Producto): void {
    if (!producto?.id) return;

    localStorage.setItem(ChocolateriaComponent.LS_PRESELECT_PRODUCT_ID, String(producto.id));

    // Si el usuario viene de seleccionar una función recientemente, llevarlo directo a compra.
    const rawCtx = localStorage.getItem(ChocolateriaComponent.LS_LAST_COMPRA_CONTEXT);
    try {
      const ctx = rawCtx ? JSON.parse(rawCtx) : null;
      const funcionId = Number(ctx?.funcionId);
      const peliculaId = Number(ctx?.peliculaId);
      if (Number.isFinite(funcionId) && funcionId > 0 && Number.isFinite(peliculaId) && peliculaId > 0) {
        this.router.navigate(['/compra'], {
          queryParams: {
            funcionId,
            peliculaId,
            productoId: producto.id
          }
        });
        return;
      }
    } catch {
      // ignorar
    }

    // Si no hay contexto de función, llevar a Funciones y arrastrar el producto.
    this.router.navigate(['/funciones'], { queryParams: { productoId: producto.id } });
  }
}
