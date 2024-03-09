import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, firebase, firestore } from '../firebase';
import { onSnapshot, query, collection, where } from 'firebase/firestore';
import Timer from './components/Timer';
import TimerComponent from './components/Timer';
import ConfettiCannon from 'react-native-confetti-cannon';

const QuizScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [jargonWords, setJargonWords] = useState([]);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [definition, setDefinition] = useState('');
    const [selectedWord, setSelectedWord] = useState('');
    const [userData, setUserData] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [forceRefresh, setForceRefresh] = useState(false);
    const [gameWon, setGameWon] = useState<boolean>(false);
    const [gameLost, setGameLost] = useState<boolean>(false);
    const confettiRef = useRef<ConfettiCannon>(null);
    const [submitted, setSubmitted] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: "",
            headerStyle: { backgroundColor: '#004aad' },
            headerShadowVisible: false,
            headerTitleStyle: { flex: 1, textAlign: 'left' },
            headerTintColor: 'white',
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.replace("HomeScreen", { 'route': 'true' })} style={{ marginLeft: 20 }}>
                    <Text style={styles.helpButtonText}>Home</Text>
                </TouchableOpacity>
            ),
            headerRight: () => (
                <TouchableOpacity onPress={showGameRules} style={{ marginRight: 20 }}>
                    <Text style={styles.helpButtonText}>Help</Text>
                </TouchableOpacity>
            ),
        })
    })

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
                    setValue({ ...value, ...userData[0] });
                }
            );
        }

        console.log(userData)
        fetchRandomJargon();
    }, [userData, value]);


    // Function to display game rules
    const showGameRules = () => {
        Alert.alert(
            "Game Rules", // Title of the alert
            "Here are the game rules: \n\n" + // Message of the alert
            "1. You have one chance to choose the right word that matches the definition.\n" +
            "2. If you select the wrong word you will have to wait through a timeout of 5 minutes\n" +
            "\nEnjoy the game!", // Example rules
            [{ text: "OK" }] // Button to close the alert
        );
    };

    const handleGameScreenNavigation = () => {
        navigation.navigate('GameScreen', { 'route': 'true' });
        setForceRefresh(true);
    };

    const fetchRandomJargon = async () => {
            if (gameWon) {
                return;
            }
            setLoading(true); // Start loading
            var jargonsArray = [];
            if (userData) {
                try {
                    const jargonCollection = firebase.firestore().collection('Jargon');
                    console.log('user category loaded:' + userData[0].category)
                    console.log('words played' + userData[0].wordsPlayed)
                    let jargonQuery = jargonCollection.where('CategoryID', '==', userData[0].category);

                    //check if the user has played words yet to filter them out of the query
                    if (userData[0].wordsPlayed.length > 0) {
                        // Split userData[0].wordsPlayed into chunks of 10 values each
                        const chunks = [];
                        for (let i = 0; i < userData[0].wordsPlayed.length; i += 10) {
                            // chunks.push(userData[0].wordsPlayed.slice(i, i + 10));
                            const chunk = userData[0].wordsPlayed.slice(i, i + 10);
                            // add the batch request to to a queue
                            chunks.push(
                                jargonQuery
                                    .where(
                                        firebase.firestore.FieldPath.documentId(),
                                        'not-in',
                                        [...chunk]
                                    )
                                    .get()
                                    .then(results => results.docs.map(result => ({ id: result.id, ...result.data() })))
                            )
                        }
                        // Wait for all promises to resolve and flatten the arrays
                        const chunkResults = await Promise.all(chunks);
                        jargonsArray = chunkResults.flat();
                        console.log('Jargons Array successful')
                        console.log(jargonsArray)
                    }else if (userData[0].wordsPlayed.length == 0) {
                        var snapshot = await jargonCollection.where('CategoryID', '==', userData[0].category).get();
                        if (!snapshot.empty) {
                            // Assuming each document has 'word' and 'definition'
                            jargonsArray = snapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data(),
                            }))
                        }
                    }
                    if (jargonsArray.length > 0) {
                        jargonsArray = shuffleArray(jargonsArray.slice(0, 10));
                        const randomJargon = jargonsArray[Math.floor(Math.random() * jargonsArray.length)];
                        setCorrectAnswer(randomJargon.Word.toUpperCase());
                        console.log('Correct Answer: ' + randomJargon.Word.toUpperCase())
                        console.log('Definition: ' + randomJargon.Definition)
                        setDefinition(randomJargon.Definition);
                        setErrorMessage('');
                        setJargonWords(jargonsArray.map(jargon => jargon.Word));
                    } else {
                        console.log('Jargon Array Empty')
                        setErrorMessage("You've played all the words in this category! Please select another category. More words will be loaded soon!")
                    }
                } catch (error) {
                    console.error('Failed to fetch random jargon from Firestore:', error);
                    setErrorMessage("Connection Issue, please try again later!")
                } finally {
                    setLoading(false); // Stop loading
                }
            }
        };

        const handleWordSelect = (selectedWord) => {
            if (!submitted) {
                setSelectedWord(selectedWord);
            }

        };

        const nextGame = () => {
            handleGameScreenNavigation()
        };

        const handleGameWin = () => {
            value.wordsPlayed.push(correctAnswer.toUpperCase())
            firebase.firestore()
                .collection('Users')
                .doc(userData[0].id)
                .update({
                    'score': value.score + 1,
                    'wordsPlayed': value.wordsPlayed
                })
                .then(() => {
                    console.log('User updated!');
                }).catch((error) => {
                    // It's important to catch and handle any errors
                    console.error("Error updating user's category:", error);
                });
        };

        const handleGameLoss = () => {
            setGameLost(true)
            //ensure that the user has a score of some kind before reducing (we don't want negative scores)
            if (userData[0].score > 0) {
                firebase.firestore()
                    .collection('Users')
                    .doc(userData[0].id)
                    .update({
                        'score': value.score - 1
                    })
                    .then(() => {
                        console.log('User updated!');
                        navigation.replace('HomeScreen', { 'route': 'true' });
                    }).catch((error) => {
                        // It's important to catch and handle any errors
                        console.error("Error updating user's category:", error);
                    });
                // rerender with timer
            }
            navigation.navigate("HomeScreen", { 'route': 'true' })
        };

        const handleSubmit = () => {
            if (selectedWord.toUpperCase() === correctAnswer.toUpperCase()) {
                // Update state to mark the selected word as correct
                // setJargonWords(prevWords => prevWords.map(word => word === selectedWord ? { ...word, correct: true } : word));
                setGameWon(true);
                confettiRef.current?.start();
                setTimeout(() => Alert.alert('Congratulations!', 'You selected the correct word!'), 1000);
                handleGameWin()
            } else {
                // Update state to mark the selected word as incorrect
                // setJargonWords(prevWords => prevWords.map(word => word === selectedWord ? { ...word, incorrect: true } : word));
                Alert.alert('Game Over', 'You will have a timeout of 2 mins!');
                handleGameLoss();
            }
        };


        return (
            <LinearGradient colors={['#004aad', '#cb6ce6']} style={styles.background}>
                {errorMessage != '' && (
                    <View style={styles.container}>
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                )}
                <View style={styles.container}>
                    {loading ? (
                        <ActivityIndicator size="large" color="white" />
                    ) : (
                        <>
                            <View style={styles.clueContainer}>
                                <Text style={styles.clueText}>{definition}</Text>
                            </View>
                            <View style={styles.wordsContainer}>
                                {jargonWords.map((word, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.wordButton,
                                            selectedWord === word && styles.selectedWordButton
                                        ]}
                                        onPress={() => handleWordSelect(word)}
                                    >
                                        <Text style={[styles.wordButtonText, selectedWord === word && styles.selectedWordButtonText]}>{word}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View>
                                {!gameWon && (
                                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                                        <Text style={styles.submitButtonText}>Submit</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View>
                                {gameWon && (
                                    <TouchableOpacity style={styles.nextButton} onPress={nextGame}>
                                        <Text style={styles.nextButtonText}>Next Round</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            {gameWon && (
                                <ConfettiCannon
                                    ref={confettiRef}
                                    count={100}
                                    origin={{ x: Dimensions.get('window').width / 2, y: 0 }}
                                    fallSpeed={5000}
                                />
                            )}

                        </>
                    )}
                    {gameLost && (
                        <TimerComponent shouldStart={gameLost} hidden={true} />
                    )}
                </View>

            </LinearGradient>
        );
    };

    const styles = StyleSheet.create({
        background: {
            width: '100%',
            height: '100%',
            flex: 1,
            padding: 20,
            alignItems: 'center',
        },
        container: {
            flex: 1,
            padding: 20,
            alignItems: 'center',
        },
        clueContainer: {
            marginBottom: 20,
            backgroundColor: 'white',
            padding: 15,
            borderRadius: 10,
            elevation: 5, // Shadow for Android
        },
        clueText: {
            fontSize: 16,
        },
        wordsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
        },
        wordButton: {
            // backgroundColor: '#6200EE',
            backgroundColor: '#580494',
            paddingVertical: 10,
            paddingHorizontal: 20,
            margin: 5,
            borderRadius: 5,
        },
        selectedWordButton: {
            backgroundColor: '#d6affa',
        },
        selectedWordButtonText: {
            color: '#460087',
        },
        wordButtonText: {
            color: 'white',
            fontSize: 16,
        },
        helpButtonText: {
            color: 'white',
            fontSize: 18,
            textAlign: 'center',
        },
        errorText: {
            fontSize: 16,
            color: 'white'
        },
        correctWordButton: {
            backgroundColor: 'green',
        },
        incorrectWordButton: {
            backgroundColor: 'red',
        },
        submitButton: {
            backgroundColor: '#cdcced',
            borderColor: '#580494',
            borderWidth: 5,
            padding: 10,
            borderRadius: 3,
            alignSelf: 'center',
            marginTop: '10%',
            shadowColor: '#000', // Shadow color
            shadowOffset: { width: 0, height: 2 }, // Shadow offset
            shadowOpacity: 0.25, // Shadow opacity
            shadowRadius: 3, // Shadow radius
            elevation: 5, // For Android
        },
        nextButton: {
            backgroundColor: 'green',
            padding: 10,
            borderRadius: 5,
            alignSelf: 'center',
            marginTop: '10%',
            shadowColor: '#000', // Shadow color
            shadowOffset: { width: 0, height: 2 }, // Shadow offset
            shadowOpacity: 0.25, // Shadow opacity
            shadowRadius: 3, // Shadow radius
            elevation: 5, // For Android
        },
        submitButtonText: {
            fontSize: 18,
            color: '#580494',
            textAlign: 'center',
        },
        nextButtonText: {
            fontSize: 18,
            color: 'white',
            textAlign: 'center',
        }
    });

    export default QuizScreen;

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
