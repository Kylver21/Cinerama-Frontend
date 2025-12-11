import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { RegistroRequest } from '../../../models/usuario.model';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss']
})
export class RegistroComponent implements OnInit {
  registroForm: FormGroup;
  loading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registroForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.required]],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]], // Exactamente 9 dígitos
      numeroDocumento: ['', [Validators.required]], // Cambiado de "documento"
      tipoDocumento: ['DNI', [Validators.required]], // Nuevo campo requerido
      aceptarTerminos: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Si ya está autenticado, redirigir al home
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registroForm.valid) {
      this.loading = true;
      // Preparar datos según lo que espera el backend RegistroDTO
      const registroData: RegistroRequest = {
        username: this.registroForm.value.username,
        email: this.registroForm.value.email,
        password: this.registroForm.value.password,
        nombre: this.registroForm.value.nombre,
        apellido: this.registroForm.value.apellido,
        telefono: this.registroForm.value.telefono,
        numeroDocumento: this.registroForm.value.numeroDocumento,
        tipoDocumento: this.registroForm.value.tipoDocumento
      };

      console.log('Enviando datos de registro:', registroData);
      
      this.authService.registro(registroData).subscribe({
        next: (response) => {
          console.log('Respuesta del backend:', response);
          // El backend devuelve MensajeDTO directamente, no ApiResponse
          if (response && (response as any).exitoso) {
            this.snackBar.open('¡Registro exitoso! Ya puedes iniciar sesión.', 'Cerrar', {
              duration: 5000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/auth/login']);
          } else {
            const mensaje = (response as any)?.mensaje || 'Error al registrarse';
            this.snackBar.open(mensaje, 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error en registro:', error);
          // El backend devuelve MensajeDTO en caso de error
          let errorMessage = 'Error al registrarse';
          
          if (error.status === 0) {
            errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté corriendo.';
          } else if (error.error) {
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
    Object.keys(this.registroForm.controls).forEach(key => {
      const control = this.registroForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.registroForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldDisplayName(fieldName)} es requerido`;
    }
    if (control?.hasError('minlength')) {
      const requiredLength = control.errors?.['minlength'].requiredLength;
      return `${this.getFieldDisplayName(fieldName)} debe tener al menos ${requiredLength} caracteres`;
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `${this.getFieldDisplayName(fieldName)} no puede tener más de ${maxLength} caracteres`;
    }
    if (control?.hasError('email')) {
      return 'Formato de email inválido';
    }
    if (control?.hasError('pattern')) {
      return `${this.getFieldDisplayName(fieldName)} tiene un formato inválido`;
    }
    if (control?.hasError('requiredTrue')) {
      return 'Debes aceptar los términos y condiciones';
    }
    return '';
  }

  getPasswordMismatchError(): string {
    if (this.registroForm.hasError('passwordMismatch') && 
        this.registroForm.get('confirmPassword')?.touched) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      username: 'Usuario',
      email: 'Email',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      nombre: 'Nombre',
      apellido: 'Apellido',
      telefono: 'Teléfono',
      numeroDocumento: 'Número de Documento',
      tipoDocumento: 'Tipo de Documento'
    };
    return fieldNames[fieldName] || fieldName;
  }

  irALogin(): void {
    this.router.navigate(['/auth/login']);
  }
}




