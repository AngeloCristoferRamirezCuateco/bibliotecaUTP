import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { useBooksViewModel } from '../viewModels/BooksViewModel';
import { buscarLibrosGoogleBooks } from '../services/bookImageService';
import { imagenesMap } from '../utils/imagenesFile';

type Props = NativeStackScreenProps<RootStackParamList, 'Books'>;

type MaterialIconName =
  | 'home'
  | 'recommend'
  | 'book'
  | 'favorite'
  | 'notifications'
  | 'person';

interface NavigationIcon {
  name: MaterialIconName;
  label: string;
}

const { width } = Dimensions.get('window');

const navigationIcons: NavigationIcon[] = [
  { name: 'home', label: 'Inicio' },
  { name: 'recommend', label: 'Recomendados' },
  { name: 'book', label: 'Préstamos' },
  { name: 'favorite', label: 'Favoritos' },
  { name: 'notifications', label: 'Notificaciones' },
  { name: 'person', label: 'Perfil' },
];

export default function BooksScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<MaterialIconName>('home');
  const [searchMode, setSearchMode] = useState<'local' | 'api'>('local');
  const [apiBooks, setApiBooks] = useState<Book[]>([]);
  const [loadingApi, setLoadingApi] = useState(false);

  const { books: localBooks, loading: loadingLocal } = useBooksViewModel();

  // Determinar qué libros mostrar
  const booksToDisplay = searchMode === 'api' ? apiBooks : localBooks;

  // Filtrado de libros locales
  const filteredBooks = booksToDisplay.filter(book =>
    (book.nombre?.toLowerCase() ?? '').includes(searchQuery.toLowerCase()) ||
    (book.autor?.toLowerCase() ?? '').includes(searchQuery.toLowerCase()) ||
    (book.genero?.toLowerCase() ?? '').includes(searchQuery.toLowerCase())
  );

  // Búsqueda en Google Books API
  const handleSearchGoogleBooks = async () => {
    if (!searchQuery.trim()) {
      setSearchMode('local');
      return;
    }

    setLoadingApi(true);
    setSearchMode('api');

    try {
      const results = await buscarLibrosGoogleBooks(searchQuery);
      setApiBooks(results);
    } catch (error) {
      console.error('Error buscando en Google Books:', error);
      setApiBooks([]);
    } finally {
      setLoadingApi(false);
    }
  };

  // Limpiar búsqueda y volver a libros locales
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchMode('local');
    setApiBooks([]);
  };

  const getImageSource = (item: Book) => {
    // Prioridad 1: URL de API de Google Books
    if (item.imagenURL) {
      return { uri: item.imagenURL };
    }
    
    // Prioridad 2: Imagen local del mapa
    if (item.imagen && imagenesMap[item.imagen]) {
      return imagenesMap[item.imagen];
    }
    
    // Sin imagen
    return null;
  };

  const renderBookItem = ({ item }: { item: Book }) => {
    const imageSource = getImageSource(item);
    
    return (
      <TouchableOpacity
        style={styles.bookCard}
        // onPress={() => navigation.navigate('BookInfo', { item })}
        onPress={() => navigation.navigate('BookInfo', { 
          item, 
          isFromAPI: searchMode === 'api' 
        })}
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
        {item.genero && (
          <Text style={styles.bookGenre} numberOfLines={1}>
            {item.genero}
          </Text>
        )}
        {searchMode === 'local' && (
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
        )}
        {searchMode === 'api' && (
          <View style={styles.apiBadge}>
            <Text style={styles.apiBadgeText}>Google Books</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderNavigationIcon = (icon: NavigationIcon, index: number) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.navIcon,
        activeTab === icon.name && styles.activeNavIcon,
      ]}
      onPress={() => {
        setActiveTab(icon.name);
        // Navegar según el ícono
        if (icon.name === 'favorite') {
          navigation.navigate('Favorites');
        } else if (icon.name === 'person') {
          navigation.navigate('Profile');
        } else if (icon.name === 'recommend') {
          navigation.navigate('Recommended');
        } else if (icon.name === 'book') {
          navigation.navigate('Loans');
        } else if (icon.name === 'notifications') {
          navigation.navigate('Notifications');
        }
      }}
    >
      <MaterialIcons
        name={icon.name}
        size={24}
        color={activeTab === icon.name ? '#00853e' : 'white'}
      />
    </TouchableOpacity>
  );

  const isLoading = loadingLocal || loadingApi;

  if (loadingLocal && searchMode === 'local') {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#00853e" />
        <Text style={styles.loadingText}>Cargando libros...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar libros..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchGoogleBooks}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
            <MaterialIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          onPress={handleSearchGoogleBooks} 
          style={styles.searchButton}
        >
          <MaterialIcons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Indicador de modo de búsqueda */}
      {searchMode === 'api' && (
        <View style={styles.modeIndicator}>
          <MaterialIcons name="cloud" size={16} color="#00853e" />
          <Text style={styles.modeText}>
            Resultados de Google Books
          </Text>
          <TouchableOpacity onPress={handleClearSearch}>
            <Text style={styles.backToLocalText}>Ver libros locales</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading de API */}
      {loadingApi && (
        <View style={styles.apiLoadingContainer}>
          <ActivityIndicator size="small" color="#0853e" />
          <Text style={styles.apiLoadingText}>Buscando en Google Books...</Text>
        </View>
      )}

      {/* Lista de libros */}
      <FlatList
        data={filteredBooks}
        renderItem={renderBookItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        numColumns={2}
        contentContainerStyle={styles.booksList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchMode === 'api' 
                ? 'No se encontraron resultados' 
                : 'No hay libros disponibles'}
            </Text>
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
  container: { flex: 1, backgroundColor: 'white' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f5f5f5', 
    margin: 16, 
    borderRadius: 12, 
    paddingHorizontal: 16 
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#333' },
  clearButton: { 
    padding: 4, 
    marginRight: 8 
  },
  searchButton: {
    backgroundColor: '#00853e',
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    gap: 8,
  },
  modeText: {
    flex: 1,
    fontSize: 14,
    color: '#00853e',
    fontWeight: '600',
  },
  backToLocalText: {
    fontSize: 12,
    color: '#00853e',
    textDecorationLine: 'underline',
  },
  apiLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  apiLoadingText: {
    fontSize: 14,
    color: '#666',
  },
  booksList: { paddingHorizontal: 8, paddingBottom: 80 },
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
  bookImage: { width: '100%', height: '100%' },
  bookTitle: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 4, 
    height: 40 
  },
  bookAuthor: { fontSize: 12, color: '#666', marginBottom: 4 },
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
  available: { backgroundColor: '#00853e' },
  notAvailable: { backgroundColor: '#A2A2A2' },
  availabilityText: { fontSize: 12, fontWeight: 'bold' },
  availableText: { color: 'white' },
  notAvailableText: { color: '#333' },
  apiBadge: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 6,
    alignItems: 'center',
  },
  apiBadgeText: {
    fontSize: 10,
    color: '#1976d2',
    fontWeight: '600',
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  bottomNavigation: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    backgroundColor: '#00853e', 
    paddingVertical: 12, 
    paddingHorizontal: 8, 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0 
  },
  navIcon: { padding: 8, borderRadius: 8 },
  activeNavIcon: { backgroundColor: '#ffffffff' },
});