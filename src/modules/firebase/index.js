const config = require('../../config').database;
const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.cert(config.credential),
    databaseURL: `https://${config.project_id}.firebaseio.com`
});

let self = {
    auth: admin.auth,
    database: admin.database
};

self.makeEvent = function(params) {

    const formattedEvent = {};

    const [title, venue, description, address, date, picture] = params;

    //checkForEventDuplicate(params);

    try {

        //.. fill formatted event

    } catch(e) {
        console.log(e.message);
    }

    // Get a key for the new event
    const newEventKey = self.database().ref().child('/events').push().key;

    return self.database().ref('/events/' + newEventKey).push(formattedEvent)
};

module.exports = self;