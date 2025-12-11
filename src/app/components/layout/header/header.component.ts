import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LoginResponse } from '../../../models/usuario.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentUser: LoginResponse | null = null;
  isMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  navigateToCompras(): void {
    if (this.isAuthenticated()) {
      // Navegar a la sección "Mis Compras" en el perfil
      this.router.navigate(['/perfil'], { 
        queryParams: { tab: 'compras' } 
      });
    } else {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/perfil', message: 'Debes iniciar sesión para ver tus compras' }
      });
    }
  }

  goToAdmin(): void {
    // Navegar al dashboard de admin integrado
    this.router.navigate(['/admin']);
  }
}




