const geo = require('./geolocator');

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const CLUB = 'Club', CONCERT = 'Concert', THEATER = 'Theater', SPORTS = 'Sports', COMMUNITY = 'Community';

//make sure any tag names added are lower case
const locationTagLookup = {
    "cowboys" : CLUB,
    "cowboys club & casino" : CLUB
};

async function dateTextToTimestamp(dateText) {

    //default to todays date
    const date = new Date();

    dateText = dateText.toLowerCase();

    //look for date info if 'today' is not found in the date string
    if(dateText.indexOf('today') === -1) {

        if (dateText.indexOf('tomorrow') === -1) {

            //check to see if there is a day of the week in the date text
            const dayFound = days.filter(d => d.includes(dateText));

            //check to see if there is a month of the year in the date text
            const monthFound = months.filter(m => m.includes(dateText));

            if (monthFound.length > 0) {

                const month = monthFound[0];

                //grabs the date and year which is between 'month' and 'at'
                let date_data = dateText.substring(dateText.indexOf(month) + month.length, dateText.indexOf('at'));
                //remove spacing and convert to an array, day is index 0, year is index 1
                date_data = date_data.trim().split(',');

                const monthIndex = months.indexOf(month);
                const dayIndex = Number(date_data[0]);
                const yearIndex = Number(date_data[1]);

                console.log(yearIndex, monthIndex, dayIndex);

                date.setFullYear(yearIndex).setMonth(monthIndex).setDate(dayIndex);

            } else if (dayFound.length > 0) {

                const day = dayFound[0];

                //if just a day of the week was found set the date to that day of the week
                const dayIndex = days.indexOf(day);
                date.setDate(date.getDate() + (7 + dayIndex - date.getDay()) % 7);

            }

        } else {

            //set the date to tomorrow
            date.setDate(date.getDate() + 1);
        }
    }

    return new Date( date.setHours(0,0,0,0) ).getTime();
}

async function geocodeLocation(location, limit = 1) {
    try {
        const data = await geo.geolocate(location, limit);
        return {lng: data.lon, lat: data.lat};
    } catch(e) {
        throw new Error('Could not geo-locate the location: '+ location)
    }
}

function getLocationTag(address) {

    //defaults to 'Club' tag
    let tag = CLUB;

    address = address.toLowerCase();

    //loop through all the location lookup keys
    Object.keys(locationTagLookup).map((key) => {

        //if a tag matches anywhere in the address, set the tag from the lookup value
        if(address.indexOf(key)) tag = locationTagLookup[key];
    });

    return tag;
}

async function checkForEventDuplicate(params) {
    //.. possibly even more cancer then date sanitizing
}

module.exports = {checkForEventDuplicate, dateTextToTimestamp, geocodeLocation, getLocationTag};