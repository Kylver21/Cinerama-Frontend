import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-recuperar-password',
  templateUrl: './recuperar-password.component.html',
  styleUrls: ['./recuperar-password.component.scss']
})
export class RecuperarPasswordComponent implements OnInit {
  recuperarForm: FormGroup;
  loading = false;
  emailEnviado = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.recuperarForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // Si ya está autenticado, redirigir al home
    // if (this.authService.isAuthenticated()) {
    //   this.router.navigate(['/home']);
    // }
  }

  onSubmit(): void {
    if (this.recuperarForm.valid) {
      this.loading = true;
      const email = this.recuperarForm.value.email;

      // Simular envío de email (aquí iría la llamada al servicio)
      setTimeout(() => {
        this.loading = false;
        this.emailEnviado = true;
        this.snackBar.open('Se ha enviado un enlace de recuperación a tu email', 'Cerrar', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      }, 2000);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.recuperarForm.controls).forEach(key => {
      const control = this.recuperarForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.recuperarForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldDisplayName(fieldName)} es requerido`;
    }
    if (control?.hasError('email')) {
      return 'Formato de email inválido';
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      email: 'Email'
    };
    return fieldNames[fieldName] || fieldName;
  }

  irALogin(): void {
    this.router.navigate(['/auth/login']);
  }

  reenviarEmail(): void {
    this.emailEnviado = false;
    this.recuperarForm.reset();
  }
}




