import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Sala, TipoSala } from '../models/sala.model';

@Injectable({
  providedIn: 'root'
})
export class SalaService {
  private apiUrl = `${environment.apiUrl}/salas`;

  constructor(private http: HttpClient) {}

  obtenerTodasLasSalas(): Observable<ApiResponse<Sala[]>> {
    return this.http.get<ApiResponse<Sala[]>>(this.apiUrl);
  }

  obtenerSalaPorId(id: number): Observable<ApiResponse<Sala>> {
    return this.http.get<ApiResponse<Sala>>(`${this.apiUrl}/${id}`);
  }

  obtenerSalasActivas(): Observable<ApiResponse<Sala[]>> {
    return this.http.get<ApiResponse<Sala[]>>(`${this.apiUrl}/activas`);
  }

  obtenerSalasPorTipo(tipo: TipoSala): Observable<ApiResponse<Sala[]>> {
    return this.http.get<ApiResponse<Sala[]>>(`${this.apiUrl}/tipo/${tipo}`);
  }

  // ===== ADMIN =====

  crearSala(sala: Sala): Observable<ApiResponse<Sala>> {
    return this.http.post<ApiResponse<Sala>>(this.apiUrl, sala);
  }

  actualizarSala(id: number, sala: Sala): Observable<ApiResponse<Sala>> {
    return this.http.put<ApiResponse<Sala>>(`${this.apiUrl}/${id}`, sala);
  }

  eliminarSala(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${id}`);
  }
}




