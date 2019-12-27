const config = require('./config').auth;
const chrome = require('selenium-webdriver/chrome');
const {Builder, By, Key} = require('selenium-webdriver');
const firebase = require('./modules/firebase/index');

//Do not put past 250 for daily updates, 500 for fresh database
const MAX_EVENT_LOOP_LIMIT = 500;
const MAX_SCROLL_LOOP_LIMIT = 100000;

const ACTION_DELAY_MS = 1250;
const SCROLL_DELAY_MS = 200;

const SCROLL_AMOUNT_PX = 500;

let eventCount = 0;
let scrollCount = 0;

let driver;

(async function init() {

    try {

        await buildDriver();

        await login(config.email, config.pass);

        await firebase.clearOldEvents();

        await scrape();

    } catch (e) {
        console.log(e.message);
    }

})();

async function buildDriver() {
    try {

        //hide notifications
        const options = new chrome.Options();
        options.setUserPreferences({'profile.default_content_setting_values.notifications': 2});

        //build the chrome driver
        driver = await new Builder().forBrowser('chrome').setChromeOptions(options).usingServer('http://localhost:4444/wd/hub').build();
        //remove .usingServer to use local chrome driver
    } catch(e) {
        throw new Error('An error occurred while trying to build the chrome driver')
    }
}

async function login(email, pass) {
    try {

        // Navigate to facebook login url
        await driver.get('https://www.facebook.com/');

        // Enter email and password then perform keyboard action "Enter"
        await driver.findElement( By.name('email') ).sendKeys(email);
        await driver.findElement( By.name('pass') ).sendKeys(pass, Key.ENTER);

    } catch(e) {
        throw new Error('An error occurred while trying to login')
    }
}

async function scrape() {

    do {

        console.log(`--------------- Event Iteration: [${eventCount}] --------------`);

        await driver.get('https://www.facebook.com/events/discovery/');
        await driver.sleep( ACTION_DELAY_MS );

        try {

            await locateNextEvent();
            await scrapeEvent();

        } catch (e) {
            console.log(e);
        }

        ++eventCount;

    } while (eventCount < MAX_EVENT_LOOP_LIMIT);

    //quit the driver if we have reached max loop limit
    await driver.quit();
}

async function locateNextEvent() {

    let scrollY = 0;

    //find the next event element
    let selector = '//*[contains(@id, "anchor' + eventCount + '")]';

    //check if the next element has loaded on screen
    let element = await getEventElement(selector);

    //while element does not exist
    if(!element) {

        for(scrollCount = 0; scrollCount < MAX_SCROLL_LOOP_LIMIT; ++scrollCount) {

            //increase by scroll amount
            scrollY += SCROLL_AMOUNT_PX;

            //wait and scroll
            await driver.sleep(SCROLL_DELAY_MS);
            await driver.executeScript(`window.scrollTo(0, ${scrollY})`);

            //check to see if we have found the element
            element = await getEventElement(selector);

            //if an element was found break the loop
            if(element) break;
        }

        //quit the driver if we have reached the max scroll limit
        if(scrollCount >= MAX_SCROLL_LOOP_LIMIT) await driver.quit();
    }

    try {

        //once an element has been found, scroll it into view and click it
        await driver.executeScript("arguments[0].scrollIntoView();", element);
        await element.click();

    } catch (e) {
        console.log(e);
    }

}

async function scrapeEvent() {

    await driver.sleep( ACTION_DELAY_MS );

    let currentUrl;

    let titleElement, dateElement, addressElement, imageElement, descriptionElement;
    let title, date, address, image, description, eventId;


    try {

        //the fifth index of the event url split by '/' is the event ID
        currentUrl = await driver.getCurrentUrl();
        eventId = currentUrl.split('/')[4];

        titleElement = await driver.findElement(By.xpath('//*[@id="seo_h1_tag"]'));
        dateElement = await driver.findElement(By.xpath('//*[@id="event_time_info"]/div/table/tbody/tr/td[2]/div/div/div[2]/div/div[1]'));
        addressElement = await driver.findElement(By.xpath('//*[@class="_4dpf _phw" or @class="_4dpf _phw"]'));
        descriptionElement = await driver.findElement(By.xpath('//*[@class="_63eu"]'));
        imageElement = await driver.findElement(By.xpath('//*[@class="scaledImageFitHeight img" or @class="scaledImageFitWidth img"]'));

    } catch(e) {
        console.log(`Could not find all elements required for event [${currentUrl}]`);
    }

    if(titleElement && dateElement && addressElement && descriptionElement && imageElement) {

        try {

            title = await titleElement.getText();
            date = await dateElement.getText();
            address = await addressElement.getText();
            description = await descriptionElement.getText();
            image = await imageElement.getAttribute('src');

        } catch(e) {
            console.log(`Could not retrieve all data required for event [${currentUrl}]`);
        }

        const eventResult = await firebase.makeEvent({title, date, address, description, image, eventId});

        console.log(eventResult);
    }
}

async function getEventElement(selector) {
    let elements = await driver.findElements( By.xpath(selector) );

    //did we find any elements?
    if(elements.length > 0) {

        //return the first element found
        return elements[0];
    }

    //no element found
    return null;
}