import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface TMDbMovie {
  id: number;
  title: string;
  originalTitle: string;
  originalLanguage: string;
  overview: string;
  genreIds: number[];
  popularity: number;
  posterPath: string;
  backdropPath: string;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  adult: boolean;
  video: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TMDbService {
  private apiUrl = `${environment.apiUrl}/tmdb`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene películas en cartelera desde TMDb (sin guardar)
   */
  obtenerEnCartelera(page: number = 1): Observable<ApiResponse<TMDbMovie[]>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<ApiResponse<TMDbMovie[]>>(`${this.apiUrl}/en-cartelera`, { params });
  }

  /**
   * Obtiene películas próximamente desde TMDb (sin guardar)
   */
  obtenerProximamente(page: number = 1): Observable<ApiResponse<TMDbMovie[]>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<ApiResponse<TMDbMovie[]>>(`${this.apiUrl}/proximamente`, { params });
  }

  /**
   * Obtiene películas populares desde TMDb (sin guardar)
   */
  obtenerPopulares(page: number = 1): Observable<ApiResponse<TMDbMovie[]>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<ApiResponse<TMDbMovie[]>>(`${this.apiUrl}/populares`, { params });
  }
}


