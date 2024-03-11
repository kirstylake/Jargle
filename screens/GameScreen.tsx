import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Keyboard, ViewStyle, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Dimensions, TextStyle } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { LinearGradient } from 'expo-linear-gradient';
import Timer from './components/Timer';
import TimerComponent from './components/Timer';
import { auth, firebase, firestore } from '../firebase'
import * as ImagePicker from "expo-image-picker";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where, orderBy, onSnapshot, getCountFromServer } from 'firebase/firestore'

const GameScreen = ({ navigation, startTimer }) => {
    const [guess, setGuess] = useState<string>('');
    const [guesses, setGuesses] = useState<Array<string | null>>(new Array(6).fill(null));
    const [currentAttempt, setCurrentAttempt] = useState<number>(0);
    const [gameWon, setGameWon] = useState<boolean>(false);
    const [gameLost, setGameLost] = useState<boolean>(false);
    const confettiRef = useRef<ConfettiCannon>(null);
    const [correctAnswer, setCorrectAnswer] = useState<string>('LEVERAGE'); // Initialize with default value
    const [definition, setDefinition] = useState<string>(''); // State to store the definition
    const [loading, setLoading] = useState(true);
    const newGuesses = [...guesses];
    const [shouldStartTimer, setShouldStartTimer] = useState(false);
    const [userData, setUserData] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [forceRefresh, setForceRefresh] = useState(false);

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
    }, [userData])

    const KeyboardRow = ({ letters, onKeyPress, letterColors }: { letters: string[]; onKeyPress: (letter: string) => void; letterColors: LetterColors }) => {
        // Calculate key width based on letters.length for flexibility
        const keyWidth = (screenWidth - 30) / letters.length - 10;
        return (
            <View style={styles.keyboardRow}>
                {letters.map((letter) => (
                    <TouchableOpacity
                        key={letter}
                        onPress={() => onKeyPress(letter)}
                        style={{
                            width: keyWidth,
                            backgroundColor: letterColors[letter.toUpperCase()] || '#d3d6da', // corrected
                            ...styles.key
                        }}
                    >
                        <Text style={styles.keyLetter}>{letter}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const Keyboard = ({ onKeyPress }: { onKeyPress: (letter: string) => void }) => {
        const row1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"]
        const row2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"]
        const row3 = ["Z", "X", "C", "V", "B", "N", "M", "⌫"]

        return (
            <View style={styles.keyboard}>
                <KeyboardRow letters={row1} onKeyPress={onKeyPress} letterColors={letterColors} />
                <KeyboardRow letters={row2} onKeyPress={onKeyPress} letterColors={letterColors} />
                <KeyboardRow letters={row3} onKeyPress={onKeyPress} letterColors={letterColors} />
            </View>
        )
    }
    const [letterColors, setLetterColors] = useState({});
    interface LetterColors {
        [key: string]: '#90EE90' | 'yellow' | '#d3d6da';
    }

    const updateLetterColors = (guess: string): void => {
        let newLetterColors: LetterColors = { ...letterColors };

        if (guess) {
            Array.from(guess.toUpperCase()).forEach((letter, index) => {
                // If the letter is in the correct answer
                if (correctAnswer.toUpperCase().includes(letter)) {
                    // If it is in the correct position
                    if (correctAnswer.toUpperCase()[index] === letter) {
                        newLetterColors[letter] = '#90EE90';
                    }
                    // If it is not in the correct position but hasn't been marked green
                    else if (newLetterColors[letter] !== '#90EE90') {
                        newLetterColors[letter] = 'yellow';
                    }
                } else {
                    // If the letter is not in the correct answer and hasn't been marked green or yellow
                    if (!newLetterColors[letter] || (newLetterColors[letter] !== '#90EE90' && newLetterColors[letter] !== 'yellow')) {
                        newLetterColors[letter] = '#d3d6da';
                    }
                }
            });
        }

        setLetterColors(newLetterColors);
        console.log(newLetterColors)
    };

    // Function to display game rules
    const showGameRules = () => {
        Alert.alert(
            "Game Rules", // Title of the alert
            "Here are the game rules: \n\n" + // Message of the alert
            "1. Guess the word in 6 tries.\n" +
            "2. Each guess must be a " + correctAnswer.length + " letter word . Hit the submit button to submit.\n" +
            "3. After each guess, the color of the tiles will change to show how close your guess was to the word.\n" +
            "4. Yellow means that the letter is correct but in the wrong space.\n" +
            "5. Green means that the letter is correct and in the correct space.\n" +
            "6. Grey means that the letter is not contained in the word at all.\n" +
            "\nEnjoy the game!", // Example rules
            [{ text: "OK" }] // Button to close the alert
        );
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
                //ensure that the only words that are shown to the user are words that they haven't already played
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
                                .then(results => results.docs.map(result => ({ id: result.id, ...result.data() })).filter(jargon => jargon.DifficultyLevel < 5))
                        )
                    }
                    // Wait for all promises to resolve and flatten the arrays
                    const chunkResults = await Promise.all(chunks);
                    jargonsArray = chunkResults.flat();
                    console.log('Jargons Array successful')
                    console.log(jargonsArray)
                } else if (userData[0].wordsPlayed.length == 0) {
                    var snapshot = await jargonCollection.where('CategoryID', '==', userData[0].category).get();
                    if (!snapshot.empty) {
                        // Assuming each document has 'word' and 'definition'
                        jargonsArray = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                        })).filter(jargon => jargon.DifficultyLevel < 5)
                    }
                }
                if (jargonsArray.length > 0) {
                    // Randomly select a jargon from the array
                    const randomJargon = jargonsArray[Math.floor(Math.random() * jargonsArray.length)];
                    console.log(randomJargon)
                    console.log('Jargon Array')
                    console.log(jargonsArray)
                    setCorrectAnswer(randomJargon.Word.toUpperCase());
                    console.log('Correct Answer:' + randomJargon.Word.toUpperCase())
                    setDefinition(randomJargon.Definition);
                    setErrorMessage('')
                } else {
                    console.log('Jargon Array Empty')
                    var snapshot = await jargonCollection.where('Word', 'not-in', userData[0].wordsPlayed).where('CategoryID', '==', userData[0].category).where('DifficultyLevel', '==', 5).get();
                    if (!snapshot.empty) {
                        navigation.replace("QuizScreen", { 'route': 'true' })
                    } else {
                        setErrorMessage("You've played all the words in this category! Please select another category. More words will be loaded soon!")
                    }
                }
            } catch (error) {
                console.error('Failed to fetch random jargon from Firestore:', error);
                setErrorMessage("Connection Issue, please try again later!")
            } finally {
                setLoading(false); // Stop loading
            }
        }
    };


    const handleKeyPress = (letter: string): void => {
        if (letter === '⌫') {
            setGuess((prev) => prev.slice(0, -1));
            return;
        }

        if (guess.length < correctAnswer.length) {
            setGuess((prev) => (prev + letter).toUpperCase());
        }
    };

    const checkWin = (word: string): boolean => {
        return word.toUpperCase() === correctAnswer.toUpperCase();
    };

    const handleSubmit = () => {
        if (guess.length === correctAnswer.length) {
            newGuesses[currentAttempt] = guess.toUpperCase();
            setGuesses(newGuesses);
            console.log('handleSubmit Guess' + guesses)

            if (checkWin(guess)) {
                let boxStyle: ViewStyle = { ...styles.charBox };
                let textStyle: TextStyle = { ...styles.charText };
                boxStyle = { ...boxStyle, backgroundColor: '#90EE90' };
                textStyle = { ...textStyle, color: 'black' }
                setGameWon(true);

                handleGameWin();
            }
            updateLetterColors(guess);
            console.log('guess:' + guess)
            setGuess('');
            console.log(currentAttempt)
            if (currentAttempt < guesses.length - 1) {
                setCurrentAttempt(currentAttempt + 1);
            } else if (!gameWon) {
                Alert.alert('Game Over', 'You have used all your attempts! You are now in a 2 minute timeout!');
                setGameLost(true);
                handleGameLoss();
            }
        } else {
            Alert.alert(`Guess must be ${correctAnswer.length} letters.`);
        }
    };

    const nextGame = () => {
        navigation.replace("QuizScreen", { 'route': 'true' })
        setForceRefresh(true)
    };

    useEffect(() => {
        // Refresh the screen when navigating back from GameScreen
        const unsubscribe = navigation.addListener('focus', () => {
            if (forceRefresh) {
                console.log("Refreshed HomeScreen");
                setForceRefresh(false);
            }
        });

        return unsubscribe;
    }, [navigation, forceRefresh]);

    const handleGameWin = () => {
        value.wordsPlayed.push(correctAnswer.toUpperCase())
        console.log(correctAnswer)
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
        confettiRef.current?.start();
        setTimeout(() => Alert.alert('Congratulations!', 'You guessed the word!'), 1000);
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
                }).catch((error) => {
                    // It's important to catch and handle any errors
                    console.error("Error updating user's category:", error);
                });
            // rerender with timer
            navigation.navigate("HomeScreen", { 'route': 'true' })
        }
    };



    const getBoxStyle = (char: string, charIndex: number, attemptIndex: number): { boxStyle: ViewStyle, textStyle: TextStyle } => {
        let boxStyle: ViewStyle = { ...styles.charBox };
        let textStyle: TextStyle = { ...styles.charText };
        if (attemptIndex < currentAttempt) {
            const correctChar = correctAnswer[charIndex].toUpperCase();
            if (char.toUpperCase() === correctChar) {
                boxStyle = { ...boxStyle, backgroundColor: '#90EE90' };
                textStyle = { ...textStyle, color: 'black' };
            } else if (correctAnswer.toUpperCase().includes(char.toUpperCase())) {
                boxStyle = { ...boxStyle, backgroundColor: 'yellow' };
            } else {
                boxStyle = { ...boxStyle, backgroundColor: '#d3d6da' };
                textStyle = { ...textStyle, color: 'black' };
            }
        }
        return { boxStyle, textStyle };
    };

    return (
        <LinearGradient colors={['#004aad', '#cb6ce6']} style={styles.background}>
            {errorMessage != '' && (
                <View style={styles.container}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                </View>

            )}
            {errorMessage === '' && (
                <View style={styles.container}>
                    {loading ? (
                        <ActivityIndicator size="large" color="white" />
                    ) : (
                        <>

                            <View style={styles.clueContainer}>
                                <Text style={styles.clueText}>{definition}</Text>
                            </View>
                            <View style={styles.grid}>
                                {guesses.map((wordGuess, attemptIndex) => (
                                    <View key={attemptIndex} style={styles.wordRow}>
                                        {Array.from({ length: correctAnswer.length }).map((_, charIndex) => {
                                            const char = wordGuess ? wordGuess[charIndex] : '';
                                            const { boxStyle, textStyle } = getBoxStyle(char, charIndex, attemptIndex);
                                            return (
                                                <View key={charIndex} style={boxStyle}>
                                                    <Text style={textStyle}>{char?.toUpperCase()}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                ))}
                            </View>
                            <TextInput
                                style={styles.input}
                                onChangeText={setGuess}
                                value={guess}
                                maxLength={correctAnswer.length}
                                autoCapitalize="characters"
                                returnKeyType="done"
                                showSoftInputOnFocus={false}
                            />
                            <Keyboard onKeyPress={handleKeyPress} />
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
            )}
        </LinearGradient>
    );
};

const screenWidth = Dimensions.get('window').width;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        // justifyContent: 'center',
    },
    background: {
        width: '100%',
        height: '100%',
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    clueContainer: {
        marginBottom: 20,
        fontSize: 16,
        textAlign: 'center',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        // Shadow properties for iOS
        shadowColor: "#000", // This is a black shadow.
        shadowOffset: {
            width: 0, // Horizontal shadow displacement
            height: 2, // Vertical shadow displacement
        },
        shadowOpacity: 0.25, // Opacity of the shadow
        shadowRadius: 3.84, // Blur radius of the shadow

        // Elevation property for Android
        elevation: 5, // This applies a shadow and elevates the component.

    },
    clueText: {
        fontSize: 16,
    },
    errorText: {
        fontSize: 16,
        color: 'white'
    },
    grid: {
        maxWidth: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    wordRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
    },
    charBox: {
        borderWidth: 1,
        borderColor: 'white',
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 1,
        borderRadius: 3,
        backgroundColor: 'lightGrey'

    },
    charText: {
        fontSize: 18,
        color: 'black'
    },
    input: {
        borderWidth: 1,
        borderColor: '#D3D3D3',
        width: 200,
        padding: 10,
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
        alignSelf: 'center',
        backgroundColor: '#D3D3D3',
        borderRadius: 5,
    },
    submitButton: {
        backgroundColor: '#6200EE',
        padding: 10,
        borderRadius: 5,
        alignSelf: 'center'
    },
    nextButton: {
        backgroundColor: 'green',
        padding: 10,
        borderRadius: 5,
        alignSelf: 'center'
    },
    submitButtonText: {
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
    },
    nextButtonText: {
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
    },
    keyboard: { flexDirection: "column" },
    keyboardRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 10,
    },
    key: {
        // backgroundColor: "#d3d6da",
        // Dynamically calculate the width of each key
        // Adjust the padding and margin values to fit your design
        width: (screenWidth) / 10 - 8, // Example for 10 keys in a row, adjust the divisor based on your row's key count
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 2, // Adjust based on your layout
        paddingVertical: 10, // Adjust based on your content
        borderRadius: 5,
    },
    keyLetter: {
        fontWeight: "500",
        fontSize: 20,
    },
    helpButtonText: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
    },
});

export default GameScreen;