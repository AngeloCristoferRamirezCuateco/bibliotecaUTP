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
  | 'credit-card'
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
  { name: 'credit-card', label: 'Pagos' },
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
        }
      }}
    >
      <MaterialIcons
        name={icon.name}
        size={24}
        color={activeTab === icon.name ? 'black' : 'white'}
      />
    </TouchableOpacity>
  );

  const isLoading = loadingLocal || loadingApi;

  if (loadingLocal && searchMode === 'local') {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0d730d" />
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
          <MaterialIcons name="cloud" size={16} color="#0d730d" />
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
          <ActivityIndicator size="small" color="#0d730d" />
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
    backgroundColor: '#0d730d',
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
    color: '#0d730d',
    fontWeight: '600',
  },
  backToLocalText: {
    fontSize: 12,
    color: '#0d730d',
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
  available: { backgroundColor: '#0d730d' },
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
    backgroundColor: '#0d730d', 
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


// export default function BooksScreen({ navigation }: Props) {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [activeTab, setActiveTab] = useState<MaterialIconName>('home');

//   const { books, loading } = useBooksViewModel();

//   // Filtrado seguro, evitando errores si algun campo es undefined
//   const filteredBooks = books.filter(book =>
//     (book.nombre?.toLowerCase() ?? '').includes(searchQuery.toLowerCase()) ||
//     (book.autor?.toLowerCase() ?? '').includes(searchQuery.toLowerCase())
//   );

//   // Si en el futuro usas URLs desde Firestore, reemplaza este mapa
//   // const imagenesMap: Record<string, any> = {
//   //   "libro1.jpg": require('../assets/img/books/libro1.jpg'),
//   //   "donquijote.jpg": require('../assets/img/books/donquijote.jpg'),
//   //   "lasaventuras.jpg": require('../assets/img/books/lasaventuras.jpg'),
//   //   "losojos.jpg": require('../assets/img/books/losojos.jpg'),
//   //   "elprincipito.jpg": require('../assets/img/books/elprincipito.jpg'),
//   // };
//   const imagenesMap: Record<string, any> = {
//     "libro1.jpg": require('../assets/img/books/libro1.jpg'),
//     "donquijote.jpg": require('../assets/img/books/donquijote.jpg'),
//     "lasaventuras.jpg": require('../assets/img/books/lasaventuras.jpg'),
//     "losojos.jpg": require('../assets/img/books/losojos.jpg'),
//     "elprincipito.jpg": require('../assets/img/books/elprincipito.jpg'),
//   };

//   const renderBookItem = ({ item }: { item: Book }) => (

//     <TouchableOpacity
//       style={styles.bookCard}
//       onPress={() => navigation.navigate('BookInfo', {item})}
//     >
//       <View style={styles.imageContainer}>
//         {/* <Image
//           source={require(`../assets/img/${item.imagen}`)} //imagenesMap[item.imagen]
//           // source={require(`../assets/img/${item.imagen}`)} //imagenesMap[item.imagen]
//           style={styles.bookImage}
//           resizeMode="cover"
//         /> */}
//         <Image
//           source={imagenesMap[item.imagen]}
//           style={styles.bookImage}
//           resizeMode="cover"
//         />
//       </View>
//       <Text style={styles.bookTitle} numberOfLines={2}>
//         {item.nombre}
//       </Text>
//       <Text style={styles.bookAuthor} numberOfLines={1}>
//         {item.autor}
//       </Text>
//       <TouchableOpacity
//         style={[
//           styles.availabilityButton,
//           item.disponible ? styles.available : styles.notAvailable,
//         ]}
//         disabled={!item.disponible}
//       >
//         <Text
//           style={[
//             styles.availabilityText,
//             item.disponible ? styles.availableText : styles.notAvailableText,
//           ]}
//         >
//           {item.disponible ? 'Disponible' : 'No Disponible'}
//         </Text>
//       </TouchableOpacity>
//     </TouchableOpacity>
//   );

//   const renderNavigationIcon = (icon: NavigationIcon, index: number) => (
//     <TouchableOpacity
//       key={index}
//       style={[
//         styles.navIcon,
//         activeTab === icon.name && styles.activeNavIcon,
//       ]}
//       onPress={() => setActiveTab(icon.name)}
//     >
//       <MaterialIcons
//         name={icon.name}
//         size={24}
//         color={activeTab === icon.name ? 'black' : 'white'}
//       />
//     </TouchableOpacity>
//   );

//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <Text>Cargando libros...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Barra de búsqueda */}
//       <View style={styles.searchContainer}>
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Buscar libros..."
//           placeholderTextColor="#999"
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//         />
//         <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
//       </View>

//       {/* Lista de libros */}
//       <FlatList
//         data={filteredBooks}
//         renderItem={renderBookItem}
//         keyExtractor={item => item.id}
//         numColumns={2}
//         contentContainerStyle={styles.booksList}
//         showsVerticalScrollIndicator={false}
//       />

//       {/* Barra de navegación inferior */}
//       <View style={styles.bottomNavigation}>
//         {navigationIcons.map(renderNavigationIcon)}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: 'white' },
//   searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', margin: 16, borderRadius: 12, paddingHorizontal: 16 },
//   searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#333' },
//   searchIcon: { marginLeft: 8 },
//   booksList: { paddingHorizontal: 8, paddingBottom: 80 },
//   bookCard: { flex: 1, margin: 8, backgroundColor: 'white', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, maxWidth: (width - 48) / 2 },
//   imageContainer: { width: '100%', height: 250, borderRadius: 8, overflow: 'hidden', marginBottom: 8 },
//   bookImage: { width: '100%', height: '100%' },
//   bookTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4, height: 40 },
//   bookAuthor: { fontSize: 12, color: '#666', marginBottom: 8 },
//   availabilityButton: { paddingVertical: 6, borderRadius: 12, alignItems: 'center', marginTop: 6 },
//   available: { backgroundColor: '#0d730d' },
//   notAvailable: { backgroundColor: '#A2A2A2' },
//   availabilityText: { fontSize: 12, fontWeight: 'bold' },
//   availableText: { color: 'white' },
//   notAvailableText: { color: '#333' },
//   bottomNavigation: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#0d730d', paddingVertical: 12, paddingHorizontal: 8, position: 'absolute', bottom: 0, left: 0, right: 0 },
//   navIcon: { padding: 8, borderRadius: 8 },
//   activeNavIcon: { backgroundColor: '#313131' },
// });


// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   Dimensions,
//   FlatList,
// } from 'react-native';
// import { NativeStackScreenProps } from '@react-navigation/native-stack';
// import { RootStackParamList } from '../navigation/types';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import { Book }  from '../models/Book';
// import { useBooksViewModel } from '../viewModels/BooksViewModel';

// type Props = NativeStackScreenProps<RootStackParamList, 'Books'>;

// // Tipar los nombres de los íconos correctamente
// type MaterialIconName =
//   | 'home'
//   | 'recommend'
//   | 'book'
//   | 'credit-card'
//   | 'favorite'
//   | 'notifications'
//   | 'person';

// interface NavigationIcon {
//   name: MaterialIconName;
//   label: string;
// }

// const { width } = Dimensions.get('window');

// const mockBooks: Book[] = [
//   {
//     id: '1',
//     title: 'Los secretos de diseñar para triunfar',
//     author: 'Nombre de Autor',
//     available: true,
//     image: require('../assets/img/books/libro1.jpg'),
//   },
//   {
//     id: '2',
//     title: 'Libro 1',
//     author: 'Autor 1',
//     available: true,
//     image: require('../assets/img/books/libro1.jpg'),
//   },
//   {
//     id: '3',
//     title: 'Libro 2',
//     author: 'Autor 2',
//     available: false,
//     image: require('../assets/img/books/libro1.jpg'),
//   },
//   {
//     id: '4',
//     title: 'Libro 3',
//     author: 'Autor 3',
//     available: true,
//     image: require('../assets/img/books/libro1.jpg'),
//   },
//   {
//     id: '5',
//     title: 'Libro 4',
//     author: 'Autor 4',
//     available: true,
//     image: require('../assets/img/books/libro1.jpg'),
//   },
// ];

// const navigationIcons: NavigationIcon[] = [
//   { name: 'home', label: 'Inicio' },
//   { name: 'recommend', label: 'Recomendados' },
//   { name: 'book', label: 'Préstamos' },
//   { name: 'credit-card', label: 'Pagos' },
//   { name: 'favorite', label: 'Favoritos' },
//   { name: 'notifications', label: 'Notificaciones' },
//   { name: 'person', label: 'Perfil' },
// ];

// export default function BooksScreen({ navigation }: Props) {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [books, setBooks] = useState<Book[]>(mockBooks);
//   const [activeTab, setActiveTab] = useState<MaterialIconName>('home');

//   const filteredBooks = books.filter(book =>
//     book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     book.author.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const renderBookItem = ({ item }: { item: Book }) => (
//     <TouchableOpacity
//       style={styles.bookCard}
//       onPress={() => {
//         // Navegar a detalles del libro (por implementar)
//       }}
//     >
//       <View style={styles.imageContainer}>
//         <Image
//           source={item.image}
//           style={styles.bookImage}
//           resizeMode="cover"
//         />
//       </View>
//       <Text style={styles.bookTitle} numberOfLines={2}>
//         {item.title}
//       </Text>
//       <Text style={styles.bookAuthor} numberOfLines={1}>
//         {item.author}
//       </Text>
//       <View
//         style={[
//           styles.availabilityBadge,
//           item.available ? styles.available : styles.notAvailable,
//         ]}
//       >
//         <Text
//           style={[
//             styles.availabilityText,
//             item.available ? styles.availableText : styles.notAvailableText,
//           ]}
//         >
//           {item.available ? 'Disponible' : 'No Disponible'}
//         </Text>
//       </View>
//     </TouchableOpacity>
//   );

//   const renderNavigationIcon = (icon: NavigationIcon, index: number) => (
//     <TouchableOpacity
//       key={index}
//       style={[
//         styles.navIcon,
//         activeTab === icon.name && styles.activeNavIcon,
//       ]}
//       onPress={() => setActiveTab(icon.name)}
//     >
//       <MaterialIcons
//         name={icon.name}
//         size={24}
//         color={activeTab === icon.name ? 'black' : 'white'}
//       />
//     </TouchableOpacity>
//   );

//   return (
//     <View style={styles.container}>
//       {/* Barra de búsqueda */}
//       <View style={styles.searchContainer}>
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Buscar libros..."
//           placeholderTextColor="#999"
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//         />
//         <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
//       </View>

//       {/* Lista de libros */}
//       <FlatList
//         data={filteredBooks}
//         renderItem={renderBookItem}
//         keyExtractor={item => item.id}
//         numColumns={2}
//         contentContainerStyle={styles.booksList}
//         showsVerticalScrollIndicator={false}
//       />

//       {/* Barra de navegación inferior */}
//       <View style={styles.bottomNavigation}>
//         {navigationIcons.map(renderNavigationIcon)}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'white',
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f5f5f5',
//     margin: 16,
//     borderRadius: 12,
//     paddingHorizontal: 16,
//   },
//   searchInput: {
//     flex: 1,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: '#333',
//   },
//   searchIcon: {
//     marginLeft: 8,
//   },
//   booksList: {
//     paddingHorizontal: 8,
//     paddingBottom: 80, // Espacio para la barra de navegación
//   },
//   bookCard: {
//     flex: 1,
//     margin: 8,
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 12,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 3,
//     maxWidth: (width - 48) / 2, // Para 2 columnas con margen
//   },
//   imageContainer: {
//     width: '100%',
//     height: 250,
//     borderRadius: 8,
//     overflow: 'hidden',
//     marginBottom: 8,
//   },
//   bookImage: {
//     width: '100%',
//     height: '100%',
//   },
//   bookTitle: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 4,
//     height: 40,
//   },
//   bookAuthor: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 8,
//   },
//   availabilityBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     alignSelf: 'flex-start',
//   },
//   available: {
//     backgroundColor: '#0d730d',
//   },
//   notAvailable: {
//     backgroundColor: '#A2A2A2',
//   },
//   availabilityText: {
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   availableText: {
//     color: 'white',
//   },
//   notAvailableText: {
//     color: '#333',
//   },
//   bottomNavigation: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     backgroundColor: '#0d730d',
//     paddingVertical: 12,
//     paddingHorizontal: 8,
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//   },
//   navIcon: {
//     padding: 8,
//     borderRadius: 8,
//   },
//   activeNavIcon: {
//     backgroundColor: '#313131',
//   },
// });