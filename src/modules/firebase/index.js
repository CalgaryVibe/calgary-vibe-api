const config = require('../../config').database;
const admin = require('firebase-admin');
const eventUtils = require('../event-utils/index');

admin.initializeApp({
    credential: admin.credential.cert(config.credential),
    databaseURL: `https://${config.project_id}.firebaseio.com`
});

let self = {
    auth: admin.auth,
    database: admin.database,
    storage: admin.storage
};

self.makeEvent = async function(params) {

    let lat, lng, timestamp, image;

    const [title, location, description, address, date, imageUrl] = params;

    const formattedEvent = {
        title,
        description,
        location,
        tag: eventUtils.getLocationTag(location, address)
    };

    try {

        const location_data = await eventUtils.geocodeLocation(address);

        lat = location_data.lat;
        lng = location_data.lng;

        image = await eventUtils.sanitizeImageUrL(imageUrl);
        timestamp = await eventUtils.dateTextToTimestamp(date);

    } catch(e) {
        console.log(e.message);
    }

    if(lat && lng && image && timestamp) {

        const newEventKey = self.database().ref().child('/events').push().key;

        formattedEvent['key'] = newEventKey;
        formattedEvent['lat'] = lat;
        formattedEvent['lng'] = lng;
        formattedEvent['image'] = image;
        formattedEvent['timestamp'] = timestamp;

        return await self.database().ref('/events/' + newEventKey).push(formattedEvent);
    }

    return null
};

module.exports = self;