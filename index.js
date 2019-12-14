const {Builder, By, Key, until} = require('selenium-webdriver');
const config = require('./config/index');
const express = require('express');
const app = express();


(async function example() {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        // Navigate to Url
        await driver.get('https://www.facebook.com');

        // Enter email and password and perform keyboard action "Enter"
        await driver.findElement(By.name('email')).sendKeys(config.authentication.email);
        await driver.findElement(By.name('pass')).sendKeys(config.authentication.pass, Key.ENTER);




        let firstResult = await driver.wait(until.elementLocated(By.css('h3>div')), 10000);

        console.log(await firstResult.getAttribute('textContent'));
    }
    finally{
     //   driver.quit();
    }
})();
