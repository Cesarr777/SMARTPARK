import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import io from 'socket.io-client';

const socket = io('http://192.168.1.71:5000');

interface Message {
  nombre: string;
  mensaje: string;
  destinatario?: string;
}

interface MessageScreenProps {
  route: {
    params: {
      usuario: string;
      mensajes?: Message[];
    };
  };
}

export default function MessageScreen({ route }: MessageScreenProps) {
  const { usuario, mensajes: mensajesIniciales = [] } = route.params;
  const [mensajes, setMensajes] = useState<Message[]>(mensajesIniciales);

  useEffect(() => {
    socket.emit('loginUsuario', { usuario });

    socket.on('recibirMensaje', (data: Message) => {
      if (data.destinatario === usuario || data.nombre === 'Guardia') {
        setMensajes((prev) => [...prev, data]);
      }
    });

    return () => {
      socket.off('recibirMensaje');
    };
  }, [usuario]);

  return (
    <View style={styles.container}>
      <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Mensajes recibidos:</Text>
      {mensajes.map((msg, i) => (
        <Text key={i} style={{ marginBottom: 5 }}>
          <Text style={{ fontWeight: 'bold' }}>{msg.nombre}: </Text>
          {msg.mensaje}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
});
