import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-ventas-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatButtonModule,
    MatTableModule
  ],
  templateUrl: './ventas-dashboard.component.html',
  styleUrls: ['./ventas-dashboard.component.scss']
})
export class VentasDashboardComponent implements OnInit {
  ventasHoy = 0;
  ventasMes = 0;
  totalProductos = 0;
  ingresoHoy = 0;

  ventasRecientes = [
    { id: 1, producto: 'Coca Cola', cantidad: 5, precio: 5.00, total: 25.00, fecha: new Date(), cliente: 'Cliente 1' },
    { id: 2, producto: 'Palomitas', cantidad: 3, precio: 8.00, total: 24.00, fecha: new Date(), cliente: 'Cliente 2' },
    { id: 3, producto: 'Chocolate', cantidad: 2, precio: 12.00, total: 24.00, fecha: new Date(), cliente: 'Cliente 3' }
  ];

  displayedColumns: string[] = ['producto', 'cantidad', 'precio', 'total', 'fecha'];

  constructor() { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    // Los datos se cargarían desde un servicio
    this.ventasHoy = 15;
    this.ventasMes = 450;
    this.totalProductos = 85;
    this.ingresoHoy = 340.50;
  }
}
