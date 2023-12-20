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
import { Dialog, Provider, Portal } from "react-native-paper";
import React, { useState, useEffect } from "react";
import firebase from "../config/index";
import Ionicons from "@expo/vector-icons/Ionicons";
export default function Group({ navigation }) {
  const user = firebase.auth().currentUser;
  const database = firebase.database(
    "https://tp-mobile-whats-default-rtdb.firebaseio.com/"
  );
  const [profiles, setProfiles] = useState({});
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState();

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
        setFilteredProfiles(
          profiles.filter((profile) => profile.id !== user.uid)
        );
      } else {
        console.log("No profile found for this user.");
      }
    });
    return () => {
      database.ref("/profiles").off();
    };
  }, []);

  useEffect(() => {
    // get groups where user.uid exists in the members.
    database.ref("/groups").on("value", (snapshot) => {
      if (snapshot.exists()) {
        let groups = Object.values(snapshot.val());
        groups = groups.filter((group) => group.members.includes(user.uid));
        setGroups(groups);
        setFilteredGroups(groups);
      } else {
        console.log("No groups found for this user.");
      }
    });
    return () => {
      database.ref("/groups").off();
    };
  }, []);

  const checkIfSelected = (id) => {
    return selectedProfiles.includes(id);
  };

  const handleSelect = (id) => {
    if (checkIfSelected(id)) {
      setSelectedProfiles(selectedProfiles.filter((item) => item !== id));
    } else {
      setSelectedProfiles([...selectedProfiles, id]);
    }
  };

  // handle update group, the group is identified by its name.
  const handleUpdateGroup = () => {
    if (name.length > 0 && selectedProfiles.length > 0) {
      // check if group name doesn't exist as it's unique.
      if (
        groups.find(
          (group) => group.name === name && group.name !== selectedGroup.name
        )
      ) {
        alert("Group name already exists");
        return;
      }
      const group = {
        name,
        members: selectedProfiles,
        admin: selectedGroup.admin,
      };
      database
        .ref("/groups")
        .child(selectedGroup.name)
        .set(group)
        .then(() => setSelectedProfiles([]));
      setIsOpen(false);
    }
  };

  // handle create group and I want the key to be the name of the group.
  const handleCreateGroup = () => {
    if (name.length > 0 && selectedProfiles.length > 0) {
      // check if group name doesn't exist as it's unique.
      if (groups.find((group) => group.name === name)) {
        alert("Group name already exists");
        return;
      }
      const group = {
        name,
        members: [...selectedProfiles, user.uid],
        admin: user.uid,
      };
      database
        .ref("/groups")
        .child(name)
        .set(group)
        .then(() => setSelectedProfiles([]));
      setIsOpen(false);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 10,
          borderRadius: 25,
          // borderBottomWidth: 0.5,
          // borderBottomColor: "grey",
          backgroundColor: checkIfSelected(item.id)
            ? "rgba(61, 71, 133, 0.2)"
            : "white",
          marginBottom: 5,
        }}
        onPress={() => (!selectedGroup || selectedGroup?.admin == user.uid) && handleSelect(item.id)}
      >
        <Image
          source={
            item.profilePicture
              ? { uri: item.profilePicture }
              : require("../assets/profile.png")
          }
          style={styles.profileImage}
        />
        <View style={{ marginLeft: 15 }}>
          <Text style={{ fontSize: 18 }}>{item.fullName}</Text>
          <Text
            style={{
              fontSize: 16,
              color: item.state == "offline" ? "grey" : "limegreen",
              textTransform: "capitalize",
            }}
          >
            {item.state}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroupItem = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={{
          width: "100%",
          flexDirection: "row",
          alignItems: "center",
          padding: 10,
          borderRadius: 10,
          backgroundColor: "rgba(61, 71, 133, 0.5)",
          borderColor: "black",
          borderWidth: 0.5,
          marginBottom: 10,
        }}
        onPress={() => {
          navigation.navigate("GroupChat", item);
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setSelectedGroup(item);
            setName(item.name);
            setSelectedProfiles(item.members);
            setIsOpen(true);
          }}
        >
          <Image
            source={
              item.profilePicture
                ? { uri: item.profilePicture }
                : require("../assets/group.png")
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>
        <View style={{ marginLeft: 15 }}>
          <Text style={{ fontSize: 18 }}>{item.name}</Text>
          <Text style={{ fontSize: 16, color: "black" }}>
            {item.members.length} members
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <ImageBackground
      source={require("../assets/background-2.jpg")}
      style={styles.backgroundImage}
    >
      <Provider>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          {/* Dialog to add new group. it has a TextInput for the name of the group and a select to select the profiles */}
          <Portal>
            <Dialog visible={isOpen} onDismiss={() => setIsOpen(false)}>
              <Dialog.Title>
                {selectedGroup ? "Edit" : "Add"} Group
              </Dialog.Title>
              <Dialog.Content>
                <View style={{ gap: 10 }}>
                  <View style={styles.inputView}>
                    <TextInput
                      style={styles.TextInput}
                      placeholder="Group Name"
                      placeholderTextColor="#003f5c"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                  <View style={styles.item}>
                    {/* user can select multiple profiles with a checkbox. profiles are in a flatlist, display profile picture, full name, phone number and email of the profile. */}
                    <FlatList
                      data={filteredProfiles}
                      renderItem={renderItem}
                      keyExtractor={(item) => item.id}
                    />
                  </View>
                </View>
              </Dialog.Content>
              <Dialog.Actions>
                {(!selectedGroup || selectedGroup.admin == user.uid) && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                      width: "100%",
                      borderRadius: 10,
                      height: 50,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(61, 71, 133, 0.7)",
                    }}
                    onPress={() =>
                      selectedGroup ? handleUpdateGroup() : handleCreateGroup()
                    }
                  >
                    <Text style={{ color: "white" }}>Confirm</Text>
                  </TouchableOpacity>
                )}
              </Dialog.Actions>
            </Dialog>
          </Portal>
          {/* Search groups */}
          <View style={{ width: "100%", padding: 10 }}>
            <View style={[styles.inputView, { marginTop: 20 }]}>
              <TextInput
                style={[styles.TextInput]}
                placeholder="Search"
                placeholderTextColor="#003f5c"
                value={searchTerm}
                onChangeText={(text) => {
                  setSearchTerm(text);
                  setFilteredGroups(
                    groups.filter((group) =>
                      group.name.toLowerCase().includes(text.toLowerCase())
                    )
                  );
                }}
              />
              <Ionicons name="search" size={24} color="rgb(61, 71, 133)" />
            </View>
          </View>
          {/* Flatlist of groups. */}
          {filteredGroups.length > 0 ? (
            <FlatList
              data={filteredGroups}
              renderItem={renderGroupItem}
              keyExtractor={(item, index) => index}
              style={{ width: "100%", padding: 10 }}
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "rgb(61, 71, 133)", fontSize: 18, fontWeight: "bold" }}>No groups found.</Text>
            </View>
          )}
          {/* Add group button using the Ionicons Plus */}
          <TouchableOpacity
            style={{
              backgroundColor: "rgba(61, 71, 133, 0.7)",
              borderRadius: 50,
              width: 50,
              height: 50,
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              bottom: 20,
              right: 20,
            }}
            onPress={() => {
              setSelectedGroup(null);
              setName("");
              setSelectedProfiles([]);
              setIsOpen(true);
            }}
          >
            <Ionicons name="ios-add" size={24} color="white" />
          </TouchableOpacity>
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
    borderWidth: 0.5,
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
    backgroundColor: "#F3F8FE",
    borderRadius: 10,
    borderWidth: 0.5, // Sets the width of the border
    borderColor: "black",
    height: 250,
    padding: 10,
  },
};
