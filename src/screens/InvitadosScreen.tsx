import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Modal,
  Image,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const plazaImages = {
  'Plaza Rio': require('../../assets/plaza1_1.png'),
  'Plaza Peninsula': require('../../assets/plaza2.png'),
  'Plaza Hipódromo': require('../../assets/plaza3.png'),
};

export default function MapaScreen({ navigation }) {
  const [selectedPlaza, setSelectedPlaza] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const handlePlaza = (plaza) => {
    setSelectedPlaza(plaza);
    setModalVisible(true);
  };

  const handleIniciar = () => {
    setModalVisible(false);
    // Navega a LoginScreen y pasa el parámetro "plazaSeleccionada"
    navigation.navigate('Login', { plazaSeleccionada: selectedPlaza });
  };

  return (
    <LinearGradient colors={['#a6c0fe', '#f68084']} style={styles.flex}>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topContainer}>
          <Text style={styles.title}>Consulta de Estacionamientos</Text>
          <Text style={styles.subtitle}>
            Elige la plaza para ver la disponibilidad en tiempo real.
          </Text>
        </View>
        <View style={styles.container}>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.plazaButton}
              onPress={() => handlePlaza('Plaza Rio')}
              activeOpacity={0.85}
            >
              <Text style={styles.plazaButtonText}>Plaza Rio</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.plazaButton}
              onPress={() => handlePlaza('Plaza Peninsula')}
              activeOpacity={0.85}
            >
              <Text style={styles.plazaButtonText}>Plaza Peninsula</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.plazaButton}
              onPress={() => handlePlaza('Plaza Hipódromo')}
              activeOpacity={0.85}
            >
              <Text style={styles.plazaButtonText}>Plaza Hipódromo</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.registerButton,
              { marginTop: 25, width: width * 0.8 }
            ]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.registerButtonText}>
              Registrarse
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modal para mostrar imagen */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedPlaza}</Text>
              <Image
                source={plazaImages[selectedPlaza]}
                style={styles.plazaImage}
                resizeMode="contain"
              />
              <View style={styles.modalBtnGroup}>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeBtnText}>Cerrar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iniciarBtn}
                  onPress={handleIniciar}
                >
                  <Text style={styles.iniciarBtnText}>Iniciar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topContainer: {
    alignItems: 'center',
    paddingTop: 38,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 15,
    width: '100%',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: '#a6c0fe99',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.93,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: 0.5,
    textShadowColor: '#f6808499',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  buttonGroup: {
    width: '100%',
    marginTop: 25,
    marginBottom: 36,
    alignItems: 'center',
  },
  plazaButton: {
    width: width * 0.8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: 14,
    borderRadius: 20,
    marginBottom: 18,
    alignItems: 'center',
    shadowColor: '#2e86de',
    shadowOpacity: 0.10,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  plazaButtonText: {
    fontSize: 16,
    color: '#f68084',
    fontWeight: '700',
    letterSpacing: 1,
  },
  registerButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#f68084',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },
  registerButtonText: {
    color: '#f68084',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 18,
    width: '93%',
    alignItems: 'center',
    maxHeight: height * 0.75,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#163e83',
    textAlign: 'center',
  },
  plazaImage: {
    width: '100%',
    height: height * 0.36,
    marginBottom: 18,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  modalBtnGroup: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#f68084',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 18,
    marginHorizontal: 4,
    marginTop: 8,
  },
  closeBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  iniciarBtn: {
    backgroundColor: '#3366ff',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 18,
    marginHorizontal: 4,
    marginTop: 8,
  },
  iniciarBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});
