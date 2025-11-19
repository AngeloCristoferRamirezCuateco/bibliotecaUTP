import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  Dimensions,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { AuthViewModel } from '../viewModels/AuthViewModel';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: Props) {
  const [matricula, setMatricula] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleLogin = async () => {
    if (!matricula || !contrasena) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      await AuthViewModel.login(matricula, contrasena);
      navigation.navigate('Books');
    } catch (error) {
      Alert.alert('Error', 'Credenciales incorrectas');
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Imagen de fondo */}
          <ImageBackground
            source={require('../assets/img/fondo.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            {/* Overlay con degradado */}
            <View style={styles.overlay}></View>
          </ImageBackground>

          {/* Contenido fuera del ImageBackground */}
          <View style={styles.contentContainer}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/img/utp.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Título */}
            <Text style={styles.title}>Inicio de Sesión</Text>

            {/* Contenedor del formulario */}
            <View style={styles.formContainer}>
              {/* Campo de Matrícula */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Matrícula</Text>
                <TextInput
                  style={styles.input}
                  value={matricula}
                  onChangeText={setMatricula}
                  placeholder="UTP0000000"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  keyboardType="default"
                  returnKeyType="next"
                />
              </View>

              {/* Campo de Contraseña */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={contrasena}
                    onChangeText={setContrasena}
                    placeholder="************"
                    placeholderTextColor="#999"
                    secureTextEntry={!mostrarContrasena}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setMostrarContrasena(!mostrarContrasena)}
                  >
                    <MaterialIcons
                      name={mostrarContrasena ? 'visibility' : 'visibility-off'}
                      size={24}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botón de Iniciar Sesión */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Espacio adicional para cuando el teclado está abierto */}
            <View style={styles.keyboardSpacer} />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  backgroundImage: {
    width: width,
    height: height * 0.5, // Ocupa la mitad de la pantalla
  },
  overlay: {
    width: width,
    height: height * 0.5, // Misma altura que el backgroundImage
    backgroundColor: 'rgba(0, 133, 62, 0.5)', // Degradado simulado con opacity
    // backgroundColor: 'rgba(13, 115, 13, 0.5)', // Degradado simulado con opacity
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: -height * 0.4, // Ajuste para superponer el formulario sobre la imagen
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 10,
  },
  eyeText: {
    fontSize: 20,
  },
  loginButton: {
    backgroundColor: '#00853e',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#7fb37f',
    opacity: 0.7,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  keyboardSpacer: {
    height: 100, // Espacio adicional para cuando el teclado está abierto
  },
});