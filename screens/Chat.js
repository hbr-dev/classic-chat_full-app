import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  ImageBackground,
  TouchableOpacity,
  // ToastAndroid,
  FlatList,
} from "react-native";
import { Dialog, Provider, Portal } from "react-native-paper";
import firebase from "../config/index";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";

const Chat = ({ route, navigation }) => {
  const friend = route.params;
  const user = firebase.auth().currentUser;
  const [profile, setProfile] = useState();
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [friendIsTyping, setFriendIsTyping] = useState(false);
  const [image, setImage] = useState();
  const [showAttachment, setShowAttachment] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const database = firebase.database(
    "https://tp-mobile-whats-default-rtdb.firebaseio.com/"
  );

  useEffect(() => {
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
    fetchUserProfile(user.uid);
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const conversationKey = getConversationKey(user.uid, friend.id);
        const messagesRef = database.ref(`messages/${conversationKey}`);

        messagesRef?.on("value", (snapshot) => {
          const messages = snapshot.val();
          if (messages) {
            // remove isTyping from messages
            delete messages.isTyping;
            const messagesList = Object.values(messages);
            setMessages(messagesList);
          }
        });
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();
    return () => {
      database
        .ref(`/messages/${getConversationKey(user.uid, friend.id)}`)
        .off();
    };
  }, []);

  // Listen for friend typing
  useEffect(() => {
    const conversationKey = getConversationKey(user.uid, friend.id);
    const isTypingRef = database.ref(`/messages/${conversationKey}/isTyping`);
    isTypingRef.on("value", (snapshot) => {
      const isTyping = snapshot.val();
      if (isTyping) {
        setFriendIsTyping(isTyping[friend.id]);
      }
    });
    return () => {
      isTypingRef.off();
    };
  }, []);

  const getConversationKey = (id1, id2) => {
    return [id1, id2].sort().join("_");
  };

  const sendMessage = (imageUri) => {
    if (messageText?.trim() === "" && !imageUri) {
      // ToastAndroid.show("Please enter a message", ToastAndroid.SHORT);
      return;
    }

    const conversationKey = getConversationKey(user.uid, friend.id);
    const newMessage = {
      text: messageText,
      timestamp: new Date().toLocaleString(), // ISO string is better for consistency
      sender: user.uid,
      receiver: friend.id,
      image: imageUri ? imageUri : null,
    };

    database
      .ref(`/messages/${conversationKey}`)
      .push(newMessage)
      .then(() => {
        setMessageText(""); // Assuming setMessageText is a state setter for messageText
      })
      .catch((error) => {
        console.error("Error sending message: ", error);
        // Handle any errors here
      });
  };

  const setIsTyping = (isTyping) => {
    const conversationKey = getConversationKey(user.uid, friend.id);
    database.ref(`/messages/${conversationKey}/isTyping`).update({
      [user.uid]: isTyping,
    });
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
      setImage(pickerResult.assets[0].uri);
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
      const blob = await convertToblob(image);
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
              sendMessage(downloadURL);
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

  // message bubble component with text and timestamp, make it look like a speech bubble. Align the message to the right if it's from the user and to the left if it's from the friend.
  const messageBubble = (message) => {
    // 255,255,255,.8
    return (
      <View
        style={{
          backgroundColor: "rgba(61, 71, 133, 0.5)",
          borderRadius: 10,
          padding: 10,
          margin: 10,
          gap: 10,
          alignSelf: message?.sender == user.uid ? "flex-end" : "flex-start",
          maxWidth: "80%",
        }}
      >
        <Text>{message?.text}</Text>
        {message?.image && (
          <TouchableOpacity
            onPress={() => {
              setIsPreview(true);
              setImage(message?.image);
              setShowAttachment(true);
            }}
          >
            <Image
              source={{ uri: message?.image }}
              style={{ width: 200, height: 200 }}
            />
          </TouchableOpacity>
        )}
        <Text style={{ fontSize: 10 }}>{message?.timestamp}</Text>
        {/* display image here */}
      </View>
    );
  };

  const messageList = (messages) => {
    return (
      <FlatList
        data={messages.slice().reverse()}
        inverted // This inverts the list (new messages appear at the bottom and it expands from the top)
        keyExtractor={(item, index) => index.toString()} // Replace with a unique key if available
        renderItem={({ item }) => (
          <View style={styles.messageContainer}>{messageBubble(item)}</View>
        )}
        contentContainerStyle={styles.contentContainer}
      />
    );
  };

  return (
    <ImageBackground
      source={require("../assets/background-2.jpg")}
      style={styles.backgroundImage}
    >
      <Provider>
        <Portal>
          <Dialog
            visible={showAttachment}
            onDismiss={() => {setIsPreview(false);setShowAttachment(false)}}
          >
            <Dialog.Title>Attachment</Dialog.Title>
            <Dialog.Content>
              {/* show Image */}
              <View style={{ justifyContent: "center", alignItems: "center" }}>
                {image && (
                  <Image
                    source={{ uri: image }}
                    style={{ width: 200, height: 200 }}
                  />
                )}
              </View>
            </Dialog.Content>
            {/* Action to remove attachment */}
            {!isPreview && <Dialog.Actions style={{ gap: 20 }}>
              <TouchableOpacity
                onPress={() => {
                  setImage(null);
                  setShowAttachment(false);
                }}
              >
                <Text style={{ color: "black" }}>Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowAttachment(false);
                }}
              >
                <Text style={{ color: "black" }}>Cancel</Text>
              </TouchableOpacity>
            </Dialog.Actions>}
          </Dialog>
        </Portal>
        <View style={{ flex: 1 }}>
          {/* Go back button to navigate back to Home */}
          <View
            style={{
              padding: 10,
              backgroundColor: "white",
              borderColor: "black",
              borderWidth: 0.5,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={25} />
            </TouchableOpacity>
            <Image
              source={
                friend?.profilePicture
                  ? { uri: friend?.profilePicture }
                  : require("../assets/profile.png")
              }
              style={styles.profileImage}
            />
            <View>
              <Text>{friend.fullName}</Text>
              <Text>{friend.state}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>{messageList(messages)}</View>
          <View
            style={{
              // backgroundColor: 'red',
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: friendIsTyping ? "flex-start" : "flex-end",
              width: "100%",
            }}
          >
            {friendIsTyping && (
              <View style={{ display: "flex", flexDirection: "row", alignItems: "center", marginLeft: 10 }}>
                <Image source={{ uri: friend.profilePicture }} style={{ height: 30, width: 30, borderRadius: 30, }} />
                <Text style={{ marginLeft: 5, backgroundColor: "rgba(61, 71, 133, 0.5)", fontSize: 16, letterSpacing: 2, fontWeight: "bold", textAlign: "center", padding: 10, borderRadius: 10, color: "#003f5c" }}>
                  Typing...
                </Text>
              </View>
            )}
            {/* if there is an image display 1 attachment text. */}
            {image && (
              <TouchableOpacity
                onPress={() => setShowAttachment(true)}
                style={{
                  borderRadius: 50,
                  borderWidth: 0.5,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  marginRight: 60,
                  paddingVertical: 2,
                  paddingHorizontal: 5,
                }}
              >
                <Text style={{ color: "white", fontSize: 10 }}>
                  {" "}
                  1 attachment
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "auto",
              gap: 5,
              padding: 10,
            }}
          >
            <View style={styles.inputView}>
              {/* {image && <Image source={{ uri: image }} style={{ width: 50, height: 50 }} />} */}
              <TextInput
                style={styles.TextInput}
                placeholder="Type a message"
                placeholderTextColor="#003f5c"
                value={messageText}
                onFocus={() => {
                  setIsTyping(true);
                }}
                onBlur={() => {
                  setIsTyping(false);
                }}
                onChangeText={(text) => setMessageText(text)}
              />
              {/* Attach an image */}
              <TouchableOpacity
                style={{ position: "absolute", right: 10, top: 10 }}
                onPress={() => {
                  pickImage();
                }}
              >
                <Ionicons name="attach" size={24} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={{
                padding: 10,
                borderRadius: 50,
                backgroundColor: "rgba(61, 71, 133, 0.7)",
              }}
              onPress={() => {
                image ? uploadImage() : sendMessage();
              }}
            >
              <Ionicons name="send" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Provider>
    </ImageBackground>
  );
};

const styles = {
  contentContainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  messageContainer: {
    marginVertical: 10,
    // Add additional styling for message container if needed
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 50,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  inputView: {
    backgroundColor: "white",
    borderRadius: 10,
    // grow.
    flex: 1,
    height: 45,
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
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  title: {
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

export default Chat;
