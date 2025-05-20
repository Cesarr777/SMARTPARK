import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  StatusBar,
  Pressable,
  Platform,
} from 'react-native';
import { StripeProvider, CardField, useStripe } from '@stripe/stripe-react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';

const socket = io('http://192.168.1.71:5000');
const plazasDisponibles = ['Plaza Río', 'Plaza Hipódromo', 'Plaza Península', 'Plaza LandMark'];

type RootStackParamList = {
  PremiumScreen: { availableSpots: number };
  InfoCarScreen: { availableSpots: number; plazaSeleccionada?: string; cajonSeleccionado?: number };
  ClubScreen: undefined;
  MessageScreen: { email: string; mensaje?: string };
};

type InfoCarScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InfoCarScreen'>;
type InfoCarScreenRouteProp = RouteProp<RootStackParamList, 'InfoCarScreen'>;

export default function InfoCarScreen({
  navigation,
  route,
}: {
  navigation: InfoCarScreenNavigationProp;
  route: InfoCarScreenRouteProp;
}) {
  const params = route.params || {};
  const { createPaymentMethod } = useStripe();

  // Datos de usuario y reserva
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [plates, setPlates] = useState('');
  const [model, setModel] = useState('');
  const [selectedPlaza, setSelectedPlaza] = useState(params.plazaSeleccionada || '');
  const [showPlazaModal, setShowPlazaModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('+52');
  const [discountUsed, setDiscountUsed] = useState(false);
  const [total, setTotal] = useState(600);
  const [activeTab, setActiveTab] = useState('reservar');
  const [cajon, setCajon] = useState(params.cajonSeleccionado ? String(params.cajonSeleccionado) : '');
  const [reservaExitosa, setReservaExitosa] = useState(false);

  // Para evitar doble login socket
  const socketLogged = useRef(false);
  const [userLogged, setUserLogged] = useState(false);

  // Modal mensaje entrante
  const [modalMensajeVisible, setModalMensajeVisible] = useState(false);
  const [mensajeModalTexto, setMensajeModalTexto] = useState('');

  // Modal correo
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loadingCorreo, setLoadingCorreo] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('reservaExitosa').then(value => {
      setReservaExitosa(value === 'true');
    });
  }, []);

  useEffect(() => {
    if (params.plazaSeleccionada) setSelectedPlaza(params.plazaSeleccionada);
    if (params.cajonSeleccionado) setCajon(String(params.cajonSeleccionado));
  }, [params.plazaSeleccionada, params.cajonSeleccionado]);

  useEffect(() => {
    if (reservaExitosa && email && name && !socketLogged.current) {
      socket.emit('loginUsuario', {
        usuario: name,
        email: email,
        placas: plates,
        cajon: cajon,
      });
      socketLogged.current = true;
      setUserLogged(true);
    }
  }, [reservaExitosa, email, name, plates, cajon]);

  // Escuchar mensajes entrantes para mostrar modal
  useEffect(() => {
    function handleNuevoMensaje(data: any) {
      if (userLogged && data.email === email) {
        setMensajeModalTexto(data.mensaje);
        setModalMensajeVisible(true);
      }
    }
    socket.on('recibirMensaje', handleNuevoMensaje);

    return () => {
      socket.off('recibirMensaje', handleNuevoMensaje);
    };
  }, [email, userLogged]);

  // Descuento
  const applyDiscount = () => {
    if (!discountUsed) {
      setTotal(prev => prev * 0.95);
      setDiscountUsed(true);
    }
  };

  // Pago
  const handlePayment = async () => {
    if (!selectedPlaza) return alert('Selecciona una plaza antes de pagar.');
    if (!cajon) return alert('Ingresa el número de cajón reservado.');
    if (!phone || !nationality) return alert('Completa el número de teléfono y nacionalidad.');
    if (!email || !name) return alert('Llena nombre y correo antes de pagar.');

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

        socket.emit('loginUsuario', {
          usuario: name,
          email: email,
          placas: plates,
          cajon: cajon,
        });
        socketLogged.current = true;
        setUserLogged(true);

        socket.emit('nuevaReserva', {
          nombre: name,
          plaza: selectedPlaza,
          cajon: cajon,
          modelo: model,
        });

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
      } else {
        Alert.alert('Error', result.message || 'Error al procesar pago');
      }
    } catch (err) {
      Alert.alert('Error', 'Error de red: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Navegar a mensajes desde modal
  const accederMensajes = (correo: string) => {
    setModalMensajeVisible(false);
    setShowEmailModal(false);
    setEmailInput('');
    navigation.navigate('MessageScreen', { email: correo, mensaje: mensajeModalTexto });
  };

  // Modal correo
  const modalCorreo = (
    <Modal visible={showEmailModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.emailModalContent}>
          <Text style={styles.emailModalTitle}>Ingresa tu correo</Text>
          <TextInput
            style={styles.emailInput}
            placeholder="ejemplo@correo.com"
            placeholderTextColor="#8e9aaf"
            value={emailInput}
            onChangeText={setEmailInput}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {emailError ? (
            <Text style={styles.emailError}>{emailError}</Text>
          ) : null}
          <Pressable style={styles.emailModalButton} onPress={verificarCorreoRecibo} disabled={loadingCorreo}>
            <Text style={styles.emailModalButtonText}>{loadingCorreo ? "Verificando..." : "Verificar"}</Text>
          </Pressable>
          <Pressable
            style={styles.emailModalCancel}
            onPress={() => {
              setShowEmailModal(false);
              setEmailError('');
            }}
          >
            <Text style={styles.emailModalCancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  // Verificar correo recibo
  const verificarCorreoRecibo = async () => {
    setEmailError('');
    if (!emailInput) {
      setEmailError('Ingresa tu correo');
      return;
    }
    setLoadingCorreo(true);
    try {
      const response = await fetch(`http://192.168.1.71:5000/api/verificar-recibo?email=${encodeURIComponent(emailInput)}`);
      const data = await response.json();
      setLoadingCorreo(false);
      if (data.exists) {
        accederMensajes(emailInput);
      } else {
        setEmailError('Correo incorrecto');
      }
    } catch (err) {
      setLoadingCorreo(false);
      setEmailError('Error al verificar. Intenta de nuevo.');
    }
  };

  return (
    <StripeProvider publishableKey="pk_test_51RPASTPRHCxOJyDTRdVT6mFokPTOdClpYVOOaZxGxHpeK6uu7K2mUL8gzLOSMgkc7zoPuu8fs5hTJRBJPkhYSeeQ00TtfqeBp6">
      <View style={styles.container}>
        <StatusBar backgroundColor="#0c1631" barStyle="light-content" />
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'estacionamientos' && styles.activeTab]}
              onPress={() => {
                setActiveTab('estacionamientos');
                navigation.goBack();
              }}
            >
              <Text style={[styles.tabText, activeTab === 'estacionamientos' && styles.activeTabText]}>
                Estacionamientos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'reservar' && styles.activeTab]}
              onPress={() => setActiveTab('reservar')}
            >
              <Text style={[styles.tabText, activeTab === 'reservar' && styles.activeTabText]}>
                Reservar Cajones
              </Text>
            </TouchableOpacity>
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
          <TouchableOpacity style={styles.searchButton} onPress={() => setShowPlazaModal(true)}>
            <Text style={styles.searchText}>{selectedPlaza || 'Selecciona una plaza...'}</Text>
            {selectedPlaza && (
              <TouchableOpacity style={styles.closeSearchIcon} onPress={() => setSelectedPlaza('')}>
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#8e9aaf"
            />
            <TextInput
              style={styles.input}
              placeholder="Correo Electrónico"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor="#8e9aaf"
            />
            <TextInput
              style={styles.input}
              placeholder="Placas"
              value={plates}
              onChangeText={setPlates}
              placeholderTextColor="#8e9aaf"
            />
            <TextInput
              style={styles.input}
              placeholder="Modelo"
              value={model}
              onChangeText={setModel}
              placeholderTextColor="#8e9aaf"
            />
            <TextInput
              style={[styles.input, params.cajonSeleccionado ? { backgroundColor: '#2d3d64', color: '#aaa' } : {}]}
              placeholder="Cajón reservado"
              value={cajon}
              onChangeText={setCajon}
              placeholderTextColor="#8e9aaf"
              keyboardType="numeric"
              editable={!params.cajonSeleccionado}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="+52"
                value={nationality}
                onChangeText={setNationality}
                placeholderTextColor="#8e9aaf"
              />
              <TextInput
                style={[styles.input, { flex: 3 }]}
                placeholder="Teléfono"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#8e9aaf"
              />
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
            <TouchableOpacity
              style={[styles.discountBtn, discountUsed && styles.discountUsed]}
              disabled={discountUsed}
              onPress={applyDiscount}
            >
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
            <Ionicons
              name="car"
              size={24}
              color={activeTab === 'estacionamientos' ? '#4a90e2' : '#8e9aaf'}
            />
            <Text style={styles.navText}>Plazas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setShowEmailModal(true)}>
            <Ionicons name="mail-outline" size={24} color="#8e9aaf" />
            <Text style={styles.navText}>Mensajes</Text>
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

        {/* Modal mensaje entrante */}
        <Modal
          visible={modalMensajeVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalMensajeVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nuevo mensaje recibido</Text>
              <ScrollView style={{ maxHeight: 150, marginBottom: 20 }}>
                <Text style={{ color: 'white', fontSize: 16 }}>{mensajeModalTexto}</Text>
              </ScrollView>
              <Pressable
                style={styles.emailModalButton}
                onPress={() => accederMensajes(email)}
              >
                <Text style={styles.emailModalButtonText}>Ir a mensajes</Text>
              </Pressable>
              <Pressable
                style={styles.emailModalCancel}
                onPress={() => setModalMensajeVisible(false)}
              >
                <Text style={styles.emailModalCancelText}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Modal correo */}
        {modalCorreo}

        {/* Modal plazas */}
        <Modal visible={showPlazaModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Selecciona una plaza</Text>
              {plazasDisponibles.map(plaza => (
                <TouchableOpacity
                  key={plaza}
                  style={styles.plazaBtn}
                  onPress={() => {
                    setSelectedPlaza(plaza);
                    setShowPlazaModal(false);
                  }}
                >
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
  container: { flex: 1, backgroundColor: '#0c1631' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 20 : 50,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3366ff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 25,
    marginRight: 10,
  },
  locationText: { color: 'white', fontWeight: 'bold', marginLeft: 5 },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d3d64',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  searchText: { color: 'white', flex: 1 },
  closeSearchIcon: { padding: 5 },
  content: { flex: 1, backgroundColor: '#0c1631' },
  contentContainer: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: 'white', marginVertical: 15 },
  card: {
    backgroundColor: '#162244',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#2d3d64',
    marginBottom: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: 'white',
  },
  cardField: { width: '100%', height: 50, backgroundColor: '#2d3d64', borderRadius: 10, padding: 10 },
  summaryContainer: {
    backgroundColor: '#162244',
    borderRadius: 16,
    padding: 20,
    marginVertical: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel: { fontSize: 18, fontWeight: '600', color: 'white' },
  totalAmount: { fontSize: 18, fontWeight: '800', color: '#4a90e2' },
  discountBtn: { backgroundColor: '#3366ff', paddingVertical: 12, borderRadius: 20, alignItems: 'center' },
  discountUsed: { backgroundColor: '#2d3d64' },
  discountText: { fontWeight: '700', color: 'white' },
  payButton: {
    backgroundColor: '#3366ff',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 20,
  },
  payText: { color: 'white', fontSize: 18, fontWeight: '700' },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#162244',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#253253',
  },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  navText: { color: '#8e9aaf', fontSize: 12, marginTop: 4 },
  activeNavText: { color: '#4a90e2' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#162244',
    width: '90%',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  emailModalContent: {
    backgroundColor: '#162244',
    width: '90%',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
    alignItems: 'center',
  },
  emailModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  emailInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#2d3d64',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: 'white',
    backgroundColor: '#233364',
    marginBottom: 15,
  },
  emailError: {
    color: 'red',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  emailModalButton: {
    width: '100%',
    backgroundColor: '#3366ff',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  emailModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emailModalCancel: {
    width: '100%',
    backgroundColor: '#2d3d64',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  emailModalCancelText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  plazaBtn: {
    backgroundColor: '#3366ff',
    paddingVertical: 15,
    marginVertical: 8,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  plazaText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  closeModalButton: {
    marginTop: 10,
    padding: 12,
  },
  closeModalText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});
