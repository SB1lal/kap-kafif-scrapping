import puppeteer from "puppeteer";
import { writeToFile } from './workbook.js';
import { blockedStockSet } from "./blockedStockes.js";

console.time();
const hayir = "HAYIR";

const browser = await puppeteer.launch({
    headless: true,
});

const page = await browser.newPage();
page.setDefaultTimeout(1500);
page.setDefaultNavigationTimeout(1500);

await page.goto("https://www.kap.org.tr/tr/bist-sirketler");

const stockArray = [];

const stockNames = await page.$$eval(
    "#financialTable > tbody > tr > td.pl-4.py-1 > a",
    (stocks) => stocks.map((el) => el.textContent)
);

const paths = await page.$$eval(
    "#financialTable > tbody > tr > td.pl-4.py-1 > a",
    (stocks) => stocks.map((el) => el.getAttribute("href"))
);

for (let i = 0; i < paths.length; i++) {
    const stock = { name: stockNames[i] };

    if (!blockedStockSet.has(stock.name)) {
        try {
            await page.goto("https://www.kap.org.tr/" + paths[i], { timeout: 8000 });
        } catch {
            console.log(stock.name);
            continue;
        }

        try {
            await page.click("#participation-tab");

            for (let j = 0; j < 7; j++) {
                const selector = `#participation > div > div > div:nth-child(2) > div > div > div > div > div > div > table > tbody > tr:nth-child(${4+j}) > td.font-normal`;
                await page.waitForSelector(selector, { timeout: 1500 });
                stock[`v${j+1}`] = await page.$eval(selector, el => el.textContent.trim());
            }

            stockArray.push(stock);
        } catch (error) {
            console.log(`${i}- ${stock.name}`);
            continue;
        }
    }
}

const zeroRateStocks = stockArray.filter(stock =>
    stock.v1.localeCompare(hayir, "tr", { sensitivity: "base" }) === 0 &&
    stock.v2.localeCompare(hayir, "tr", { sensitivity: "base" }) === 0 &&
    stock.v3.localeCompare(hayir, "tr", { sensitivity: "base" }) === 0 &&
    stock.v4.localeCompare(hayir, "tr", { sensitivity: "base" }) === 0 &&
    stock.v5 === '0'
);

writeToFile(zeroRateStocks);
console.timeEnd();
await browser.close();
