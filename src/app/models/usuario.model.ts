export interface Usuario {
  id?: number;
  username: string;
  email: string;
  activo?: boolean;
  roles?: string[];
  // Estos campos están en Cliente, no directamente en Usuario
  clienteId?: number;
  nombreCompleto?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tipo?: string;
  username: string;
  email: string;
  roles: string[];
  userId?: number;
  clienteId?: number;
  nombreCompleto?: string;
}

export interface RegistroRequest {
  username: string;
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono: string; // Debe tener exactamente 9 dígitos
  numeroDocumento: string; // Cambiado de "documento"
  tipoDocumento: string; // DNI, PASAPORTE, CARNET_EXTRANJERIA
}

export interface CambiarPasswordRequest {
  passwordActual: string;
  passwordNuevo: string;
}

