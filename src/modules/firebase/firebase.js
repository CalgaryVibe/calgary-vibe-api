const firebase = require('./firebase');
const geo = require('../../modules/geolocator');

async function checkForEventDuplicate(params) {
    //.. possibly even more cancer then date sanitizing
}

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
            const picRef = firebase.storage().ref().child(`${fileName}_${Date.now()}`);
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

module.exports = {checkForEventDuplicate, sanitizeDate, geocodeLocation, sanitizeImageUrL};