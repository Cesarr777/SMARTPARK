import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegistroScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const registrarUsuario = async () => {
    if (!nombre || !email || !password) {
      Alert.alert('Completa todos los campos');
      return;
    }
    // Aquí puedes hacer un fetch POST a tu backend (si tienes API), por ahora simula usuario
    const usuario = {
      id: Date.now().toString(),
      nombre,
      email,
    };

    // Guarda sesión en AsyncStorage
    await AsyncStorage.setItem('usuario_id', usuario.id);
    await AsyncStorage.setItem('usuario_email', usuario.email);
    await AsyncStorage.setItem('usuario_nombre', usuario.nombre);

    Alert.alert('Cuenta creada', '¡Bienvenido, ' + nombre + '!');
    navigation.replace('Home'); // O a donde quieras redirigir después de registro
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={registrarUsuario}>
        <Text style={styles.buttonText}>Registrarme</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c1631', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#4a90e2', marginBottom: 24 },
  input: { width: '100%', backgroundColor: '#162244', borderRadius: 12, padding: 14, marginBottom: 16, color: 'white', fontSize: 16 },
  button: { width: '100%', backgroundColor: '#4a90e2', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  link: { color: '#4a90e2', marginTop: 22, fontSize: 15 },
});
