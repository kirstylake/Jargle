// This is to load up the database. it is a one time use file. It is used to load up the database with the jargon terms.
// The data in this file should be formatted in the same way as the jargon terms in the jargonTerms.json file.
// To run this type "node databaseLoader.js" in the terminal.

const admin = require('firebase-admin');

//firebase provides a file for the node connection
var serviceAccount = require("./jargle-ca313-firebase-adminsdk-g8tmt-3261f0da9b.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Get a Firestore database reference
const db = admin.firestore();

//update the database with the jargon terms
async function updateDatabase(jargonList) {
  try {
    for (const jargon of jargonList) {
      const { Word, CategoryID, DateAdded, Definition, DifficultyLevel } = jargon;
      const jargonRef = db.collection('Jargon').doc(Word.toUpperCase());
      await jargonRef.set({
        CategoryID,
        DateAdded: admin.firestore.Timestamp.fromDate(new Date(DateAdded)),
        Word,
        Definition,
        DifficultyLevel
      });
      console.log(`Jargon term '${Word}' added to the database.`);
    }
    console.log("Database update completed.");
  } catch (error) {
    console.error("Error updating database:", error);
  }
}

// Call the update function
// List of jargon terms
const technologyList = require('./technologyTerms.json');
const businessList = require('./businessTerms.json');
const generalList = require('./generalTerms.json');
const lawList = require('./lawTerms.json');
const scienceList = require('./scienceTerms.json');
const psychologyList = require('./psychologyTerms.json');

updateDatabase(technologyList);
updateDatabase(businessList);
updateDatabase(generalList);
updateDatabase(lawList);
updateDatabase(scienceList);
updateDatabase(psychologyList)