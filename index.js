// /**
//  * @format
//  */

// import { AppRegistry } from 'react-native';
// import App from './App';
// import { name as appName } from './app.json';

// AppRegistry.registerComponent(appName, () => App);
/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import BackgroundFetch from 'react-native-background-fetch';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

// ============================================
// TAREA HEADLESS PARA VERIFICAR PRÉSTAMOS
// ============================================
const BackgroundFetchHeadlessTask = async (event) => {
    const taskId = event.taskId;
    const isTimeout = event.timeout;

    if (isTimeout) {
        console.log('[BackgroundFetch] Headless TIMEOUT:', taskId);
        BackgroundFetch.finish(taskId);
        return;
    }

    console.log('[BackgroundFetch] Headless event received:', taskId);

    try {
        // Importar y ejecutar verificación
        const firestore = require('@react-native-firebase/firestore').default;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Obtener préstamos activos
        const snapshot = await firestore()
            .collection('prestamos')
            .where('activo', '==', true)
            .get();

        console.log(`[Headless] ${snapshot.size} préstamos activos encontrados`);

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const fechaEntrega = data.fechaEntrega?.toDate();

            if (!fechaEntrega) continue;

            const fechaEntregaSinHora = new Date(fechaEntrega);
            fechaEntregaSinHora.setHours(0, 0, 0, 0);

            const diferencia = fechaEntregaSinHora.getTime() - hoy.getTime();
            const diasRestantes = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

            // Actualizar días restantes
            await firestore()
                .collection('prestamos')
                .doc(doc.id)
                .update({ diasRestantes });

            console.log(`[Headless] Préstamo ${doc.id}: ${diasRestantes} días restantes`);
        }

        console.log('[BackgroundFetch] Headless completado');
    } catch (error) {
        console.error('[BackgroundFetch] Headless error:', error);
    }

    BackgroundFetch.finish(taskId);
};

// Función auxiliar para verificar préstamos sin importar el servicio completo
async function verificarPrestamosHeadless() {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Obtener préstamos activos
        const snapshot = await firestore()
            .collection('prestamos')
            .where('activo', '==', true)
            .where('estado', '==', 'activo')
            .get();

        console.log(`[Headless] ${snapshot.size} préstamos activos encontrados`);

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const fechaEntrega = data.fechaEntrega?.toDate();

            if (!fechaEntrega) continue;

            const fechaEntregaSinHora = new Date(fechaEntrega);
            fechaEntregaSinHora.setHours(0, 0, 0, 0);

            const diferencia = fechaEntregaSinHora.getTime() - hoy.getTime();
            const diasRestantes = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

            // Actualizar días restantes
            await firestore()
                .collection('prestamos')
                .doc(doc.id)
                .update({ diasRestantes });

            // Si está vencido, marcar como expirado
            if (diasRestantes <= 0) {
                await firestore()
                    .collection('prestamos')
                    .doc(doc.id)
                    .update({
                        estado: 'expirado',
                        diasRestantes: 0
                    });
            }

            console.log(`[Headless] Préstamo ${doc.id}: ${diasRestantes} días restantes`);
        }
    } catch (error) {
        console.error('[Headless] Error verificando préstamos:', error);
    }
}

// ============================================
// HANDLER DE NOTIFICACIONES EN SEGUNDO PLANO
// ============================================
messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('[FCM] Mensaje en segundo plano:', remoteMessage);
});

// ============================================
// REGISTRAR TAREAS Y APLICACIÓN
// ============================================

// Registrar la tarea headless
BackgroundFetch.registerHeadlessTask(BackgroundFetchHeadlessTask);

// Registrar la aplicación
AppRegistry.registerComponent(appName, () => App);