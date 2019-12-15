const config = require('../../config').database;
const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.cert(config.credential),
    databaseURL: `https://${config.project_id}.firebaseio.com`
});

let self = {
    auth: admin.auth,
    database: admin.database,
};

self.makeEvent = function(params) {
    return self.database()
        .ref('/events')
        .push({...params})
};

module.exports = self;