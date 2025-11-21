import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { LoginRequest, LoginResponse, RegistroRequest, Usuario, CambiarPasswordRequest } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'auth_token';
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar usuario del localStorage al iniciar
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Enviar solo username y password como espera el backend
    const loginData = {
      username: credentials.username,
      password: credentials.password
    };
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(
        tap(response => {
          if (response && response.token) {
            // Guardar token y usuario
            localStorage.setItem(this.tokenKey, response.token);
            localStorage.setItem('currentUser', JSON.stringify(response));
            this.currentUserSubject.next(response);
          }
        })
      );
  }

  registro(data: RegistroRequest): Observable<any> {
    // El backend devuelve MensajeDTO directamente, no ApiResponse
    // Enviar exactamente los campos que espera RegistroDTO
    const registroData = {
      username: data.username,
      email: data.email,
      password: data.password,
      nombre: data.nombre,
      apellido: data.apellido,
      telefono: data.telefono,
      numeroDocumento: data.numeroDocumento,
      tipoDocumento: data.tipoDocumento
    };
    
    return this.http.post<any>(`${this.apiUrl}/register`, registroData);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.roles.includes(role) || false;
  }

  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  isCliente(): boolean {
    return this.hasRole('ROLE_CLIENTE');
  }

  getCurrentUser(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  cambiarPassword(data: CambiarPasswordRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/cambiar-password`, data);
  }

  validarUsername(username: string): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/validar-username/${username}`);
  }

  validarEmail(email: string): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/validar-email/${email}`);
  }

  obtenerInfoUsuario(): Observable<ApiResponse<Usuario>> {
    return this.http.get<ApiResponse<Usuario>>(`${this.apiUrl}/me`);
  }

  refreshToken(): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/refresh`, {});
  }

  validarToken(): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/validate`);
  }
}




