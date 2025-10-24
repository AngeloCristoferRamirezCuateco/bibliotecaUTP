import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Book } from '../models/Book';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useBooksViewModel } from '../viewModels/BooksViewModel';
import { imagenesMap } from '../utils/imagenesFile';

type Props = NativeStackScreenProps<RootStackParamList, 'Recommended'>;

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

const { width } = Dimensions.get('window');

const navigationIcons: NavigationIcon[] = [
  { name: 'home', label: 'Inicio', route: 'Books' },
  { name: 'recommend', label: 'Recomendados', route: 'Recommended' },
  { name: 'book', label: 'Préstamos', route: 'Loans' },
  { name: 'credit-card', label: 'Pagos', route: 'Payments' },
  { name: 'favorite', label: 'Favoritos', route: 'Favorites' },
  { name: 'notifications', label: 'Notificaciones', route: 'Notifications' },
  { name: 'person', label: 'Perfil', route: 'Profile' },
];

// Mapeo de áreas con géneros relacionados
const areaGenerosMap: { [key: string]: string[] } = {
  'Negocios': ['Negocios', 'Economía', 'Administración', 'Emprendimiento', 'Finanzas', 'Marketing', 'Gestión'],
  'Gastronomía': ['Cocina', 'Gastronomía', 'Nutrición', 'Repostería', 'Bebidas', 'Alimentos', 'Recetas'],
  'Procesos Industriales': ['Ingeniería', 'Producción', 'Logística', 'Calidad', 'Manufactura', 'Procesos', 'Industrial'],
  'Mantenimiento Industrial': ['Mantenimiento', 'Mecánica', 'Electricidad', 'Instrumentación', 'Industrial', 'Técnica'],
  'Mecatrónica': ['Robótica', 'Electrónica', 'Automatización', 'Control', 'Programación', 'Mecatrónica', 'Sistemas'],
  'Sistemas Automotrices': ['Automotriz', 'Motores', 'Electromecánica', 'Diseño Automotriz', 'Automóviles', 'Transporte'],
  'Energías Alternativas y Medio Ambiente': ['Energía', 'Medio Ambiente', 'Sostenibilidad', 'Ecología', 'Renovable', 'Clima'],
  'Tecnologías de la Información': ['Programación', 'Tecnología', 'Informática', 'Redes', 'Base de Datos', 'Software', 'Computación']
};

export default function RecommendedScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<MaterialIconName>('recommend');
  const [recommendedBooks, setRecommendedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [userArea, setUserArea] = useState<string>('');

  const user = useSelector((state: RootState) => state.auth.user);
  const { books: allBooks, loading: loadingBooks } = useBooksViewModel();

  // Obtener libros recomendados basados en el área del usuario
useEffect(() => {
  if (user && allBooks.length > 0) {
    const userArea = user.area;
    setUserArea(userArea);
    
    if (userArea && areaGenerosMap[userArea]) {
      const generosRecomendados = areaGenerosMap[userArea];
      
      // Filtrar libros que coincidan con los géneros recomendados
        const librosFiltrados = allBooks.filter(book => {
        try {
            // Verificar que book.genero exista y no sea vacío
            if (!book.genero || typeof book.genero !== 'string' || book.genero.trim() === '') {
            return false;
            }
            
            const generoLibro = book.genero.toLowerCase().trim();
            
            return generosRecomendados.some(genero => {
            if (typeof genero !== 'string') return false;
            return generoLibro.includes(genero.toLowerCase());
            });
            
        } catch (error) {
            console.error('Error filtrando libro:', error, book);
            return false;
        }
        });

        setRecommendedBooks(librosFiltrados);
    } else {
      // Si no hay área definida o no está en el mapeo, mostrar todos los libros
        setRecommendedBooks(allBooks);
    }
    
    setLoading(false);
  }
}, [user, allBooks]);

  const getImageSource = (item: Book) => {
    if (item.imagenURL) {
      return { uri: item.imagenURL };
    }
    if (item.imagen && imagenesMap[item.imagen]) {
      return imagenesMap[item.imagen];
    }
    return null;
  };

  const renderBookItem = ({ item }: { item: Book }) => {
    const imageSource = getImageSource(item);
    
    return (
      <TouchableOpacity
        style={styles.bookCard}
        onPress={() => navigation.navigate('BookInfo', { item })}
      >
        <View style={styles.imageContainer}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.bookImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <MaterialIcons name="book" size={50} color="#ccc" />
            </View>
          )}
        </View>
        
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.nombre}
        </Text>
        
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {item.autor}
        </Text>
        
        {item.genero && item.genero.trim() !== '' && (
            <Text style={styles.bookGenre} numberOfLines={1}>
                {item.genero}
            </Text>
        )}
        
        <TouchableOpacity
          style={[
            styles.availabilityButton,
            item.disponible ? styles.available : styles.notAvailable,
          ]}
          disabled={!item.disponible}
        >
          <Text
            style={[
              styles.availabilityText,
              item.disponible ? styles.availableText : styles.notAvailableText,
            ]}
          >
            {item.disponible ? 'Disponible' : 'No Disponible'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderNavigationIcon = (icon: NavigationIcon, index: number) => {
    const isActive = icon.name === 'recommend';

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.navIcon,
          isActive && styles.activeNavIcon,
        ]}
        onPress={() => {
            if (!icon.route || icon.route === 'Recommended') return;
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

  if (loading || loadingBooks) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0d730d" />
        <Text style={styles.loadingText}>Cargando recomendaciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header informativo */}
      <View style={styles.headerContainer}>
        <MaterialIcons name="recommend" size={32} color="#0d730d" />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Libros Recomendados</Text>
          <Text style={styles.headerSubtitle}>
            {userArea ? 
              `Para tu área: ${userArea}` : 
              'Basado en tus intereses'
            }
          </Text>
        </View>
      </View>

        {/* Información de recomendación */}
        {userArea && areaGenerosMap[userArea] && recommendedBooks.length > 0 && (
        <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
            Libros de: {areaGenerosMap[userArea].join(', ')}
            </Text>
        </View>
        )}

      {/* Lista de libros recomendados */}
      <FlatList
        data={recommendedBooks}
        renderItem={renderBookItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        numColumns={2}
        contentContainerStyle={styles.booksList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="bookmark-border" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No hay recomendaciones</Text>
            <Text style={styles.emptySubtitle}>
              {userArea ? 
                `No encontramos libros relacionados con ${userArea}` :
                'Completa tu perfil para obtener recomendaciones personalizadas'
              }
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate('Books')}
            >
              <Text style={styles.exploreButtonText}>Explorar Todos los Libros</Text>
            </TouchableOpacity>
          </View>
        }
      />

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
    backgroundColor: 'white' 
  },
  centerContent: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0d730d',
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  infoContainer: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0d730d',
    textAlign: 'center',
    fontWeight: '500',
  },
  booksList: { 
    paddingHorizontal: 8, 
    paddingBottom: 80 
  },
  bookCard: { 
    flex: 1, 
    margin: 8, 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 3, 
    elevation: 3, 
    maxWidth: (width - 48) / 2 
  },
  imageContainer: { 
    width: '100%', 
    height: 250, 
    borderRadius: 8, 
    overflow: 'hidden', 
    marginBottom: 8, 
    backgroundColor: '#f0f0f0' 
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  bookImage: { 
    width: '100%', 
    height: '100%' 
  },
  bookTitle: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 4, 
    height: 40 
  },
  bookAuthor: { 
    fontSize: 12, 
    color: '#666', 
    marginBottom: 4 
  },
  bookGenre: { 
    fontSize: 11, 
    color: '#999', 
    fontStyle: 'italic', 
    marginBottom: 8 
  },
  availabilityButton: { 
    paddingVertical: 6, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 6 
  },
  available: { 
    backgroundColor: '#0d730d' 
  },
  notAvailable: { 
    backgroundColor: '#A2A2A2' 
  },
  availabilityText: { 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  availableText: { 
    color: 'white' 
  },
  notAvailableText: { 
    color: '#333' 
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 16, 
    color: '#666' 
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  exploreButton: {
    backgroundColor: '#0d730d',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  exploreButtonText: {
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
    right: 0 
  },
  navIcon: { 
    padding: 8, 
    borderRadius: 8 
  },
  activeNavIcon: { 
    backgroundColor: '#ffffffff' 
  },
});