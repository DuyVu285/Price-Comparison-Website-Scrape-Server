import { ProductsService } from 'src/products/products.service';
import { Injectable } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';

const config = {
    WEB_URL: 'https://xgear.net/',
    SEARCH_BOX_SELECTOR: '#woocommerce-product-search-field',
    SEARCH_TARGET: 'laptop',
    PRODUCTS_GRID_SELECTOR: '#main > div > div.datit-bg-white > div > div > div.row.products_archive_grid > div',
    LOAD_MORE_BUTTON_SELECTOR: '#pp_loadmore_products',
    DELAY_TIME: 2000,
    COLLECTION: 'xgear-products',
};

@Injectable()
export class XgearScraperService {
    constructor(private readonly ProductsService: ProductsService) { }

    async scrapeWebsite(): Promise<string> {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await this.handleRequestInterception(page);
        await page.goto(config.WEB_URL, { waitUntil: 'networkidle0' });
        await page.waitForSelector(config.SEARCH_BOX_SELECTOR);
        await this.onSearchBox(page);

        await this.loadMoreProducts(page);
        const data = await this.extractProducts(page);
        //await this.storeDataToDatabase(data);

        await browser.close();
        return 'Scraped data from xgear.net';
    }

    private async dataProcess(data: any) {
        return data
    }

    private async handleRequestInterception(page: Page) {
        page.setRequestInterception(true)
        page.on('request', (request) => {
            if (request.resourceType() === 'stylesheet' || request.resourceType() === 'font' || request.resourceType() === 'image') {
                request.abort();
            }
            else {
                request.continue();
            }
        });
    }

    private async onSearchBox(page: Page) {
        const searchBox = await page.$(config.SEARCH_BOX_SELECTOR);
        await searchBox.type(config.SEARCH_TARGET);
        await searchBox.press('Enter');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        return page;
    }

    private async loadMoreProducts(page: Page) {
        let loadMoreButton;
        do {
            loadMoreButton = await page.$(config.LOAD_MORE_BUTTON_SELECTOR);
            if (loadMoreButton) {
                await loadMoreButton.click();
                await new Promise(resolve => setTimeout(resolve, config.DELAY_TIME));
            }
        } while (loadMoreButton);
    }

    private async storeDataToDatabase(data: any) {
        return this.ProductsService.createMany(data, config.COLLECTION);
    }

    private async extractProducts(page: Page) {
        const productsGridContent = await page.$$eval(config.PRODUCTS_GRID_SELECTOR, (elements) => {
            return elements
                .map(element => {
                    const config = {
                        PRODUCT_NAME_SELECTOR: 'div.product-info > h2 > a',
                        PRICE_SELECTOR: 'div.product-info > span.price.datit-price-loop > ins',
                        DESCRIPTION_SELECTOR: 'div.product-info > div.show-cauhinh-loop > div.item-cauhinh',
                        URL_SELECTOR: 'div.product-info > h2 > a',
                    }
                    const nameElement = element.querySelector(config.PRODUCT_NAME_SELECTOR);
                    const name = nameElement ? nameElement.textContent.trim() : '';

                    if (name.toLowerCase().includes('laptop')) {
                        const priceElement = element.querySelector(config.PRICE_SELECTOR);
                        const priceText = priceElement ? priceElement.textContent.trim() : 'Price not available';
                        const price = priceText.includes('Price not available') ? null : parseInt(priceText.replace(/[^\d]/g, ''), 10);

                        const description = Array.from(element.querySelectorAll(config.DESCRIPTION_SELECTOR)).map(el => el.textContent.trim());

                        const url = element.querySelector(config.URL_SELECTOR).getAttribute('href');

                        return { name, price, description, url };
                    }
                    return null;
                })
                .filter(product => product !== null);
        });
        console.log('Products Scraped: ', productsGridContent)
        console.log('Products Scraped: ', productsGridContent.length)
        return productsGridContent;
    }
}
