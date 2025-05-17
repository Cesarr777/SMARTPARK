import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  StatusBar,
} from 'react-native';
import { StripeProvider, CardField, useStripe } from '@stripe/stripe-react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';

// --- SOCKET --- (fuera del componente)
const socket = io('http://192.168.1.71:5000'); // <- Cambia IP si es necesario

type RootStackParamList = {
  PremiumScreen: { availableSpots: number };
  InfoCarScreen: { availableSpots: number, plazaSeleccionada?: string, cajonSeleccionado?: number };
  ClubScreen: undefined;
};

type InfoCarScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InfoCarScreen'>;
type InfoCarScreenRouteProp = RouteProp<RootStackParamList, 'InfoCarScreen'>;

const plazasDisponibles = ['Plaza Río', 'Plaza Hipódromo', 'Plaza Península', 'Plaza LandMark'];

export default function InfoCarScreen({ navigation, route }: { navigation: InfoCarScreenNavigationProp; route: InfoCarScreenRouteProp }) {
  const { createPaymentMethod } = useStripe();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [plates, setPlates] = useState('');
  const [model, setModel] = useState('');
  const [selectedPlaza, setSelectedPlaza] = useState(route.params.plazaSeleccionada || '');
  const [showPlazaModal, setShowPlazaModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('+52');
  const [availableSpots, setAvailableSpots] = useState(route.params.availableSpots || 6);
  const [discountUsed, setDiscountUsed] = useState(false);
  const [total, setTotal] = useState(600);
  const [activeTab, setActiveTab] = useState('reservar');
  const [cajon, setCajon] = useState(route.params?.cajonSeleccionado ? String(route.params.cajonSeleccionado) : '');
  const [reservaExitosa, setReservaExitosa] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('reservaExitosa').then(value => {
      setReservaExitosa(value === 'true');
    });
  }, []);

  useEffect(() => {
    if (route.params?.plazaSeleccionada) {
      setSelectedPlaza(route.params.plazaSeleccionada);
    }
    if (route.params?.cajonSeleccionado) {
      setCajon(String(route.params.cajonSeleccionado));
    }
  }, [route.params?.plazaSeleccionada, route.params?.cajonSeleccionado]);

  const applyDiscount = () => {
    if (!discountUsed) {
      setTotal(prev => prev * 0.95);
      setDiscountUsed(true);
    }
  };

  // ----- AQUI VA EL SOCKET EMIT DE NUEVA RESERVA -----
  const handlePayment = async () => {
    if (!selectedPlaza) return alert('Selecciona una plaza antes de pagar.');
    if (!cajon) return alert('Ingresa el número de cajón reservado.');
    if (!phone || !nationality) return alert('Completa el número de teléfono y nacionalidad.');

    const { paymentMethod, error } = await createPaymentMethod({
      paymentMethodType: 'Card',
      paymentMethodData: { billingDetails: { name } },
    });

    if (error) return alert(error.message);

    try {
      const res = await fetch('http://192.168.1.71:5000/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          name,
          email,
          plates,
          model,
          plaza: selectedPlaza,
          cajon,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        Alert.alert('Pago realizado con éxito');
        await AsyncStorage.setItem('reservaExitosa', 'true');
        setReservaExitosa(true);

        // --- AVISO AL GUARDIA (SOCKET) ---
        socket.emit('nuevaReserva', {
          nombre: name,
          plaza: selectedPlaza,
          cajon: cajon,
        });

        // --- ENVÍO PDF Y NAVEGACIÓN ---
        await fetch('http://192.168.1.71:5000/api/enviar-recibo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            plates,
            model,
            plaza: selectedPlaza,
            cajon,
            telefono: `${nationality} ${phone}`,
            total: total.toFixed(2),
          }),
        });
        const newSpots = availableSpots - 1;
        navigation.navigate('PremiumScreen', { availableSpots: newSpots });
      } else {
        Alert.alert('Error', result.message || 'Error al procesar pago');
      }
    } catch (err) {
      Alert.alert('Error', 'Error de red: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const TabButton = ({ title, active, onPress }: { title: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.activeTab]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <StripeProvider publishableKey="pk_test_51RPASTPRHCxOJyDTRdVT6mFokPTOdClpYVOOaZxGxHpeK6uu7K2mUL8gzLOSMgkc7zoPuu8fs5hTJRBJPkhYSeeQ00TtfqeBp6">
      <View style={styles.container}>
        <StatusBar backgroundColor="#0c1631" barStyle="light-content" />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => alert('Notificaciones')}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.tabsContainer}>
            <TabButton 
              title="Estacionamientos" 
              active={activeTab === 'estacionamientos'} 
              onPress={() => {
                setActiveTab('estacionamientos');
                navigation.goBack();
              }} 
            />
            <TabButton 
              title="Reservar Cajones"
              active={activeTab === 'reservar'}
              onPress={() => setActiveTab('reservar')}
            />
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={() => alert('Perfil')}>
            <Ionicons name="person-circle-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <View style={styles.locationButton}>
            <Ionicons name="card-outline" size={24} color="white" />
            <Text style={styles.locationText}>Membresía</Text>
          </View>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => setShowPlazaModal(true)}
          >
            <Text style={styles.searchText}>
              {selectedPlaza || "Selecciona una plaza..."}
            </Text>
            {selectedPlaza && (
              <TouchableOpacity 
                style={styles.closeSearchIcon}
                onPress={() => setSelectedPlaza('')}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
        {/* Main Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <View style={styles.card}>
            <TextInput style={styles.input} placeholder="Nombre" value={name} onChangeText={setName} placeholderTextColor="#8e9aaf" />
            <TextInput style={styles.input} placeholder="Correo Electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" placeholderTextColor="#8e9aaf" />
            <TextInput style={styles.input} placeholder="Placas" value={plates} onChangeText={setPlates} placeholderTextColor="#8e9aaf" />
            <TextInput style={styles.input} placeholder="Modelo" value={model} onChangeText={setModel} placeholderTextColor="#8e9aaf" />
            {/* NUEVO: Campo de cajón reservado */}
            <TextInput
              style={[
                styles.input,
                route.params?.cajonSeleccionado ? { backgroundColor: '#2d3d64', color: '#aaa' } : {}
              ]}
              placeholder="Cajón reservado"
              value={cajon}
              onChangeText={setCajon}
              placeholderTextColor="#8e9aaf"
              keyboardType="numeric"
              editable={!route.params?.cajonSeleccionado}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="+52" value={nationality} onChangeText={setNationality} placeholderTextColor="#8e9aaf" />
              <TextInput style={[styles.input, { flex: 3 }]} placeholder="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor="#8e9aaf" />
            </View>
          </View>
          <Text style={styles.sectionTitle}>Método de Pago</Text>
          <View style={styles.card}>
            <CardField postalCodeEnabled={false} style={styles.cardField} />
          </View>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={[styles.discountBtn, discountUsed && styles.discountUsed]} disabled={discountUsed} onPress={applyDiscount}>
              <Text style={styles.discountText}>{discountUsed ? 'Cupón usado' : 'Aplicar cupón 5%'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
            <Text style={styles.payText}>Confirmar y Pagar</Text>
          </TouchableOpacity>
        </ScrollView>
        {/* Navbar */}
        <View style={styles.navbar}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.goBack()}>
            <Ionicons name="car" size={24} color={activeTab === 'estacionamientos' ? "#4a90e2" : "#8e9aaf"} />
            <Text style={styles.navText}>Plazas</Text>
          </TouchableOpacity>
          {/* MENSAJES: BLOQUEADO CON CANDADO SI NO RESERVA */}
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
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ClubScreen')}>
            <Ionicons name="card-outline" size={24} color="#4a90e2" />
            <Text style={[styles.navText, styles.activeNavText]}>Club</Text>
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
        {/* Modal de plazas */}
        <Modal visible={showPlazaModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Selecciona una plaza</Text>
              {plazasDisponibles.map((plaza) => (
                <TouchableOpacity key={plaza} style={styles.plazaBtn} onPress={() => {
                  setSelectedPlaza(plaza);
                  setShowPlazaModal(false);
                }}>
                  <Text style={styles.plazaText}>{plaza}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowPlazaModal(false)} style={styles.closeModalButton}>
                <Text style={styles.closeModalText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  // ...mismos estilos que ya tienes
  container: { flex: 1, backgroundColor: '#0c1631' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 15, backgroundColor: '#0c1631' },
  iconButton: { padding: 8 },
  tabsContainer: { flexDirection: 'row', flex: 1, justifyContent: 'center' },
  tabButton: { paddingVertical: 12, paddingHorizontal: 10 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#2e86de' },
  tabText: { color: '#8e9aaf', fontSize: 16, fontWeight: 'bold' },
  activeTabText: { color: 'white' },
  searchBar: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 12, backgroundColor: '#162244' },
  locationButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3366ff', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 25, marginRight: 10 },
  locationText: { color: 'white', fontWeight: 'bold', marginLeft: 5 },
  searchButton: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2d3d64', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 10, justifyContent: 'space-between' },
  searchText: { color: 'white', flex: 1 },
  closeSearchIcon: { padding: 5 },
  content: { flex: 1, backgroundColor: '#0c1631' },
  contentContainer: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: 'white', marginVertical: 15 },
  card: { backgroundColor: '#162244', borderRadius: 16, padding: 20, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
  input: { borderBottomWidth: 1, borderBottomColor: '#2d3d64', marginBottom: 15, paddingVertical: 10, fontSize: 16, color: 'white' },
  cardField: { width: '100%', height: 50, backgroundColor: '#2d3d64', borderRadius: 10, padding: 10 },
  summaryContainer: { backgroundColor: '#162244', borderRadius: 16, padding: 20, marginVertical: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel: { fontSize: 18, fontWeight: '600', color: 'white' },
  totalAmount: { fontSize: 18, fontWeight: '800', color: '#4a90e2' },
  discountBtn: { backgroundColor: '#3366ff', paddingVertical: 12, borderRadius: 20, alignItems: 'center' },
  discountUsed: { backgroundColor: '#2d3d64' },
  discountText: { fontWeight: '700', color: 'white' },
  payButton: { backgroundColor: '#3366ff', paddingVertical: 15, borderRadius: 25, alignItems: 'center', marginVertical: 20 },
  payText: { color: 'white', fontSize: 18, fontWeight: '700' },
  navbar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#162244', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#253253' },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  navText: { color: '#8e9aaf', fontSize: 12, marginTop: 4 },
  activeNavText: { color: '#4a90e2' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#162244', width: '90%', borderRadius: 10, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: 'white' },
  plazaBtn: { width: '100%', paddingVertical: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#253253' },
  plazaText: { fontSize: 16, fontWeight: '600', color: 'white' },
  closeModalButton: { backgroundColor: '#3366ff', paddingVertical: 12, borderRadius: 5, alignItems: 'center', marginTop: 15 },
  closeModalText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
