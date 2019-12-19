const config = require('../../config').database;
const admin = require('firebase-admin');
const eventUtils = require('../event-utils/index');
const request = require('request');
const uuidv4 = require('uuid/v4');

admin.initializeApp({
    credential: admin.credential.cert(config.credential),
    databaseURL: `https://${config.project_id}.firebaseio.com`,
    storageBucket: `${config.project_id}.appspot.com`
});

let self = {
    auth: admin.auth,
    database: admin.database,
};

self.clearOldEvents = async function() {

    const expiredEvents = {};

    const events = await self.database()
        .ref('/events')
        .once('value')
        .then((snapshot) => snapshot.val() )
        .catch( () => null);

    const eventCount = events ? Object.keys(events).length : 0;

    if(eventCount > 0) {

        Object.keys(events).map((key) => {
            if (Date.now() >= events[key].timestamp + 86400000) expiredEvents[key] = null;
        });

        await self.database()
            .ref('/events').update(expiredEvents);

    }

    const expiredEventCount = Object.keys(expiredEvents).length;

    console.log(`${expiredEventCount} events(s) have expired and been deleted.`);
    console.log(`${eventCount-expiredEventCount} events(s) in the system.`);
};

self.makeEvent = async function(params) {

    let lat, lng, imageUrl, formattedAddress, tag;

    const {title, description, address, date, image, eventId} = params;

    const timestamp = await eventUtils.dateTextToTimestamp(date);

    const formattedEvent = {
        title,
        description,
        date,
        timestamp,
        eventId,
    };

    const duplicateEvent = await self.database()
        .ref('/events')
        .orderByChild('eventId')
        .equalTo(eventId)
        .once('value')
        .then((snapshot) => {
            const data = snapshot.val();

            if(data) {
                const event = Object.keys(data)[0];
                return data[event];
            }

            return null;
        });

    if(!duplicateEvent) {

        try {

            const location_data = await eventUtils.geocodeLocation(address);

            tag = eventUtils.getLocationTag(address, title, description, location_data.types);

            lat = location_data.lat;
            lng = location_data.lng;
            formattedAddress = location_data.formatted_address;

            imageUrl = await saveToStorage(image);

        } catch (e) {
            console.log(e.message);
        }

        if (lat && lng && imageUrl && timestamp && tag) {

            const newEventKey = self.database().ref().child('/events').push().key;

            formattedEvent['key'] = newEventKey;
            formattedEvent['lat'] = lat;
            formattedEvent['lng'] = lng;
            formattedEvent['tag'] = tag;
            formattedEvent['location'] = formattedAddress;
            formattedEvent['image'] = imageUrl;
            formattedEvent['eventId'] = eventId;

            await self.database().ref('/events/' + newEventKey).set(formattedEvent);

            return 'Event Created : ' + title + `\n${JSON.stringify(formattedEvent)}`;
        }

    } else {

        //are there any properties that need updating?
        if(eventUtils.newEventData(formattedEvent, duplicateEvent)) {

            //update the basic information of the event
            await self.database().ref('/events/' + duplicateEvent.key).update(formattedEvent);

            return 'Event Updated : ' + title + `\n${JSON.stringify(formattedEvent)}`;
        }

        return `No new event data for [ ${title} ]`
    }

    return `Event creation failed [ ${title} ]`;
};

async function saveToStorage(url) {

    return new Promise( (resolve, reject) => {

        let fileType;

        try {
            fileType = url.split('/').pop().split('#')[0].split('?')[0].split('.').pop();
        } catch(e) {
            reject('No file type found in image url');
        }

        if(! (/(gif|jpg|jpeg|tiff|png)$/i).test(fileType) ) reject('File type was not a valid image type.');

        const uuid = uuidv4();
        const filePath = `event_image_${Date.now()}.${fileType}`;

        const bucket = admin.storage().bucket();
        const bucketFile = bucket.file(filePath);

        const fileWriteStream = bucketFile.createWriteStream({
            metadata: {
                contentType: `image/${fileType}`,
                metadata: {
                    firebaseStorageDownloadTokens: uuid
                }
            }
        });

        let rqPipe = request(url).pipe(fileWriteStream);

        rqPipe.on('error', () => reject);

        rqPipe.on('finish', async () => {
            await bucketFile.makePublic();
            resolve("https://firebasestorage.googleapis.com/v0/b/" + bucket.name + "/o/" + encodeURIComponent(filePath) + "?alt=media&token=" + uuid);
        });
    })
}

module.exports = self;