import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginResponse } from '../../models/usuario.model';
import { ClienteService } from '../../services/cliente.service';
import { Boleto } from '../../models/boleto.model';
import { VentaProducto } from '../../models/venta.model';

type HistorialApiResponse = any;

interface HistorialProducto {
  productoId?: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface HistorialCompra {
  key: string;
  estado?: string;
  fechaCompra?: string;
  total?: number;
  metodoPago?: string;
  tipoComprobante?: string;

  peliculaTitulo?: string;
  posterUrl?: string;
  salaNombre?: string;
  fechaFuncion?: string;

  asientos: string[];
  productos: HistorialProducto[];
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  currentUser: LoginResponse | null = null;
  historialCompras: HistorialCompra[] = [];
  cargandoCompras = false;
  errorCompras = '';
  tabActivo = 0;

  constructor(
    private authService: AuthService,
    private clienteService: ClienteService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Primero obtener el usuario actual
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('Usuario actual:', user);
      console.log('ClienteId:', user?.clienteId);
      
      // Luego verificar si hay query param para ir a tab específico
      this.route.queryParams.subscribe(params => {
        if (params['tab'] === 'compras') {
          this.tabActivo = 1;
        }
        // Cargar compras si estamos en el tab correcto y hay clienteId
        if (this.tabActivo === 1 && this.currentUser?.clienteId) {
          this.cargarMisCompras();
        }
      });
    });
  }

  cargarMisCompras(): void {
    console.log('Intentando cargar compras...');
    console.log('CurrentUser:', this.currentUser);
    console.log('ClienteId:', this.currentUser?.clienteId);

    if (!this.currentUser?.clienteId) {
      // Si es admin sin clienteId, mostrar mensaje apropiado
      if (this.currentUser?.roles?.includes('ROLE_ADMIN')) {
        this.errorCompras = 'Los administradores no tienen historial de compras de cliente';
      } else {
        this.errorCompras = 'No se pudo obtener el ID del cliente. Intenta cerrar sesión y volver a ingresar.';
      }
      return;
    }

    this.cargandoCompras = true;
    this.errorCompras = '';

    this.clienteService.obtenerHistorial(this.currentUser.clienteId)
      .subscribe({
        next: (response) => {
          console.log('Respuesta historial:', response);
          this.historialCompras = this.normalizarHistorial(response);
          this.cargandoCompras = false;
        },
        error: (error) => {
          console.error('Error al cargar compras:', error);
          this.errorCompras = 'Error al cargar el historial de compras: ' + (error.error?.message || error.message || 'Error desconocido');
          this.cargandoCompras = false;
        }
      });
  }

  onTabChange(index: number): void {
    this.tabActivo = index;
    if (index === 1 && this.historialCompras.length === 0 && !this.cargandoCompras) {
      this.cargarMisCompras();
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'PAGADO':
      case 'CONFIRMADO':
        return 'estado-confirmado';
      case 'PENDIENTE':
        return 'estado-pendiente';
      case 'CANCELADO':
        return 'estado-cancelado';
      case 'USADO':
        return 'estado-usado';
      default:
        return '';
    }
  }

  formatFecha(fecha: string | undefined): string {
    if (!fecha) return 'No disponible';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCodigoAsiento(asiento: any): string {
    if (!asiento) return 'N/A';
    // El backend puede devolver codigoAsiento o fila+numero
    return asiento.codigoAsiento || `${asiento.fila}${asiento.numero}` || 'N/A';
  }

  getAsientosLabel(compra: HistorialCompra): string {
    if (!compra.asientos || compra.asientos.length === 0) return 'N/A';
    return compra.asientos.join(', ');
  }

  getTotal(compra: HistorialCompra): number {
    if (typeof compra.total === 'number') return compra.total;
    const totalProductos = (compra.productos || []).reduce((acc, p) => acc + (p.subtotal || 0), 0);
    return totalProductos;
  }

  getTieneProductos(compra: HistorialCompra): boolean {
    return Array.isArray(compra.productos) && compra.productos.length > 0;
  }

  private normalizarHistorial(response: HistorialApiResponse): HistorialCompra[] {
    const data = (response && response.success === true && response.data != null)
      ? response.data
      : response;

    const compras: HistorialCompra[] = [];

    if (Array.isArray(data)) {
      data.forEach((item: any, index: number) => {
        const normalized = this.normalizarItemHistorial(item, index);
        if (normalized) compras.push(normalized);
      });
      return this.deduplicarYOrdenar(compras);
    }

    if (data && typeof data === 'object') {
      // Caso: objeto contenedor con posibles claves
      const possibleArrays: any[] = [];
      if (Array.isArray((data as any).historial)) possibleArrays.push(...(data as any).historial);
      if (Array.isArray((data as any).compras)) possibleArrays.push(...(data as any).compras);
      if (possibleArrays.length > 0) {
        possibleArrays.forEach((item: any, index: number) => {
          const normalized = this.normalizarItemHistorial(item, index);
          if (normalized) compras.push(normalized);
        });
        return this.deduplicarYOrdenar(compras);
      }

      // Caso legacy: { boletos: Boleto[], ventasProductos: VentaProducto[] }
      const boletos: Boleto[] = Array.isArray((data as any).boletos) ? (data as any).boletos : [];
      const ventasProductos: VentaProducto[] = Array.isArray((data as any).ventasProductos)
        ? (data as any).ventasProductos
        : (Array.isArray((data as any).ventas) ? (data as any).ventas : []);

      compras.push(...this.normalizarDesdeBoletos(boletos));
      compras.push(...this.normalizarDesdeVentasProductos(ventasProductos));
      return this.deduplicarYOrdenar(compras);
    }

    return [];
  }

  private normalizarItemHistorial(item: any, index: number): HistorialCompra | null {
    if (!item || typeof item !== 'object') return null;

    // Caso "compra" unificada tipo ConfirmarCompraResponse (o similar)
    const hasBoletosResumen = Array.isArray(item.boletos);
    const hasProductosResumen = Array.isArray(item.productos);
    const numeroConfirmacion = item.numeroConfirmacion || item.numero || item.codigo || null;

    if (hasBoletosResumen || hasProductosResumen || item.pelicula || item.funcion) {
      const boletos = Array.isArray(item.boletos) ? item.boletos : [];
      const asientos = boletos
        .map((b: any) => b.codigoAsiento || b.codigo || b.asientoCodigo)
        .filter((x: any) => typeof x === 'string' && x.trim().length > 0);

      const productos: HistorialProducto[] = (Array.isArray(item.productos) ? item.productos : [])
        .map((p: any) => ({
          productoId: p.productoId || p.id,
          nombre: p.nombre || 'Producto',
          cantidad: Number(p.cantidad || 0),
          precioUnitario: Number(p.precioUnitario || p.precio || 0),
          subtotal: Number(p.subtotal || (Number(p.precioUnitario || p.precio || 0) * Number(p.cantidad || 0)) || 0)
        }))
        .filter((p: HistorialProducto) => p.cantidad > 0);

      const peliculaTitulo = item.pelicula?.titulo || item.peliculaTitulo || item.tituloPelicula;
      const posterUrl = item.pelicula?.posterUrl || item.posterUrl;
      const salaNombre = item.funcion?.salaNombre || item.salaNombre || item.funcion?.sala?.nombre;
      const fechaFuncion = item.funcion?.fechaHora || item.fechaFuncion || item.funcion?.fecha;

      const key = numeroConfirmacion
        ? `compra:${String(numeroConfirmacion)}`
        : `compra:${index}:${peliculaTitulo || ''}:${item.fechaCompra || item.fecha || ''}`;

      return {
        key,
        estado: item.estado || 'PAGADO',
        fechaCompra: item.fechaCompra || item.fecha || item.fechaVenta,
        total: (typeof item.total === 'number') ? item.total : (item.total ? Number(item.total) : undefined),
        metodoPago: item.metodoPago,
        tipoComprobante: item.tipoComprobante,
        peliculaTitulo,
        posterUrl,
        salaNombre,
        fechaFuncion,
        asientos: Array.from(new Set(asientos)),
        productos
      };
    }

    // Caso "venta-productos" suelta
    if (Array.isArray(item.detalles) && item.total != null && item.fechaVenta) {
      const detalles = Array.isArray(item.detalles) ? item.detalles : [];
      const productos: HistorialProducto[] = detalles.map((d: any) => ({
        productoId: d.producto?.id || d.productoId,
        nombre: d.producto?.nombre || d.nombre || 'Producto',
        cantidad: Number(d.cantidad || 0),
        precioUnitario: Number(d.precioUnitario || d.precio || 0),
        subtotal: Number(d.subtotal || (Number(d.precioUnitario || d.precio || 0) * Number(d.cantidad || 0)) || 0)
      })).filter((p: HistorialProducto) => p.cantidad > 0);

      return {
        key: item.id != null ? `venta:${String(item.id)}` : `venta:${index}:${item.fechaVenta}`,
        estado: item.estado,
        fechaCompra: item.fechaVenta,
        total: Number(item.total || 0),
        metodoPago: item.metodoPago,
        peliculaTitulo: 'Chocolatería',
        posterUrl: undefined,
        salaNombre: undefined,
        fechaFuncion: undefined,
        asientos: [],
        productos
      };
    }

    // Caso "boleto" suelto
    if (item.funcion && item.precio != null) {
      const boleto = item as Boleto;
      const funcionId = (boleto.funcion as any)?.id;
      const fechaCompra = boleto.fechaCompra;
      const key = `boletos:${funcionId || 'na'}:${fechaCompra || index}`;
      const peliculaTitulo = boleto.funcion?.pelicula?.titulo;
      const posterUrl = boleto.funcion?.pelicula?.posterUrl;
      const salaNombre = boleto.funcion?.sala?.nombre;
      const fechaFuncion = boleto.funcion?.fechaHora;
      const asiento = this.getCodigoAsiento(boleto.asiento);

      return {
        key,
        estado: (boleto.estado as any) || 'PAGADO',
        fechaCompra,
        total: Number(boleto.precio || 0),
        metodoPago: undefined,
        peliculaTitulo,
        posterUrl,
        salaNombre,
        fechaFuncion,
        asientos: asiento && asiento !== 'N/A' ? [asiento] : [],
        productos: []
      };
    }

    return null;
  }

  private normalizarDesdeBoletos(boletos: Boleto[]): HistorialCompra[] {
    if (!Array.isArray(boletos) || boletos.length === 0) return [];

    const grouped = new Map<string, HistorialCompra>();

    boletos.forEach((boleto) => {
      const funcionId = (boleto.funcion as any)?.id;
      const fechaCompra = boleto.fechaCompra || '';
      const key = `boletos:${funcionId || 'na'}:${fechaCompra.slice(0, 10)}`;

      const existing = grouped.get(key);
      const asiento = this.getCodigoAsiento(boleto.asiento);
      const asientoArr = (asiento && asiento !== 'N/A') ? [asiento] : [];

      if (!existing) {
        grouped.set(key, {
          key,
          estado: (boleto.estado as any) || 'PAGADO',
          fechaCompra: boleto.fechaCompra,
          total: Number(boleto.precio || 0),
          peliculaTitulo: boleto.funcion?.pelicula?.titulo,
          posterUrl: boleto.funcion?.pelicula?.posterUrl,
          salaNombre: boleto.funcion?.sala?.nombre,
          fechaFuncion: boleto.funcion?.fechaHora,
          asientos: asientoArr,
          productos: []
        });
        return;
      }

      existing.total = Number(existing.total || 0) + Number(boleto.precio || 0);
      existing.asientos = Array.from(new Set([...(existing.asientos || []), ...asientoArr]));
    });

    return Array.from(grouped.values());
  }

  private normalizarDesdeVentasProductos(ventas: VentaProducto[]): HistorialCompra[] {
    if (!Array.isArray(ventas) || ventas.length === 0) return [];

    return ventas.map((venta, index) => {
      const productos: HistorialProducto[] = (Array.isArray(venta.detalles) ? venta.detalles : [])
        .map((d: any) => ({
          productoId: d.producto?.id,
          nombre: d.producto?.nombre || 'Producto',
          cantidad: Number(d.cantidad || 0),
          precioUnitario: Number(d.precioUnitario || 0),
          subtotal: Number(d.subtotal || 0)
        }))
        .filter((p: HistorialProducto) => p.cantidad > 0);

      return {
        key: venta.id != null ? `venta:${String(venta.id)}` : `venta:${index}:${venta.fechaVenta}`,
        estado: venta.estado,
        fechaCompra: venta.fechaVenta,
        total: Number(venta.total || 0),
        metodoPago: (venta as any).metodoPago,
        peliculaTitulo: 'Chocolatería',
        posterUrl: undefined,
        salaNombre: undefined,
        fechaFuncion: undefined,
        asientos: [],
        productos
      };
    });
  }

  private deduplicarYOrdenar(items: HistorialCompra[]): HistorialCompra[] {
    const map = new Map<string, HistorialCompra>();

    items.forEach((item) => {
      const key = item.key || JSON.stringify(item);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          ...item,
          asientos: Array.from(new Set(item.asientos || [])),
          productos: Array.isArray(item.productos) ? item.productos : []
        });
        return;
      }

      // merge asientos
      existing.asientos = Array.from(new Set([...(existing.asientos || []), ...(item.asientos || [])]));

      // merge productos (por productoId o nombre)
      const prodMap = new Map<string, HistorialProducto>();
      [...(existing.productos || []), ...(item.productos || [])].forEach((p) => {
        const k = (p.productoId != null) ? `id:${p.productoId}` : `n:${p.nombre}`;
        const prev = prodMap.get(k);
        if (!prev) {
          prodMap.set(k, { ...p });
        } else {
          prev.cantidad = Number(prev.cantidad || 0) + Number(p.cantidad || 0);
          prev.subtotal = Number(prev.subtotal || 0) + Number(p.subtotal || 0);
          if (!prev.precioUnitario && p.precioUnitario) prev.precioUnitario = p.precioUnitario;
        }
      });
      existing.productos = Array.from(prodMap.values());

      // merge total (preferir el más grande si ambos existen)
      const a = typeof existing.total === 'number' ? existing.total : undefined;
      const b = typeof item.total === 'number' ? item.total : undefined;
      if (a == null && b != null) existing.total = b;
      if (a != null && b != null) existing.total = Math.max(a, b);

      // rellenar campos faltantes
      existing.estado = existing.estado || item.estado;
      existing.fechaCompra = existing.fechaCompra || item.fechaCompra;
      existing.peliculaTitulo = existing.peliculaTitulo || item.peliculaTitulo;
      existing.posterUrl = existing.posterUrl || item.posterUrl;
      existing.salaNombre = existing.salaNombre || item.salaNombre;
      existing.fechaFuncion = existing.fechaFuncion || item.fechaFuncion;
      existing.metodoPago = existing.metodoPago || item.metodoPago;
      existing.tipoComprobante = existing.tipoComprobante || item.tipoComprobante;
    });

    return Array.from(map.values()).sort((x, y) => {
      const dx = x.fechaCompra ? new Date(x.fechaCompra).getTime() : 0;
      const dy = y.fechaCompra ? new Date(y.fechaCompra).getTime() : 0;
      return dy - dx;
    });
  }

  goToAdmin(): void {
    const token = localStorage.getItem('token');
    if (token) {
      window.location.href = `http://localhost:4300/dashboard?token=${encodeURIComponent(token)}`;
    } else {
      window.location.href = 'http://localhost:4300';
    }
  }
}




