import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ImageBackground,
  // ToastAndroid,
} from "react-native";
import firebase from "../config/index";

export default function Signup({ navigation }) {
  const auth = firebase.auth();
  const database = firebase.database(
    "https://tp-mobile-whats-default-rtdb.firebaseio.com/"
  );
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const createProfile = async (profile, userId) => {
    database
      .ref(`/profiles/${userId}`)
      .set(profile)
      .catch((error) => {
        ToastAndroid.show(error.message, ToastAndroid.SHORT);
      });
    // user.updateProfile({
    //     displayName: fullName,
    //     phoneNumber,
    //     email,
    //   })
  };

  const handleSignup = () => {
    if (password === confirmPassword) {
      auth
        .createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Signed in
          var user = userCredential.user;
          createProfile(
            { id: user.uid, fullName, email, phoneNumber, state: "online" },
            user.uid
          ).then(() => navigation.replace("Home"));
          // ...
        })
        .catch((error) => {
          var errorCode = error.code;
          var errorMessage = error.message;
          ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
          // ...
        });
    }
  };

  return (
    <ImageBackground
      source={require("../assets/background-2.jpg")}
      style={styles.backgroundImage}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={styles.title}>Inscription</Text>

        <View style={styles.inputView}>
          <TextInput
            style={styles.TextInput}
            placeholder="Full Name"
            placeholderTextColor="#003f5c"
            onChangeText={(text) => setFullName(text)}
          />
        </View>

        <View style={styles.inputView}>
          <TextInput
            style={styles.TextInput}
            placeholder="Email"
            placeholderTextColor="#003f5c"
            onChangeText={(text) => setEmail(text)}
          />
        </View>

        <View style={styles.inputView}>
          <TextInput
            style={styles.TextInput}
            placeholder="Phone Number"
            placeholderTextColor="#003f5c"
            keyboardType="numeric"
            onChangeText={(phoneNumber) => setPhoneNumber(phoneNumber)}
          />
        </View>

        <View style={styles.inputView}>
          <TextInput
            style={styles.TextInput}
            placeholder="Password"
            placeholderTextColor="#003f5c"
            secureTextEntry={true}
            onChangeText={(text) => setPassword(text)}
          />
        </View>

        <View style={styles.inputView}>
          <TextInput
            style={styles.TextInput}
            placeholder="Confirm Password"
            placeholderTextColor="#003f5c"
            secureTextEntry={true}
            onChangeText={(text) => setConfirmPassword(text)}
          />
        </View>

        <View style={{ width: "90%" }}>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleSignup}
            activeOpacity={0.8}
          >
            <Text style={styles.loginText}>Signup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate("Auth")} // Navigate back to Auth page
            activeOpacity={0.8}
          >
            <Text style={styles.loginText}>Go back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = {
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
    borderWidth: 0.5, // Sets the width of the border
    borderColor: "black",
  },
  TextInput: {
    height: 50,
    flex: 1,
    padding: 10,
    width: "100%",
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
