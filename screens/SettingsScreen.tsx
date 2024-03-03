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
} from 'react-native';
import { auth, firebase, firestore } from '../firebase'
import * as ImagePicker from "expo-image-picker";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where, orderBy, onSnapshot, getCountFromServer } from 'firebase/firestore'
import { getDatabase, ref, set, update } from "firebase/database";
import { LinearGradient } from 'expo-linear-gradient';

const SettingsScreen = ({ navigation }) => {
  const [storagePermission, setStoragePermission] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [userData, setUserData] = useState(null);
  const userRef = firebase.firestore().collection('Users')

  const [value, setValue] = useState({
    id: '',
    email: '',
    password: '',
    username: '',
    file: null,
    error: ''
  })

  // This function is triggered when the "Open camera" button pressed
  const openCamera = async () => {
    // Ask the user for the permission to access the camera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraPermission(status === "granted")

    //alerts the user if permissions have not been granted
    if (cameraPermission === false) {
      alert("Please grant camera access");
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
  const storeImage = async () => {
    let temp = null;
    if (value.file == null) return null;

    const img = await fetch(value.file)
    let blob = await img.blob()

    console.log(value.file)

    const metadata = {
      contentType: 'image/jpeg'
    };

    //creates a query refrence for storing the file to the media storage
    const storageRef = firebase.storage().ref(`profile/${auth.currentUser.uid}`)
    var uploadTask = storageRef.child('image').put(blob, metadata);

    //begins the upload task and waits till it is compleate before moving on
    // Listen for state changes, errors, and completion of the upload.
    uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
      (snapshot) => {
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
        switch (snapshot.state) {
          case firebase.storage.TaskState.PAUSED: // or 'paused'
            console.log('Upload is paused');
            break;
          case firebase.storage.TaskState.RUNNING: // or 'running'
            console.log('Upload is running');
            break;
        }
      },
      (error) => {
        // A full list of error codes is available at
        // https://firebase.google.com/docs/storage/web/handle-errors
        switch (error.code) {
          case 'storage/unauthorized':
            // User doesn't have permission to access the object
            break;
          case 'storage/canceled':
            // User canceled the upload
            break;

          // ...

          case 'storage/unknown':
            // Unknown error occurred, inspect error.serverResponse
            break;
        }
      },
      () => {
        // Upload completed successfully, now we can get the download URL
        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
          console.log('File available at', downloadURL);
          temp = downloadURL;
      const createUserRef = () => {
        // Define your function here
      };
          value.file = temp;
          createUserRef();
        });
      }
    )
  }


  //creates a user refrence for building a complete list of users
  const logout = async () => {
    try {
      await firebase.auth().signOut();
      navigation.replace('Login');
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
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
          setUserData(userData);
          setValue({...value, ...userData[0]});
        }
      );
    }
  }, [userData])

  //triggers when the signup button is pressed creates a user in the firebase auth file,
  //stores the image and logs the user in
  async function updateProfile() {
    if (value.email === '' || value.username === '') {
      setValue({
        ...value,
        error: 'Email and Username and name are mandatory.'
      })
      return;
    }else{

    
  firebase.firestore()
  .collection('Users')
  .doc(userData[0].ref_no)
  .update({
    'file': value.file,
    'username': value.username,
    'email': value.email
  })
  .then(() => {
    console.log('User updated!');
    navigation.replace('Home');
  });
  }}

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding">
      <LinearGradient colors={['#004aad', '#cb6ce6']} style={styles.background}>
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.greetingContainer}>
            <Text style={styles.profileImageText}>Click image to select a profile picture</Text>
          </View>
          <View style={styles.profileImageSelectorContainer}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImageButton}>
                <TouchableOpacity onPress={pickImage} activeOpacity={0.5} >
                  <View >
                    <Image style={styles.profileImage} source={{ uri: value && value.file ? value.file : "'https://www.pngall.com/wp-content/uploads/12/Avatar-Profile-PNG-Images.png'" }} />
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
                onChangeText={(text) => setValue({ ...value, username: text })}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={updateProfile}
                style={styles.button}>
                <Text style={styles.buttonText}>Update Profile</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={logout}
                style={styles.button}>
                <Text style={styles.buttonText}>Change Category</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={logout}
                style={styles.button}>
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
            </View>
            

          </View>
        </ScrollView>
        <View style={{ alignItems: 'flex-end' }}>
        </View>
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
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10
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
    height: '100%',
    marginTop: "10%"
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

