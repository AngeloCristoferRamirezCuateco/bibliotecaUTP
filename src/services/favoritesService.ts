// src/services/favoritesService.ts
import firestore from '@react-native-firebase/firestore';
import { Book } from '../models/Book';

export class FavoritesService {
    /**
     * Agrega un libro a favoritos
     */
    static async addFavorite(userId: string, bookId: string): Promise<void> {
        try {
            await firestore()
                .collection('usuarios')
                .doc(userId)
                .update({
                favoritosIds: firestore.FieldValue.arrayUnion(bookId),
                });
        } catch (error) {
            console.error('Error agregando favorito:', error);
            throw error;
        }
    }

    /**
     * Elimina un libro de favoritos
     */
    static async removeFavorite(userId: string, bookId: string): Promise<void> {
        try {
        await firestore()
            .collection('usuarios')
            .doc(userId)
            .update({
            favoritosIds: firestore.FieldValue.arrayRemove(bookId),
            });
        } catch (error) {
            console.error('Error eliminando favorito:', error);
            throw error;
        }
    }

    /**
     * Alterna el estado de favorito (agregar/eliminar)
     */
    static async toggleFavorite(userId: string, bookId: string): Promise<boolean> {
        try {
        const userDoc = await firestore()
            .collection('usuarios')
            .doc(userId)
            .get();

        const userData = userDoc.data();
        const favoritosIds = userData?.favoritosIds || [];

        const isFavorite = favoritosIds.includes(bookId);

        if (isFavorite) {
            await this.removeFavorite(userId, bookId);
            return false; // Ya no es favorito
        } else {
            await this.addFavorite(userId, bookId);
            return true; // Ahora es favorito
        }
        } catch (error) {
            console.error('Error toggling favorito:', error);
            throw error;
        }
    }

    /**
     * Verifica si un libro es favorito
     */
    static async isFavorite(userId: string, bookId: string): Promise<boolean> {
        try {
        const userDoc = await firestore()
            .collection('usuarios')
            .doc(userId)
            .get();

        const userData = userDoc.data();
        const favoritosIds = userData?.favoritosIds || [];

        return favoritosIds.includes(bookId);
        } catch (error) {
            console.error('Error verificando favorito:', error);
            return false;
        }
    }

    /**
     * Obtiene todos los IDs de libros favoritos del usuario
     */
    static async getFavoriteIds(userId: string): Promise<string[]> {
        try {
        const userDoc = await firestore()
            .collection('usuarios')
            .doc(userId)
            .get();

        const userData = userDoc.data();
        return userData?.favoritosIds || [];
        } catch (error) {
            console.error('Error obteniendo IDs de favoritos:', error);
            return [];
        }
    }

    /**
     * Obtiene todos los libros favoritos del usuario con su información completa
     */
    static async getFavoriteBooks(userId: string): Promise<Book[]> {
        try {
            const favoriteIds = await this.getFavoriteIds(userId);

            if (favoriteIds.length === 0) {
                return [];
            }

            // Firebase tiene un límite de 10 items en consultas 'in'
            // Si hay más de 10 favoritos, dividimos en lotes
            const books: Book[] = [];
            const batchSize = 10;

            for (let i = 0; i < favoriteIds.length; i += batchSize) {
                const batch = favoriteIds.slice(i, i + batchSize);
                
                const snapshot = await firestore()
                .collection('libros')
                .where(firestore.FieldPath.documentId(), 'in', batch)
                .get();

                snapshot.forEach(doc => {
                const data = doc.data();
                books.push({
                    id: doc.id,
                    nombre: data.nombre,
                    autor: data.autor,
                    disponible: data.disponible,
                    imagen: data.imagen,
                    imagenURL: data.imagenURL,
                    descripcion: data.descripcion,
                    genero: data.genero,
                    isbn: data.isbn,
                    editorial: data.editorial,
                    fechaPublicacion: data.fechaPublicacion,
                    unidades: data.unidades,
                } as Book);
                });
            }

            // Mantener el orden original de los favoritos
            return favoriteIds
                .map(id => books.find(book => book.id === id))
                .filter((book): book is Book => book !== undefined);

        } catch (error) {
            console.error('Error obteniendo libros favoritos:', error);
            return [];
        }
    }
}