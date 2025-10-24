export interface Book {
  id: string;
  nombre: string;
  autor: string;
  disponible: boolean;
  imagen: string; // Mantenemos por compatibilidad
  imagenURL?: string; // Nueva: URL de Google Books o Firebase
  descripcion?: string; // Nueva
  genero?: string; // Nueva
  isbn?: string; // Nueva: útil para búsquedas más precisas
  editorial?: string; // Nueva
  fechaPublicacion?: string; // Nueva
  unidades?: number; // Nueva: cantidad de ejemplares
}

// export interface Book {
//   id: string;
//   nombre: string;
//   autor: string;
//   genero: string;
//   descripcion: string;
//   unidades: number;
//   disponible: boolean;
//   imagen: string;
// }