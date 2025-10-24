import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LoansService } from '../services/loansService';
import { Book } from '../models/Book';

type Props = NativeStackScreenProps<RootStackParamList, 'ApplyLoan'>;

export default function ApplyLoanScreen({ navigation, route }: Props) {
  const { book } = route.params;
  const [fechaRecogida, setFechaRecogida] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);
  const userId = user?.id;

  // Calcular fecha de entrega (5 días después de la recogida)
  const calcularFechaEntrega = (fechaRecogida: Date): Date => {
    const fechaEntrega = new Date(fechaRecogida);
    fechaEntrega.setDate(fechaEntrega.getDate() + 5);
    return fechaEntrega;
  };

  // Calcular días restantes
  const calcularDiasRestantes = (fechaEntrega: Date): number => {
    const hoy = new Date();
    const diffTime = fechaEntrega.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSolicitarPrestamo = async () => {
    if (!userId) {
      Alert.alert('Error', 'Debes iniciar sesión para solicitar préstamos');
      return;
    }

    // Validar que la fecha de recogida no sea en el pasado
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaRecogida < hoy) {
      Alert.alert('Error', 'La fecha de recogida no puede ser en el pasado');
      return;
    }

    try {
      setLoading(true);

      // Verificar si puede solicitar más préstamos
      const verificacion = await LoansService.puedeSolicitarPrestamo(userId);
      if (!verificacion.puede) {
        Alert.alert('Límite alcanzado', verificacion.mensaje);
        setLoading(false);
        return;
      }

      // Calcular fechas
      const fechaEntrega = calcularFechaEntrega(fechaRecogida);
      const diasRestantes = calcularDiasRestantes(fechaEntrega);

      // Crear préstamo
      await LoansService.solicitarPrestamo({
        userId,
        bookId: book.id,
        bookData: book,
        fechaSolicitud: new Date(),
        fechaRecogida,
        fechaEntrega,
        estado: 'activo',
        diasRestantes,
        activo: true,
      });

      Alert.alert(
        '¡Éxito!',
        `Préstamo solicitado correctamente\nDebes recoger el libro el ${fechaRecogida.toLocaleDateString()}\nFecha de entrega: ${fechaEntrega.toLocaleDateString()}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Loans'),
          },
        ]
      );

    } catch (error) {
      console.error('Error solicitando préstamo:', error);
      Alert.alert('Error', 'No se pudo solicitar el préstamo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFechaRecogida(selectedDate);
    }
  };

  const fechaEntrega = calcularFechaEntrega(fechaRecogida);
  const diasRestantes = calcularDiasRestantes(fechaEntrega);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Información del libro */}
        <View style={styles.bookInfoContainer}>
          <Text style={styles.bookTitle}>{book.nombre}</Text>
          <Text style={styles.bookAuthor}>por {book.autor}</Text>
          {book.genero && (
            <View style={styles.genreTag}>
              <Text style={styles.genreText}>{book.genero}</Text>
            </View>
          )}
        </View>

        {/* Selector de fecha */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Fecha de Recogida</Text>
          
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons name="event" size={24} color="#0d730d" />
            <Text style={styles.dateButtonText}>
              {fechaRecogida.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={fechaRecogida}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* Resumen del préstamo */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Resumen del Préstamo</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fecha de recogida:</Text>
              <Text style={styles.summaryValue}>{fechaRecogida.toLocaleDateString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fecha de entrega:</Text>
              <Text style={styles.summaryValue}>{fechaEntrega.toLocaleDateString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Días de préstamo:</Text>
              <Text style={styles.summaryValue}>5 días</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Días restantes:</Text>
              <Text style={[styles.summaryValue, styles.diasRestantes]}>
                {diasRestantes} días
              </Text>
            </View>
          </View>
        </View>

        {/* Botones */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.solicitarButton, loading && styles.buttonDisabled]}
            onPress={handleSolicitarPrestamo}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="book" size={22} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.solicitarButtonText}>Solicitar Préstamo</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  bookInfoContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  bookAuthor: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  genreTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0d730d',
  },
  genreText: {
    color: '#0d730d',
    fontSize: 12,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  dateButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  diasRestantes: {
    color: '#0d730d',
    fontWeight: 'bold',
  },
  buttonsContainer: {
    marginTop: 20,
  },
  solicitarButton: {
    backgroundColor: '#0d730d',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  solicitarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});