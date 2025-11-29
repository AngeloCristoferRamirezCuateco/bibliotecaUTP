// src/models/Notification.ts
export interface Notification {
    id: string;
    userId: string;
    tipo: 'prestamo_vence' | 'prestamo_vencido' | 'general';
    titulo: string;
    mensaje: string;
    leida: boolean;
    fechaCreacion: Date;
    
    // Datos relacionados (opcional)
    libroId?: string;
    libroNombre?: string;
    libroImagen?: string;
    libroImagenURL?: string;
    prestamoId?: string;
    diasRestantes?: number;
}

export interface NotificationData {
    userId: string;
    tipo: 'prestamo_vence' | 'prestamo_vencido' | 'general';
    titulo: string;
    mensaje: string;
    libroId?: string;
    libroNombre?: string;
    libroImagen?: string;
    libroImagenURL?: string;
    prestamoId?: string;
    diasRestantes?: number;
}