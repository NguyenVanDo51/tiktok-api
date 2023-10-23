
// [START imports]
const firebase = require('firebase-admin');
// [END imports]

const serviceAccount = require('./service-account.json');
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  storageBucket: 'tiktok-c5222.appspot.com'
});

const bucket = firebase.storage().bucket()

module.exports = {
  bucket,
  db: firebase.firestore(),
  firebase
}