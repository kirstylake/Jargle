// App.tsx or your navigator's file
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import GameScreen from './screens/GameScreen'; // Update with the correct path
import LoginScreen from './screens/LoginScreen';
import SettingsScreen from './screens/SettingsScreen';
import RegisterScreen from './screens/RegisterScreen';
import Tabs from './navigation/Tabs';
import CategoryScreen from './screens/CategoryScreen';  

const Stack = createStackNavigator();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginScreen">
        <Stack.Screen name="GameScreen" component={GameScreen} />
        <Stack.Screen name="HomeScreen" component={Tabs} options={{headerShown: false , title: 'Home', }}/>
        <Stack.Screen name="LoginScreen" component={LoginScreen} options={{headerShown: false}} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} options={{headerShown: false}} />
        <Stack.Screen name="CategoryScreen" component={CategoryScreen} options={{headerShown: true}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
