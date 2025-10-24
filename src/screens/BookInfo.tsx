import React, { useState, useEffect } from 'react';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { imagenesMap } from '../utils/imagenesFile';
import { Book } from '../models/Book';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { FavoritesService } from '../services/favoritesService';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
    Dimensions,
    StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useBookImage } from '../hooks/useBookImage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type BookInformationRouteProp = RouteProp<RootStackParamList, 'BookInfo'>;

const { width, height } = Dimensions.get('window');

export const BookInformation = () => {
    const route = useRoute<BookInformationRouteProp>();
    // const navigation = useNavigation();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { item } = route.params;
    const [isFavorite, setIsFavorite] = useState(false);
    const [loadingFavorite, setLoadingFavorite] = useState(true);

    const user = useSelector((state: RootState) => state.auth.user);
    const userId = user?.id;

    const { imageSource, isLoading } = useBookImage(
        item.imagen,
        item.imagenURL,
        item.nombre,
        item.autor,
        item.isbn
    );

    // Verificar si el libro es favorito al cargar
    useEffect(() => {
        checkIfFavorite();
    }, [userId, item.id]);

    const checkIfFavorite = async () => {
        if (!userId) {
            setLoadingFavorite(false);
            return;
        }

        try {
            const isFav = await FavoritesService.isFavorite(userId, item.id);
            setIsFavorite(isFav);
        } catch (error) {
            console.error('Error verificando favorito:', error);
        } finally {
            setLoadingFavorite(false);
        }
    };

    const handleSolicitarPrestamo = () => {
        if (!user) {
            alert('Debes iniciar sesión para solicitar préstamos');
            return;
        }

        if (!item.disponible) {
            alert('Este libro no está disponible para préstamo');
            return;
        }

        // Navegar a la pantalla de solicitud de préstamo
        navigation.navigate('ApplyLoan', { book: item });
    };

    const toggleFavorite = async () => {
        if (!userId) {
            alert('Debes iniciar sesión para agregar favoritos');
            return;
        }

        try {
            const newFavoriteState = await FavoritesService.toggleFavorite(userId, item.id);
            setIsFavorite(newFavoriteState);
        } catch (error) {
            console.error('Error toggling favorito:', error);
            alert('Error al actualizar favorito');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            
            {/* Header con imagen */}
            <View style={styles.imageContainer}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>

                <Image
                    source={imageSource}
                    style={styles.bookImage}
                    resizeMode="cover"
                />
                
                {/* Gradiente overlay (simulado) */}
                <View style={styles.imageOverlay} />
            </View>

            {/* Contenido con scroll */}
            <ScrollView 
                style={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Título del libro */}
                <Text style={styles.bookTitle}>{item.nombre}</Text>
                
                {/* Autor */}
                <Text style={styles.bookAuthor}>por {item.autor}</Text>

                {/* Estado de disponibilidad */}
                <View style={styles.availabilityContainer}>
                    <View style={[
                        styles.statusBadge,
                        item.disponible ? styles.available : styles.notAvailable
                    ]}>
                        <MaterialIcons 
                            name={item.disponible ? "check-circle" : "cancel"} 
                            size={18} 
                            color="#fff" 
                        />
                        <Text style={styles.statusText}>
                            {item.disponible ? 'Disponible' : 'No Disponible'}
                        </Text>
                    </View>
                    
                    <View style={styles.stockInfo}>
                        <MaterialIcons name="inventory" size={18} color="#666" />
                        <Text style={styles.stockText}>
                            {item.unidades} {item.unidades === 1 ? 'ejemplar' : 'ejemplares'}
                        </Text>
                    </View>
                </View>

                {/* Género */}
                {item.genero && (
                    <View style={styles.infoSection}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="category" size={20} color="#0d730d" />
                            <Text style={styles.sectionTitle}>Género</Text>
                        </View>
                        <View style={styles.genreTag}>
                            <Text style={styles.genreText}>{item.genero}</Text>
                        </View>
                    </View>
                )}

                {/* Descripción */}
                <View style={styles.infoSection}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="description" size={20} color="#0d730d" />
                        <Text style={styles.sectionTitle}>Descripción del Libro</Text>
                    </View>
                    <Text style={styles.descriptionText}>
                        {item.descripcion || 'Sin descripción disponible.'}
                    </Text>
                </View>

                {/* Información adicional */}
                {(item.editorial || item.fechaPublicacion) && (
                    <View style={styles.infoSection}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="info" size={20} color="#0d730d" />
                            <Text style={styles.sectionTitle}>Información Adicional</Text>
                        </View>
                        <View style={styles.additionalInfo}>
                            {item.editorial && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Editorial:</Text>
                                    <Text style={styles.infoValue}>{item.editorial}</Text>
                                </View>
                            )}
                            {item.fechaPublicacion && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Fecha de publicación:</Text>
                                    <Text style={styles.infoValue}>{item.fechaPublicacion}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Espaciado para los botones fijos */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Botones fijos en la parte inferior */}
            <View style={styles.bottomActions}>
                <TouchableOpacity 
                    style={[
                        styles.requestButton,
                        !item.disponible && styles.requestButtonDisabled
                    ]}
                    onPress={handleSolicitarPrestamo}
                    disabled={!item.disponible}
                >
                    <MaterialIcons 
                        name="book" 
                        size={22} 
                        color="#fff" 
                        style={{ marginRight: 8 }}
                    />
                    <Text style={styles.requestButtonText}>
                        Solicitar Préstamo
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.favoriteButton}
                    onPress={toggleFavorite}
                >
                    <MaterialIcons 
                        name={isFavorite ? "favorite" : "favorite-border"} 
                        size={28} 
                        color={isFavorite ? "#e74c3c" : "#0d730d"} 
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    imageContainer: {
        width: '100%',
        height: height * 0.5,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 100,
        backgroundColor: 'transparent',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        marginTop: -25,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    bookTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
        lineHeight: 32,
    },
    bookAuthor: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    availabilityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    available: {
        backgroundColor: '#0d730d',
    },
    notAvailable: {
        backgroundColor: '#A2A2A2',
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    stockInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    stockText: {
        fontSize: 14,
        color: '#666',
    },
    infoSection: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    genreTag: {
        alignSelf: 'flex-start',
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#0d730d',
    },
    genreText: {
        color: '#0d730d',
        fontSize: 14,
        fontWeight: '600',
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 24,
        color: '#444',
        textAlign: 'justify',
    },
    additionalInfo: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginRight: 8,
        minWidth: 100,
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    bottomActions: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        gap: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    requestButton: {
        flex: 1,
        backgroundColor: '#0d730d',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    requestButtonDisabled: {
        backgroundColor: '#ccc',
    },
    requestButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    favoriteButton: {
        width: 56,
        height: 56,
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
});

function alert(arg0: string) {
    throw new Error('Function not implemented.');
}
