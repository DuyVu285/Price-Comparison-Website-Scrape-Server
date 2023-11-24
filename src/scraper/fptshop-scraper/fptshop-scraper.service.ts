import { ProductsService } from 'src/products/products.service';
import { Injectable } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';

const config = {
    SEARCH_BOX_SELECTOR: '#key',
    SEARCH_TARGET: 'laptop',
    PRODUCTS_GRID_SELECTOR: '#main > section > div > div.card.cs-card > div > div',
    LOAD_MORE_BUTTON_SELECTOR: '#main > section > div > div.card.cs-card > div > div.c-comment-loadMore > a',
    DELAY_TIME: 2000,
    COLLECTION: 'fptshop-products',
};

@Injectable()
export class FptshopScraperService {
    constructor(private readonly ProductsService: ProductsService) { }

    async scrapeWebsite(url: string): Promise<string> {
        const browser = await puppeteer.launch({});
        const page = await browser.newPage();

        await page.goto(url, { waitUntil: 'domcontentloaded' });

        await page.waitForSelector(config.SEARCH_BOX_SELECTOR);
        await this.onSearchBox(page);

        await this.loadMoreProducts(page);
        const data = await this.extractProducts(page);
        await this.storeDataToDatabase(data);

        await browser.close();
        return 'Scraped data from fptshop.com.vn';
    }

    private async onSearchBox(page: Page) {
        const searchBox = await page.$(config.SEARCH_BOX_SELECTOR);
        await searchBox.type(config.SEARCH_TARGET);
        await searchBox.press('Enter');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        return page;
    }

    private async loadMoreProducts(page: Page) {
        let loadMoreCount = 0;
        const maxLoadMoreClicks = 80;
        const DELAY_TIME = 2000;
        let loadMoreButton;
        while (loadMoreCount < maxLoadMoreClicks) {
            loadMoreButton = await page.$(config.LOAD_MORE_BUTTON_SELECTOR);
            if (loadMoreButton) {
                await loadMoreButton.click();
                await new Promise(resolve => setTimeout(resolve, DELAY_TIME));
                console.log(`Load ${loadMoreCount}`);
                loadMoreCount++;
            }
        }
    }

    private async storeDataToDatabase(data: any) {
        return this.ProductsService.createMany(data, config.COLLECTION);
    }

    private async extractProducts(page: Page) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const productsGridContent = await page.$$eval(config.PRODUCTS_GRID_SELECTOR, (elements) => {
            return elements
                .map(element => {
                    const config = {
                        PRODUCT_NAME_SELECTOR: 'div.cdt-product__info > h3 > a',
                        PRICE_SELECTOR: 'div.cdt-product__show-promo > div.progress',
                        DESCRIPTION_SELECTOR: 'div.cdt-product__info > div.cdt-product__config > div',
                        URL_SELECTOR: 'div.cdt-product__info > h3 > a',
                    }
                    const nameElement = element.querySelector(config.PRODUCT_NAME_SELECTOR);
                    const name = nameElement ? nameElement.textContent.trim() : '';

                    if (name.toLowerCase().includes('laptop')) {
                        const priceElement = element.querySelector(config.PRICE_SELECTOR);
                        const priceText = priceElement ? priceElement.textContent.trim() : 'Price not available';
                        const price = priceText.includes('Price not available') ? null : parseInt(priceText.replace(/[^\d]/g, ''), 10);

                        const description = Array.from(element.querySelectorAll(config.DESCRIPTION_SELECTOR)).map(el => el.textContent.trim());

                        const baseUrlElement = element.querySelector(config.URL_SELECTOR);
                        const url = baseUrlElement ? `https://fptshop.com.vn${baseUrlElement.getAttribute('href')}` : '';

                        console.log({ name, price, description, url });
                        return { name, price, description, url };
                    } 
                    return null;
                })
                .filter(product => product !== null);
        });
        console.log(productsGridContent)
        console.log('Products Scraped: ', productsGridContent.length)
        return productsGridContent;
    }
}
