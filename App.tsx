// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { Provider } from 'react-redux';
// import { store } from './src/store';
// import RootNavigator from './src/navigation/RootNavigator';
// import '@react-native-firebase/app';
// import "./src/test/encryptTest";

// export default function App() {
//   return (
//     <Provider store={store}>
//       <NavigationContainer>
//         <RootNavigator />
//       </NavigationContainer>
//     </Provider>
//   );
// }

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import '@react-native-firebase/app';
import "./src/test/encryptTest";
import { NotificationsService } from './src/services/notificationsService';
import { BackgroundTaskService } from './src/services/backgroundTaskService';
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform, ActivityIndicator, View } from 'react-native';

// Función para solicitar permisos de notificaciones en Android 13+
async function requestNotificationPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Permiso de Notificaciones',
          message: 'La aplicación necesita permiso para enviarte notificaciones sobre tus préstamos',
          buttonNeutral: 'Preguntar después',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Aceptar',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Error solicitando permisos:', err);
      return false;
    }
  }
  return true;
}

// Handler para notificaciones en segundo plano (debe estar FUERA del componente)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Mensaje recibido en segundo plano:', remoteMessage);
});

function AppContent() {
  useEffect(() => {
    // Inicializar el servicio de notificaciones
    const initializeNotifications = async () => {
      try {
        console.log('Inicializando sistema de notificaciones...');
        
        // Solicitar permisos
        const hasPermission = await requestNotificationPermission();
        
        if (hasPermission) {
          // Inicializar el servicio de notificaciones
          await NotificationsService.initialize();
          
          // Obtener el token FCM
          const token = await messaging().getToken();
          console.log('Token FCM:', token);
          
          // Inicializar tareas en segundo plano
          await BackgroundTaskService.initialize();
          
          console.log('Sistema de notificaciones inicializado correctamente');
        } else {
          console.log('Permisos de notificación denegados');
        }
      } catch (error) {
        console.error('Error inicializando notificaciones:', error);
      }
    };

    initializeNotifications();

    // Listener para cuando el token se actualiza
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
      console.log('Token FCM actualizado:', token);
    });

    // Limpiar listeners
    return () => {
      unsubscribeTokenRefresh();
    };
  }, []);

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate 
        loading={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <ActivityIndicator size="large" color="#00853e" />
          </View>
        }
        persistor={persistor}
      >
        <AppContent />
      </PersistGate>
    </Provider>
  );
}