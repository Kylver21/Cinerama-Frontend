import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginResponse } from '../../models/usuario.model';
import { BoletoService } from '../../services/boleto.service';
import { Boleto } from '../../models/boleto.model';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  currentUser: LoginResponse | null = null;
  misCompras: Boleto[] = [];
  cargandoCompras = false;
  errorCompras = '';
  tabActivo = 0;

  constructor(
    private authService: AuthService,
    private boletoService: BoletoService,
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

    this.boletoService.obtenerBoletosPorCliente(this.currentUser.clienteId)
      .subscribe({
        next: (response) => {
          console.log('Respuesta boletos:', response);
          if (response.success && response.data) {
            this.misCompras = response.data;
          } else if (Array.isArray(response)) {
            // Si el backend devuelve array directo
            this.misCompras = response as any;
          } else {
            this.misCompras = [];
          }
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
    if (index === 1 && this.misCompras.length === 0 && !this.cargandoCompras) {
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

  goToAdmin(): void {
    const token = localStorage.getItem('token');
    if (token) {
      window.location.href = `http://localhost:4300/dashboard?token=${encodeURIComponent(token)}`;
    } else {
      window.location.href = 'http://localhost:4300';
    }
  }
}




