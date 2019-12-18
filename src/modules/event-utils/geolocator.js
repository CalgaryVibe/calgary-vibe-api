const config = require('../../config/index').google_maps;
const googleMapsClient = require('@google/maps').createClient({
    key: config.private_key
});

const self = {};

self.geolocate = async (q) => {

    return new Promise((resolve, reject) => {

        googleMapsClient.geocode({
            address: q
        }, function(err, response) {
            if (!err) {
                const results = response.json.results;
                if(results && results.length > 0) {
                    resolve(response.json.results[0]);
                } else {
                    reject(`Could not locate locate an address for ${q}`);
                }
            } else {
                reject(err);
            }
        });

    });
};

module.exports = self;