export interface User {
  id: string;
  nombre: string;
  apellidos: string;
  fechaNac: string;
  sexo: string;
  telefono: string;
  matricula: string;
  email: string;
  contrasena: string;
  area: string;
  carrera: string;
  favoritosIds?: string[];
}