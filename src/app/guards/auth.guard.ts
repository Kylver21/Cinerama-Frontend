import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.authService.isAuthenticated()) {
      // Redirigir al login con returnUrl para que después del login vuelva a la página solicitada
      const returnUrl = route.url.map(u => u.path).join('/');
      this.router.navigate(['/auth/login'], {
        queryParams: { 
          returnUrl: returnUrl ? `/${returnUrl}` : '/compra',
          message: 'Debes iniciar sesión para acceder a esta página'
        }
      });
      return false;
    }

    // Verificar roles si están especificados
    const requiredRoles = route.data['roles'] as string[];
    if (requiredRoles) {
      const hasRole = requiredRoles.some(role => this.authService.hasRole(role));
      if (!hasRole) {
        this.router.navigate(['/acceso-denegado']);
        return false;
      }
    }

    return true;
  }
}




