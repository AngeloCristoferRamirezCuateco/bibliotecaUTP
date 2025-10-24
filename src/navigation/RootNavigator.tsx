import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';
import BooksScreen from '../screens/BooksScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import { BookInformation } from '../screens/BookInfo';
import RecommendedScreen from '../screens/RecommendedScreen';
import LoansScreen from '../screens/LoanScreen';
import ApplyLoanScreen from '../screens/ApplyLoanScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Iniciar Sesión', headerShown: false }}
      />
      <Stack.Screen
        name="Books"
        component={BooksScreen}
        options={{
          title: 'Biblioteca UTP',
          headerStyle: {
            backgroundColor: '#0d730d',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackVisible: false, // ← ESTA LÍNEA QUITA LA FLECHA DE REGRESAR
          headerLeft: () => null,
        }}
      />
      <Stack.Screen  //<-- Definimos como sera encontrado/importado nuestra vista/componente al resto de vistas
        name="BookInfo" //<--Nombre de la vista
        component={BookInformation} //<-- Componente al que hace referencia
        options={{ //<--Opciones :D
          title: 'Información de Libro', //<--Titulo del encabezado
          headerStyle: { //<--Color del encabezado
            backgroundColor: '#0d730d', 
          },
          headerTintColor: 'white', //<--Color del texto del encabezado
          headerTitleStyle: { //<--Estilo para la letra del encabezado
            fontWeight: 'bold', 
          },
          headerBackVisible: false, // ← ESTA LÍNEA QUITA LA FLECHA DE REGRESAR
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'Favoritos',
          headerStyle: {
            backgroundColor: '#0d730d',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackVisible: false, // ← ESTA LÍNEA QUITA LA FLECHA DE REGRESAR
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          headerStyle: {
            backgroundColor: '#0d730d',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackVisible: false, // ← ESTA LÍNEA QUITA LA FLECHA DE REGRESAR
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          title: 'Cambiar Contraseña',
          headerStyle: {
            backgroundColor: '#0d730d',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          }
        }}
      />
      <Stack.Screen
        name="Recommended"
        component={RecommendedScreen}
        options={{
          title: 'Recomendados',
          headerStyle: {
            backgroundColor: '#0d730d',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackVisible: false, // ← ESTA LÍNEA QUITA LA FLECHA DE REGRESAR
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="Loans"
        component={LoansScreen}
        options={{
          title: 'Mis Préstamos',
          headerStyle: {
            backgroundColor: '#0d730d',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackVisible: false,
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="ApplyLoan"
        component={ApplyLoanScreen}
        options={{
          title: 'Solicitar Préstamo',
          headerStyle: {
            backgroundColor: '#0d730d',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          }
        }}
      />
    </Stack.Navigator>
  );
}
