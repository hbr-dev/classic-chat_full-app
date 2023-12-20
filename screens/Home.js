import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import GroupsList from "./Group";
import UsersList from "./UsersList";
import Profils from "./Profile";
import Ionicons from "@expo/vector-icons/Ionicons";
import firebase from "../config/index";

import React, { useState, useEffect } from "react";
const Tab = createMaterialBottomTabNavigator();
export default function Home() {
  const user = firebase.auth().currentUser;
  const database = firebase.database(
    "https://tp-mobile-whats-default-rtdb.firebaseio.com/"
  );
  const [connectedUsersCount, setConnectedUsersCount] = useState(0);

  useEffect(() => {
    const profilesRef = database.ref("/profiles/");

    const onProfileChange = profilesRef.on("value", (snapshot) => {
      const profiles = snapshot.val() || {};
      const connectedUsers = Object.values(profiles).filter(
        (profile) => profile.state === "online" && profile.id != user.uid
      ).length;
      setConnectedUsersCount(connectedUsers);
    });

    return () => {
      // Clean up the listener
      profilesRef.off("value", onProfileChange);
    };
  }, []);

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Groups"
        component={GroupsList}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-circle-outline" size={25} color="#3d4785" />
          ),
        }}
      />
      <Tab.Screen
        name="Users"
        component={UsersList}
        options={{
          tabBarBadge: connectedUsersCount,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={25} color="#3d4785" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profils}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={25} color="#3d4785" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
