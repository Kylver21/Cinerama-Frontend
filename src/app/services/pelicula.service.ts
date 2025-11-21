import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, PagedResponse } from '../models/api-response.model';
import { Pelicula, PeliculaCreateRequest } from '../models/pelicula.model';

@Injectable({
  providedIn: 'root'
})
export class PeliculaService {
  private apiUrl = `${environment.apiUrl}/peliculas`;

  constructor(private http: HttpClient) {}

  // ===== PAGINADOS (RECOMENDADO) =====
  
  obtenerPeliculasPaginadas(
    page: number = 0, 
    size: number = 10, 
    sortBy: string = 'popularidad'
  ): Observable<ApiResponse<PagedResponse<Pelicula>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy);
    
    return this.http.get<ApiResponse<PagedResponse<Pelicula>>>(
      `${this.apiUrl}/paginadas`, 
      { params }
    );
  }

  buscarPorGeneroPaginado(
    genero: string,
    page: number = 0, 
    size: number = 10
  ): Observable<ApiResponse<PagedResponse<Pelicula>>> {
    const params = new HttpParams()
      .set('genero', genero)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<ApiResponse<PagedResponse<Pelicula>>>(
      `${this.apiUrl}/genero/paginado`, 
      { params }
    );
  }

  buscarPorTituloPaginado(
    titulo: string,
    page: number = 0, 
    size: number = 10
  ): Observable<ApiResponse<PagedResponse<Pelicula>>> {
    const params = new HttpParams()
      .set('titulo', titulo)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<ApiResponse<PagedResponse<Pelicula>>>(
      `${this.apiUrl}/titulo/paginado`, 
      { params }
    );
  }

  // ===== SIN PAGINACIÓN =====

  obtenerTodasLasPeliculas(): Observable<ApiResponse<Pelicula[]>> {
    return this.http.get<ApiResponse<Pelicula[]>>(this.apiUrl);
  }

  obtenerPeliculaPorId(id: number): Observable<ApiResponse<Pelicula>> {
    return this.http.get<ApiResponse<Pelicula>>(`${this.apiUrl}/${id}`);
  }

  obtenerPeliculasActivas(): Observable<ApiResponse<Pelicula[]>> {
    return this.http.get<ApiResponse<Pelicula[]>>(`${this.apiUrl}/activas`);
  }

  obtenerPeliculasPopulares(): Observable<ApiResponse<Pelicula[]>> {
    return this.http.get<ApiResponse<Pelicula[]>>(`${this.apiUrl}/populares`);
  }

  obtenerMejorValoradas(): Observable<ApiResponse<Pelicula[]>> {
    return this.http.get<ApiResponse<Pelicula[]>>(`${this.apiUrl}/mejor-valoradas`);
  }

  buscarPorGenero(genero: string): Observable<ApiResponse<Pelicula[]>> {
    return this.http.get<ApiResponse<Pelicula[]>>(`${this.apiUrl}/genero/${genero}`);
  }

  buscarPorTitulo(titulo: string): Observable<ApiResponse<Pelicula[]>> {
    return this.http.get<ApiResponse<Pelicula[]>>(`${this.apiUrl}/titulo/${titulo}`);
  }

  obtenerPeliculaPorTmdbId(tmdbId: number): Observable<ApiResponse<Pelicula>> {
    return this.http.get<ApiResponse<Pelicula>>(`${this.apiUrl}/tmdb/${tmdbId}`);
  }

  // ===== ADMIN =====

  crearPelicula(pelicula: PeliculaCreateRequest): Observable<ApiResponse<Pelicula>> {
    return this.http.post<ApiResponse<Pelicula>>(this.apiUrl, pelicula);
  }

  actualizarPelicula(id: number, pelicula: PeliculaCreateRequest): Observable<ApiResponse<Pelicula>> {
    return this.http.put<ApiResponse<Pelicula>>(`${this.apiUrl}/${id}`, pelicula);
  }

  eliminarPelicula(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${id}`);
  }

  sincronizarConTMDb(paginas: number = 1): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('paginas', paginas.toString());
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/sync`, null, { params });
  }

  probarConexionTMDb(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/test-connection`);
  }

  /**
   * Agrega una película específica desde TMDb a la base de datos
   */
  agregarDesdeTMDb(tmdbId: number): Observable<ApiResponse<Pelicula>> {
    const params = new HttpParams().set('tmdbId', tmdbId.toString());
    return this.http.post<ApiResponse<Pelicula>>(`${this.apiUrl}/agregar-desde-tmdb`, null, { params });
  }
}




