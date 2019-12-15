const {Builder, By, Key} = require('selenium-webdriver');

const chrome = require('selenium-webdriver/chrome');
const config = require('../config/index');

const MAX_EVENT_LOOP_LIMIT = 500;
const ACTION_DELAY = 1000;

const MAX_SCROLL_LOOP_LIMIT = 5000;
const SCROLL_DELAY = 250;
const SCROLL_AMOUNT = 350;

let eventCount = 0;
let scrollCount = 0;

let driver;

(async function init() {

    try {

        await buildDriver();

        await login('https://www.facebook.com/', config.authentication.email, config.authentication.pass);

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
        driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    } catch(e) {
        throw new Error('An error occurred while trying to build the chrome driver')
    }
}

async function login(url, email, pass) {
    try {

        // Navigate to the login url
        await driver.get(url);

        // Enter email and password then perform keyboard action "Enter"
        await driver.findElement( By.name('email' ) ).sendKeys(email);
        await driver.findElement( By.name('pass' ) ).sendKeys(pass, Key.ENTER);

    } catch(e) {
        throw new Error('An error occurred while trying to login')
    }
}

async function scrape() {

    do {

        await driver.get('https://www.facebook.com/events/discovery/');

        await driver.sleep( ACTION_DELAY );

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

    let element = await getEventElement(selector);

    //while element does not exist
    if(!element) {

        for(scrollCount = 0; scrollCount < MAX_SCROLL_LOOP_LIMIT; ++scrollCount) {

            //increase by scroll amount
            scrollY += SCROLL_AMOUNT;

            //wait and scroll
            await driver.sleep(SCROLL_DELAY);
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

    await driver.sleep( ACTION_DELAY );

    let titleElement, dateElement, addressElement, venueElement, pictureElement, descriptionElement;
    let title, date, address, venue, picture, description;

    try {

        titleElement = await driver.findElement(By.xpath('//*[@id="seo_h1_tag"]'));
        dateElement = await driver.findElement(By.xpath('//*[@id="event_time_info"]/div/table/tbody/tr/td[2]/div/div/div[2]/div/div[1]'));
        addressElement = await driver.findElement(By.xpath('//*[@id="u_0_19"]/table/tbody/tr/td[2]/div/div[1]/div/div[2]/div/div'));
        venueElement = await driver.findElement(By.xpath('//*[@id="u_0_1a"]'));
        descriptionElement = await driver.findElement(By.xpath('//*[@id="u_0_1p"]/div/div/div[2]/div/div/div/span'));
        pictureElement = await driver.findElement(By.xpath('//*[@id="event_header_primary"]/div[1]/div[1]/a/div/img'));

    } catch(e) {
        console.log('Could not find all elements required for this event.');
    }

    if(titleElement && dateElement && addressElement && venueElement && descriptionElement && pictureElement) {

        try {

            title = await titleElement.getText();
            date = await dateElement.getText();
            address = await addressElement.getText();
            venue = await venueElement.getText();
            description = await descriptionElement.getText();
            picture = await pictureElement.getAttribute('src');

        } catch(e) {
            console.log('Could not find all data required for this event.');
        }

        console.log(title, date, address, venue, description, picture);

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