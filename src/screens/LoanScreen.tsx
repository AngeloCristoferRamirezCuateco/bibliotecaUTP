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
    ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Loan } from '../models/Loan';
import { LoansService } from '../services/loansService';
import { imagenesMap } from '../utils/imagenesFile';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Loans'>;

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

type LoanSection = 'activos' | 'expirados' | 'historial';

export default function LoansScreen({ navigation }: Props) {
    const [prestamosActivos, setPrestamosActivos] = useState<Loan[]>([]);
    const [prestamosExpirados, setPrestamosExpirados] = useState<Loan[]>([]);
    const [prestamosHistorial, setPrestamosHistorial] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelingId, setCancelingId] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<LoanSection>('activos');
    
    const user = useSelector((state: RootState) => state.auth.user);
    const userId = user?.id;

    // Recargar préstamos cada vez que la pantalla recibe foco
    useFocusEffect(
        useCallback(() => {
            loadPrestamos();
            // Actualizar estados de préstamos (marcar expirados)
            LoansService.actualizarEstadosPrestamos();
        }, [userId])
    );

    const loadPrestamos = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            
            // Cargar todos los tipos de préstamos
            const [activos, historial] = await Promise.all([
                LoansService.getPrestamosActivos(userId),
                LoansService.getHistorialPrestamos(userId)
            ]);

            // Separar activos de expirados
            const activosFiltrados = activos.filter(p => p.estado === 'activo');
            const expiradosFiltrados = activos.filter(p => p.estado === 'expirado');
            const historialFiltrado = historial.filter(p => 
                p.estado === 'entregado' || p.estado === 'cancelado'
            );

            setPrestamosActivos(activosFiltrados);
            setPrestamosExpirados(expiradosFiltrados);
            setPrestamosHistorial(historialFiltrado);

        } catch (error) {
            console.error('Error cargando préstamos:', error);
            Alert.alert('Error', 'No se pudieron cargar los préstamos');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelarPrestamo = async (prestamoId: string) => {
        if (!userId) return;

        Alert.alert(
            'Cancelar Préstamo',
            '¿Estás seguro de que quieres cancelar este préstamo?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí, cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setCancelingId(prestamoId);
                            await LoansService.cancelarPrestamo(prestamoId);
                            // Recargar la lista
                            await loadPrestamos();
                        } catch (error) {
                            console.error('Error cancelando préstamo:', error);
                            Alert.alert('Error', 'No se pudo cancelar el préstamo');
                        } finally {
                            setCancelingId(null);
                        }
                    },
                },
            ]
        );
    };

    const getImageSource = (item: Loan) => {
        const book = item.bookData;
        if (book.imagenURL) {
            return { uri: book.imagenURL };
        }
        if (book.imagen && imagenesMap[book.imagen]) {
            return imagenesMap[book.imagen];
        }
        return null;
    };

    const getStatusInfo = (prestamo: Loan) => {
        const fechaEntrega = prestamo.fechaEntrega.toLocaleDateString();
        
        switch (prestamo.estado) {
            case 'activo':
                return {
                    tiempo: `${prestamo.diasRestantes} días`,
                    fecha: fechaEntrega,
                    color: '#0d730d',
                    texto: 'Para entregar'
                };
            case 'expirado':
                return {
                    tiempo: 'Tiempo expirado',
                    fecha: fechaEntrega,
                    color: '#e74c3c',
                    texto: 'Fecha límite pasada'
                };
            case 'entregado':
                return {
                    tiempo: 'Entregado',
                    fecha: fechaEntrega,
                    color: '#3498db',
                    texto: 'Fecha de entrega'
                };
            case 'cancelado':
                return {
                    tiempo: 'Cancelado',
                    fecha: fechaEntrega,
                    color: '#95a5a6',
                    texto: 'Fecha programada'
                };
            default:
                return {
                    tiempo: 'Desconocido',
                    fecha: fechaEntrega,
                    color: '#95a5a6',
                    texto: 'Fecha'
                };
        }
    };

    const renderLoanItem = ({ item }: { item: Loan }) => {
        const imageSource = getImageSource(item);
        const isCanceling = cancelingId === item.id;
        const statusInfo = getStatusInfo(item);
        const canCancel = item.estado === 'activo';

        return (
            <TouchableOpacity
                style={styles.loanCard}
                onPress={() => navigation.navigate('BookInfo', { item: item.bookData })}
                disabled={isCanceling}
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

                {/* Información del préstamo */}
                <View style={styles.loanInfo}>
                    <Text style={styles.bookTitle} numberOfLines={2}>
                        {item.bookData.nombre}
                    </Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>
                        {item.bookData.autor}
                    </Text>
                    {item.bookData.genero && (
                        <Text style={styles.bookGenre} numberOfLines={1}>
                            {item.bookData.genero}
                        </Text>
                    )}
                    
                    {/* Información del préstamo */}
                    <View style={styles.loanDetails}>
                        <View style={styles.timeInfo}>
                            <Text style={[styles.timeText, { color: statusInfo.color }]}>
                                {statusInfo.tiempo}
                            </Text>
                            <Text style={styles.dateLabel}>{statusInfo.texto}</Text>
                            <Text style={styles.dateText}>{statusInfo.fecha}</Text>
                        </View>
                        
                        <View style={styles.datesContainer}>
                            <Text style={styles.dateItem}>
                                Solicitud: {item.fechaSolicitud.toLocaleDateString()}
                            </Text>
                            <Text style={styles.dateItem}>
                                Recogida: {item.fechaRecogida.toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Botón de cancelar (solo para préstamos activos) */}
                {canCancel && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelarPrestamo(item.id)}
                        disabled={isCanceling}
                    >
                        {isCanceling ? (
                            <ActivityIndicator size="small" color="#e74c3c" />
                        ) : (
                            <MaterialIcons name="cancel" size={28} color="#e74c3c" />
                        )}
                    </TouchableOpacity>
                )}

                {/* Icono de estado para no activos */}
                {!canCancel && (
                    <View style={styles.statusIcon}>
                        <MaterialIcons 
                            name={
                                item.estado === 'expirado' ? 'error' :
                                item.estado === 'entregado' ? 'check-circle' :
                                'cancel'
                            } 
                            size={28} 
                            color={statusInfo.color} 
                        />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderNavigationIcon = (icon: NavigationIcon, index: number) => {
        const isActive = icon.name === 'book';

        return (
            <TouchableOpacity
                key={index}
                style={[
                    styles.navIcon,
                    isActive && styles.activeNavIcon,
                ]}
                onPress={() => {
                    if (!icon.route || icon.route === 'Loans') return;
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

    const getCurrentData = () => {
        switch (activeSection) {
            case 'activos': return prestamosActivos;
            case 'expirados': return prestamosExpirados;
            case 'historial': return prestamosHistorial;
            default: return [];
        }
    };

    const getSectionTitle = () => {
        switch (activeSection) {
            case 'activos': return 'Préstamos Activos';
            case 'expirados': return 'Préstamos Expirados';
            case 'historial': return 'Historial de Préstamos';
            default: return 'Préstamos';
        }
    };

    if (!userId) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <MaterialIcons name="error-outline" size={64} color="#ccc" />
                <Text style={styles.errorText}>
                    Debes iniciar sesión para ver tus préstamos
                </Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#0d730d" />
                <Text style={styles.loadingText}>Cargando préstamos...</Text>
            </View>
        );
    }

    const currentData = getCurrentData();

    return (
        <View style={styles.container}>
            {/* Header con selector de sección */}
            <View style={styles.sectionSelector}>
                <TouchableOpacity
                    style={[
                        styles.sectionButton,
                        activeSection === 'activos' && styles.activeSectionButton
                    ]}
                    onPress={() => setActiveSection('activos')}
                >
                    <Text style={[
                        styles.sectionButtonText,
                        activeSection === 'activos' && styles.activeSectionButtonText
                    ]}>
                        Activos ({prestamosActivos.length})
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[
                        styles.sectionButton,
                        activeSection === 'expirados' && styles.activeSectionButton
                    ]}
                    onPress={() => setActiveSection('expirados')}
                >
                    <Text style={[
                        styles.sectionButtonText,
                        activeSection === 'expirados' && styles.activeSectionButtonText
                    ]}>
                        Expirados ({prestamosExpirados.length})
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[
                        styles.sectionButton,
                        activeSection === 'historial' && styles.activeSectionButton
                    ]}
                    onPress={() => setActiveSection('historial')}
                >
                    <Text style={[
                        styles.sectionButtonText,
                        activeSection === 'historial' && styles.activeSectionButtonText
                    ]}>
                        Historial ({prestamosHistorial.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Lista de préstamos */}
            {currentData.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons 
                        name={
                            activeSection === 'activos' ? 'book' :
                            activeSection === 'expirados' ? 'error-outline' :
                            'history'
                        } 
                        size={80} 
                        color="#ccc" 
                    />
                    <Text style={styles.emptyTitle}>
                        {activeSection === 'activos' && 'No tienes préstamos activos'}
                        {activeSection === 'expirados' && 'No tienes préstamos expirados'}
                        {activeSection === 'historial' && 'No hay historial de préstamos'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {activeSection === 'activos' && 'Solicita un préstamo desde la pantalla de un libro'}
                        {activeSection === 'expirados' && 'Los préstamos expirados aparecerán aquí'}
                        {activeSection === 'historial' && 'Los préstamos entregados o cancelados aparecerán aquí'}
                    </Text>
                    {activeSection === 'activos' && (
                        <TouchableOpacity
                            style={styles.exploreButton}
                            onPress={() => navigation.navigate('Books')}
                        >
                            <Text style={styles.exploreButtonText}>Explorar Libros</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={currentData}
                    renderItem={renderLoanItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.loansList}
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
    sectionSelector: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        padding: 8,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
    },
    sectionButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeSectionButton: {
        backgroundColor: '#0d730d',
    },
    sectionButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    activeSectionButtonText: {
        color: '#fff',
    },
    loansList: {
        padding: 16,
        paddingBottom: 80,
    },
    loanCard: {
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
        alignItems: 'flex-start',
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
    loanInfo: {
        flex: 1,
        marginLeft: 12,
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
        marginBottom: 8,
    },
    loanDetails: {
        marginTop: 4,
    },
    timeInfo: {
        marginBottom: 8,
    },
    timeText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    dateLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    datesContainer: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 8,
    },
    dateItem: {
        fontSize: 11,
        color: '#888',
        marginBottom: 2,
    },
    cancelButton: {
        padding: 8,
        marginLeft: 8,
    },
    statusIcon: {
        padding: 8,
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        marginBottom: 80,
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