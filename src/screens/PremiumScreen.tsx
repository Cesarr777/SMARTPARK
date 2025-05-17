import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  ImageBackground,
  SafeAreaView
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

interface PremiumScreenProps {
  navigation: NavigationProp<any>;
  route: RouteProp<any, any>;
}

export default function PremiumScreen({ navigation, route }: PremiumScreenProps) {
  const [availableSpots, setAvailableSpots] = useState(6);
  
  useEffect(() => {
    if (route.params?.availableSpots) {
      setAvailableSpots(route.params.availableSpots);
    }
  }, [route.params?.availableSpots]);
  
  const handlePurchase = () => {
    if (availableSpots > 0) {
      navigation.navigate('InfoCarScreen', { availableSpots });
    } else {
      Alert.alert('No hay más lugares disponibles');
    }
  };
  
  return (
    <LinearGradient 
      colors={['#a6c0fe', '#f68084']} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>SmartPark Premium</Text>
          <View style={styles.badgeContainer}>
            <MaterialIcons name="verified" size={24} color="#FFD700" />
            <Text style={styles.badgeText}>Servicio Exclusivo</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="local-parking" size={28} color="#0026A9" />
            <Text style={styles.cardTitle}>Cajón Reservado</Text>
          </View>
          
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <MaterialIcons name="check-circle" size={20} color="#0026A9" />
              <Text style={styles.benefitText}>Acceso garantizado 24/7</Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons name="check-circle" size={20} color="#0026A9" />
              <Text style={styles.benefitText}>Lugar asignado exclusivamente para ti</Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons name="check-circle" size={20} color="#0026A9" />
              <Text style={styles.benefitText}>Seguridad y monitoreo constante</Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons name="check-circle" size={20} color="#0026A9" />
              <Text style={styles.benefitText}>Soporte prioritario en la app</Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.pricePeriod}>Renta mensual</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceSign}>$</Text>
              <Text style={styles.priceAmount}>600</Text>
              <Text style={styles.priceCurrency}>MXN</Text>
            </View>
          </View>

          <View style={styles.spotsInfoContainer}>
            <MaterialIcons 
              name={availableSpots > 2 ? "emoji-objects" : "priority-high"} 
              size={22} 
              color={availableSpots > 2 ? "#FFD700" : "#FF6B6B"} 
            />
            <Text style={[
              styles.spotsText, 
              availableSpots <= 2 && {color: "#FF6B6B"}
            ]}>
              {availableSpots > 0 
                ? `¡Solo quedan ${availableSpots} lugares disponibles!` 
                : "No hay lugares disponibles actualmente"}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.buyButton, availableSpots === 0 && styles.disabledButton]}
            onPress={handlePurchase}
            disabled={availableSpots === 0}
          >
            <Text style={styles.buyText}>
              {availableSpots > 0 ? 'Reservar Ahora' : 'Sin Disponibilidad'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <MaterialIcons name="security" size={18} color="#FFF" style={styles.footerIcon} />
          <Text style={styles.footerText}>Pago seguro garantizado</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0026A9',
    marginLeft: 10,
  },
  benefitsContainer: {
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  priceContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  pricePeriod: {
    fontSize: 16,
    color: '#777',
    marginBottom: 5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  priceSign: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0026A9',
    marginTop: 5,
  },
  priceAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#0026A9',
  },
  priceCurrency: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0026A9',
    marginLeft: 4,
    marginTop: 5,
  },
  spotsInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  spotsText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  buyButton: {
    backgroundColor: '#0026A9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  buyText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerIcon: {
    marginRight: 6,
  },
  footerText: {
    color: '#FFF',
    fontSize: 14,
  },
});