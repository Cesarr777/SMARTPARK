import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  TextInput,
  Button,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import io from 'socket.io-client';

const socket = io('http://192.168.1.71:5000');
const LOGO_URI = require('../../assets/logo.png');

export default function MessageScreen({ route }) {
  const { email } = route.params || {};
  const [recibo, setRecibo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensajes, setMensajes] = useState([]);
  const [mensajeTexto, setMensajeTexto] = useState('');
  const [guardiaEscribiendo, setGuardiaEscribiendo] = useState(false);
  const scrollRef = useRef();

  useEffect(() => {
    if (email) {
      fetch(`http://192.168.1.71:5000/api/datos-recibo?email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          setRecibo(data);
          setLoading(false);

          const resumen = {
            usuario: data.name,
            placas: data.plates,
            cajon: data.cajon,
          };
          socket.emit('loginUsuario', resumen);
        })
        .catch(() => setLoading(false));
    }

    socket.on('recibirMensaje', (data) => {
      setMensajes(prev => [...prev, { de: 'Guardia', texto: data.mensaje }]);
      setGuardiaEscribiendo(false);
    });

    socket.on('guardiaEscribiendo', (escribiendo) => {
      setGuardiaEscribiendo(escribiendo);
    });

    return () => {
      socket.off('recibirMensaje');
      socket.off('guardiaEscribiendo');
    };
  }, [email]);

  useEffect(() => {
    // Hace scroll al fondo al recibir/enviar mensaje
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [mensajes, guardiaEscribiendo]);

  const enviarMensaje = () => {
    if (!mensajeTexto.trim()) return;
    socket.emit('enviarMensajeUsuario', { usuario: recibo.name, mensaje: mensajeTexto });
    setMensajes(prev => [...prev, { de: 'Tú', texto: mensajeTexto }]);
    setMensajeTexto('');
  };

  const onChangeTexto = (text) => {
    setMensajeTexto(text);
    socket.emit('usuarioEscribiendo', { usuario: recibo?.name, escribiendo: text.length > 0 });
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3366ff" />
      </View>
    );

  if (!recibo)
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          No se encontró recibo para este usuario.
        </Text>
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
    >
      <View style={styles.bg}>
        <View style={styles.logoRow}>
          <Image source={LOGO_URI} style={styles.logo} />
          <Text style={styles.companyName}>SmartPark</Text>
        </View>
        {/* SCROLLVIEW SOLO PARA EL CONTENIDO */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card con datos */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.colLeft}>
                <Text style={styles.label}>Plaza</Text>
                <Text style={styles.info}>{recibo.plaza}</Text>
              </View>
              <View style={styles.colRight}>
                <Text style={styles.label}>Cajón</Text>
                <Text style={styles.info}>{recibo.cajon}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.colLeft}>
                <Text style={styles.label}>Nombre</Text>
                <Text style={styles.info}>{recibo.name}</Text>
                <Text style={styles.label}>Correo</Text>
                <Text style={styles.info}>{recibo.email}</Text>
              </View>
              <View style={styles.colRight}>
                <Text style={styles.label}>Placas</Text>
                <Text style={styles.info}>{recibo.plates}</Text>
                <Text style={styles.label}>Modelo</Text>
                <Text style={styles.info}>{recibo.model}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.rowTotal}>
              <Text style={styles.label}>Total:</Text>
              <Text style={styles.total}>{recibo.total}</Text>
            </View>
            {recibo.fecha && (
              <Text style={styles.fecha}>
                {new Date(recibo.fecha).toLocaleString('es-MX')}
              </Text>
            )}
          </View>
          {/* Chat */}
          <View style={styles.chatSection}>
            <Text style={styles.chatTitle}>Mensajes</Text>
            <View style={styles.chatBox}>
              {mensajes.length === 0 ? (
                <Text style={styles.chatPlaceholder}>
                  Aquí aparecerán los mensajes con el guardia...
                </Text>
              ) : (
                mensajes.map((msg, idx) => (
                  <Text
                    key={idx}
                    style={msg.de === 'Tú' ? styles.msgUser : styles.msgGuard}
                  >
                    <Text style={{ fontWeight: 'bold' }}>{msg.de}: </Text>
                    {msg.texto}
                  </Text>
                ))
              )}
              {guardiaEscribiendo && (
                <Text style={styles.escribiendoTexto}>Guardia está escribiendo...</Text>
              )}
            </View>
          </View>
        </ScrollView>
        {/* INPUT PEGADO ABAJO */}
        <View style={styles.inputContainerSticky}>
          <TextInput
            style={styles.inputChat}
            placeholder="Escribe tu mensaje"
            value={mensajeTexto}
            onChangeText={onChangeTexto}
            multiline
            blurOnSubmit={false}
            returnKeyType="send"
            onSubmitEditing={enviarMensaje}
          />
          <Button title="Enviar" onPress={enviarMensaje} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0c1631' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c1631' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c1631' },
  scroll: { padding: 24, paddingTop: 0, paddingBottom: 32, paddingBottom: 120 }, // más espacio abajo para el input
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    marginTop: 32,
  },
  logo: {
    width: 110,
    height: 110,
    resizeMode: 'contain',
    marginRight: 18,
  },
  companyName: { color: '#3366ff', fontWeight: 'bold', fontSize: 32, marginLeft: 2 },
  card: {
    backgroundColor: '#f4f7fa',
    borderRadius: 18,
    padding: 24,
    marginBottom: 24,
    marginTop: 0,
    elevation: 4,
    shadowColor: '#0026A9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  colLeft: { width: '48%' },
  colRight: { width: '48%' },
  label: { color: '#0026A9', fontWeight: 'bold', fontSize: 15, marginBottom: 2 },
  info: { color: '#0c1631', fontSize: 16, marginBottom: 8, fontWeight: '500' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#dde5ed', marginVertical: 8 },
  rowTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  total: { color: '#00B076', fontWeight: 'bold', fontSize: 20 },
  fecha: { textAlign: 'right', color: '#888', fontSize: 13, marginTop: 8 },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center', marginTop: 30 },
  chatSection: { marginTop: 8, marginBottom: 6 },
  chatTitle: { color: '#0026A9', fontSize: 17, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
  chatBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1.3,
    borderColor: '#dde5ed',
    minHeight: 250,
    maxHeight: 350,
    paddingHorizontal: 16,
    paddingVertical: 18,
    shadowColor: '#0026A9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    justifyContent: 'flex-start',
    marginHorizontal: 2,
  },
  escribiendoTexto: {
    fontStyle: 'italic',
    color: '#888',
    marginTop: 4,
  },
  inputContainerSticky: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: '#dde5ed',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  inputChat: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#8e9aaf',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    backgroundColor: '#fff',
    fontSize: 16,
    maxHeight: 80,
    textAlignVertical: 'top',
  },
  chatPlaceholder: { color: '#8e9aaf', fontSize: 15, textAlign: 'center' },
  msgGuard: { color: '#0026A9', marginBottom: 6 },
  msgUser: { color: '#00B076', marginBottom: 6, alignSelf: 'flex-end', textAlign: 'right' },
});
