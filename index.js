import puppeteer from "puppeteer";
import { writeToFile } from './workbook.js';
import { blockedStockSet } from "./blockedStockes.js";

const hayir = "HAYIR";

const browserOptions = {
    headless: true,
    timeout: 1500,
};

// const viewportOptions = {
//     width: 1280,
//     height: 720,
// };

const browser = await puppeteer.launch(browserOptions);
const page = await browser.newPage();

// await page.setViewport(viewportOptions);

await page.goto("https://www.kap.org.tr/tr/bist-sirketler");

const stockArray = [];

const stockNames = await page.$$eval(
    //"div.w-clearfix.w-inline-block.comp-row > div.comp-cell._04.vtable > a",
    "#financialTable > tbody > tr > td.pl-4.py-1 > a",
    (stocks) => stocks.map((el) => el.textContent)
);


const paths = await page.$$eval("#financialTable > tbody > tr > td.pl-4.py-1 > a", (stocks) => 
    stocks.map((el) => el.getAttribute("href"))
);

const pathLength = paths.length;
for (let i = 0; i < pathLength; i++) {
    
    const stock = {};
    stock.name = stockNames[i];

    if(!blockedStockSet.has(stock.name))
    {
        page.setDefaultTimeout(10000);
        try { await page.goto("https://www.kap.org.tr/" + paths[i]); } 
        catch (error) { console.log(stock.name); }
        
        page.setDefaultTimeout(1500);
        try {
            await page.$eval("#participation-tab", (link) => link.click());

            for (let j = 0; j < 7; j++) {
                const selector = await page
                    .locator(`#participation > div > div > div:nth-child(2) > div > div > div > div > div > div > table > tbody > tr:nth-child(${4+j}) > td.font-normal`)
                    .waitHandle();
                stock[`v${j+1}`] = await selector?.evaluate((el) => el.textContent.trim());
                
            }

            stockArray.push(stock);
        } catch (error) {
            console.log(`${i}- ${stock.name}`);
            continue;
        }
    }
}

const zeroRateStocks = stockArray.filter((stock) => {
    return (stock.v1.localeCompare(hayir, "tr", { sensitivity: "base" }) === 0 &&
                stock.v2.localeCompare(hayir, "tr", { sensitivity: "base" }) === 0 &&
                    stock.v3.localeCompare(hayir, "tr", { sensitivity: "base" }) === 0 &&
                        stock.v4.localeCompare(hayir, "tr", { sensitivity: "base" }) === 0 &&
                            stock.v5 === '0')})

writeToFile(zeroRateStocks);
await browser.close();
