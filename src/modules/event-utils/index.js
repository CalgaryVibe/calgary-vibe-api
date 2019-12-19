const geo = require('./geolocator');

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const TAGS = {
    CLUB : 'Club',
    CONCERT : 'Concert',
    THEATER : 'Theater',
    SPORTS : 'Sports',
    COMMUNITY : 'Community'
};

//make sure any tag names added are lower case
//these tags when found will override all other tags
const locationTagOverrideLookup = {
    "cowboys club & casino" : TAGS.CLUB,
    "the ace nightclub": TAGS.CLUB,
    "back alley nightclub": TAGS.CLUB,
    "the palace theatre": TAGS.CLUB,
    "the hifi club": TAGS.CLUB,
    "habitat living sound": TAGS.CLUB,
    "the gateway": TAGS.CLUB,
    "knoxville's tavern": TAGS.CLUB,
    "commonwealth bar & stage": TAGS.CLUB,
    "national on 8th": TAGS.CLUB,
    "twisted element": TAGS.CLUB,
    "jack singer concert hall": TAGS.CONCERT,
    "calgary flames" : TAGS.SPORTS,
    "calgary roughnecks" : TAGS.SPORTS,
};

//these when found will override the default tags
const googleTagLookup = {
    "night_club" : TAGS.CLUB,
    "movie_theater": TAGS.THEATER,
    "stadium": TAGS.CONCERT,
    "university": TAGS.CONCERT,
    "casino": TAGS.CLUB
};

//the default lookup's
const default_tags = {
    "CONCERT": [
        'artist', 'music', 'festival', 'singer', 'songwriter', 'musician',
        'rock', 'folk', 'country', 'jazz', 'pop', 'concert', 'presents',
        'special guests', 'tour', 'band', 'rave', 'edm', 'dj', 'hip hop', 'reggaeton',
    ]
};

let MINIMUM_MATCH_THRESHOLD = 3;

function getEventTag(title, description, locationTypes) {

    title = title.toLowerCase();
    description = description.toLowerCase();

    //default all events to the 'Community' tag
    let tag = TAGS.COMMUNITY;

    //default to basic threshold tag check
    Object.keys(default_tags).map((_tag) => {
        let matches = 0;

        //get the current tag type's
        let _tags = default_tags[_tag];

        //loop through all the possible tag matches
        _tags.map((t) => {

            //when we have found a match in the title or description add it to the match count
            if (title.indexOf(t) !== -1 || description.indexOf(t) !== -1) ++matches;
        });

        //if the number of matches is >= to the threshold, set this as the events new tag
        if(matches >= MINIMUM_MATCH_THRESHOLD) {
            tag = _tag;
        }
    });

    if(locationTypes.length > 0) {
        //loop through all the google tag keys
        Object.keys(googleTagLookup).map((key) => {

            //if a one of the google tags found from the address match, set that as the new tag
            if (locationTypes.indexOf(key) !== -1) tag = googleTagLookup[key];
        });
    }

    //loop through all the location override lookup keys
    Object.keys(locationTagOverrideLookup).map((key) => {

        //if a tag matches anywhere in the address, description or title, set the override value as the new tag
        if(description.indexOf(key) !== -1 || title.indexOf(key) !== -1) {
            tag = locationTagOverrideLookup[key];
            console.log(tag);
        }

    });

    return tag;
}

async function dateTextToTimestamp(dateText) {

    //default to today's date
    const date = new Date();

    dateText = dateText.toLowerCase();

    //look for date info if 'today' is not found in the date string
    if(dateText.indexOf('today') === -1) {

        if (dateText.indexOf('tomorrow') === -1) {

            //check to see if there is a day of the week in the date text
            const dayFound = days.filter(d => dateText.includes(d));

            //check to see if there is a month of the year in the date text
            const monthFound = months.filter(m => dateText.includes(m));

            if (monthFound.length > 0) {

                const month = monthFound[0];

                //grabs the date and year which is between 'month' and 'at'
                let date_data = dateText.substring(dateText.indexOf(month));
                date_data = date_data.substring(0, date_data.indexOf('at'));

                //strip anything that's not a number or a comma, remove any spacings and split into an array by the ','
                date_data = date_data.replace(/[^0-9,]+/g, "").trim().split(',');

                const monthIndex = months.indexOf(month);
                const dayIndex = Number(date_data[0]);
                const yearIndex = Number(date_data[1]);

                date.setFullYear(yearIndex, monthIndex, dayIndex);

            } else if (dayFound.length > 0) {

                const day = dayFound[0];

                //if just a day of the week was found set it to that date
                const dayIndex = days.indexOf(day) + 1;
                date.setDate(date.getDate() + (7 + dayIndex - date.getDay()) % 7);

            }

        } else {

            //set the date to tomorrow
            date.setDate(date.getDate() + 1);
        }
    }

    //adjust for timezone
    const t = new Date( date.setHours( -(date.getTimezoneOffset() / 60),0,0,0) );

    //return a UTC timestamp
    return Date.UTC(
        t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(),
        t.getUTCHours(), t.getUTCMinutes(), t.getUTCSeconds(), t.getUTCMilliseconds()
    );
}

async function geocodeLocation(address) {
    try {

        const response = await geo.geolocate(address);
        const location = response.geometry.location;

        return {
            lng: location.lng,
            lat: location.lat,
            formatted_address: response.formatted_address,
            types: response.types || []
        };

    } catch(e) {
        throw new Error('Could not geo-locate the location: ' + location)
    }
}

function newEventData(new_data, old_data) {
    let newData = false;

    //map the new data
    Object.keys(new_data).map((key) => {
        //if the property does exist in the old data or if any of the properties dont match, then flag to update
        if(!old_data[key] || new_data[key] !== old_data[key]) newData = true;
    });

    return newData;
}

module.exports = {dateTextToTimestamp, geocodeLocation, getEventTag, newEventData};