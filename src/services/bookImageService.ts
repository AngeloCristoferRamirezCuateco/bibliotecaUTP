import { API_CONFIG } from '../config/api';
import { Book } from '../models/Book';

interface GoogleBookImageLinks {
  thumbnail?: string;
  smallThumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
}

interface GoogleBookVolumeInfo {
  title?: string;
  authors?: string[];
  description?: string;
  categories?: string[];
  imageLinks?: GoogleBookImageLinks;
  publisher?: string;
  publishedDate?: string;
  industryIdentifiers?: Array<{
    type: string;
    identifier: string;
  }>;
}

interface GoogleBookItem {
  id: string;
  volumeInfo: GoogleBookVolumeInfo;
}

interface GoogleBooksResponse {
  items?: GoogleBookItem[];
  totalItems: number;
}

export interface BookImageData {
  imageUrl: string;
  descripcion?: string;
  genero?: string;
  editorial?: string;
  fechaPublicacion?: string;
}

/**
 * Obtiene la mejor URL de imagen disponible
 */
function obtenerMejorImagen(imageLinks?: GoogleBookImageLinks): string {
  if (!imageLinks) return '';
  
  const imageUrl = imageLinks.large ||
                   imageLinks.medium ||
                   imageLinks.thumbnail ||
                   imageLinks.small ||
                   imageLinks.smallThumbnail ||
                   '';
  
  // Mejorar la calidad de la imagen
  return imageUrl
    .replace('http:', 'https:')
    .replace('&edge=curl', '')
    .replace('zoom=1', 'zoom=2');
}

/**
 * Busca información de un libro en Google Books API
 * @param titulo - Título del libro
 * @param autor - Autor del libro (opcional pero recomendado)
 * @param isbn - ISBN del libro (opcional, más preciso)
 * @returns Datos del libro incluyendo URL de imagen
 */
export async function obtenerDatosLibro(
  titulo: string,
  autor?: string,
  isbn?: string
): Promise<BookImageData> {
  try {
    let url: string;
    
    if (isbn) {
      url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${API_CONFIG.GOOGLE_BOOKS_API_KEY}`;
    } else {
      const query = autor 
        ? encodeURIComponent(`intitle:${titulo} inauthor:${autor}`)
        : encodeURIComponent(`intitle:${titulo}`);
      
      url = `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${API_CONFIG.GOOGLE_BOOKS_API_KEY}&maxResults=1`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Error en Google Books API: ${response.status}`);
      return { imageUrl: '' };
    }
    
    const data: GoogleBooksResponse = await response.json();
    
    if (data.items && data.items.length > 0) {
      const book = data.items[0].volumeInfo;
      
      return {
        imageUrl: obtenerMejorImagen(book.imageLinks),
        descripcion: book.description,
        genero: book.categories?.[0],
        editorial: book.publisher,
        fechaPublicacion: book.publishedDate,
      };
    }
    
    return { imageUrl: '' };
  } catch (error) {
    console.error('Error obteniendo datos de Google Books:', error);
    return { imageUrl: '' };
  }
}

/**
 * Versión simplificada para solo obtener la imagen
 */
export async function obtenerImagenLibro(
  titulo: string,
  autor?: string
): Promise<string> {
  const datos = await obtenerDatosLibro(titulo, autor);
  return datos.imageUrl;
}

/**
 * Busca libros en Google Books API y los convierte al formato Book
 * @param query - Término de búsqueda
 * @param maxResults - Número máximo de resultados (default: 20)
 * @returns Array de libros en formato Book
 */
export async function buscarLibrosGoogleBooks(
    query: string,
    maxResults: number = 20
): Promise<Book[]> {
    try {
        const searchQuery = encodeURIComponent(query);
        const url = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&key=${API_CONFIG.GOOGLE_BOOKS_API_KEY}&maxResults=${maxResults}&langRestrict=es`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn(`Error en Google Books API: ${response.status}`);
            return [];
        }
        
        const data: GoogleBooksResponse = await response.json();
        
        if (!data.items || data.items.length === 0) {
            return [];
        }
        
        // Convertir los resultados de Google Books al formato Book
        const books: Book[] = data.items.map((item, index) => {
            const volumeInfo = item.volumeInfo;

            // Obtener ISBN si está disponible
            const isbn = volumeInfo.industryIdentifiers?.find(
                id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
            )?.identifier;

            return {
                id: item.id || `google-book-${index}`,
                nombre: volumeInfo.title || 'Sin título',
                autor: volumeInfo.authors?.join(', ') || 'Autor desconocido',
                disponible: true, // Los libros de la API se marcan como disponibles por defecto
                imagen: '', // No usamos imagen local
                imagenURL: obtenerMejorImagen(volumeInfo.imageLinks),
                descripcion: volumeInfo.description,
                genero: volumeInfo.categories?.[0],
                isbn: isbn,
                editorial: volumeInfo.publisher,
                fechaPublicacion: volumeInfo.publishedDate,
                unidades: 1, // Valor por defecto
            };
        });
    
    return books;
    } catch (error) {
        console.error('Error buscando libros en Google Books:', error);
        return [];
    }
}