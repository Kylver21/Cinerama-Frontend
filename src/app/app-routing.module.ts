import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./components/home/home.module').then(m => m.HomeModule)
  },
  {
    path: 'peliculas',
    loadChildren: () => import('./components/peliculas/peliculas.module').then(m => m.PeliculasModule)
  },
  {
    path: 'funciones',
    loadChildren: () => import('./components/funciones/funciones.module').then(m => m.FuncionesModule)
  },
  {
    path: 'compra',
    loadChildren: () => import('./components/compra/compra.module').then(m => m.CompraModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'perfil',
    loadChildren: () => import('./components/perfil/perfil.module').then(m => m.PerfilModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./components/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AdminGuard]
  },
  {
    path: 'auth',
    loadChildren: () => import('./components/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'nosotros',
    loadChildren: () => import('./components/nosotros/nosotros.module').then(m => m.NosotrosModule)
  },
  {
    path: 'contacto',
    loadChildren: () => import('./components/contacto/contacto.module').then(m => m.ContactoModule)
  },
  {
    path: 'acceso-denegado',
    loadComponent: () => import('./components/acceso-denegado/acceso-denegado.component').then(c => c.AccesoDenegadoComponent)
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'top',
    enableTracing: false
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
