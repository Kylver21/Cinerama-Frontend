import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { LoginRequest } from '../../../models/usuario.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Si ya está autenticado, redirigir al home
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      const credentials: LoginRequest = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password
      };

      console.log('Enviando login:', credentials);
      
      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('Respuesta del backend:', response);
          // El backend devuelve LoginResponseDTO directamente en caso de éxito
          if (response && response.token) {
            this.snackBar.open('¡Inicio de sesión exitoso!', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            
            // Obtener returnUrl de query params si existe
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
            const funcionId = this.route.snapshot.queryParams['funcionId'];
            const peliculaId = this.route.snapshot.queryParams['peliculaId'];
            
            // Redirigir según el rol o returnUrl
            if (this.authService.isAdmin()) {
              // Administrador: ir al panel integrado
              this.router.navigate(['/admin']);
            } else if (returnUrl && returnUrl !== '/home') {
              // Si hay returnUrl, redirigir allí (ej: después de intentar comprar)
              const queryParams: any = {};
              if (funcionId) queryParams.funcionId = funcionId;
              if (peliculaId) queryParams.peliculaId = peliculaId;
              this.router.navigate([returnUrl], { queryParams });
            } else {
              this.router.navigate(['/home']);
            }
          } else {
            // Si la respuesta no tiene token, puede ser un MensajeDTO de error
            const errorMsg = (response as any)?.mensaje || 'Error al iniciar sesión';
            this.snackBar.open(errorMsg, 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error en login:', error);
          // El backend devuelve MensajeDTO en caso de error (401, 500, etc.)
          let errorMessage = 'Error al iniciar sesión';
          
          if (error.status === 0) {
            errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté corriendo.';
          } else if (error.error) {
            // El backend puede devolver MensajeDTO con campo "mensaje"
            errorMessage = error.error.mensaje || error.error.message || errorMessage;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.snackBar.open(errorMessage, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.loading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldDisplayName(fieldName)} es requerido`;
    }
    if (control?.hasError('minlength')) {
      const requiredLength = control.errors?.['minlength'].requiredLength;
      return `${this.getFieldDisplayName(fieldName)} debe tener al menos ${requiredLength} caracteres`;
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      username: 'Usuario',
      password: 'Contraseña'
    };
    return fieldNames[fieldName] || fieldName;
  }

  irARegistro(): void {
    this.router.navigate(['/auth/registro']);
  }

  irARecuperarPassword(): void {
    this.router.navigate(['/auth/recuperar-password']);
  }
}




