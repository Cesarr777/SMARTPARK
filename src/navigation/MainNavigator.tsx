import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import MapaScreen from '../screens/MapaScreen';
import PremiumScreen from '../screens/PremiumScreen';
import ContactoScreen from '../screens/ContactoScreen';
import MessageScreen from '../screens/MessageScreen';
import InfoCarScreen from '../screens/InfoCarScreen';
import InvitadosScreen from '../screens/InvitadosScreen';
import RegistroScreen from '../screens/RegistroScreen'; // Registro de usuarios
import ClubScreen from '../screens/ClubScreen'; // Pantalla de ventajas del Club
import { enableScreens } from 'react-native-screens';

enableScreens();

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="MapaScreen" 
          component={MapaScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ContactoScreen" 
          component={ContactoScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="PremiumScreen" 
          component={PremiumScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="InfoCarScreen" 
          component={InfoCarScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="MessageScreen" 
          component={MessageScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="InvitadosScreen" 
          component={InvitadosScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="Registro"
          component={RegistroScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ClubScreen"
          component={ClubScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
