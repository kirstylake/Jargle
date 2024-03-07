import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Keyboard, ViewStyle, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Dimensions, TextStyle } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { firebase } from '../firebase';
import { LinearGradient } from 'expo-linear-gradient';

const GameScreen = ({ navigation }) => {
    const [guess, setGuess] = useState<string>('');
    const [guesses, setGuesses] = useState<Array<string | null>>(new Array(6).fill(null));
    const [currentAttempt, setCurrentAttempt] = useState<number>(0);
    const [gameWon, setGameWon] = useState<boolean>(false);
    const confettiRef = useRef<ConfettiCannon>(null);
    const [correctAnswer, setCorrectAnswer] = useState<string>('LEVERAGE'); // Initialize with default value
    const [definition, setDefinition] = useState<string>(''); // State to store the definition
    const [loading, setLoading] = useState(true);
    const [letterStatuses, setLetterStatuses] = useState({});


    // Initialize letterColors with default values
const [letterColors, setLetterColors] = useState<LetterColors>({
    Q: 'grey', W: 'grey', E: 'grey', R: 'grey', T: 'grey', Y: 'grey', U: 'grey', I: 'grey', O: 'grey', P: 'grey',
    A: 'grey', S: 'grey', D: 'grey', F: 'grey', G: 'grey', H: 'grey', J: 'grey', K: 'grey', L: 'grey',
    Z: 'grey', X: 'grey', C: 'grey', V: 'grey', B: 'grey', N: 'grey', M: 'grey', '⌫': 'grey',
  });
    //sets the style of the header to a custom styling
    useLayoutEffect(() => {
        navigation.setOptions({
            title: "",
            headerStyle: { backgroundColor: '#004aad' },
            headerShadowVisible: false,
            headerTitleStyle: { flex: 1, textAlign: 'left' },
            headerTintColor: 'white',
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 20 }}>
                    <Text style={styles.helpButtonText}>Back</Text>
                </TouchableOpacity>
            ),
            headerRight: () => (
                <TouchableOpacity onPress={showGameRules} style={{ marginRight: 20 }}>
                    <Text style={styles.helpButtonText}>Help</Text>
                </TouchableOpacity>
            ),
        })
    })


    const KeyboardRow = ({ letters, onKeyPress, letterColors }: { letters: string[]; onKeyPress: (letter: string) => void; letterColors: LetterColors }) => {
        // Calculate key width based on letters.length for flexibility
        const keyWidth = (screenWidth - 30) / letters.length - 10;

        return (
            <View style={styles.keyboardRow}>
                {letters.map((letter) => (
                    <TouchableOpacity key={letter} onPress={() => onKeyPress(letter)} style={{ width: keyWidth, ...styles.key }}>
                        <View>
                            <Text style={styles.keyLetter}>{letter}</Text>
                        </View>
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
    // const [letterColors, setLetterColors] = useState({});
    interface LetterColors {
        [key: string]: 'green' | 'yellow' | 'grey';
    }

    const updateLetterColors = (guess: string): void => {
        let newLetterColors: LetterColors = { ...letterColors };
        Array.from(guess).forEach((letter, index) => {
            if (correctAnswer.toUpperCase().includes(letter.toUpperCase())) {
                newLetterColors[letter] = correctAnswer.toUpperCase()[index] === letter.toUpperCase() ? 'green' : 'yellow';
            } else {
                newLetterColors[letter] = 'grey';
            }
        });
        setLetterColors(newLetterColors);
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
        setLoading(true); // Start loading
        try {
            const jargonCollection = firebase.firestore().collection('Jargon');
            const snapshot = await jargonCollection.get();

            if (!snapshot.empty) {
                // Assuming each document has 'word' and 'definition'
                const jargonsArray = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                // Randomly select a jargon from the array
                const randomJargon = jargonsArray[Math.floor(Math.random() * jargonsArray.length)];
                setCorrectAnswer(randomJargon.Word.toUpperCase());
                setDefinition(randomJargon.Definition);
            } else {
                console.log('No jargon found in Firestore.');
            }
        } catch (error) {
            console.error('Failed to fetch random jargon from Firestore:', error);
        } finally {
            setLoading(false); // Stop loading
        }
    };

    useEffect(() => {
        fetchRandomJargon();
    }, []);

    const handleKeyPress = (letter: string): void => {
        if (letter === '⌫') {
            setGuess((prev) => prev.slice(0, -1));
            return;
        }

        if (guess.length < correctAnswer.length) {
            setGuess((prev) => (prev + letter).toUpperCase());
        }
    };


    const handleInput = (text: string) => {
        if (text.length <= correctAnswer.length) {
            setGuess(text.toUpperCase());
        }
    };

    const checkWin = (word: string): boolean => {
        return word.toUpperCase() === correctAnswer.toUpperCase();
    };

    const handleSubmit = () => {
        if (guess.length === correctAnswer.length) {
            const newGuesses = [...guesses];
            newGuesses[currentAttempt] = guess.toUpperCase();
            setGuesses(newGuesses);

            if (checkWin(guess)) {
                let boxStyle: ViewStyle = { ...styles.charBox };
                let textStyle: TextStyle = { ...styles.charText };
                boxStyle = { ...boxStyle, backgroundColor: 'green' };
                textStyle = { ...textStyle, color: 'white' }
                setGameWon(true);
                confettiRef.current?.start();
                setTimeout(() => Alert.alert('Congratulations!', 'You guessed the word!'), 1000);
            }
            updateLetterColors(guess);
            setGuess('');
            if (currentAttempt < guesses.length - 1) {
                setCurrentAttempt(currentAttempt + 1);
            } else {
                Alert.alert('Game Over', 'You have used all your attempts!');
            }
        } else {
            Alert.alert(`Guess must be ${correctAnswer.length} letters.`);
        }
    };



    const getBoxStyle = (char: string, charIndex: number, attemptIndex: number): { boxStyle: ViewStyle, textStyle: TextStyle } => {
        let boxStyle: ViewStyle = { ...styles.charBox };
        let textStyle: TextStyle = { ...styles.charText };
        if (attemptIndex < currentAttempt) {
            const correctChar = correctAnswer[charIndex].toUpperCase();
            if (char.toUpperCase() === correctChar) {
                boxStyle = { ...boxStyle, backgroundColor: 'green' };
                textStyle = { ...textStyle, color: 'white' };
            } else if (correctAnswer.toUpperCase().includes(char.toUpperCase())) {
                boxStyle = { ...boxStyle, backgroundColor: 'yellow' };
            }
        }

        return { boxStyle, textStyle };
    };

    return (
        <LinearGradient colors={['#004aad', '#cb6ce6']} style={styles.background}>
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
                            onChangeText={setGuess} // Directly binding setGuess here for demo purposes; might want to control input differently
                            value={guess}
                            maxLength={correctAnswer.length}
                            autoCapitalize="characters"
                            returnKeyType="done"
                            showSoftInputOnFocus={false}
                        />
                        <Keyboard onKeyPress={handleKeyPress} />
                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.submitButtonText}>Submit</Text>
                        </TouchableOpacity>
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
            </View>

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
        color: 'white'
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
    submitButtonText: {
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
        backgroundColor: "#d3d6da",
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