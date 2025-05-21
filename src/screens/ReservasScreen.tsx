import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar, ScrollView } from 'react-native';
import moment from 'moment';

// Si quieres íconos tipo InfoCarScreen:
import { Ionicons } from '@expo/vector-icons';

export default function ReservasScreen() {
  const [recibos, setRecibos] = useState([]);

  useEffect(() => {
    fetch('http://192.168.1.71:5000/api/recibos')
      .then(res => res.json())
      .then(data => setRecibos(data))
      .catch(() => setRecibos([]));
  }, []);

  const getDiasRestantes = (fechaPago) => {
    const fechaInicio = moment(fechaPago);
    const fechaFin = fechaInicio.clone().add(30, 'days');
    const ahora = moment();
    const duracion = fechaFin.diff(ahora, 'days');
    const horas = fechaFin.diff(ahora, 'hours') % 24;
    return duracion > 0 ? `${duracion} días ${horas} horas` : "Vencido";
  };

  // Ordena por plaza y nombre
  const recibosOrdenados = recibos.sort((a, b) => {
    if (a.plaza === b.plaza) return a.nombre.localeCompare(b.nombre);
    return a.plaza.localeCompare(b.plaza);
  });

  if (recibos.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#0c1631" barStyle="light-content" />
        <View style={styles.header}>
          <Ionicons name="card-outline" size={28} color="#4a90e2" style={{ marginRight: 10 }} />
          <Text style={styles.headerTitle}>Mis Reservas</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={60} color="#233364" />
          <Text style={styles.emptyText}>No tienes reservas activas.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0c1631" barStyle="light-content" />
      <View style={styles.header}>
        <Ionicons name="card-outline" size={28} color="#4a90e2" style={{ marginRight: 10 }} />
        <Text style={styles.headerTitle}>Mis Reservas</Text>
      </View>
      <FlatList
        data={recibosOrdenados}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="person-circle-outline" size={28} color="#8e9aaf" style={{ marginRight: 10 }} />
              <Text style={styles.title}>{item.nombre}</Text>
            </View>
            <Text style={styles.subtitle}>
              <Ionicons name="mail-outline" size={16} color="#8e9aaf" />  {item.correo}
            </Text>
            <Text style={styles.subtitle}>
              <Ionicons name="car-sport-outline" size={16} color="#4a90e2" />  Plaza: <Text style={{ color: '#4a90e2', fontWeight: 'bold' }}>{item.plaza}</Text>
            </Text>
            <Text style={styles.subtitle}>
              <Ionicons name="calendar-outline" size={16} color="#8e9aaf" />  Fecha de pago: {moment(item.fechaPago).format('DD/MM/YYYY HH:mm')}
            </Text>
            <Text style={styles.duration}>
              <Ionicons name="timer-outline" size={16} color="#42b883" />  Quedan: {getDiasRestantes(item.fechaPago)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c1631' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162244',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#233364',
  },
  headerTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 15,
    color: "#8e9aaf",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  card: {
    backgroundColor: '#162244',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 15,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  title: { fontWeight: "bold", fontSize: 20, color: 'white' },
  subtitle: { color: "#8e9aaf", marginTop: 5, fontSize: 15 },
  duration: { marginTop: 14, color: "#42b883", fontWeight: "bold", fontSize: 16 },
});
