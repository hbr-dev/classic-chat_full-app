import {
  View,
  Text,
  FlatList,
  ImageBackground,
  Image,
  TouchableOpacity,
  TextInput,
  Linking,
} from "react-native";
import { Dialog, Provider, Portal } from 'react-native-paper';
import React, { useState, useEffect } from "react";
import firebase from "../config/index";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function UsersList({ navigation }) {
  const user = firebase.auth().currentUser;
  const database = firebase.database(
    "https://tp-mobile-whats-default-rtdb.firebaseio.com/"
  );
  const [profiles, setProfiles] = useState({});
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const fetchProfiles = async () => {
    try {
      const snapshot = await database.ref("/profiles").get();
      if (snapshot.exists()) {
        const profiles = Object.values(snapshot.val());
        setProfiles(profiles.filter((profile) => profile.id !== user.uid));
        setFilteredProfiles(profiles);
      } else {
        console.log("No profile found for this user.");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    // fetchProfiles();
    database.ref("/profiles").on("value", (snapshot) => {
      if (snapshot.exists()) {
        let profiles = Object.values(snapshot.val());
        // sort state by online/offline
        profiles.sort((a, b) => {
          if (a.state === "online") return -1;
          if (b.state === "online") return 1;
          return 0;
        });
        setProfiles(profiles.filter((profile) => profile.id !== user.uid));
        setFilteredProfiles(profiles.filter((profile) => profile.id !== user.uid));
      } else {
        console.log("No profile found for this user.");
      }
    });
    return () => {
      database.ref("/profiles").off();
    };
  }, []);

  const userItem = ({ item }) => {
    // Make the user card. Display Name, Phone Number, Email, Profile Picture of each user. I want the profile picture to be a circle and on the left of the other information (add the right styling to the image).
    return (
      <View
        style={[
          styles.item,
          {
            flexDirection: "col",
            padding: 10,
            gap: 20,
            backgroundColor: "rgba(61, 71, 133, 0.2)",
            borderColor: item.state == "online" ? "green" : "rgb(61, 71, 133)",
            borderWidth: 2,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("Chat", item)}
          activeOpacity={0.6}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity onPress={() => {setSelectedItem(item);setIsOpen(true);}} style={{ position:"relative" }}>
            <Image
              source={
                item?.profilePicture
                  ? { uri: item?.profilePicture }
                  : require("../assets/profile.png")
              }
              style={styles.profileImage}
            />
            <View style={{ width: 17, height: 17, backgroundColor: item.state =='online' ? 'green' : 'red', borderRadius: 17, position: "absolute", left: 35, bottom: 2 }}></View>
            </TouchableOpacity>
            <View>
              <Text>{item.fullName}</Text>
              <Text>{item.phoneNumber}</Text>
              <Text>{item.email}</Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "end",
              justifyContent: "center",
            }}
          >
            <TouchableOpacity
              style={{
                padding: 10,
                borderRadius: 50,
                backgroundColor: "rgb(61, 71, 133)",
                marginLeft: 5,
                marginRight: 5,
              }}
              onPress={() => Linking.openURL(`tel:${item.phoneNumber}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="videocam" size={18} color="#F3F8FE" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                padding: 10,
                borderRadius: 50,
                backgroundColor: "rgb(61, 71, 133)",
                marginLeft: 5,
                marginRight: 5,
              }}
              onPress={() => Linking.openURL(`tel:${item.phoneNumber}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={18} color="#F3F8FE" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require("../assets/background-2.jpg")}
      style={styles.backgroundImage}
    >
      <Provider>
      <Portal>
      <Dialog visible={isOpen} onDismiss={() => {setIsOpen(false)}}>
          <Dialog.Title>Profile information</Dialog.Title>
          <Dialog.Content>
            <Text style={{marginVertical: 5}}><Text style={{fontWeight:"bold"}}>Name: </Text>{selectedItem?.fullName}</Text>
            <Text style={{marginVertical: 5}}><Text style={{fontWeight:"bold"}}>Email: </Text>{selectedItem?.email}</Text>
            <Text style={{marginVertical: 5}}><Text style={{fontWeight:"bold"}}>Phone Number: </Text>{selectedItem?.phoneNumber}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <TouchableOpacity title="Done" onPress={() => {setIsOpen(false)}}>
              <Text>Close</Text>
            </TouchableOpacity>
          </Dialog.Actions>
      </Dialog>
        </Portal>
      <View style={{ height: "100%", gap: 20, padding: 10 }}>
        {/* Search profiles */}
        <View style={[styles.inputView, { marginTop: 20}]}>
          <TextInput
            style={[styles.TextInput]}
            placeholder="Search"
            placeholderTextColor="#003f5c"
            value={searchTerm}
            onChangeText={(text) => {
              setSearchTerm(text);
              setFilteredProfiles(
                profiles.filter((profile) =>
                  profile.fullName.toLowerCase().includes(text.toLowerCase())
                )
              );
            }}
          />
          <Ionicons name="search" size={24} color="rgb(61, 71, 133)" />
        </View>
        <FlatList data={filteredProfiles} renderItem={userItem}></FlatList>
      </View>
      </Provider>
    </ImageBackground>
  );
}

const styles = {
  modalView: {
    alignSelf: "center",
    marginVertical: "50%",
    position: "absolute",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    
    elevation: 5,
  },
  inputView: {
    backgroundColor: "white",
    borderRadius: 10,
    width: "100%",
    height: 45,
    borderWidth: 0.5, // Sets the width of the border
    borderColor: "black",
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingRight: 10,
  },
  TextInput: {
    height: 50,
    flex: 1,
    padding: 10,
    width: "100%",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 50,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  item: {
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 0.5,
  },
};
