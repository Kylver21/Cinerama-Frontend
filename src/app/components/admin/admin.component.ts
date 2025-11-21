import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PeliculaService } from '../../services/pelicula.service';
import { FuncionService } from '../../services/funcion.service';
import { SalaService } from '../../services/sala.service';
import { TMDbService, TMDbMovie } from '../../services/tmdb.service';
import { Sala, TipoSala } from '../../models/sala.model';
import { Pelicula, PeliculaCreateRequest } from '../../models/pelicula.model';
import { Funcion, FuncionCreateRequest } from '../../models/funcion.model';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  loading = false;
  estadisticas = {
    totalPeliculas: 0,
    totalFunciones: 0,
    totalSalas: 0,
    ventasHoy: 0
  };

  // Gestión de Salas
  salas: Sala[] = [];
  salaForm: FormGroup;
  mostrarFormSala = false;
  salaEditando: Sala | null = null;
  tiposSala: string[] = ['NORMAL', 'CINE_2D'];

  // Gestión de Películas
  peliculas: Pelicula[] = [];
  peliculaForm: FormGroup;
  mostrarFormPelicula = false;
  peliculaEditando: Pelicula | null = null;

  // Gestión de Funciones
  funciones: Funcion[] = [];
  funcionForm: FormGroup;
  mostrarFormFuncion = false;
  funcionEditando: Funcion | null = null;

  // Exploración TMDb
  tmdbMovies: TMDbMovie[] = [];
  tmdbLoading = false;
  tmdbCategoria: 'en-cartelera' | 'proximamente' | 'populares' = 'en-cartelera';
  tmdbPage = 1;

  constructor(
    private peliculaService: PeliculaService,
    private funcionService: FuncionService,
    private salaService: SalaService,
    private tmdbService: TMDbService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    // Formulario de Sala
    this.salaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      capacidad: ['', [Validators.required, Validators.min(1), Validators.max(500)]],
      tipo: ['NORMAL', Validators.required],
      descripcion: [''],
      activa: [true]
    });

    // Formulario de Película
    this.peliculaForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(2)]],
      genero: [''],
      duracion: ['', [Validators.min(1)]],
      clasificacion: [''],
      sinopsis: [''],
      posterUrl: [''],
      backdropUrl: [''],
      popularidad: [0],
      votoPromedio: [0],
      fechaEstreno: [''],
      activa: [true]
    });

    // Formulario de Función
    this.funcionForm = this.fb.group({
      peliculaId: ['', Validators.required],
      salaId: ['', Validators.required],
      fechaHora: ['', Validators.required],
      precio: ['', [Validators.required, Validators.min(0)]],
      activa: [true]
    });
  }

  ngOnInit(): void {
    this.cargarEstadisticas();
    this.cargarSalas();
    this.cargarPeliculas();
    this.cargarFunciones();
    this.explorarTMDb('en-cartelera');
  }

  cargarEstadisticas(): void {
    this.loading = true;
    
    this.peliculaService.obtenerTodasLasPeliculas().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.estadisticas.totalPeliculas = response.data.length;
        }
      }
    });

    this.funcionService.obtenerTodasLasFunciones().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.estadisticas.totalFunciones = response.data.length;
        }
      }
    });

    this.salaService.obtenerTodasLasSalas().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.estadisticas.totalSalas = response.data.length;
        }
        this.loading = false;
      }
    });
  }

  sincronizarTMDb(): void {
    this.loading = true;
    this.peliculaService.sincronizarConTMDb(2).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackBar.open('Sincronización con TMDb exitosa', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.cargarEstadisticas();
          this.cargarPeliculas();
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.snackBar.open('Error al sincronizar con TMDb', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.loading = false;
      }
    });
  }

  // ===== GESTIÓN DE SALAS =====
  cargarSalas(): void {
    this.salaService.obtenerTodasLasSalas().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.salas = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error al cargar salas:', error);
      }
    });
  }

  nuevaSala(): void {
    this.salaEditando = null;
    this.salaForm.reset({
      tipo: 'NORMAL' as TipoSala,
      activa: true
    });
    this.mostrarFormSala = true;
  }

  editarSala(sala: Sala): void {
    this.salaEditando = sala;
    this.salaForm.patchValue({
      nombre: sala.nombre,
      capacidad: sala.capacidad,
      tipo: (sala as any).tipo || 'NORMAL',
      descripcion: sala.descripcion || '',
      activa: sala.activa !== false
    });
    this.mostrarFormSala = true;
  }

  cancelarFormSala(): void {
    this.mostrarFormSala = false;
    this.salaEditando = null;
    this.salaForm.reset();
  }

  guardarSala(): void {
    if (this.salaForm.valid) {
      const salaData: Sala = this.salaForm.value;
      
      if (this.salaEditando && this.salaEditando.id) {
        this.salaService.actualizarSala(this.salaEditando.id, salaData).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.snackBar.open('Sala actualizada exitosamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.cargarSalas();
              this.cargarEstadisticas();
              this.cancelarFormSala();
            }
          },
          error: (error: any) => {
            this.snackBar.open('Error al actualizar la sala', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      } else {
        this.salaService.crearSala(salaData).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.snackBar.open('Sala creada exitosamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.cargarSalas();
              this.cargarEstadisticas();
              this.cancelarFormSala();
            }
          },
          error: (error: any) => {
            this.snackBar.open('Error al crear la sala', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    }
  }

  eliminarSala(sala: Sala): void {
    if (confirm(`¿Estás seguro de eliminar la sala "${sala.nombre}"?`)) {
      if (sala.id) {
        this.salaService.eliminarSala(sala.id).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.snackBar.open('Sala eliminada exitosamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.cargarSalas();
              this.cargarEstadisticas();
            }
          },
          error: (error: any) => {
            this.snackBar.open('Error al eliminar la sala', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    }
  }

  obtenerTipoSalaLabel(tipo: TipoSala | string | undefined): string {
    if (!tipo) return 'N/A';
    const tipoStr = String(tipo);
    if (tipoStr === 'NORMAL') {
      return 'Normal';
    }
    return 'Cine 2D';
  }

  obtenerTipoSala(sala: Sala): string | undefined {
    return (sala as any).tipo;
  }

  // ===== GESTIÓN DE PELÍCULAS =====
  cargarPeliculas(): void {
    this.peliculaService.obtenerTodasLasPeliculas().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.peliculas = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error al cargar películas:', error);
      }
    });
  }

  nuevaPelicula(): void {
    this.peliculaEditando = null;
    this.peliculaForm.reset({
      activa: true,
      popularidad: 0,
      votoPromedio: 0
    });
    this.mostrarFormPelicula = true;
  }

  editarPelicula(pelicula: Pelicula): void {
    this.peliculaEditando = pelicula;
    this.peliculaForm.patchValue({
      titulo: pelicula.titulo,
      genero: pelicula.genero || '',
      duracion: pelicula.duracion || '',
      clasificacion: pelicula.clasificacion || '',
      sinopsis: pelicula.sinopsis || '',
      posterUrl: pelicula.posterUrl || '',
      backdropUrl: pelicula.backdropUrl || '',
      popularidad: pelicula.popularidad || 0,
      votoPromedio: pelicula.votoPromedio || 0,
      fechaEstreno: pelicula.fechaEstreno || '',
      activa: pelicula.activa !== false
    });
    this.mostrarFormPelicula = true;
  }

  cancelarFormPelicula(): void {
    this.mostrarFormPelicula = false;
    this.peliculaEditando = null;
    this.peliculaForm.reset();
  }

  guardarPelicula(): void {
    if (this.peliculaForm.valid) {
      const peliculaData: PeliculaCreateRequest = this.peliculaForm.value;
      
      if (this.peliculaEditando && this.peliculaEditando.id) {
        this.peliculaService.actualizarPelicula(this.peliculaEditando.id, peliculaData).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.snackBar.open('Película actualizada exitosamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.cargarPeliculas();
              this.cargarEstadisticas();
              this.cancelarFormPelicula();
            }
          },
          error: (error: any) => {
            this.snackBar.open('Error al actualizar la película', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      } else {
        this.peliculaService.crearPelicula(peliculaData).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.snackBar.open('Película creada exitosamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.cargarPeliculas();
              this.cargarEstadisticas();
              this.cancelarFormPelicula();
            }
          },
          error: (error: any) => {
            this.snackBar.open('Error al crear la película', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    }
  }

  eliminarPelicula(pelicula: Pelicula): void {
    if (confirm(`¿Estás seguro de eliminar la película "${pelicula.titulo}"?`)) {
      if (pelicula.id) {
        this.peliculaService.eliminarPelicula(pelicula.id).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.snackBar.open('Película eliminada exitosamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.cargarPeliculas();
              this.cargarEstadisticas();
            }
          },
          error: (error: any) => {
            this.snackBar.open('Error al eliminar la película', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    }
  }

  // ===== GESTIÓN DE FUNCIONES =====
  cargarFunciones(): void {
    this.funcionService.obtenerTodasLasFunciones().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.funciones = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error al cargar funciones:', error);
      }
    });
  }

  nuevaFuncion(): void {
    this.funcionEditando = null;
    this.funcionForm.reset({
      activa: true
    });
    this.mostrarFormFuncion = true;
  }

  editarFuncion(funcion: Funcion): void {
    this.funcionEditando = funcion;
    const fechaHora = funcion.fechaHora ? new Date(funcion.fechaHora).toISOString().slice(0, 16) : '';
    this.funcionForm.patchValue({
      peliculaId: funcion.pelicula?.id || '',
      salaId: funcion.sala?.id || '',
      fechaHora: fechaHora,
      precio: funcion.precio || '',
      activa: funcion.activa !== false
    });
    this.mostrarFormFuncion = true;
  }

  cancelarFormFuncion(): void {
    this.mostrarFormFuncion = false;
    this.funcionEditando = null;
    this.funcionForm.reset();
  }

  guardarFuncion(): void {
    if (this.funcionForm.valid) {
      const funcionData: FuncionCreateRequest = this.funcionForm.value;
      
      if (this.funcionEditando && this.funcionEditando.id) {
        this.funcionService.actualizarFuncion(this.funcionEditando.id, funcionData).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.snackBar.open('Función actualizada exitosamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.cargarFunciones();
              this.cargarEstadisticas();
              this.cancelarFormFuncion();
            }
          },
          error: (error: any) => {
            this.snackBar.open('Error al actualizar la función', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      } else {
        this.funcionService.crearFuncion(funcionData).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.snackBar.open('Función creada exitosamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.cargarFunciones();
              this.cargarEstadisticas();
              this.cancelarFormFuncion();
            }
          },
          error: (error: any) => {
            this.snackBar.open('Error al crear la función', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    }
  }

  eliminarFuncion(funcion: Funcion): void {
    if (confirm(`¿Estás seguro de eliminar esta función?`)) {
      if (funcion.id) {
        this.funcionService.eliminarFuncion(funcion.id).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.snackBar.open('Función eliminada exitosamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.cargarFunciones();
              this.cargarEstadisticas();
            }
          },
          error: (error: any) => {
            this.snackBar.open('Error al eliminar la función', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    }
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ===== EXPLORACIÓN TMDb =====
  
  explorarTMDb(categoria: 'en-cartelera' | 'proximamente' | 'populares'): void {
    this.tmdbCategoria = categoria;
    this.tmdbPage = 1;
    this.cargarPeliculasTMDb();
  }

  cargarPeliculasTMDb(): void {
    this.tmdbLoading = true;
    let request: any;

    switch (this.tmdbCategoria) {
      case 'en-cartelera':
        request = this.tmdbService.obtenerEnCartelera(this.tmdbPage);
        break;
      case 'proximamente':
        request = this.tmdbService.obtenerProximamente(this.tmdbPage);
        break;
      case 'populares':
        request = this.tmdbService.obtenerPopulares(this.tmdbPage);
        break;
    }

    request.subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.tmdbMovies = response.data;
        }
        this.tmdbLoading = false;
      },
      error: (error: any) => {
        this.snackBar.open('Error al cargar películas desde TMDb', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.tmdbLoading = false;
      }
    });
  }

  agregarPeliculaDesdeTMDb(tmdbMovie: TMDbMovie): void {
    if (confirm(`¿Agregar "${tmdbMovie.title}" a la base de datos?`)) {
      this.tmdbLoading = true;
      this.peliculaService.agregarDesdeTMDb(tmdbMovie.id).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.snackBar.open(`Película "${tmdbMovie.title}" agregada exitosamente`, 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.cargarEstadisticas();
            this.cargarPeliculas();
          }
          this.tmdbLoading = false;
        },
        error: (error: any) => {
          const errorMsg = error.error?.message || 'Error al agregar película';
          this.snackBar.open(errorMsg, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.tmdbLoading = false;
        }
      });
    }
  }

  getPosterUrl(posterPath: string | null): string {
    if (!posterPath) return 'https://via.placeholder.com/500x750/1a1a1a/ffffff?text=No+Poster';
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  }

  paginaAnteriorTMDb(): void {
    if (this.tmdbPage > 1) {
      this.tmdbPage--;
      this.cargarPeliculasTMDb();
    }
  }

  paginaSiguienteTMDb(): void {
    this.tmdbPage++;
    this.cargarPeliculasTMDb();
  }
}
