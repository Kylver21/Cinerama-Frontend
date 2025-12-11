import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  hidePassword = true;
  loginError = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['admin', [Validators.required]],
      password: ['Admin123!', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  login(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.loginError = '';

      const { username, password, rememberMe } = this.loginForm.value;

      // Llamada real al backend
      this.authService.login({ username, password }).subscribe({
        next: (response) => {
          console.log('Login exitoso:', response);
          
          // Verificar que el usuario sea admin
          if (response.roles.includes('ROLE_ADMIN')) {
            if (isPlatformBrowser(this.platformId)) {
              // Guardar token de admin adicional
              localStorage.setItem('adminToken', response.token);
              
              if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
              }
            }
            
            this.loading = false;
            this.router.navigate(['/admin']);
          } else {
            this.loginError = 'No tienes permisos de administrador';
            this.authService.logout();
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error en login:', error);
          this.loginError = error.error?.message || 'Usuario o contraseña incorrectos';
          this.loading = false;
        }
      });
    }
  }

  // Demo credentials helper
  useDemoCredentials(): void {
    this.loginForm.patchValue({
      username: 'admin',
      password: 'Admin123!'
    });
  }
}
