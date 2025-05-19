// HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import io from 'socket.io-client';

const { width } = Dimensions.get('window');
const socket = io('http://192.168.1.71:5000');

interface HomeScreenProps {
  navigation: NavigationProp<any>;
  route: any;
}

const actions = [
  { label: 'Mapa', icon: 'map', screen: 'MapaScreen' },
  { label: 'Servicio Premium', icon: 'star', screen: 'PremiumScreen' },
  { label: 'Ayuda', icon: 'help-circle', screen: 'ContactoScreen' },
  { label: 'Mensajes', icon: 'chatbubble-ellipses', screen: 'MessageScreen' },
];

const fakeContacts = [
  'Ana Torres',
  'Carlos Méndez',
  'Lucía Ríos',
  'Pablo Ortega',
  'Sandra Lozano',
  'Jorge Ramírez',
  'Claudia Ruiz',
  'Iván Salinas',
];

export default function HomeScreen({ navigation, route }: HomeScreenProps) {
  const { usuario, placas, plaza } = route.params;
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [invited, setInvited] = useState<string[]>([]);

  useEffect(() => {
    socket.emit('loginUsuario', { usuario });

    socket.on('recibirMensaje', (data) => {
      if (data.destinatario === usuario || data.nombre === 'Guardia') {
        setMensajes((prev) => [...prev, data]);
        setNotificationCount((prev) => prev + 1);
        setHasNotifications(true);
      }
    });

    return () => {
      socket.off('recibirMensaje');
    };
  }, [usuario]);

  const handleNotifications = () => {
    navigation.navigate('MessageScreen', { usuario, mensajes });
    setNotificationCount(0);
    setHasNotifications(false);
  };

  // Cambiado: ahora si la acción es MapaScreen manda la plaza seleccionada
  const handlePress = (screen: string) => {
    if (screen === 'MessageScreen') handleNotifications();
    else if (screen === 'MapaScreen') navigation.navigate('MapaScreen', { plaza });
    else navigation.navigate(screen);
  };

  const inviteFriend = (name: string) => {
    setInvited((prev) => [...prev, name]);
  };

  return (
    <LinearGradient colors={['#a6c0fe', '#f68084']} style={styles.gradientContainer}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.headerWrapper}>
          <TouchableOpacity style={styles.homeIcon} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}>
            <Ionicons name="home-outline" size={30} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNotifications} style={styles.notificationBtn}>
            <Ionicons
              name={hasNotifications ? 'notifications' : 'notifications-outline'}
              size={28}
              color={hasNotifications ? '#fff' : '#eee'}
            />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={styles.welcomeText}>¡Hola, {usuario}!</Text>
          <Text style={styles.subText}>Placas: {placas}</Text>
          {plaza && (
            <Text style={styles.subText}>Plaza: {plaza}</Text>
          )}
        </View>

        <View style={styles.quickActionsGrid}>
          {actions.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionBtn}
              onPress={() => handlePress(item.screen)}
            >
              <Ionicons name={item.icon as any} size={30} color="#4a90e2" />
              <Text style={styles.quickActionText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.banner}>
          <Text style={styles.bannerText}>Invita a tus amigos y obtén 5% de descuento</Text>
          <TouchableOpacity style={styles.bannerBtn} onPress={() => setInviteModalVisible(true)}>
            <Text style={styles.bannerBtnText}>INVITAR</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={inviteModalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Selecciona contactos para invitar</Text>
              {fakeContacts.map((name) => (
                <View key={name} style={styles.contactItem}>
                  <Text style={styles.contactName}>{name}</Text>
                  {invited.includes(name) ? (
                    <Text style={styles.invitedLabel}>Invitado</Text>
                  ) : (
                    <TouchableOpacity onPress={() => inviteFriend(name)}>
                      <Text style={styles.inviteBtn}>Invitar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity onPress={() => setInviteModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  homeIcon: {
    padding: 6,
  },
  notificationBtn: {
    position: 'relative',
    padding: 6,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff5252',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  headerTextContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  subText: {
    fontSize: 14,
    color: '#fceef1',
    marginTop: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  quickActionBtn: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 6,
  },
  quickActionText: {
    marginTop: 8,
    fontWeight: '700',
    fontSize: 14,
    color: '#4a90e2',
    textAlign: 'center',
  },
  banner: {
    backgroundColor: '#4a90e2',
    borderRadius: 20,
    padding: 20,
    marginTop: 30,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
  },
  bannerText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
    marginRight: 10,
  },
  bannerBtn: {
    backgroundColor: '#163e83',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  bannerBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingBottom: 6,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
  },
  inviteBtn: {
    color: '#4a90e2',
    fontWeight: '700',
  },
  invitedLabel: {
    color: 'green',
    fontWeight: '700',
  },
  closeBtn: {
    marginTop: 20,
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  closeBtnText: {
    color: 'white',
    fontWeight: '700',
  },
});
