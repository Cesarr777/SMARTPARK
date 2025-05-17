import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  Animated,
  Modal,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import io from 'socket.io-client';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const socket = io('http://192.168.1.71:5000');

const plazasDisponibles = [
  { 
    id: '1', 
    nombre: 'Plaza Rio', 
    ciudad: 'Tijuana', 
    disponibles: 45, 
    duracion: '3 hrs', 
    imagen: require('../../assets/RIO.png'),
    horario: '10:00 - 22:00' 
  },
  { 
    id: '2', 
    nombre: 'Plaza Peninsula', 
    ciudad: 'Tijuana', 
    disponibles: 32, 
    duracion: '2 hrs', 
    imagen: require('../../assets/penin.png'),
    horario: '09:00 - 21:00' 
  },
  { 
    id: '3', 
    nombre: 'Plaza Hipódromo', 
    ciudad: 'Tijuana', 
    disponibles: 18, 
    duracion: '4 hrs', 
    imagen: require('../../assets/hipodromo.png'),
    horario: '10:00 - 23:00' 
  },
  { 
    id: '4', 
    nombre: 'Landmark', 
    ciudad: 'Tijuana', 
    disponibles: 27, 
    duracion: '3 hrs', 
    imagen: require('../../assets/landmark.png'),
    horario: '11:00 - 22:00' 
  },
];

interface ParkingAppProps {
  navigation: NavigationProp<any>;
  route: RouteProp<any>;
}

const TabButton = ({ title, active, onPress }: { title: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.tabButton, active && styles.activeTab]}
    onPress={onPress}
  >
    <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
  </TouchableOpacity>
);

export default function ParkingAppScreen({ navigation, route }: ParkingAppProps) {
  const [activeTab, setActiveTab] = useState('estacionamientos');
  const [searchText, setSearchText] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedPlaza, setSelectedPlaza] = useState(null);
  const [filteredPlazas, setFilteredPlazas] = useState(plazasDisponibles);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [placas, setPlacas] = useState('');
  const [modelo, setModelo] = useState('');
  const [color, setColor] = useState('');
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [reservaExitosa, setReservaExitosa] = useState(false);

  useEffect(() => {
    if (searchText) {
      const results = plazasDisponibles.filter(plaza => 
        plaza.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
        plaza.ciudad.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredPlazas(results);
    } else {
      setFilteredPlazas(plazasDisponibles);
    }
  }, [searchText]);

  useEffect(() => {
    AsyncStorage.getItem('reservaExitosa').then(value => {
      setReservaExitosa(value === 'true');
    });
  }, []);

  const handleVerDetalle = (plaza) => {
    setSelectedPlaza(null);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
        navigation.navigate('MapaScreen', { plaza });
    });
  };

  const handleReservar = () => {
    navigation.navigate('InfoCarScreen', { availableSpots: 6 });
  };

  const handleSaveProfile = () => {
    setShowProfileModal(false);
    // Guardar perfil aquí si es necesario
  };

  const renderPlaza = ({ item }) => (
    <View style={styles.plazaCard}>
      <View style={styles.plazaImageContainer}>
        <Image
          source={item.imagen}
          style={styles.plazaImage}
          resizeMode="cover"
        />
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>{item.disponibles}</Text>
        </View>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.disponiblesText}>Disponible: {item.duracion}</Text>
        <Text style={styles.horarioText}>{item.horario}</Text>
      </View>
      <TouchableOpacity
        style={styles.estrenoButton}
        onPress={handleReservar}
      >
        <Text style={styles.estrenoText}>Reservar</Text>
      </TouchableOpacity>
      <Text style={styles.plazaTitle}>{item.nombre}</Text>
      <Text style={styles.ciudadText}>{item.ciudad}</Text>
      <TouchableOpacity onPress={() => handleVerDetalle(item)}>
        <Text style={styles.verMasText}>Ver disponibilidad <Ionicons name="information-circle-outline" size={16} color="#4a90e2" /></Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0c1631" barStyle="light-content" />
      {/* Barra superior */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => alert('Notificaciones')}>
          <Ionicons name="notifications-outline" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.tabsContainer}>
          <TabButton 
            title="Estacionamientos" 
            active={activeTab === 'estacionamientos'} 
            onPress={() => setActiveTab('estacionamientos')} 
          />
          <TabButton 
            title="Reservar Cajones"
            active={activeTab === 'reservar'}
            onPress={() => {
              setActiveTab('reservar');
              navigation.navigate('InfoCarScreen', { availableSpots: 6 });
            }}
          />
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => setShowProfileModal(true)}>
          <Ionicons name="person-circle-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>
      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <View style={styles.locationButton}>
          <Ionicons name="location" size={24} color="white" />
          <Text style={styles.locationText}>Estacionamientos</Text>
        </View>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => setShowSearchModal(true)}
        >
          <Text style={styles.searchText}>
            {selectedPlaza ? selectedPlaza.nombre : "Buscar plaza..."}
          </Text>
          {selectedPlaza && (
            <TouchableOpacity 
              style={styles.closeSearchIcon}
              onPress={() => setSelectedPlaza(null)}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
      {/* Contenido principal */}
      <ScrollView style={styles.content}>
        <FlatList
          data={selectedPlaza ? [selectedPlaza] : filteredPlazas}
          renderItem={renderPlaza}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.plazasList}
          numColumns={2}
        />
      </ScrollView>
      {/* Barra inferior de navegación */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('estacionamientos')}>
          <Ionicons name="car" size={24} color={activeTab === 'estacionamientos' ? "#4a90e2" : "#8e9aaf"} />
          <Text style={[styles.navText, activeTab === 'estacionamientos' && styles.activeNavText]}>Plazas</Text>
        </TouchableOpacity>
        {/* Mensajes: Candado y color rojo si no ha reservado */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            if (reservaExitosa) {
              navigation.navigate('MessageScreen');
            } else {
              Alert.alert('Función bloqueada', 'Debes reservar un cajón para enviar mensajes.');
            }
          }}
          disabled={!reservaExitosa}
        >
          <Ionicons
            name={reservaExitosa ? "mail-outline" : "lock-closed-outline"}
            size={24}
            color={reservaExitosa ? "#8e9aaf" : "#d63031"}
          />
          <Text style={[styles.navText, !reservaExitosa && { color: '#d63031' }]}>
            Mensajes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('ClubScreen')}
        >
          <Ionicons name="card-outline" size={24} color="#8e9aaf" />
          <Text style={styles.navText}>Club</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => alert('Mis reservas')}>
          <Ionicons name="time-outline" size={24} color="#8e9aaf" />
          <Text style={styles.navText}>Mis reservas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => alert('Más')}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#8e9aaf" />
          <Text style={styles.navText}>Más</Text>
        </TouchableOpacity>
      </View>
      {/* Modal de búsqueda */}
      <Modal visible={showSearchModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Buscar Plaza</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Escribe nombre de plaza o ciudad..."
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
            <FlatList
              data={filteredPlazas}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => {
                    setSelectedPlaza(item);
                    setShowSearchModal(false);
                  }}
                >
                  <Text style={styles.searchResultName}>{item.nombre}</Text>
                  <Text style={styles.searchResultCity}>{item.ciudad}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <Text style={styles.noResultsText}>No se encontraron plazas</Text>
              )}
            />
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setShowSearchModal(false)}
            >
              <Text style={styles.closeModalText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Modal de perfil */}
      <Modal visible={showProfileModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mi Perfil</Text>
            <View style={styles.profileForm}>
              <Text style={styles.inputLabel}>Nombre de usuario</Text>
              <TextInput
                style={styles.profileInput}
                placeholder="Tu nombre"
                value={usuario}
                onChangeText={setUsuario}
              />
              <Text style={styles.inputLabel}>Placas del vehículo</Text>
              <TextInput
                style={styles.profileInput}
                placeholder="ABC-123"
                value={placas}
                onChangeText={setPlacas}
                autoCapitalize="characters"
              />
              <Text style={styles.inputLabel}>Modelo del vehículo</Text>
              <TextInput
                style={styles.profileInput}
                placeholder="Ej: Honda Civic 2020"
                value={modelo}
                onChangeText={setModelo}
              />
              <Text style={styles.inputLabel}>Color</Text>
              <TextInput
                style={styles.profileInput}
                placeholder="Ej: Rojo"
                value={color}
                onChangeText={setColor}
              />
            </View>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setShowProfileModal(false)}
            >
              <Text style={styles.closeModalText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c1631' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 15,
    backgroundColor: '#0c1631',
  },
  iconButton: { padding: 8 },
  tabsContainer: { flexDirection: 'row', flex: 1, justifyContent: 'center' },
  tabButton: { paddingVertical: 12, paddingHorizontal: 10 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#2e86de' },
  tabText: { color: '#8e9aaf', fontSize: 16, fontWeight: 'bold' },
  activeTabText: { color: 'white' },
  searchBar: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 12, backgroundColor: '#162244' },
  locationButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#3366ff',
    paddingVertical: 12, paddingHorizontal: 15, borderRadius: 25, marginRight: 10,
  },
  locationText: { color: 'white', fontWeight: 'bold', marginLeft: 5 },
  searchButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2d3d64',
    borderRadius: 25, paddingHorizontal: 15, paddingVertical: 10, justifyContent: 'space-between',
  },
  searchText: { color: 'white', flex: 1 },
  closeSearchIcon: { padding: 5 },
  content: { flex: 1, backgroundColor: '#0c1631' },
  plazasList: { padding: 10 },
  plazaCard: {
    width: width / 2 - 18,
    marginHorizontal: 8,
    marginBottom: 20,
    backgroundColor: '#0c1631',
  },
  plazaImageContainer: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 5,
    backgroundColor: '#2c3e50',
    elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2,
  },
  infoContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  disponiblesText: { color: '#42b883', fontSize: 14, fontWeight: 'bold' },
  horarioText: { color: '#e1b12c', fontSize: 12, fontWeight: '500' },
  plazaImage: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: '#42b883',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderTopRightRadius: 10,
  },
  labelText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  minutosText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginVertical: 5 },
  estrenoButton: { backgroundColor: '#3366ff', paddingVertical: 8, borderRadius: 20, alignItems: 'center', marginBottom: 8 },
  estrenoText: { color: 'white', fontWeight: 'bold' },
  plazaTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginTop: 5 },
  ciudadText: { color: '#8e9aaf', fontSize: 14, marginTop: 2 },
  verMasText: { color: '#4a90e2', fontSize: 14, marginTop: 8 },
  navbar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#162244', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#253253' },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  navText: { color: '#8e9aaf', fontSize: 12, marginTop: 4 },
  activeNavText: { color: '#4a90e2' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', width: '90%', borderRadius: 10, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  searchInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 15 },
  searchResultItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchResultName: { fontSize: 16, fontWeight: 'bold' },
  searchResultCity: { fontSize: 14, color: '#666' },
  noResultsText: { textAlign: 'center', marginVertical: 20, color: '#666' },
  closeModalButton: { backgroundColor: '#3366ff', paddingVertical: 12, borderRadius: 5, alignItems: 'center', marginTop: 15 },
  closeModalText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  profileForm: { marginBottom: 15 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  profileInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 15 },
  saveButton: { backgroundColor: '#42b883', paddingVertical: 12, borderRadius: 5, alignItems: 'center' },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
