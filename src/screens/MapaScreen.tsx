import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
  ScrollView,
} from "react-native";
import io from "socket.io-client";

const { width } = Dimensions.get("window");
const TOTAL_CAJONES = 72;
const CAJONES_POR_FILA = 12;
const socket = io("http://192.168.1.87:5050"); // Cambia la IP si es necesario

export default function MapaScreen({ route, navigation }) {
  const { plaza } = route.params;

  const [cajones, setCajones] = useState(
    Array.from({ length: TOTAL_CAJONES }, (_, i) => ({
      id: `${i + 1}`,
      ocupado: false,
      ocultar: i + 1 === 72, // Oculta el cajón 72 visualmente
    }))
  );

  const [selectedCajon, setSelectedCajon] = useState(null);

  useEffect(() => {
    socket.on("connect", () => console.log("🟢 Conectado a WebSocket"));

    socket.on("message", (data) => {
      const updates = JSON.parse(data); // [{ id: "1", status: "occupied" }]
      setCajones((prev) =>
        prev.map((cajon) => {
          const update = updates.find((u) => u.id === cajon.id);
          return update
            ? { ...cajon, ocupado: update.status === "occupied" }
            : cajon;
        })
      );
    });

    return () => socket.disconnect();
  }, []);

  const handleReservar = () => {
    if (!selectedCajon) {
      Alert.alert("Selecciona un cajón libre para reservar");
      return;
    }
    navigation.navigate("InfoCarScreen", {
      availableSpots: plaza.disponibles,
      plazaSeleccionada: plaza.nombre,
      cajonSeleccionado: selectedCajon,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0c1631" barStyle="light-content" />

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

      <Text style={styles.subtitulo}>Selecciona tu cajón</Text>

      <ScrollView contentContainerStyle={styles.gridScroll}>
        {Array.from({ length: 6 }).map((_, rowIndex) => {
          const fila = (
            <View key={`fila-${rowIndex}`} style={styles.row}>
              {Array.from({ length: CAJONES_POR_FILA }).map((_, colIndex) => {
                const index = rowIndex * CAJONES_POR_FILA + colIndex;
                const cajon = cajones[index];
                if (!cajon) return null;

                if (cajon.ocultar) {
                  return (
                    <View
                      key={cajon.id}
                      style={{ width: 30, height: 36, margin: 4 }}
                    />
                  );
                }

                const isSelected = selectedCajon === cajon.id;
                const libre = !cajon.ocupado;

                return (
                  <TouchableOpacity
                    key={cajon.id}
                    disabled={!libre}
                    style={[
                      styles.cajon,
                      cajon.ocupado && styles.cajonOcupado,
                      isSelected && styles.cajonSeleccionado,
                    ]}
                    onPress={() => setSelectedCajon(cajon.id)}
                  >
                    <Text style={styles.cajonNum}>{cajon.id}</Text>
                    <Text style={styles.cajonIcon}>
                      {cajon.ocupado ? "🚗" : isSelected ? "✅" : "🅿️"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );

          const agregarPasillo = rowIndex === 1 || rowIndex === 3;

          return (
            <React.Fragment key={`grupo-${rowIndex}`}>
              {fila}
              {agregarPasillo && <View style={styles.pasillo} />}
            </React.Fragment>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[styles.botonReservar, !selectedCajon && { opacity: 0.7 }]}
        onPress={handleReservar}
        disabled={!selectedCajon}
      >
        <Text style={styles.botonReservarTexto}>
          {selectedCajon
            ? `Reservar cajón #${selectedCajon}`
            : "Selecciona un cajón para reservar"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c1631" },
  imagenWrap: {
    marginBottom: 25,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  imagenPlaza: {
    width: width - 40,
    height: 170,
    borderRadius: 18,
    marginTop: 78,
    zIndex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(12,22,49,0.55)",
    borderRadius: 18,
    zIndex: 2,
  },
  tituloPlaza: {
    position: "absolute",
    top: 92,
    left: 40,
    fontSize: 26,
    color: "#fff",
    fontWeight: "bold",
    zIndex: 3,
    textShadowColor: "#333",
    textShadowRadius: 10,
  },
  horario: {
    position: "absolute",
    bottom: 18,
    left: 40,
    fontSize: 15,
    color: "#f6e58d",
    zIndex: 3,
    fontWeight: "700",
    textShadowColor: "#0c1631",
    textShadowRadius: 6,
  },
  subtitulo: {
    color: "white",
    fontSize: 17,
    marginBottom: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  gridScroll: {
    alignItems: "center",
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  pasillo: {
    height: 20,
  },
  cajon: {
    width: 24,
    height: 45,
    backgroundColor: "#2ecc71",
    margin: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    borderWidth: 2,
    borderColor: "#232f45",
  },
  cajonOcupado: {
    backgroundColor: "#636e72",
    borderColor: "#4a4a4a",
    opacity: 0.7,
  },
  cajonSeleccionado: {
    backgroundColor: "#4a90e2",
    borderColor: "#f9ca24",
    elevation: 10,
  },
  cajonNum: {
    color: "white",
    fontWeight: "bold",
    fontSize: 13,
  },
  cajonIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  botonReservar: {
    marginTop: 12,
    marginBottom: 42,
    alignSelf: "center",
    backgroundColor: "#3366ff",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 18,
    elevation: 5,
  },
  botonReservarTexto: {
    color: "white",
    fontWeight: "bold",
    fontSize: 17,
    textAlign: "center",
  },
});
