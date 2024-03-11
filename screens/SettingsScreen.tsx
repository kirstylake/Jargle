import { StatusBar } from 'expo-status-bar';
import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { auth, firebase, firestore, storage } from '../firebase'
import * as ImagePicker from "expo-image-picker";
import { getFirestore, collection, getDocs, query, where, orderBy, onSnapshot, getCountFromServer } from 'firebase/firestore'
import { LinearGradient } from 'expo-linear-gradient';
import { uploadBytesResumable, ref as sRef, getDownloadURL } from "firebase/storage";
import 'firebase/storage'



const SettingsScreen = ({ navigation }) => {
  const [storagePermission, setStoragePermission] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [userData, setUserData] = useState(null);
  const userRef = firebase.firestore().collection('Users')
  const [forceRefresh, setForceRefresh] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Refresh the screen when navigating back from GameScreen
    const unsubscribe = navigation.addListener('focus', () => {
      if (forceRefresh) {
        console.log("Refreshed SettingsScreen");
        setForceRefresh(false);
      }
    });

    return unsubscribe;
  }, [navigation, forceRefresh]);

  // Set header style
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Settings",
      headerStyle: { backgroundColor: '#004aad' },
      headerShadowVisible: false,
      headerTitleStyle: { flex: 1, textAlign: 'left' },
      headerTintColor: 'white'
    })
  }, [navigation]);

  useEffect(() => {
   setLoading(true);
    let unsubscribeUser = null;
    if (userData == null) {
      unsubscribeUser = onSnapshot(
        query(
          collection(firestore, "Users"),
          where("id", "==", auth.currentUser.uid)
        ),
        (snapshot) => {
          const userData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),

          }));
          if (userData.length > 0) { // Ensure userData is not an empty array
            setUserData(userData);
            setValue({ ...value, ...userData[0] });
          } else {
            // Handle the case where no user data is found
            console.log("No user data found");
          }
        }
      );
      setLoading(false)
    }
  }, [userData])

  const [value, setValue] = useState({
    id: '',
    email: '',
    password: '',
    username: '',
    file: null,
    error: '',
    category: '',
    difficulty: '',
    score: '',
    wordsPlayed: []
  })

  // This function is triggered when the "Open camera" button pressed
  const openCamera = async () => {
    // Ask the user for the permission to access the camera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraPermission(status === "granted")

    //alerts the user if permissions have not been granted
    if (cameraPermission === false) {
      alert("Sorry camera access has not been granted by the phone. This can be changed in the app settings menu of your phone");
      return;
    }

    //Launches the camera if permissions has been given
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5
    });

    if (!result.canceled) {
      value.file = result.assets[0].uri
      setValue({ ...value, file: result.assets[0].uri })
      console.log(value.file)
      var tempUserData = userData
      tempUserData[0].file = value.file;
      setUserData[tempUserData]
    }
  }

  //this allows the user to pick an image
  const pickImage = async () => {
    //ask for permission to access file storage
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setStoragePermission(status === "granted")
    //alerts the user if permissions have not been granted
    if (storagePermission === false) {
      alert("Please grant image access to Jargle");
      return;
    }
    //launches file explorer if permissions have been given
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setValue({ ...value, file: result.assets[0].uri })
      console.log(value.file)
      var tempUserData = userData
      tempUserData[0].file = value.file;
      setUserData[tempUserData]
    }
  }

  //this function is triggered when the signup button is pressed but only after the correct
  //information has been added
  //https://firebase.google.com/docs/storage/web/upload-files#web-namespaced-api_4
  const storeImage = async () => {
    let temp = null;
    if (value.file == null) return

    const img = await fetch(value.file);
    const blob = await img.blob();

    const metadata = {
      contentType: 'image/jpeg'
    };

    try {

      const storageRef = sRef(storage, 'profile/' + userData[0].id);
      //https://stackoverflow.com/questions/70297884/typeerror-db-checknotdeleted-is-not-a-function-when-creating-a-storage-ref-o
      const uploadTask = uploadBytesResumable(storageRef, blob, metadata);
      console.log('made it here')
      uploadTask.on('state_changed',
        (snapshot) => {
          // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':
              console.log('Upload is running');
              break;
          }
        },
        (error) => {
          console.log('Error uploading file' + error.code)
          // A full list of error codes is available at
          // https://firebase.google.com/docs/storage/web/handle-errors
          switch (error.code) {
            case 'storage/unauthorized':
              // User doesn't have permission to access the object
              console.log(error.code)
              break;
            case 'storage/canceled':
              // User canceled the upload
              console.log(error.code)
              break;
            case 'storage/unknown':
              // Unknown error occurred, inspect error.serverResponse
              console.log(error.code)
              break;
          }
        },
        () => {
          // Upload completed successfully, now we can get the download URL
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            console.log('File available at', downloadURL);
            temp = downloadURL;
            return downloadURL;
          });
        }
      )
    } catch (error) {
      console.error('Error storing image:', error);
    }
  }


  //creates a user refrence for building a complete list of users
  const logout = async () => {
    try {
      await firebase.auth().signOut();
      navigation.replace('LoginScreen');
    } catch (e) {
      console.log(e);
    }
  }

  //creates a user refrence for building a complete list of users
  const changeCategory = async () => {
    try {
      navigation.replace('CategoryScreen');
    } catch (e) {
      console.log(e);
    }
  }

  //creates a user refrence for building a complete list of users
  const addJargon = async () => {
    try {
      navigation.replace('AddJargonScreen');
    } catch (e) {
      console.log(e);
    }
  }






  //triggers when the signup button is pressed creates a user in the firebase auth file,
  //stores the image and logs the user in
  async function updateProfile() {
    console.log('Checking for data:' + value.file)
    if (value.email === '' || value.username === '') {
      setValue({
        ...value,
        error: 'Email and Username and name are mandatory.'
      })
      return;
    } else {
      setLoading(false)
      console.log('Updating user data');
      firebase.firestore()
        .collection('Users')
        .doc(userData[0].id)
        .update({
          'file': value.file,
          'username': value.username,
          'email': value.email
        })
        .then(() => {
          console.log('User updated!');
          navigation.replace('HomeScreen');
          if (userData && userData.length > 0 && value.file != '') {
            console.log("storing file")
            setLoading(true)
            try {
              const downloadURL = storeImage();
              // Handle the downloadURL here, for example, update state
              console.log('generated value' + value.file)
            } catch (error) {
              // Handle errors
              console.error('Error uploading image:', error);
            }
          }
          setLoading(true)
        }).catch((error) => {
          // It's important to catch and handle any errors
          console.error("Error updating user's category:", error);
        });
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined} >
      <LinearGradient colors={['#004aad', '#cb6ce6']} style={styles.background}>
        {!loading ? (
          <ActivityIndicator size="large" color="white" />
        ) : (
          <>{userData && (
            <ScrollView style={styles.scrollContainer}>
              <View style={styles.greetingContainer}>
                <Text style={styles.profileImageText}>Click image to select a profile picture</Text>
              </View>
              <View style={styles.profileImageSelectorContainer}>
                <View style={styles.profileImageContainer}>
                  <View style={styles.profileImageButton}>
                    <TouchableOpacity onPress={pickImage} activeOpacity={0.5} >
                      <View >
                      {value.file ?( <Image source={{ uri: value.file }} style={styles.profileImage} />
                        ) : (
                        <Image source={require('../assets/icons/emptyUser.png')} style={styles.profileImage} />
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cameraContainer}>
                    <TouchableOpacity onPress={openCamera} activeOpacity={0.5}>
                      <View style={styles.cameraImageContainer}>
                        <Image style={styles.cameraImage} source={require("../assets/icons/camera.png")} />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {!!value.error && <View style={styles.error}><Text>{value.error}</Text></View>}

              <View style={styles.controls}>
                <View style={styles.textFields}>
                  <TextInput placeholder={value && value.username ? value.username : ""}
                    style={styles.control}
                    value={value.username}
                    onChangeText={(text) => setValue({ ...value, username: text })}
                  />
                </View>
                <View style={styles.textFields}>
                  <TextInput placeholder={value && value.email ? value.email : ""}
                    style={styles.control}
                    value={value.email}
                    onChangeText={(text) => setValue({ ...value, email: text })}
                  />
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    onPress={updateProfile}
                    style={styles.button}>
                    <Text style={styles.buttonText}>Save Profile Update</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    onPress={changeCategory}
                    style={styles.button}>
                    <Text style={styles.buttonText}>Change Category</Text>
                  </TouchableOpacity>
                </View>

                {userData[0].admin === true &&
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      onPress={addJargon}
                      style={styles.button}>
                      <Text style={styles.buttonText}>Add Jargon</Text>
                    </TouchableOpacity>
                  </View>}

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    onPress={logout}
                    style={styles.button}>
                    <Text style={styles.buttonText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView> )}
            <View style={{ alignItems: 'flex-end' }}>
            </View>
          </>
        )}
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flex: 1,
    alignItems: 'center'
  },
  control: {
    backgroundColor: 'white',
    // paddingHorizontal: 15,
    // paddingVertical: 10,
    // borderRadius: 10,
    // margin: 2
    alignItems: 'center'
  },
  signUpButtonContainer: {
    width: 125,
    margin: '5%'
  },
  greetingContainer: {
    alignItems: 'center',
    margin: '2.5%'
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'black',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 20
  },
  profileImageText: {
    fontSize: 13,
    fontWeight: '600',
    paddingTop: 10,
    color: 'white',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20
  },
  profileImageSelectorContainer: {
    alignItems: 'center'
  },
  profileImageContainer: {
    flex: 1,
    width: 200,
    height: 200,
    justifyContent: 'center',
    // borderWidth: 3,
    borderRadius: 125,
    margin: '2.5%'
  },
  profileImageButton: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileImage: {
    width: 200,
    height: 200,
    // borderWidth: 3,
    borderRadius: 125,
    borderColor: 'lightblue'
  },
  cameraContainer: {
    position: 'absolute',
    right: 20,
    bottom: 10
  },
  cameraImageContainer: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#200F77'
  },
  cameraImage: {
    width: 25,
    height: 25
  },
  textFields: {
    height: 50,
    width: '80%',
    margin: '1%',
    borderWidth: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    paddingLeft: 6,
    paddingRight: 6,
    flexDirection: 'row'
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 5
  },
  image: {
    flex: 1,
    justifyContent: "center",
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  error: {
    marginTop: 10,
    padding: 10,
    color: '#fff',
    backgroundColor: '#D54826FF',
  },
  button: {
    backgroundColor: '#004aad',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonOutline: {
    backgroundColor: 'white',
    marginTop: 5,
    borderColor: '#004aad',
    borderWidth: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonContainer: {
    width: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  logo: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
});

export default SettingsScreen

