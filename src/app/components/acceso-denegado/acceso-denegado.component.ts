import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './acceso-denegado.component.html',
  styleUrls: ['./acceso-denegado.component.scss']
})
export class AccesoDenegadoComponent {
  constructor(private router: Router) {}

  volverAtras(): void {
    this.router.navigate(['/home']);
  }
}