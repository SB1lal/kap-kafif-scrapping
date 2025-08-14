import puppeteer from "puppeteer";
import { writeToFile } from './workbook.js';
import { blockedStockSet } from "./blockedStockes.js";

const hayir = "HAYIR";
const MAX_CONCURRENCY = 5; // Limit open pages to avoid overwhelming the site

const browser = await puppeteer.launch({ headless: true });

const mainPage = await browser.newPage();
await mainPage.setDefaultTimeout(1500);
await mainPage.setDefaultNavigationTimeout(1500);

await mainPage.goto("https://www.kap.org.tr/tr/bist-sirketler");

const stockNames = await mainPage.$$eval(
    "#financialTable > tbody > tr > td.pl-4.py-1 > a",
    stocks => stocks.map(el => el.textContent.trim())
);

const paths = await mainPage.$$eval(
    "#financialTable > tbody > tr > td.pl-4.py-1 > a",
    stocks => stocks.map(el => el.getAttribute("href"))
);

await mainPage.close();

// Filter out blocked stocks
const stocksToProcess = stockNames
    .map((name, i) => ({ name, path: paths[i] }))
    .filter(stock => !blockedStockSet.has(stock.name));

const stockArray = [];

async function scrapeStock(stock) {
    const page = await browser.newPage();
    page.setDefaultTimeout(1500);
    page.setDefaultNavigationTimeout(10000);

    try {
        await page.goto("https://www.kap.org.tr/" + stock.path);

        await page.click("#participation-tab");

        for (let j = 0; j < 7; j++) {
            const selector = `#participation > div > div > div:nth-child(2) > div > div > div > div > div > div > table > tbody > tr:nth-child(${4+j}) > td.font-normal`;
            await page.waitForSelector(selector, { timeout: 1500 });
            stock[`v${j+1}`] = await page.$eval(selector, el => el.textContent.trim());
        }

        stockArray.push(stock);
    } catch (error) {
        console.log(`❌ Failed: ${stock.name}`);
    } finally {
        await page.close();
    }
}

// Run tasks in batches to avoid too many tabs
for (let i = 0; i < stocksToProcess.length; i += MAX_CONCURRENCY) {
    const batch = stocksToProcess.slice(i, i + MAX_CONCURRENCY);
    await Promise.all(batch.map(scrapeStock));
}

// Filter stocks with all "HAYIR" and v5 === '0'
const zeroRateStocks = stockArray.filter(stock =>
    stock.v1.localeCompare(hayir, "tr", { sensitivity: "base" }) === 0 &&
    stock.v2.localeCompare(hayir, "tr", { sensitivity: "base" }) === 0 &&
    stock.v3.localeCompare(hayir, "tr", { sensitivity: "base" }) === 0 &&
    stock.v4.localeCompare(hayir, "tr", { sensitivity: "base" }) === 0 &&
    stock.v5 === '0'
);

writeToFile(zeroRateStocks);
await browser.close();
