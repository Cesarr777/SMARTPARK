import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function MapaScreen({ route, navigation }) {
  const { plaza } = route.params;

  // --- Generar lugares aleatorios por cada plaza ---
  // Memo para no cambiar cada render
  const [totalCajones] = useState(24); // Cambia este valor por plaza si quieres
  const cajonesOcupados = useMemo(() => {
    // Genera de 5 a 10 ocupados randoms, diferentes cada vez que entras
    const numOcupados = Math.floor(Math.random() * 6) + 5;
    const ocupados = new Set();
    while (ocupados.size < numOcupados) {
      ocupados.add(Math.floor(Math.random() * totalCajones) + 1);
    }
    return ocupados;
  }, [plaza.id]);
  const cajones = Array.from({ length: totalCajones }, (_, i) => ({
    numero: i + 1,
    ocupado: cajonesOcupados.has(i + 1),
  }));

  // Estado para saber cuál está seleccionado
  const [selectedCajon, setSelectedCajon] = useState(null);

  // Reservar el cajón seleccionado (lleva a InfoCarScreen)
  const handleReservar = () => {
    if (!selectedCajon) {
      Alert.alert('Selecciona un cajón libre para reservar');
      return;
    }
    navigation.navigate('InfoCarScreen', {
      availableSpots: plaza.disponibles,
      plazaSeleccionada: plaza.nombre,
      cajonSeleccionado: selectedCajon,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0c1631" barStyle="light-content" />
      {/* Imagen grande y sombreada */}
      <View style={styles.imagenWrap}>
        <Image
          source={plaza.imagen}
          style={styles.imagenPlaza}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
        <Text style={styles.tituloPlaza}>{plaza.nombre}</Text>
        <Text style={styles.horario}>{plaza.horario}</Text>
      </View>

      {/* Grid visual tipo estacionamiento */}
      <Text style={styles.subtitulo}>Selecciona tu cajón</Text>
      <FlatList
        data={cajones}
        numColumns={6}
        keyExtractor={item => item.numero.toString()}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            disabled={item.ocupado}
            style={[
              styles.cajon,
              item.ocupado && styles.cajonOcupado,
              selectedCajon === item.numero && styles.cajonSeleccionado,
            ]}
            onPress={() => setSelectedCajon(item.numero)}
          >
            <Text style={styles.cajonNum}>{item.numero}</Text>
            <Text style={styles.cajonIcon}>
              {item.ocupado ? '🚗' : selectedCajon === item.numero ? '✅' : '🅿️'}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Botón de reservar */}
      <TouchableOpacity
        style={[styles.botonReservar, !selectedCajon && { opacity: 0.7 }]}
        onPress={handleReservar}
        disabled={!selectedCajon}
      >
        <Text style={styles.botonReservarTexto}>
          {selectedCajon
            ? `Reservar cajón #${selectedCajon}`
            : 'Selecciona un cajón para reservar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c1631' },
  imagenWrap: {
    marginBottom: 15,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagenPlaza: {
    width: width - 40,
    height: 170,
    borderRadius: 18,
    marginTop: 18,
    zIndex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12,22,49,0.55)',
    borderRadius: 18,
    zIndex: 2,
  },
  tituloPlaza: {
    position: 'absolute',
    top: 32,
    left: 30,
    fontSize: 26,
    color: '#fff',
    fontWeight: 'bold',
    zIndex: 3,
    textShadowColor: '#333',
    textShadowRadius: 10,
  },
  horario: {
    position: 'absolute',
    bottom: 18,
    left: 30,
    fontSize: 15,
    color: '#f6e58d',
    zIndex: 3,
    fontWeight: '700',
    textShadowColor: '#0c1631',
    textShadowRadius: 6,
  },
  subtitulo: {
    color: 'white',
    fontSize: 17,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  grid: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cajon: {
    width: 46,
    height: 46,
    backgroundColor: '#2ecc71',
    margin: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    borderWidth: 2,
    borderColor: '#232f45',
  },
  cajonOcupado: {
    backgroundColor: '#636e72',
    borderColor: '#4a4a4a',
    opacity: 0.7,
  },
  cajonSeleccionado: {
    backgroundColor: '#4a90e2',
    borderColor: '#f9ca24',
    elevation: 10,
  },
  cajonNum: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cajonIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  botonReservar: {
    marginTop: 12,
    marginBottom: 22,
    alignSelf: 'center',
    backgroundColor: '#3366ff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 18,
    elevation: 5,
  },
  botonReservarTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
  },
});
