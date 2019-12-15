const chrome = require('selenium-webdriver/chrome');
const config = require('../config/index');

const {Builder, By, Key} = require('selenium-webdriver');

const express = require('express');
const app = express();

let driver;

(async function init() {

    try {

        await buildDriver();

        await login('https://www.facebook.com/', config.authentication.email, config.authentication.pass);

        await scrapeEvent('https://www.facebook.com/events/592706501271611/');

    } catch (e) {
        console.log(e);
    }

})();

async function buildDriver() {
    try {

        const options = new chrome.Options();
        options.setUserPreferences({'profile.default_content_setting_values.notifications': 2});

        driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    } catch(e) {
        console.log(e);
        throw new Error('An error occurred while trying to build chrome driver')
    }
}

async function login(url, email, pass) {
    try {

        // Navigate to Url
        await driver.get(url);

        // Enter email and password and perform keyboard action "Enter"
        await driver.findElement(By.name('email')).sendKeys(email);
        await driver.findElement(By.name('pass')).sendKeys(pass, Key.ENTER);

    } catch(e) {
        throw new Error('An error occurred while trying to login')
    } finally {
        //driver.quit();
    }
}

async function scrapeEvent(url) {

    //navigate to url
    await driver.get(url);

    //Scrape Event Data

    //Title
    const titleObject = await driver.findElement(By.xpath('//*[@id="seo_h1_tag"]'));
    const title = await titleObject.getText();

    //Date
    const dateObject = await driver.findElement(By.xpath('//*[@id="event_time_info"]/div/table/tbody/tr/td[2]/div/div/div[2]/div/div[1]'));
    const date = await dateObject.getText();

    //Address
    const addressObject = await driver.findElement(By.xpath('//*[@id="u_0_19"]/table/tbody/tr/td[2]/div/div[1]/div/div[2]/div/div'));
    const address = await addressObject.getText();

    //Venue -- location in firebase
    const venueObject = await driver.findElement(By.xpath('//*[@id="u_0_1a"]'));
    const venue = await venueObject.getText();

    //Picture
    const pictureObject = await driver.findElement(By.xpath('//*[@id="event_header_primary"]/div[1]/div[1]/a/div/img'));
    const picture = await pictureObject.getAttribute("src");

    //Description
    const descriptionObject = await driver.findElement(By.xpath('//*[@id="u_0_1p"]/div/div/div[2]/div/div/div/span'));
    const description = await descriptionObject.getText();

    console.log(title + date + address + venue + picture + description);
}
