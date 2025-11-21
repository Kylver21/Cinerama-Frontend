import { Component } from '@angular/core';

@Component({
  selector: 'app-chocolateria',
  templateUrl: './chocolateria.component.html',
  styleUrls: ['./chocolateria.component.scss']
})
export class ChocolateriaComponent {
  productos = [
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
