import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

// Componentes
import { NosotrosComponent } from './nosotros.component';

const routes = [
  {
    path: '',
    component: NosotrosComponent
  }
];

@NgModule({
  declarations: [
    NosotrosComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    
    // Angular Material
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    
    // PrimeNG
    CardModule,
    ButtonModule
  ]
})
export class NosotrosModule { }




