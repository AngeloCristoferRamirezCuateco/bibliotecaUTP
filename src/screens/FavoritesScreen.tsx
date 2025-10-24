// src/screens/FavoritesScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Book } from '../models/Book';
import { FavoritesService } from '../services/favoritesService';
import { imagenesMap } from '../utils/imagenesFile';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Favorites'>;

type MaterialIconName =
    | 'home'
    | 'recommend'
    | 'book'
    | 'credit-card'
    | 'favorite'
    | 'notifications'
    | 'person';

interface NavigationIcon {
    name: MaterialIconName;
    label: string;
    route?: keyof RootStackParamList;
}

const navigationIcons: NavigationIcon[] = [
    { name: 'home', label: 'Inicio', route: 'Books' },
    { name: 'recommend', label: 'Recomendados', route: 'Recommended' },
    { name: 'book', label: 'Préstamos', route: 'Loans' },
    { name: 'credit-card', label: 'Pagos', route: 'Payments' },
    { name: 'favorite', label: 'Favoritos', route: 'Favorites' },
    { name: 'notifications', label: 'Notificaciones', route: 'Notifications' },
    { name: 'person', label: 'Perfil', route: 'Profile' },
];

export default function FavoritesScreen({ navigation }: Props) {
    const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);
    
    const user = useSelector((state: RootState) => state.auth.user);
    const userId = user?.id;

  // Recargar favoritos cada vez que la pantalla recibe foco
    useFocusEffect(
        useCallback(() => {
        loadFavorites();
        }, [userId])
    );

    const loadFavorites = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const books = await FavoritesService.getFavoriteBooks(userId);
            setFavoriteBooks(books);
        } catch (error) {
            console.error('Error cargando favoritos:', error);
            Alert.alert('Error', 'No se pudieron cargar los favoritos');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (bookId: string) => {
        if (!userId) return;

        Alert.alert(
        'Eliminar de Favoritos',
        '¿Estás seguro de que quieres eliminar este libro de tus favoritos?',
        [
            { text: 'Cancelar', style: 'cancel' },
            {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
                try {
                setRemovingId(bookId);
                await FavoritesService.removeFavorite(userId, bookId);
                setFavoriteBooks(prev => prev.filter(book => book.id !== bookId));
                } catch (error) {
                console.error('Error eliminando favorito:', error);
                Alert.alert('Error', 'No se pudo eliminar el favorito');
                } finally {
                setRemovingId(null);
                }
            },
            },
        ]
        );
    };

    const getImageSource = (item: Book) => {
        if (item.imagenURL) {
        return { uri: item.imagenURL };
        }
        if (item.imagen && imagenesMap[item.imagen]) {
        return imagenesMap[item.imagen];
        }
        return null;
    };

    const renderBookItem = ({ item }: { item: Book }) => {
        const imageSource = getImageSource(item);
        const isRemoving = removingId === item.id;

        return (
        <TouchableOpacity
            style={styles.bookCard}
            onPress={() => navigation.navigate('BookInfo', { item })}
            disabled={isRemoving}
        >
            {/* Imagen del libro */}
            <View style={styles.imageContainer}>
            {imageSource ? (
                <Image
                source={imageSource}
                style={styles.bookImage}
                resizeMode="cover"
                />
            ) : (
                <View style={styles.noImageContainer}>
                <MaterialIcons name="book" size={40} color="#ccc" />
                </View>
            )}
            </View>

            {/* Información del libro */}
            <View style={styles.bookInfo}>
            <Text style={styles.bookTitle} numberOfLines={2}>
                {item.nombre}
            </Text>
            <Text style={styles.bookAuthor} numberOfLines={1}>
                {item.autor}
            </Text>
            {item.genero && (
                <Text style={styles.bookGenre} numberOfLines={1}>
                {item.genero}
                </Text>
            )}
            </View>

            {/* Botón de eliminar favorito */}
            <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleRemoveFavorite(item.id)}
            disabled={isRemoving}
            >
            {isRemoving ? (
                <ActivityIndicator size="small" color="#e74c3c" />
            ) : (
                <MaterialIcons name="favorite" size={28} color="#e74c3c" />
            )}
            </TouchableOpacity>
        </TouchableOpacity>
        );
    };

    const renderNavigationIcon = (icon: NavigationIcon, index: number) => {
        const isActive = icon.name === 'favorite';

        return (
        <TouchableOpacity
            key={index}
            style={[
            styles.navIcon,
            isActive && styles.activeNavIcon,
            ]}
            onPress={() => {
                if (!icon.route || icon.route === 'Favorites') return;
                navigation.navigate(icon.route as any);
            }}
        >
            <MaterialIcons
            name={icon.name}
            size={24}
            color={isActive ? 'black' : 'white'}
            />
        </TouchableOpacity>
        );
    };

    if (!userId) {
        return (
        <View style={[styles.container, styles.centerContent]}>
            <MaterialIcons name="error-outline" size={64} color="#ccc" />
            <Text style={styles.errorText}>
            Debes iniciar sesión para ver tus favoritos
            </Text>
        </View>
        );
    }

    if (loading) {
        return (
        <View style={[styles.container, styles.centerContent]}>
            <ActivityIndicator size="large" color="#0d730d" />
            <Text style={styles.loadingText}>Cargando favoritos...</Text>
        </View>
        );
    }

    return (
        <View style={styles.container}>
        {/* Header */}
        {/* <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Favoritos</Text>
            <View style={{ width: 28 }} />
        </View> */}

        {/* Lista de favoritos */}
        {favoriteBooks.length === 0 ? (
            <View style={styles.emptyContainer}>
            <MaterialIcons name="favorite-border" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No tienes favoritos aún</Text>
            <Text style={styles.emptySubtitle}>
                Agrega libros a tus favoritos tocando el ❤️
            </Text>
            <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => navigation.navigate('Books')}
            >
                <Text style={styles.exploreButtonText}>Explorar Libros</Text>
            </TouchableOpacity>
            </View>
        ) : (
            <FlatList
            data={favoriteBooks}
            renderItem={renderBookItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.booksList}
            showsVerticalScrollIndicator={false}
            />
        )}

            {/* Barra de navegación inferior */}
            <View style={styles.bottomNavigation}>
                {navigationIcons.map(renderNavigationIcon)}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0d730d',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: 40,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    booksList: {
        padding: 16,
        paddingBottom: 80,
    },
    bookCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
    },
    imageContainer: {
        width: 80,
        height: 120,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    noImageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    bookImage: {
        width: '100%',
        height: '100%',
    },
    bookInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    bookTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    bookAuthor: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    bookGenre: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    favoriteButton: {
        padding: 8,
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 24,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    exploreButton: {
        backgroundColor: '#0d730d',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
    },
    exploreButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    bottomNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#0d730d',
        paddingVertical: 12,
        paddingHorizontal: 8,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    navIcon: {
        padding: 8,
        borderRadius: 8,
    },
    activeNavIcon: {
        backgroundColor: '#fff',
    },
});