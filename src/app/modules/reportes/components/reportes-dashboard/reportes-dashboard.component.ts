import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-reportes-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule
  ],
  templateUrl: './reportes-dashboard.component.html',
  styleUrls: ['./reportes-dashboard.component.scss']
})
export class ReportesDashboardComponent implements OnInit {
  peliculasPopulares = [
    { titulo: 'Avatar: The Way of Water', funciones: 45, entradas: 1200, ingresos: 30000 },
    { titulo: 'Oppenheimer', funciones: 38, entradas: 980, ingresos: 24500 },
    { titulo: 'Barbie', funciones: 42, entradas: 1100, ingresos: 27500 },
    { titulo: 'Killers of the Flower Moon', funciones: 35, entradas: 850, ingresos: 21250 }
  ];

  ocupacionSalas = [
    { sala: 'Sala A (2D)', capacidad: 100, promedio: 85 },
    { sala: 'Sala B (3D)', capacidad: 80, promedio: 72 },
    { sala: 'Sala C (VIP)', capacidad: 50, promedio: 95 },
    { sala: 'Sala D (IMAX)', capacidad: 120, promedio: 88 }
  ];

  displayedColumnsPeliculas: string[] = ['titulo', 'funciones', 'entradas', 'ingresos'];
  displayedColumnsSalas: string[] = ['sala', 'capacidad', 'promedio'];

  constructor() { }

  ngOnInit(): void {
  }
}
