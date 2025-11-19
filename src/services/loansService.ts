// import firestore from '@react-native-firebase/firestore';
// import { Loan, NewLoan } from '../models/Loan';
// import { Book } from '../models/Book';

// export const LoansService = {
//     // Solicitar un nuevo préstamo
//     async solicitarPrestamo(prestamoData: NewLoan): Promise<string> {
//         try {
//         const docRef = await firestore()
//             .collection('prestamos')
//             .add({
//             ...prestamoData,
//             fechaSolicitud: firestore.Timestamp.fromDate(prestamoData.fechaSolicitud),
//             fechaRecogida: firestore.Timestamp.fromDate(prestamoData.fechaRecogida),
//             fechaEntrega: firestore.Timestamp.fromDate(prestamoData.fechaEntrega),
//             });
        
//         return docRef.id;
//         } catch (error) {
//         console.error('Error solicitando préstamo:', error);
//         throw error;
//         }
//     },

//   // Obtener préstamos activos de un usuario
//   async getPrestamosActivos(userId: string): Promise<Loan[]> {
//     try {
//       const snapshot = await firestore()
//         .collection('prestamos')
//         .where('userId', '==', userId)
//         .where('activo', '==', true)
//         .orderBy('fechaEntrega', 'asc')
//         .get();

//       return snapshot.docs.map(doc => {
//         const data = doc.data();
//         return {
//           id: doc.id,
//           ...data,
//           fechaSolicitud: data.fechaSolicitud?.toDate() || new Date(),
//           fechaRecogida: data.fechaRecogida?.toDate() || new Date(),
//           fechaEntrega: data.fechaEntrega?.toDate() || new Date(),
//           fechaDevolucion: data.fechaDevolucion?.toDate(),
//         } as Loan;
//       });
//     } catch (error) {
//       console.error('Error obteniendo préstamos activos:', error);
//       throw error;
//     }
//   },

//   // Obtener historial de préstamos (entregados)
//   async getHistorialPrestamos(userId: string): Promise<Loan[]> {
//     try {
//       const snapshot = await firestore()
//         .collection('prestamos')
//         .where('userId', '==', userId)
//         .where('activo', '==', false)
//         .orderBy('fechaEntrega', 'desc')
//         .get();

//       return snapshot.docs.map(doc => {
//         const data = doc.data();
//         return {
//           id: doc.id,
//           ...data,
//           fechaSolicitud: data.fechaSolicitud?.toDate() || new Date(),
//           fechaRecogida: data.fechaRecogida?.toDate() || new Date(),
//           fechaEntrega: data.fechaEntrega?.toDate() || new Date(),
//           fechaDevolucion: data.fechaDevolucion?.toDate(),
//         } as Loan;
//       });
//     } catch (error) {
//       console.error('Error obteniendo historial:', error);
//       throw error;
//     }
//   },

//   // Cancelar un préstamo
//   async cancelarPrestamo(prestamoId: string): Promise<void> {
//     try {
//       await firestore()
//         .collection('prestamos')
//         .doc(prestamoId)
//         .update({
//           activo: false,
//           estado: 'cancelado',
//         });
//     } catch (error) {
//       console.error('Error cancelando préstamo:', error);
//       throw error;
//     }
//   },

//   // Verificar si usuario puede pedir más préstamos
//   async puedeSolicitarPrestamo(userId: string): Promise<{ puede: boolean; mensaje?: string }> {
//     try {
//       const prestamosActivos = await this.getPrestamosActivos(userId);
      
//       if (prestamosActivos.length >= 5) {
//         return { 
//           puede: false, 
//           mensaje: 'Has alcanzado el límite de 5 préstamos activos' 
//         };
//       }
      
//       return { puede: true };
//     } catch (error) {
//       console.error('Error verificando límite:', error);
//       throw error;
//     }
//   },

//   // Actualizar estado de préstamos (para marcar como expirados)
//   async actualizarEstadosPrestamos(): Promise<void> {
//     try {
//       const hoy = new Date();
//       const snapshot = await firestore()
//         .collection('prestamos')
//         .where('activo', '==', true)
//         .where('estado', '==', 'activo')
//         .get();

//       const batch = firestore().batch();

//       snapshot.docs.forEach(doc => {
//         const data = doc.data();
//         const fechaEntrega = data.fechaEntrega?.toDate();
        
//         if (fechaEntrega && fechaEntrega < hoy) {
//           batch.update(doc.ref, {
//             estado: 'expirado',
//             diasRestantes: 0
//           });
//         }
//       });

//       if (snapshot.docs.length > 0) {
//         await batch.commit();
//       }
//     } catch (error) {
//       console.error('Error actualizando estados:', error);
//     }
//   }
// };
import firestore from '@react-native-firebase/firestore';
import { Loan, NewLoan } from '../models/Loan';
import { Book } from '../models/Book';
import { NotificationsService } from './notificationsService';

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

      // Después de actualizar estados, verificar notificaciones
      await this.verificarYNotificarPrestamos();
    } catch (error) {
      console.error('Error actualizando estados:', error);
    }
  },

  // ========================================
  // NUEVOS MÉTODOS PARA NOTIFICACIONES
  // ========================================

  /**
   * Verificar y generar notificaciones para préstamos próximos a vencer
   * Esta función se ejecuta automáticamente
   */
  async verificarYNotificarPrestamos(): Promise<string[]> {
    try {
      // Obtener todos los préstamos activos
      const snapshot = await firestore()
        .collection('prestamos')
        .where('activo', '==', true)
        .where('estado', '==', 'activo')
        .get();

      const notificacionesGeneradas: string[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const prestamoId = doc.id;
        
        // Obtener datos del libro
        const bookSnapshot = await firestore()
          .collection('libros')
          .doc(data.bookId)
          .get();
        
        if (!bookSnapshot.exists) continue;

        const bookData = bookSnapshot.data() as Book;

        // Calcular días restantes
        const fechaEntrega = data.fechaEntrega?.toDate();
        if (!fechaEntrega) continue;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaEntregaSinHora = new Date(fechaEntrega);
        fechaEntregaSinHora.setHours(0, 0, 0, 0);
        
        const diferencia = fechaEntregaSinHora.getTime() - hoy.getTime();
        const diasRestantes = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

        // Actualizar días restantes en el préstamo
        await firestore()
          .collection('prestamos')
          .doc(prestamoId)
          .update({ diasRestantes });

        // Construir objeto Loan completo
        const prestamo: Loan = {
          id: prestamoId,
          userId: data.userId,
          bookId: data.bookId,
          fechaSolicitud: data.fechaSolicitud?.toDate() || new Date(),
          fechaRecogida: data.fechaRecogida?.toDate() || new Date(),
          fechaEntrega: fechaEntrega,
          estado: data.estado || 'activo',
          activo: data.activo !== false,
          diasRestantes: diasRestantes,
          bookData: {
            ...bookData,
            id: bookSnapshot.id
          } as Book
        };

        // Solo generar notificación para 2 días o 1 día
        if (diasRestantes === 2 || diasRestantes === 1) {
          // Verificar si ya existe una notificación para este préstamo y días específicos
          const notificacionExistente = await firestore()
            .collection('notificaciones')
            .where('prestamoId', '==', prestamoId)
            .where('diasRestantes', '==', diasRestantes)
            .get();

          if (notificacionExistente.empty) {
            await NotificationsService.generarNotificacionesPrestamos(prestamo);
            notificacionesGeneradas.push(prestamoId);
          }
        }

        // Notificación para préstamos vencidos
        if (diasRestantes <= 0 && data.estado === 'activo') {
          // Marcar como expirado
          await firestore()
            .collection('prestamos')
            .doc(prestamoId)
            .update({ 
              estado: 'expirado',
              diasRestantes: 0
            });

          // Verificar si ya existe notificación de vencimiento
          const notifVencimiento = await firestore()
            .collection('notificaciones')
            .where('prestamoId', '==', prestamoId)
            .where('tipo', '==', 'prestamo_vencido')
            .get();

          if (notifVencimiento.empty) {
            const prestamoVencido: Loan = {
              ...prestamo,
              estado: 'expirado',
              diasRestantes: 0
            };
            await NotificationsService.generarNotificacionesPrestamos(prestamoVencido);
            notificacionesGeneradas.push(prestamoId);
          }
        }
      }

      console.log(`✅ Notificaciones generadas para ${notificacionesGeneradas.length} préstamos`);
      return notificacionesGeneradas;
    } catch (error) {
      console.error('❌ Error verificando préstamos:', error);
      throw error;
    }
  }
};