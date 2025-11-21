import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { ImageModule } from 'primeng/image';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { PaginatorModule } from 'primeng/paginator';
import { DataViewModule } from 'primeng/dataview';
import { DialogModule } from 'primeng/dialog';
import { TabViewModule } from 'primeng/tabview';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';

// Componentes
import { PeliculasListComponent } from './peliculas-list/peliculas-list.component';
import { PeliculaDetalleComponent } from './pelicula-detalle/pelicula-detalle.component';

const routes = [
  {
    path: '',
    component: PeliculasListComponent
  },
  {
    path: ':id',
    component: PeliculaDetalleComponent
  }
];

@NgModule({
  declarations: [
    PeliculasListComponent,
    PeliculaDetalleComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    FormsModule,
    
    // Angular Material
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTabsModule,
    MatDialogModule,
    
    // PrimeNG
    CardModule,
    ButtonModule,
    TagModule,
    RatingModule,
    ImageModule,
    InputTextModule,
    DropdownModule,
    PaginatorModule,
    DataViewModule,
    DialogModule,
    TabViewModule,
    DividerModule,
    ChipModule
  ]
})
export class PeliculasModule { }





