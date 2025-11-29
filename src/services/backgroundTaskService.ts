// // src/services/backgroundTaskService.ts
// import BackgroundFetch from 'react-native-background-fetch';
// import { LoansService } from './loansService';

// class BackgroundTaskServiceClass {
//     async initialize() {
//         try {
//             console.log('[BackgroundTask] 🚀 Iniciando configuración...');

//             // Configurar tarea en segundo plano
//             const status = await BackgroundFetch.configure(
//                 {
//                     minimumFetchInterval: 15, // Cada 15 minutos
//                     stopOnTerminate: false, // Continuar después de cerrar la app
//                     startOnBoot: true, // Iniciar cuando el dispositivo se reinicie
//                     enableHeadless: true, // Permitir ejecución sin interfaz
//                     requiresCharging: false, // No requiere estar cargando
//                     requiresDeviceIdle: false, // No requiere que el dispositivo esté inactivo
//                     requiresBatteryNotLow: false, // No requiere batería alta
//                     requiresStorageNotLow: false, // No requiere almacenamiento alto
//                 },
//                 async (taskId) => {
//                     console.log('[BackgroundTask] ⏰ Tarea iniciada:', taskId);

//                     try {
//                         // Verificar y generar notificaciones para préstamos
//                         const notificacionesGeneradas = await LoansService.verificarYNotificarPrestamos();
//                         console.log(`[BackgroundTask] ✅ ${notificacionesGeneradas.length} notificaciones generadas`);
//                     } catch (error) {
//                         console.error('[BackgroundTask] ❌ Error:', error);
//                     }

//                     // IMPORTANTE: Indicar que la tarea terminó
//                     BackgroundFetch.finish(taskId);
//                 },
//                 (taskId) => {
//                     // Callback para cuando la tarea expira (timeout)
//                     console.log('[BackgroundTask] ⏱️ Tarea expiró:', taskId);
//                     BackgroundFetch.finish(taskId);
//                 }
//             );

//             console.log('[BackgroundTask] ✅ Configuración completada. Estado:', status);

//             // Estados posibles:
//             // BackgroundFetch.STATUS_RESTRICTED = 0
//             // BackgroundFetch.STATUS_DENIED = 1
//             // BackgroundFetch.STATUS_AVAILABLE = 2

//             if (status === BackgroundFetch.STATUS_RESTRICTED) {
//                 console.warn('[BackgroundTask] ⚠️ Estado: RESTRICTED');
//             } else if (status === BackgroundFetch.STATUS_DENIED) {
//                 console.warn('[BackgroundTask] ⚠️ Estado: DENIED');
//             } else if (status === BackgroundFetch.STATUS_AVAILABLE) {
//                 console.log('[BackgroundTask] ✅ Estado: AVAILABLE');
//             }

//             return status;
//         } catch (error) {
//             console.error('[BackgroundTask] ❌ Error configurando:', error);
//             throw error;
//         }
//     }

//     // Detener tareas en segundo plano
//     async stop() {
//         try {
//             await BackgroundFetch.stop();
//             console.log('[BackgroundTask] 🛑 Detenido');
//         } catch (error) {
//             console.error('[BackgroundTask] ❌ Error deteniendo:', error);
//         }
//     }

//     // Verificar el estado de la tarea
//     async checkStatus() {
//         try {
//             const status = await BackgroundFetch.status();

//             let statusText = 'UNKNOWN';
//             switch (status) {
//                 case BackgroundFetch.STATUS_RESTRICTED:
//                     statusText = 'RESTRICTED';
//                     break;
//                 case BackgroundFetch.STATUS_DENIED:
//                     statusText = 'DENIED';
//                     break;
//                 case BackgroundFetch.STATUS_AVAILABLE:
//                     statusText = 'AVAILABLE';
//                     break;
//             }

//             console.log('[BackgroundTask] 📊 Estado:', statusText, `(${status})`);
//             return status;
//         } catch (error) {
//             console.error('[BackgroundTask] ❌ Error verificando estado:', error);
//             return null;
//         }
//     }

//     // Forzar una ejecución inmediata (útil para pruebas)
//     async scheduleTask() {
//         try {
//             await BackgroundFetch.scheduleTask({
//                 taskId: 'com.biblioteca.verificar-prestamos',
//                 delay: 0, // Ejecutar inmediatamente
//                 periodic: false,
//                 forceAlarmManager: true,
//                 stopOnTerminate: false,
//                 startOnBoot: true,
//             });
//             console.log('[BackgroundTask] ⏰ Tarea programada para ejecución inmediata');
//         } catch (error) {
//             console.error('[BackgroundTask] ❌ Error programando tarea:', error);
//         }
//     }
// }

// export const BackgroundTaskService = new BackgroundTaskServiceClass();

// src/services/backgroundTaskService.ts
import BackgroundFetch from 'react-native-background-fetch';
import { LoansService } from './loansService';

class BackgroundTaskServiceClass {
    async initialize() {
        try {
            console.log('[BackgroundTask] Iniciando configuración...');

            const status = await BackgroundFetch.configure(
                {
                    minimumFetchInterval: 15, // ⭐ Cada 15 minutos
                    stopOnTerminate: false,
                    startOnBoot: true,
                    enableHeadless: true,
                    requiresCharging: false,
                    requiresDeviceIdle: false,
                    requiresBatteryNotLow: false,
                    requiresStorageNotLow: false,
                },
                async (taskId) => {
                    console.log('[BackgroundTask] Tarea iniciada:', taskId);

                    try {
                        await LoansService.actualizarEstadosPrestamos();
                        console.log('[BackgroundTask] Verificación completada');
                    } catch (error) {
                        console.error('[BackgroundTask] Error:', error);
                    }

                    BackgroundFetch.finish(taskId);
                },
                (taskId) => {
                    console.log('[BackgroundTask] Tarea expiró:', taskId);
                    BackgroundFetch.finish(taskId);
                }
            );

            console.log('[BackgroundTask] Estado:', status);
            return status;
        } catch (error) {
            console.error('[BackgroundTask] Error configurando:', error);
            throw error;
        }
    }

    async scheduleTask() {
        try {
            await BackgroundFetch.scheduleTask({
                taskId: 'com.biblioteca.verificar-prestamos',
                delay: 0,
                periodic: false,
                forceAlarmManager: true,
                stopOnTerminate: false,
                startOnBoot: true,
            });
            console.log('[BackgroundTask] Tarea inmediata programada');
        } catch (error) {
            console.error('[BackgroundTask] Error programando:', error);
        }
    }
}

export const BackgroundTaskService = new BackgroundTaskServiceClass();