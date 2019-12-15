const axios = require('axios');

const self = {};

self.geolocate = async (q, limit = 1) => {

    let payload;

    const ENDPOINT = `https://nominatim.openstreetmap.org/search?q=${q}&limit=${limit}&format=json`;

    try {

        payload = await axios({
            url: ENDPOINT,
            method: 'get'
        });

    } catch(e) {
        throw new Error(`No response for Address: ${q}`);
    }

    if(payload.data.length > 0) {
        return payload.data[0];
    }

    return null;
};


module.exports = self;