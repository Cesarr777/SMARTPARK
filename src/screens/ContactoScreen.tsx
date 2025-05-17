import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Dimensions, Keyboard, TouchableWithoutFeedback, ScrollView, ImageBackground } from 'react-native';

// Obtenemos las dimensiones de la pantalla
const { width, height } = Dimensions.get('window');

export default function ContactoScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  // Función para enviar el mensaje de contacto
  const sendContactMessage = async () => {
    console.log('Botón Enviar presionado');
    try {
      console.log('Enviando solicitud al servidor...');
      const response = await fetch('http://192.168.1.71:5000/api/contact', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
        }),
      });

      console.log('Respuesta del servidor recibida:', response);

      if (!response.ok) {
        throw new Error(`Error en la respuesta del servidor: ${response.status}`);
      }

      const result = await response.json();
      console.log('Resultado del servidor:', result);

      Alert.alert('Éxito', result.message);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      Keyboard.dismiss(); // Ocultar teclado después de enviar el mensaje
    } catch (error) {
      console.error('Error al enviar el mensaje:', error);
      Alert.alert('Error', 'Error al enviar el mensaje, verifica tu conexión y vuelve a intentarlo.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ImageBackground source={require('../../assets/BlueWallpaper.jpeg')} style={styles.backgroundImage}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Contacto</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={name}
            onChangeText={setName}
            returnKeyType="done"
            placeholderTextColor="#888"
            onSubmitEditing={Keyboard.dismiss}
          />
          <TextInput
            style={styles.input}
            placeholder="Correo"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            returnKeyType="done"
            placeholderTextColor="#888"
            onSubmitEditing={Keyboard.dismiss}
          />
          <TextInput
            style={styles.input}
            placeholder="Número de Teléfono"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            returnKeyType="done"
            placeholderTextColor="#888"
            onSubmitEditing={Keyboard.dismiss}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Escribe tu mensaje..."
            multiline
            value={message}
            onChangeText={setMessage}
            returnKeyType="done"
            placeholderTextColor="#888"
            onSubmitEditing={Keyboard.dismiss}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendContactMessage}>
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'flex-start',
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 25,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#32CD32',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    width: '60%',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: width * 0.05,
    fontWeight: 'bold',
  },
});
