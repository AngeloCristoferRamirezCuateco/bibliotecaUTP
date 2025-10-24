import firestore from '@react-native-firebase/firestore';
import { Loan, NewLoan } from '../models/Loan';
import { Book } from '../models/Book';

export const LoansService = {
    // Solicitar un nuevo préstamo
    async solicitarPrestamo(prestamoData: NewLoan): Promise<string> {
        try {
        const docRef = await firestore()
            .collection('prestamos')
            .add({
            ...prestamoData,
            fechaSolicitud: firestore.Timestamp.fromDate(prestamoData.fechaSolicitud),
            fechaRecogida: firestore.Timestamp.fromDate(prestamoData.fechaRecogida),
            fechaEntrega: firestore.Timestamp.fromDate(prestamoData.fechaEntrega),
            });
        
        return docRef.id;
        } catch (error) {
        console.error('Error solicitando préstamo:', error);
        throw error;
        }
    },

  // Obtener préstamos activos de un usuario
  async getPrestamosActivos(userId: string): Promise<Loan[]> {
    try {
      const snapshot = await firestore()
        .collection('prestamos')
        .where('userId', '==', userId)
        .where('activo', '==', true)
        .orderBy('fechaEntrega', 'asc')
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          fechaSolicitud: data.fechaSolicitud?.toDate() || new Date(),
          fechaRecogida: data.fechaRecogida?.toDate() || new Date(),
          fechaEntrega: data.fechaEntrega?.toDate() || new Date(),
          fechaDevolucion: data.fechaDevolucion?.toDate(),
        } as Loan;
      });
    } catch (error) {
      console.error('Error obteniendo préstamos activos:', error);
      throw error;
    }
  },

  // Obtener historial de préstamos (entregados)
  async getHistorialPrestamos(userId: string): Promise<Loan[]> {
    try {
      const snapshot = await firestore()
        .collection('prestamos')
        .where('userId', '==', userId)
        .where('activo', '==', false)
        .orderBy('fechaEntrega', 'desc')
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          fechaSolicitud: data.fechaSolicitud?.toDate() || new Date(),
          fechaRecogida: data.fechaRecogida?.toDate() || new Date(),
          fechaEntrega: data.fechaEntrega?.toDate() || new Date(),
          fechaDevolucion: data.fechaDevolucion?.toDate(),
        } as Loan;
      });
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      throw error;
    }
  },

  // Cancelar un préstamo
  async cancelarPrestamo(prestamoId: string): Promise<void> {
    try {
      await firestore()
        .collection('prestamos')
        .doc(prestamoId)
        .update({
          activo: false,
          estado: 'cancelado',
        });
    } catch (error) {
      console.error('Error cancelando préstamo:', error);
      throw error;
    }
  },

  // Verificar si usuario puede pedir más préstamos
  async puedeSolicitarPrestamo(userId: string): Promise<{ puede: boolean; mensaje?: string }> {
    try {
      const prestamosActivos = await this.getPrestamosActivos(userId);
      
      if (prestamosActivos.length >= 5) {
        return { 
          puede: false, 
          mensaje: 'Has alcanzado el límite de 5 préstamos activos' 
        };
      }
      
      return { puede: true };
    } catch (error) {
      console.error('Error verificando límite:', error);
      throw error;
    }
  },

  // Actualizar estado de préstamos (para marcar como expirados)
  async actualizarEstadosPrestamos(): Promise<void> {
    try {
      const hoy = new Date();
      const snapshot = await firestore()
        .collection('prestamos')
        .where('activo', '==', true)
        .where('estado', '==', 'activo')
        .get();

      const batch = firestore().batch();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const fechaEntrega = data.fechaEntrega?.toDate();
        
        if (fechaEntrega && fechaEntrega < hoy) {
          batch.update(doc.ref, {
            estado: 'expirado',
            diasRestantes: 0
          });
        }
      });

      if (snapshot.docs.length > 0) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Error actualizando estados:', error);
    }
  }
};