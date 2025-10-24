// src/screens/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AuthViewModel } from '../viewModels/AuthViewModel';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

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
  { name: 'credit-card', label: 'Pagos' },
  { name: 'favorite', label: 'Favoritos', route: 'Favorites' },
  { name: 'notifications', label: 'Notificaciones' },
  { name: 'person', label: 'Perfil', route: 'Profile' },
];

export default function ProfileScreen({ navigation }: Props) {
  const user = useSelector((state: RootState) => state.auth.user);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Calcular edad desde fechaNac
  const calcularEdad = (fechaNac: string): number => {
    if (!fechaNac) return 0;
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  };

  // Formatear fecha
  const formatearFecha = (fecha: string): string => {
    if (!fecha) return 'No disponible';
    
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const año = date.getFullYear();
    
    return `${dia}/${mes}/${año}`;
  };

    const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          onPress: () => console.log('Cancelado cerrar sesión'),
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          onPress: async () => {
            try {
              await AuthViewModel.logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error cerrando sesión:', error);
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };


  const confirmLogout = async () => {
    console.log('Confirmado cerrar sesión');
    try {
      setShowLogoutModal(false);
      await AuthViewModel.logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      setShowLogoutModal(false);
    }
  };

  const cancelLogout = () => {
    console.log('Cancelado cerrar sesión');
    setShowLogoutModal(false);
  };

  const renderNavigationIcon = (icon: NavigationIcon, index: number) => {
    const isActive = icon.name === 'person';

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.navIcon,
          isActive && styles.activeNavIcon,
        ]}
        onPress={() => {
            if (!icon.route || icon.route === 'Profile') return; 
            navigation.navigate(icon.route as any);
          
        }}
      >
        <MaterialIcons
          name={icon.name}
          size={24}
          color={isActive ? 'black' : 'white'}
        />
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialIcons name="error-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>
          No se pudo cargar la información del usuario
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.retryButtonText}>Volver al Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const edad = calcularEdad(user.fechaNac);
  const fechaFormateada = formatearFecha(user.fechaNac);

  return (
    <View style={styles.container}>
      {/* Header con imagen de fondo */}
      <View style={styles.headerContainer}>
        <Image
          source={require('../assets/img/fondo.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <View style={styles.headerOverlay}>
          <Text style={styles.headerTitle}>Información de Perfil</Text>
        </View>
        
        {/* Foto de perfil - AHORA DENTRO DEL HEADER */}
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImageWrapper}>
            <Image
              source={require('../assets/img/imagenPerfil.jpg')}
              style={styles.profileImage}
              resizeMode="cover"
            />
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Información principal */}
        <View style={styles.mainInfoContainer}>
          <Text style={styles.userName}>
            {user.nombre} {user.apellidos}
          </Text>
          <Text style={styles.userMatricula}>{user.matricula}</Text>
        </View>

        {/* Tarjeta de información */}
        <View style={styles.infoCard}>
          {/* Nombre de usuario */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>Nombre de usuario</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {user.nombre} {user.apellidos}
              </Text>
            </View>
          </View>

          {/* Correo de usuario */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>Correo de usuario</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{user.email}</Text>
            </View>
          </View>

          {/* Fecha y Edad */}
          <View style={styles.rowContainer}>
            <View style={[styles.infoSection, styles.halfWidth]}>
              <Text style={styles.sectionLabel}>Fecha</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>{fechaFormateada}</Text>
              </View>
            </View>

            <View style={[styles.infoSection, styles.halfWidth]}>
              <Text style={styles.sectionLabel}>Edad</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>{edad} años</Text>
              </View>
            </View>
          </View>

          {/* Información adicional */}
          <View style={styles.additionalInfo}>
            <View style={styles.additionalInfoRow}>
              <MaterialIcons name="phone" size={20} color="#0d730d" />
              <View style={styles.additionalInfoText}>
                <Text style={styles.additionalInfoLabel}>Teléfono</Text>
                <Text style={styles.additionalInfoValue}>{user.telefono}</Text>
              </View>
            </View>

            <View style={styles.additionalInfoRow}>
              <MaterialIcons name="person" size={20} color="#0d730d" />
              <View style={styles.additionalInfoText}>
                <Text style={styles.additionalInfoLabel}>Sexo</Text>
                <Text style={styles.additionalInfoValue}>
                  {user.sexo === 'M' ? 'Masculino' : user.sexo === 'F' ? 'Femenino' : user.sexo}
                </Text>
              </View>
            </View>

            <View style={styles.additionalInfoRow}>
              <MaterialIcons name="school" size={20} color="#0d730d" />
              <View style={styles.additionalInfoText}>
                <Text style={styles.additionalInfoLabel}>Carrera</Text>
                <Text style={styles.additionalInfoValue}>{user.carrera}</Text>
              </View>
            </View>

            <View style={styles.additionalInfoRow}>
              <MaterialIcons name="business" size={20} color="#0d730d" />
              <View style={styles.additionalInfoText}>
                <Text style={styles.additionalInfoLabel}>Área</Text>
                <Text style={styles.additionalInfoValue}>{user.area}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Botones de acción */}
        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <MaterialIcons name="lock" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.changePasswordButtonText}>
            Editar Contraseña
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout} //handleLogout
        >
          <MaterialIcons name="logout" size={20} color="#e74c3c" style={styles.buttonIcon} />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Espaciado para la barra inferior */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal de confirmación de cerrar sesión */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="logout" size={48} color="#e74c3c" />
            </View>
            
            <Text style={styles.modalTitle}>Cerrar Sesión</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que quieres cerrar sesión?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={cancelLogout}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={confirmLogout}
              >
                <Text style={styles.modalButtonConfirmText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    height: 200,
    position: 'relative',
    marginBottom: 70, // Espacio para la imagen de perfil que sobresale
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 115, 13, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileImageContainer: {
    position: 'absolute',
    bottom: -60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  profileImageWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fff',
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  mainInfoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userMatricula: {
    fontSize: 16,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 14,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  additionalInfo: {
    marginTop: 8,
  },
  additionalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  additionalInfoText: {
    marginLeft: 12,
    flex: 1,
  },
  additionalInfoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  additionalInfoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  changePasswordButton: {
    backgroundColor: '#0d730d',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  changePasswordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
  logoutButton: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e74c3c',
  },
  logoutButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#0d730d',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#0d730d',
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
  },
  activeNavIcon: {
    backgroundColor: '#fff',
  },
  // Estilos del Modal
    modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999, // 🔥 agregado
    elevation: 10, // 🔥 agregado para Android
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12, // 🔥 más alto que los demás
    zIndex: 99999, // 🔥 asegura que esté arriba
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonConfirm: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});