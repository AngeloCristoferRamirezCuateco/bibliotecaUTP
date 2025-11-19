// src/screens/NotificationsScreen.tsx
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
import { Notification } from '../models/Notification';
import { NotificationsService } from '../services/notificationsService';
import { imagenesMap } from '../utils/imagenesFile';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

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
    { name: 'favorite', label: 'Favoritos', route: 'Favorites' },
    { name: 'notifications', label: 'Notificaciones', route: 'Notifications' },
    { name: 'person', label: 'Perfil', route: 'Profile' },
];

export default function NotificationsScreen({ navigation }: Props) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    
    const user = useSelector((state: RootState) => state.auth.user);
    const userId = user?.id;

    // Recargar notificaciones cada vez que la pantalla recibe foco
    useFocusEffect(
        useCallback(() => {
            loadNotifications();
        }, [userId])
    );

    // Suscribirse a notificaciones en tiempo real
    useEffect(() => {
        if (!userId) return;

        const unsubscribe = NotificationsService.subscribeToNotifications(
            userId,
            (newNotifications) => {
                setNotifications(newNotifications);
                const unread = newNotifications.filter(n => !n.leida).length;
                setUnreadCount(unread);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userId]);

    const loadNotifications = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const notifs = await NotificationsService.getNotificacionesUsuario(userId);
            setNotifications(notifs);
            const unread = await NotificationsService.getContadorNoLeidas(userId);
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error cargando notificaciones:', error);
            Alert.alert('Error', 'No se pudieron cargar las notificaciones');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await NotificationsService.marcarComoLeida(notificationId);
            // La actualización se hará automáticamente por el listener
        } catch (error) {
            console.error('Error marcando como leída:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!userId) return;

        try {
            await NotificationsService.marcarTodasComoLeidas(userId);
            Alert.alert('Éxito', 'Todas las notificaciones marcadas como leídas');
        } catch (error) {
            console.error('Error marcando todas como leídas:', error);
            Alert.alert('Error', 'No se pudieron marcar todas como leídas');
        }
    };

    const handleDeleteNotification = async (notificationId: string) => {
        Alert.alert(
            'Eliminar notificación',
            '¿Estás seguro de que quieres eliminar esta notificación?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setDeletingId(notificationId);
                            await NotificationsService.eliminarNotificacion(notificationId);
                        } catch (error) {
                            console.error('Error eliminando notificación:', error);
                            Alert.alert('Error', 'No se pudo eliminar la notificación');
                        } finally {
                            setDeletingId(null);
                        }
                    },
                },
            ]
        );
    };

    const getImageSource = (item: Notification) => {
        if (item.libroImagenURL) {
            return { uri: item.libroImagenURL };
        }
        if (item.libroImagen && imagenesMap[item.libroImagen]) {
            return imagenesMap[item.libroImagen];
        }
        return null;
    };

    const getNotificationIcon = (tipo: Notification['tipo']) => {
        switch (tipo) {
            case 'prestamo_vence':
                return { name: 'access-time' as const, color: '#f39c12' };
            case 'prestamo_vencido':
                return { name: 'error' as const, color: '#e74c3c' };
            case 'general':
            default:
                return { name: 'info' as const, color: '#3498db' };
        }
    };

    const getTimeAgo = (fecha: Date): string => {
        const ahora = new Date();
        const diferencia = ahora.getTime() - fecha.getTime();
        const minutos = Math.floor(diferencia / 60000);
        const horas = Math.floor(diferencia / 3600000);
        const dias = Math.floor(diferencia / 86400000);

        if (minutos < 1) return 'Ahora';
        if (minutos < 60) return `Hace ${minutos} min`;
        if (horas < 24) return `Hace ${horas}h`;
        if (dias < 7) return `Hace ${dias}d`;
        return fecha.toLocaleDateString();
    };

    const renderNotificationItem = ({ item }: { item: Notification }) => {
        const imageSource = getImageSource(item);
        const isDeleting = deletingId === item.id;
        const iconInfo = getNotificationIcon(item.tipo);

        return (
            <TouchableOpacity
                style={[
                    styles.notificationCard,
                    !item.leida && styles.unreadNotification
                ]}
                onPress={() => {
                    if (!item.leida) {
                        handleMarkAsRead(item.id);
                    }
                    // Si tiene libro asociado, navegar a BookInfo
                    if (item.libroId) {
                        // Aquí podrías navegar al detalle del libro si tienes los datos
                        navigation.navigate('Loans');
                    }
                }}
                disabled={isDeleting}
            >
                {/* Indicador de no leída */}
                {!item.leida && <View style={styles.unreadIndicator} />}

                {/* Imagen del libro o icono */}
                <View style={styles.notificationIconContainer}>
                    {imageSource ? (
                        <Image
                            source={imageSource}
                            style={styles.bookThumbnail}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.iconCircle, { backgroundColor: iconInfo.color + '20' }]}>
                            <MaterialIcons 
                                name={iconInfo.name} 
                                size={24} 
                                color={iconInfo.color} 
                            />
                        </View>
                    )}
                </View>

                {/* Contenido de la notificación */}
                <View style={styles.notificationContent}>
                    <Text style={[
                        styles.notificationTitle,
                        !item.leida && styles.boldText
                    ]} numberOfLines={2}>
                        {item.titulo}
                    </Text>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                        {item.mensaje}
                    </Text>
                    
                    {/* Información adicional del libro */}
                    {item.libroNombre && (
                        <View style={styles.bookInfoTag}>
                            <MaterialIcons name="book" size={14} color="#666" />
                            <Text style={styles.bookNameTag} numberOfLines={1}>
                                {item.libroNombre}
                            </Text>
                        </View>
                    )}

                    {/* Tiempo transcurrido */}
                    <Text style={styles.timeAgo}>
                        {getTimeAgo(item.fechaCreacion)}
                    </Text>
                </View>

                {/* Botón de eliminar */}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteNotification(item.id)}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <ActivityIndicator size="small" color="#95a5a6" />
                    ) : (
                        <MaterialIcons name="close" size={20} color="#95a5a6" />
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    const renderNavigationIcon = (icon: NavigationIcon, index: number) => {
        const isActive = icon.name === 'notifications';

        return (
            <TouchableOpacity
                key={index}
                style={[
                    styles.navIcon,
                    isActive && styles.activeNavIcon,
                ]}
                onPress={() => {
                    if (!icon.route || icon.route === 'Notifications') return;
                    navigation.navigate(icon.route as any);
                }}
            >
                <MaterialIcons
                    name={icon.name}
                    size={24}
                    color={isActive ? '#00853e' : 'white'}
                />
                {/* Badge de notificaciones no leídas */}
                {icon.name === 'notifications' && unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (!userId) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <MaterialIcons name="error-outline" size={64} color="#ccc" />
                <Text style={styles.errorText}>
                    Debes iniciar sesión para ver tus notificaciones
                </Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#00853e" />
                <Text style={styles.loadingText}>Cargando notificaciones...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header con opciones */}
            {/* <View style={styles.header}>
                <Text style={styles.headerTitle}>Notificaciones</Text>
                {unreadCount > 0 && (
                    <TouchableOpacity
                        style={styles.markAllButton}
                        onPress={handleMarkAllAsRead}
                    >
                        <Text style={styles.markAllButtonText}>
                            Marcar todas como leídas
                        </Text>
                    </TouchableOpacity>
                )}
            </View> */}

            {/* Lista de notificaciones */}
            {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="notifications-none" size={80} color="#ccc" />
                    <Text style={styles.emptyTitle}>No tienes notificaciones</Text>
                    <Text style={styles.emptySubtitle}>
                        Te notificaremos cuando haya actualizaciones importantes
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
                    data={notifications}
                    renderItem={renderNotificationItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.notificationsList}
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
        backgroundColor: '#f8f9fa',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    markAllButton: {
        alignSelf: 'flex-start',
    },
    markAllButtonText: {
        color: '#00853e',
        fontSize: 14,
        fontWeight: '600',
    },
    notificationsList: {
        padding: 8,
        paddingBottom: 80,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        position: 'relative',
    },
    unreadNotification: {
        backgroundColor: '#f0f9f4',
        borderLeftWidth: 4,
        borderLeftColor: '#00853e',
    },
    unreadIndicator: {
        position: 'absolute',
        left: 12,
        top: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00853e',
    },
    notificationIconContainer: {
        marginRight: 12,
        marginLeft: 4,
    },
    bookThumbnail: {
        width: 60,
        height: 80,
        borderRadius: 8,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationContent: {
        flex: 1,
        justifyContent: 'center',
    },
    notificationTitle: {
        fontSize: 15,
        color: '#333',
        marginBottom: 4,
    },
    boldText: {
        fontWeight: 'bold',
    },
    notificationMessage: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
        lineHeight: 20,
    },
    bookInfoTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    bookNameTag: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
        maxWidth: 150,
    },
    timeAgo: {
        fontSize: 12,
        color: '#999',
    },
    deleteButton: {
        padding: 4,
        justifyContent: 'center',
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
        backgroundColor: '#00853e',
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
        backgroundColor: '#00853e',
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
        position: 'relative',
    },
    activeNavIcon: {
        backgroundColor: '#fff',
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#e74c3c',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});