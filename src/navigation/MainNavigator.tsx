import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import MapaScreen from '../screens/MapaScreen';
import MessageScreen from '../screens/MessageScreen';
import InfoCarScreen from '../screens/InfoCarScreen';
import ClubScreen from '../screens/ClubScreen'; // Pantalla de ventajas del Club
import ReservasScreen from '../screens/ReservasScreen'; // <- ¡Agrega tu pantalla aquí!
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
          name="MapaScreen" 
          component={MapaScreen} 
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
          name="ClubScreen"
          component={ClubScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ReservasScreen" // <--- Aquí la nueva pantalla
          component={ReservasScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
