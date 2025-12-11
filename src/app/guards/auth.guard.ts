import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    if (!this.authService.isAuthenticated()) {
      // Redirigir al login con returnUrl para que después del login vuelva a la página solicitada
      const returnUrl = state.url;
      this.router.navigate(['/auth/login'], {
        queryParams: { 
          returnUrl: returnUrl,
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




