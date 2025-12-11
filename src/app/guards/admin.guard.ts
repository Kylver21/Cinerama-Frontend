import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(): boolean {
    // Verificar si estamos en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    // Verificar token de admin
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      return true;
    }

    // Si no hay token de admin, verificar autenticación normal y rol
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/admin-login']);
      return false;
    }

    if (!this.authService.isAdmin()) {
      this.router.navigate(['/acceso-denegado']);
      return false;
    }

    return true;
  }
}




