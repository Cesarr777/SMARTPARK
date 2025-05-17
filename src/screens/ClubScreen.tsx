import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ClubScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StatusBar backgroundColor="#0c1631" barStyle="light-content" />
      <View style={styles.header}>
        <Ionicons name="star" size={40} color="#ffd700" style={{ marginBottom: 10 }} />
        <Text style={styles.title}>Ventajas de rentar tu cajón de estacionamiento</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.bullet}><Ionicons name="checkmark-circle" size={20} color="#4a90e2" /> Acceso garantizado 24/7 a tu espacio reservado.</Text>
        <Text style={styles.bullet}><Ionicons name="checkmark-circle" size={20} color="#4a90e2" /> Mensajes en tiempo real para estar al tanto de tu auto.</Text>
        <Text style={styles.bullet}><Ionicons name="checkmark-circle" size={20} color="#4a90e2" /> Protección contra clima y daños externos.</Text>
        <Text style={styles.bullet}><Ionicons name="checkmark-circle" size={20} color="#4a90e2" /> Beneficios exclusivos para miembros SmartPark Club.</Text>
        <Text style={styles.bullet}><Ionicons name="checkmark-circle" size={20} color="#4a90e2" /> Descuentos en comercios participantes.</Text>
        <Text style={styles.bullet}><Ionicons name="checkmark-circle" size={20} color="#4a90e2" /> Reserva y gestión de tu espacio 100% en línea.</Text>
        <Text style={styles.bullet}><Ionicons name="checkmark-circle" size={20} color="#4a90e2" /> Soporte premium y atención personalizada.</Text>
      </View>
      <View style={{ marginTop: 40, alignItems: 'center' }}>
        <Text style={{ color: '#8e9aaf', fontSize: 16 }}>¡Únete y disfruta todos los beneficios!</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c1631' },
  contentContainer: { padding: 20, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 10 },
  card: { backgroundColor: '#162244', borderRadius: 16, padding: 24, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
  bullet: { color: 'white', fontSize: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
});
