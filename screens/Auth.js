// Auth.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Alert,
  BackHandler,
  // ToastAndroid,
} from "react-native";
import firebase from "../config/index";
export default function Auth({ navigation }) {
  const auth = firebase.auth();
  const database = firebase.database(
    "https://tp-mobile-whats-default-rtdb.firebaseio.com/"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newUser, setNewUser] = useState("Sign Up");

  const handleCancel = () => {
    Alert.alert(
      "Confirm Exit",
      "Are you sure you want to close the app?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "OK", onPress: () => BackHandler.exitApp() },
      ],
      { cancelable: false }
    );
  };

  const handleLogin = () => {
    auth
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        onLogin(user);
        navigation.replace("Home");
        // ...
      })

      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
        // Handle errors...
      });
  };

  useEffect(() => {
    const stateListener = auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in, obtain the user's ID.
        const uid = user.uid;

        // Reference to the user's record in the database.
        const userProfileRef = database.ref(`/profiles/${uid}`);

        // Reference to the /info/connected path in the database, which reports the client's connection state.

        database.ref(".info/connected").on("value", (snapshot) => {
          if (snapshot.val() === false) {
            // The client is not connected to the internet or Firebase.
            return;
          }

          userProfileRef
            .onDisconnect()
            .update({ state: "offline", last_changed: new Date().getTime() });

          // Update the user's profile with the 'online' state when they are connected.
          userProfileRef.update({ state: "online", last_changed: new Date().getTime() }).then(() => {
            navigation.replace("Home");
          });
        });
      }
    });

    return () => {
      stateListener();
    };
  }, []);

  return (
    <ImageBackground
      source={require("../assets/background-2.jpg")}
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <StatusBar style="auto" />
        <Text style={styles.title}>Login</Text>

        <View style={styles.inputView}>
          <TextInput
            style={styles.TextInput}
            placeholder="Email"
            placeholderTextColor="#003f5c"
            onChangeText={(email) => setEmail(email)}
          />
        </View>
        <View style={styles.inputView}>
          <TextInput
            style={styles.TextInput}
            placeholder="Password"
            placeholderTextColor="#003f5c"
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
          />
        </View>

        <View style={{ alignItems: "flex-end", width: "85%" }}>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text>
              <Text style={{ color: "#91969C", letterSpacing:2 }}>Don't have an account ? </Text>
              <Text style={{ fontWeight: "bold", color:"#3d4785" }}>{newUser}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ width: "90%", marginTop: 10 }}>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.loginBtn, styles.cancelButton]}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}
const styles = {
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  inputView: {
    backgroundColor: "white",
    borderRadius: 10,
    width: "90%",
    height: 45,
    marginBottom: 20,
    textAlign: "center",
    borderWidth: 0.5, // Sets the width of the border
    borderColor: "black",
  },
  TextInput: {
    height: 50,
    flex: 1,
    padding: 10,
    width: "100%",
  },
  cancelButton: {
    // backgroundColor: "#5783db",
  },
  loginBtn: {
    width: "100%",
    borderRadius: 10,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    backgroundColor: "rgba(61, 71, 133, 0.7)",
  },
  title: {
    color: "rgb(61, 71, 133)",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 40,
  },
  loginText: {
    color: "white",
  },
  cancelText: {
    color: "white",
  },
};
