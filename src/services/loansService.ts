// import firestore from '@react-native-firebase/firestore';
// import { Loan, NewLoan } from '../models/Loan';
// import { Book } from '../models/Book';
// import { NotificationsService } from './notificationsService';

// export const LoansService = {
//   // Solicitar un nuevo préstamo
//   async solicitarPrestamo(prestamoData: NewLoan): Promise<string> {
//     try {
//       const docRef = await firestore()
//         .collection('prestamos')
//         .add({
//           ...prestamoData,
//           fechaSolicitud: firestore.Timestamp.fromDate(prestamoData.fechaSolicitud),
//           fechaRecogida: firestore.Timestamp.fromDate(prestamoData.fechaRecogida),
//           fechaEntrega: firestore.Timestamp.fromDate(prestamoData.fechaEntrega),
//         });
      
//       return docRef.id;
//     } catch (error) {
//       console.error('Error solicitando préstamo:', error);
//       throw error;
//     }
//   },

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

//       // Después de actualizar estados, verificar notificaciones
//       await this.verificarYNotificarPrestamos();
//     } catch (error) {
//       console.error('Error actualizando estados:', error);
//     }
//   },

//   // ========================================
//   // NUEVOS MÉTODOS PARA NOTIFICACIONES
//   // ========================================

//   /**
//    * Verificar y generar notificaciones para préstamos próximos a vencer
//    * Esta función se ejecuta automáticamente
//    */
//   async verificarYNotificarPrestamos(): Promise<string[]> {
//     try {
//       // Obtener todos los préstamos activos
//       const snapshot = await firestore()
//         .collection('prestamos')
//         .where('activo', '==', true)
//         .where('estado', '==', 'activo')
//         .get();

//       const notificacionesGeneradas: string[] = [];

//       for (const doc of snapshot.docs) {
//         const data = doc.data();
//         const prestamoId = doc.id;
        
//         // Obtener datos del libro
//         const bookSnapshot = await firestore()
//           .collection('libros')
//           .doc(data.bookId)
//           .get();
        
//         if (!bookSnapshot.exists) continue;

//         const bookData = bookSnapshot.data() as Book;

//         // Calcular días restantes
//         const fechaEntrega = data.fechaEntrega?.toDate();
//         if (!fechaEntrega) continue;

//         const hoy = new Date();
//         hoy.setHours(0, 0, 0, 0);
//         const fechaEntregaSinHora = new Date(fechaEntrega);
//         fechaEntregaSinHora.setHours(0, 0, 0, 0);
        
//         const diferencia = fechaEntregaSinHora.getTime() - hoy.getTime();
//         const diasRestantes = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

//         // Actualizar días restantes en el préstamo
//         await firestore()
//           .collection('prestamos')
//           .doc(prestamoId)
//           .update({ diasRestantes });

//         // Construir objeto Loan completo
//         const prestamo: Loan = {
//           id: prestamoId,
//           userId: data.userId,
//           bookId: data.bookId,
//           fechaSolicitud: data.fechaSolicitud?.toDate() || new Date(),
//           fechaRecogida: data.fechaRecogida?.toDate() || new Date(),
//           fechaEntrega: fechaEntrega,
//           estado: data.estado || 'activo',
//           activo: data.activo !== false,
//           diasRestantes: diasRestantes,
//           bookData: {
//             ...bookData,
//             id: bookSnapshot.id
//           } as Book
//         };

//         // Solo generar notificación para 2 días o 1 día
//         if (diasRestantes === 2 || diasRestantes === 1) {
//           // Verificar si ya existe una notificación para este préstamo y días específicos
//           const notificacionExistente = await firestore()
//             .collection('notificaciones')
//             .where('prestamoId', '==', prestamoId)
//             .where('diasRestantes', '==', diasRestantes)
//             .get();

//           if (notificacionExistente.empty) {
//             await NotificationsService.generarNotificacionesPrestamos(prestamo);
//             notificacionesGeneradas.push(prestamoId);
//           }
//         }

//         // Notificación para préstamos vencidos
//         if (diasRestantes <= 0 && data.estado === 'activo') {
//           // Marcar como expirado
//           await firestore()
//             .collection('prestamos')
//             .doc(prestamoId)
//             .update({ 
//               estado: 'expirado',
//               diasRestantes: 0
//             });

//           // Verificar si ya existe notificación de vencimiento
//           const notifVencimiento = await firestore()
//             .collection('notificaciones')
//             .where('prestamoId', '==', prestamoId)
//             .where('tipo', '==', 'prestamo_vencido')
//             .get();

//           if (notifVencimiento.empty) {
//             const prestamoVencido: Loan = {
//               ...prestamo,
//               estado: 'expirado',
//               diasRestantes: 0
//             };
//             await NotificationsService.generarNotificacionesPrestamos(prestamoVencido);
//             notificacionesGeneradas.push(prestamoId);
//           }
//         }
//       }

//       console.log(`✅ Notificaciones generadas para ${notificacionesGeneradas.length} préstamos`);
//       return notificacionesGeneradas;
//     } catch (error) {
//       console.error('❌ Error verificando préstamos:', error);
//       throw error;
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

  // ========================================
  // ACTUALIZAR ESTADOS Y VERIFICAR NOTIFICACIONES
  // ========================================
  async actualizarEstadosPrestamos(): Promise<void> {
    try {
      console.log('[LOANS] Iniciando actualización de estados...');
      
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      console.log('[LOANS] Fecha de hoy:', hoy.toISOString());

      // Obtener TODOS los préstamos activos (sin filtro de estado)
      const snapshot = await firestore()
        .collection('prestamos')
        .where('activo', '==', true)
        .get();

      console.log(`[LOANS] ${snapshot.size} préstamos con activo=true encontrados`);

      if (snapshot.empty) {
        console.log('[LOANS] No hay préstamos activos en la base de datos');
        return;
      }

      const batch = firestore().batch();
      let actualizados = 0;
      let notificacionesPendientes = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        console.log(`\n[LOANS] Analizando préstamo ${doc.id}:`);
        console.log(` - userId: ${data.userId}`);
        console.log(` - bookId: ${data.bookId}`);
        console.log(` - activo: ${data.activo}`);
        console.log(` - estado: ${data.estado}`);
        
        const fechaEntrega = data.fechaEntrega?.toDate();
        
        if (!fechaEntrega) {
          console.log('Sin fechaEntrega, saltando...');
          continue;
        }

        const fechaEntregaSinHora = new Date(fechaEntrega);
        fechaEntregaSinHora.setHours(0, 0, 0, 0);

        const diferencia = fechaEntregaSinHora.getTime() - hoy.getTime();
        const diasRestantes = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

        console.log(`- Fecha entrega: ${fechaEntrega.toLocaleDateString()}`);
        console.log(`- Días restantes: ${diasRestantes}`);

        // Actualizar días restantes en el préstamo
        batch.update(doc.ref, { diasRestantes });

        // Marcar como expirado si corresponde
        if (diasRestantes <= 0 && data.estado === 'activo') {
          console.log(`Préstamo VENCIDO, marcando como expirado`);
          batch.update(doc.ref, {
            estado: 'expirado',
            diasRestantes: 0
          });
          actualizados++;
        }

        // Guardar info para notificaciones
        if (diasRestantes === 2 || diasRestantes === 1 || (diasRestantes <= 0 && data.estado === 'activo')) {
          console.log(`Agregando a lista de notificaciones (${diasRestantes} días)`);
          notificacionesPendientes.push({
            prestamoId: doc.id,
            userId: data.userId,
            bookId: data.bookId,
            diasRestantes,
            fechaEntrega,
            fechaSolicitud: data.fechaSolicitud?.toDate() || new Date(),
            fechaRecogida: data.fechaRecogida?.toDate() || new Date(),
            estado: diasRestantes <= 0 ? 'expirado' : data.estado,
            activo: true,
          });
        } else {
          console.log(`No requiere notificación (${diasRestantes} días)`);
        }
      }

      // Aplicar cambios de estado
      if (snapshot.docs.length > 0) {
        console.log(`\n💾 [LOANS] Aplicando cambios en batch...`);
        await batch.commit();
        console.log(`[LOANS] Batch completado. ${actualizados} préstamos marcados como expirados`);
      }

      // Generar notificaciones
      console.log(`\n[LOANS] Generando ${notificacionesPendientes.length} notificaciones...`);
      
      if (notificacionesPendientes.length > 0) {
        await this.verificarYNotificarPrestamos(notificacionesPendientes);
      } else {
        console.log('ℹ[LOANS] No hay notificaciones pendientes para generar');
      }

    } catch (error) {
      const err = error as Error;
      console.error('[LOANS] Error actualizando estados:', err.message);
      console.error('[LOANS] Stack:', err.stack);
    }
  },

  // ========================================
  // VERIFICAR Y NOTIFICAR PRÉSTAMOS
  // ========================================
  async verificarYNotificarPrestamos(prestamosData?: any[]): Promise<string[]> {
    try {
      console.log('[NOTIF] Iniciando verificación de notificaciones...');

      let prestamos = prestamosData;

      // Si no se pasaron préstamos, obtenerlos de Firestore
      if (!prestamos) {
        console.log('[NOTIF] Obteniendo préstamos de Firestore...');
        const snapshot = await firestore()
          .collection('prestamos')
          .where('activo', '==', true)
          .where('estado', '==', 'activo')
          .get();

        prestamos = snapshot.docs.map(doc => ({
          prestamoId: doc.id,
          ...doc.data(),
        }));
      }

      console.log(`[NOTIF] ${prestamos.length} préstamos para verificar`);

      const notificacionesGeneradas: string[] = [];

      for (const prestamo of prestamos) {
        const { prestamoId, userId, bookId, diasRestantes } = prestamo;

        console.log(`[NOTIF] Verificando préstamo ${prestamoId} (${diasRestantes} días)`);

        // Obtener datos del libro
        const bookSnapshot = await firestore()
          .collection('libros')
          .doc(bookId)
          .get();

        if (!bookSnapshot.exists) {
          console.log(`Libro ${bookId} no encontrado`);
          continue;
        }

        const bookData = bookSnapshot.data() as Book;

        // Verificar si ya existe notificación para estos días específicos
        const notifQuery = await firestore()
          .collection('notificaciones')
          .where('prestamoId', '==', prestamoId)
          .where('diasRestantes', '==', diasRestantes)
          .get();

        if (!notifQuery.empty) {
          console.log(`Ya existe notificación para ${diasRestantes} días`);
          continue;
        }

        // Crear objeto Loan completo
        const loanCompleto: Loan = {
          id: prestamoId,
          userId: userId,
          bookId: bookId,
          fechaSolicitud: prestamo.fechaSolicitud || new Date(),
          fechaRecogida: prestamo.fechaRecogida || new Date(),
          fechaEntrega: prestamo.fechaEntrega || new Date(),
          estado: prestamo.estado || 'activo',
          activo: prestamo.activo !== false,
          diasRestantes: diasRestantes,
          bookData: {
            ...bookData,
            id: bookSnapshot.id,
          } as Book,
        };

        // Generar notificación según días restantes
        if (diasRestantes === 2 || diasRestantes === 1) {
          console.log(`Creando notificación para ${diasRestantes} días`);
          await NotificationsService.generarNotificacionesPrestamos(loanCompleto);
          notificacionesGeneradas.push(prestamoId);
        } else if (diasRestantes <= 0) {
          console.log(`Creando notificación de VENCIMIENTO`);
          await NotificationsService.generarNotificacionesPrestamos(loanCompleto);
          notificacionesGeneradas.push(prestamoId);
        }
      }

      console.log(`[NOTIF] ${notificacionesGeneradas.length} notificaciones generadas`);
      return notificacionesGeneradas;

    } catch (error) {
      console.error('[NOTIF] Error verificando préstamos:', error);
      throw error;
    }
  }
};