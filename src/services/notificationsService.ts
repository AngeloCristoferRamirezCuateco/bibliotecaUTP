// src/services/notificationsService.ts
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { Notification, NotificationData } from '../models/Notification';
import { Loan } from '../models/Loan';

class NotificationsServiceClass {
    private notificationsCollection = firestore().collection('notificaciones');

    // Inicializar el servicio de notificaciones
    async initialize() {
        await this.setupPushNotifications();
        await this.requestUserPermission();
        await this.setupForegroundHandler();
        await this.setupBackgroundHandler();
    }

    // Configurar notificaciones push
    private async setupPushNotifications() {
        PushNotification.configure({
            onNotification: function (notification) {
                console.log('Notificación recibida:', notification);
            },
            permissions: {
                alert: true,
                badge: true,
                sound: true,
            },
            popInitialNotification: true,
            requestPermissions: Platform.OS === 'ios',
        });

        // Crear canal para Android
        PushNotification.createChannel(
            {
                channelId: 'prestamos-channel',
                channelName: 'Préstamos de Libros',
                channelDescription: 'Notificaciones sobre préstamos de libros',
                playSound: true,
                soundName: 'default',
                importance: 4,
                vibrate: true,
            },
            (created) => console.log(`Canal creado: ${created}`)
        );
    }

    // Solicitar permisos
    async requestUserPermission() {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            console.log('Permisos de notificación concedidos');
            const token = await messaging().getToken();
            console.log('FCM Token:', token);
            return token;
        }
        return null;
    }

    // Configurar handler para notificaciones en primer plano
    private async setupForegroundHandler() {
        messaging().onMessage(async remoteMessage => {
            console.log('Notificación en primer plano:', remoteMessage);
            
            if (remoteMessage.notification) {
                this.showLocalNotification(
                    remoteMessage.notification.title || 'Biblioteca',
                    remoteMessage.notification.body || '',
                    remoteMessage.data
                );
            }
        });
    }

    // Configurar handler para notificaciones en segundo plano
    private async setupBackgroundHandler() {
        messaging().setBackgroundMessageHandler(async remoteMessage => {
            console.log('Notificación en segundo plano:', remoteMessage);
        });
    }

    // Mostrar notificación local
    showLocalNotification(
        title: string,
        message: string,
        notificationData?: any
    ) {
        PushNotification.localNotification({
            channelId: 'prestamos-channel',
            title: title,
            message: message,
            playSound: true,
            soundName: 'default',
            importance: 'high',
            vibrate: true,
            vibration: 300,
            userInfo: notificationData || {},
            largeIcon: notificationData?.libroImagenURL || '',
            bigPictureUrl: notificationData?.libroImagenURL || '',
        } as any);
    }

    // Crear notificación en Firestore
    async crearNotificacion(data: NotificationData): Promise<string> {
        try {
            console.log('[NOTIF-SERVICE] Creando notificación en Firestore...');
            console.log('[NOTIF-SERVICE] Datos:', JSON.stringify(data, null, 2));
            
            const notificacion = {
                userId: data.userId,
                tipo: data.tipo,
                titulo: data.titulo,
                mensaje: data.mensaje,
                leida: false,
                fechaCreacion: firestore.Timestamp.now(),
                libroId: data.libroId || null,
                libroNombre: data.libroNombre || null,
                libroImagen: data.libroImagen || null,
                libroImagenURL: data.libroImagenURL || null,
                prestamoId: data.prestamoId || null,
                diasRestantes: data.diasRestantes || null,
            };

            console.log('[NOTIF-SERVICE] Guardando en Firestore...');
            const docRef = await this.notificationsCollection.add(notificacion);
            console.log('[NOTIF-SERVICE] Notificación guardada con ID:', docRef.id);
            
            // Mostrar notificación local (PUSH)
            console.log('[NOTIF-SERVICE] Mostrando notificación push local...');
            this.showLocalNotification(data.titulo, data.mensaje, {
                libroImagenURL: data.libroImagenURL,
                libroNombre: data.libroNombre,
                prestamoId: data.prestamoId,
                diasRestantes: data.diasRestantes
            });

            return docRef.id;
        } catch (error) {
            console.error('[NOTIF-SERVICE] Error creando notificación:', error);
            console.error('[NOTIF-SERVICE] Stack:', (error as Error).stack);
            throw error;
        }
    }

    // Obtener notificaciones del usuario
    async getNotificacionesUsuario(userId: string): Promise<Notification[]> {
        try {
            console.log('getNotificacionesUsuario llamado con userId:', userId);
            
            const snapshot = await this.notificationsCollection
                .where('userId', '==', userId)
                .orderBy('fechaCreacion', 'desc')
                .get();

            console.log('Documentos encontrados:', snapshot.size);
            
            if (snapshot.empty) {
                console.log('No se encontraron notificaciones para userId:', userId);
                return [];
            }

            const notifications = snapshot.docs.map(doc => {
                const data = doc.data();
                console.log('Documento:', doc.id, data);
                
                // Convertir fechaCreacion de manera segura
                let fechaCreacion = new Date();
                if (data.fechaCreacion) {
                    if (typeof data.fechaCreacion.toDate === 'function') {
                        fechaCreacion = data.fechaCreacion.toDate();
                    } else if (data.fechaCreacion instanceof Date) {
                        fechaCreacion = data.fechaCreacion;
                    } else if (typeof data.fechaCreacion === 'number') {
                        fechaCreacion = new Date(data.fechaCreacion);
                    }
                }
                
                return {
                    id: doc.id,
                    userId: data.userId || '',
                    tipo: data.tipo || 'general',
                    titulo: data.titulo || '',
                    mensaje: data.mensaje || '',
                    leida: data.leida || false,
                    fechaCreacion: fechaCreacion,
                    libroId: data.libroId || undefined,
                    libroNombre: data.libroNombre || undefined,
                    libroImagen: data.libroImagen || undefined,
                    libroImagenURL: data.libroImagenURL || undefined,
                    prestamoId: data.prestamoId || undefined,
                    diasRestantes: data.diasRestantes || undefined,
                } as Notification;
            });
            
            console.log('Notificaciones procesadas:', notifications.length);
            return notifications;
        } catch (error) {
            console.error('Error obteniendo notificaciones:', error);
            console.error('Error completo:', JSON.stringify(error, null, 2));
            throw error;
        }
    }

    // Marcar notificación como leída
    async marcarComoLeida(notificacionId: string): Promise<void> {
        try {
            await this.notificationsCollection.doc(notificacionId).update({
                leida: true,
            });
        } catch (error) {
            console.error('Error marcando notificación como leída:', error);
            throw error;
        }
    }

    // Marcar todas las notificaciones como leídas
    async marcarTodasComoLeidas(userId: string): Promise<void> {
        try {
            const snapshot = await this.notificationsCollection
                .where('userId', '==', userId)
                .where('leida', '==', false)
                .get();

            const batch = firestore().batch();
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { leida: true });
            });

            await batch.commit();
        } catch (error) {
            console.error('Error marcando todas como leídas:', error);
            throw error;
        }
    }

    // Eliminar notificación
    async eliminarNotificacion(notificacionId: string): Promise<void> {
        try {
            await this.notificationsCollection.doc(notificacionId).delete();
        } catch (error) {
            console.error('Error eliminando notificación:', error);
            throw error;
        }
    }

    // Obtener contador de notificaciones no leídas
    async getContadorNoLeidas(userId: string): Promise<number> {
        try {
            const snapshot = await this.notificationsCollection
                .where('userId', '==', userId)
                .where('leida', '==', false)
                .get();

            return snapshot.size;
        } catch (error) {
            console.error('Error obteniendo contador:', error);
            return 0;
        }
    }

    // Generar notificaciones para préstamos próximos a vencer
    async generarNotificacionesPrestamos(prestamo: Loan): Promise<void> {
        try {
            const diasRestantes = prestamo.diasRestantes;
            
            // Notificación para 2 días
            if (diasRestantes === 2) {
                await this.crearNotificacion({
                    userId: prestamo.userId,
                    tipo: 'prestamo_vence',
                    titulo: 'Préstamo próximo a vencer',
                    mensaje: `El préstamo del libro "${prestamo.bookData.nombre}" vence en 2 días`,
                    libroId: prestamo.bookId,
                    libroNombre: prestamo.bookData.nombre,
                    libroImagen: prestamo.bookData.imagen,
                    libroImagenURL: prestamo.bookData.imagenURL,
                    prestamoId: prestamo.id,
                    diasRestantes: 2,
                });
            }
            
            // Notificación para 1 día (mañana)
            if (diasRestantes === 1) {
                await this.crearNotificacion({
                    userId: prestamo.userId,
                    tipo: 'prestamo_vence',
                    titulo: 'Préstamo vence mañana',
                    mensaje: `El préstamo del libro "${prestamo.bookData.nombre}" vence mañana`,
                    libroId: prestamo.bookId,
                    libroNombre: prestamo.bookData.nombre,
                    libroImagen: prestamo.bookData.imagen,
                    libroImagenURL: prestamo.bookData.imagenURL,
                    prestamoId: prestamo.id,
                    diasRestantes: 1,
                });
            }

            // Notificación para préstamo vencido
            if (diasRestantes === 0 && prestamo.estado === 'expirado') {
                await this.crearNotificacion({
                    userId: prestamo.userId,
                    tipo: 'prestamo_vencido',
                    titulo: 'Préstamo vencido',
                    mensaje: `El préstamo del libro "${prestamo.bookData.nombre}" ha vencido. Por favor, devuélvelo lo antes posible.`,
                    libroId: prestamo.bookId,
                    libroNombre: prestamo.bookData.nombre,
                    libroImagen: prestamo.bookData.imagen,
                    libroImagenURL: prestamo.bookData.imagenURL,
                    prestamoId: prestamo.id,
                    diasRestantes: 0,
                });
            }
        } catch (error) {
            console.error('Error generando notificaciones de préstamo:', error);
        }
    }

    // Listener en tiempo real para notificaciones
    subscribeToNotifications(
        userId: string,
        callback: (notifications: Notification[]) => void
    ) {
        return this.notificationsCollection
            .where('userId', '==', userId)
            .orderBy('fechaCreacion', 'desc')
            .onSnapshot(
                snapshot => {
                    const notifications = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...(doc.data() as Omit<Notification, 'id'>),
                        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date(),
                    }));
                    callback(notifications);
                },
                error => {
                    console.error('Error en listener de notificaciones:', error);
                }
            );
    }
}

export const NotificationsService = new NotificationsServiceClass();