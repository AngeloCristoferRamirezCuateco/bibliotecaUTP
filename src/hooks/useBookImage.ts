import { useState, useEffect } from 'react';
import { obtenerDatosLibro, BookImageData } from '../services/bookImageService';
import { imagenesMap } from '../utils/imagenesFile';

interface UseBookImageResult {
    imageSource: any;
    isLoading: boolean;
    bookData: BookImageData | null;
}

export function useBookImage(
    imagenLocal: string,
    imagenURL: string | undefined,
    titulo: string,
    autor?: string,
    isbn?: string
): UseBookImageResult {
    const [imageSource, setImageSource] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [bookData, setBookData] = useState<BookImageData | null>(null);

    useEffect(() => {
        loadImage();
    }, [imagenLocal, imagenURL, titulo, autor, isbn]);

    const loadImage = async () => {
        try {
        setIsLoading(true);

        // Prioridad 1: URL de Firebase/externa guardada
        if (imagenURL) {
            setImageSource({ uri: imagenURL });
            setIsLoading(false);
            return;
        }

        // Prioridad 2: Imagen local del mapa
        if (imagenLocal && imagenesMap[imagenLocal]) {
            setImageSource(imagenesMap[imagenLocal]);
            setIsLoading(false);
            return;
        }

        // Prioridad 3: Buscar en Google Books API
        const datos = await obtenerDatosLibro(titulo, autor, isbn);
        
        if (datos.imageUrl) {
            setImageSource({ uri: datos.imageUrl });
            setBookData(datos);
        } else {
            // Prioridad 4: Imagen placeholder
            setImageSource(require('../assets/img/books/libro1.jpg'));
        }
        } catch (error) {
            console.error('Error cargando imagen:', error);
            setImageSource(require('../assets/img/books/libro1.jpg'));
        } finally {
            setIsLoading(false);
        }
    };

    return { imageSource, isLoading, bookData };
}