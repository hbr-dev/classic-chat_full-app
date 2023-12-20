import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import Auth from "./screens/Auth";
import Signup from "./screens/Inscription";
import Home from "./screens/Home";
import Chat from "./screens/Chat";
import GroupChat from "./screens/GroupChat";
import firebase from "./config/index";

const Stack = createStackNavigator();

export default function App() {
  const user = firebase.auth().currentUser;
  return (
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={user  ? "Home" : "Auth"}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Auth" component={Auth} />
          <Stack.Screen name="Signup" component={Signup} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Chat" component={Chat} />
          <Stack.Screen name="GroupChat" component={GroupChat} />
        </Stack.Navigator>
      </NavigationContainer>
);
}
