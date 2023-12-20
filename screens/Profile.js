import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  ImageBackground,
  TouchableOpacity,
  ToastAndroid,
  // ToastAndroid,
} from "react-native";
import firebase from "../config/index";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";

const Profile = ({ navigation }) => {
  // Placeholder data, replace with actual data from your user
  const user = firebase.auth().currentUser;
  const database = firebase.database(
    "https://tp-mobile-whats-default-rtdb.firebaseio.com/"
  );
  const [profile, setProfile] = useState();

  const fetchUserProfile = async (userId) => {
    try {
      const snapshot = await database.ref("/profiles/" + userId).get();
      if (snapshot.exists()) {
        const profile = snapshot.val();
        setProfile(profile);
      } else {
        console.log("No profile found for this user.");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    fetchUserProfile(user.uid);
  }, []);

  const handleSaveChanges = async (prof = profile) => {
    database
      .ref(`/profiles/${user.uid}`)
      .set({ ...prof, state: "online" })
      .then(() => {
        ToastAndroid.show("Profile successfully updated", ToastAndroid.SHORT);
      })
      .catch((error) => {
        ToastAndroid.show(error.message, ToastAndroid.SHORT);
      });
    // user.updateProfile({
    //     displayName: fullName,
    //     phoneNumber,
    //     email,
    //   })
  };

  const pickImage = async () => {
    // Request permission to access the media library
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert("Permission to access gallery is required!");
      return;
    }

    // Launch the image picker
    const pickerResult = await ImagePicker.launchImageLibraryAsync();
    if (pickerResult.canceled) {
      return;
    }
    if (pickerResult.assets && pickerResult.assets.length > 0) {
      setProfile({ ...profile, profilePicture: pickerResult.assets[0].uri });
    }
  };

  const convertToblob = async (uri) => {
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.log(e);
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob"; //bufferArray
      xhr.open("GET", uri, true);
      xhr.send(null);
    });
    return blob;
  };

  const uploadImage = async () => {
    try {
      const blob = await convertToblob(profile?.profilePicture);
      const storageRef = firebase.storage().ref().child(`images/${Date.now()}`);
      const uploadTask = storageRef.put(blob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // handle progress
        },
        (error) => {
          // handle error
          console.log(error);
        },
        () => {
          // handle successful upload
          uploadTask.snapshot.ref
            .getDownloadURL()
            .then((downloadURL) => {
              console.log("File available at", downloadURL);
              // Save the URL to the Realtime Database
              setProfile({ ...profile, profilePicture: downloadURL });
              handleSaveChanges({ ...profile, profilePicture: downloadURL });
            })
            .catch((error) => {
              console.log(error);
            });
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    // Assuming `user.uid` is available and valid

    // Update the user's state to "offline"
    database.ref(`/profiles/${user.uid}`).update({ state: "offline" })
      .then(() => {
        // If you have set up global or persistent listeners, detach them here
        // For example: database.ref('/some/path').off();

        // Sign out from Firebase Authentication
        firebase.auth().signOut()
          .then(() => {
            // Navigate to the authentication (login) screen
            navigation.replace("Auth");
          })
          .catch((error) => {
            // Handle errors here
            console.error("Error signing out: ", error);
          });
      })
      .catch((error) => {
        // Handle errors here
        console.error("Error updating user state: ", error);
      });
  };

  return (
    <ImageBackground
      source={require("../assets/background-2.jpg")}
      style={styles.backgroundImage}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
          <Image
            source={
              profile?.profilePicture
                ? { uri: profile?.profilePicture }
                : require("../assets/profile.png")
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>
        <View style={styles.inputView}>
          <TextInput
            style={styles.TextInput}
            placeholder="Full Name"
            placeholderTextColor="#003f5c"
            value={profile?.fullName}
            onChangeText={(text) => setProfile({ ...profile, fullName: text })}
          />
        </View>

        <View style={styles.inputView}>
          <TextInput
            style={styles.TextInput}
            placeholder="Email"
            placeholderTextColor="#003f5c"
            value={profile?.email}
            onChangeText={(text) => setProfile({ ...profile, email: text })}
          />
        </View>

        <View style={styles.inputView}>
          <TextInput
            keyboardType="numeric"
            style={styles.TextInput}
            placeholder="Phone Number"
            placeholderTextColor="#003f5c"
            value={profile?.phoneNumber}
            onChangeText={(text) =>
              setProfile({ ...profile, phoneNumber: text })
            }
          />
        </View>

        <View style={{ width: "90%" }}>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={uploadImage}
            activeOpacity={0.8}
          >
            <Text style={styles.loginText}>Save changes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.loginText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = {
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
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
    // alignItems: "center",
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
    marginBottom: 10,
  },
  loginText: {
    color: "white",
  },
  cancelText: {
    color: "white",
  },
};

export default Profile;
