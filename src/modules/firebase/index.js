const config = require('../../config').database;
const admin = require('firebase-admin');
const geo = require('../../modules/geolocator');

admin.initializeApp({
    credential: admin.credential.cert(config.credential),
    databaseURL: `https://${config.project_id}.firebaseio.com`
});

let self = {
    auth: admin.auth,
    database: admin.database,
};

self.makeEvent = function(params) {

    const [title, venue, description, address, date, picture] = params;

    // Get a key for a new Post.
    const newEventKey = self.database().ref().child('/events').push().key;

    const formattedEvent = {};

    try {

        //.. fill formatted event

    } catch(e) {
        console.log(e.message);
    }

    return self.database().ref('/events/' + newEventKey).push(formattedEvent)
};

async function sanitizeDate(date) {
    //.. this is gonna be cancer fuck me
}

async function geocodeLocation(location, limit = 1) {
    try {
        const data = await geo.geolocate(location, limit);
        return {lng: data.lon, lat: data.lat};
    } catch(e) {
        throw new Error('Could not geo-locate the location: '+ location)
    }
}

function sanitizeImageUrL(oldURL) {

    const fileName = oldURL.substring(url.lastIndexOf("/") + 1).split("?")[0];

    getBlob(oldURL)
        .then((blob) => {
            const picRef = self.storage().ref().child(`${fileName}_${Date.now()}`);
            return picRef.put(blob)
        })
        .then((snapshot) => snapshot.downloadURL)
        .catch(() => oldURL)
}

function getBlob(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';

        xhr.onload = function() { resolve(xhr.response) };
        xhr.onerror = function() { reject() };

        xhr.open('GET', url);
        xhr.send();
    });
}

module.exports = self;