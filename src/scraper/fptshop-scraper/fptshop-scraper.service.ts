import { ProductsService } from 'src/products/products.service';
import { Injectable } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';

const config = {
    SEARCH_BOX_SELECTOR: '#key',
    SEARCH_TARGET: 'laptop',
    PRODUCTS_GRID_SELECTOR: '#main > section > div > div.card.cs-card > div.row-flex > div',
    LOAD_MORE_BUTTON_SELECTOR: '#main > section > div > div.card.cs-card > div > div.c-comment-loadMore > a',
    DELAY_TIME: 2000,
    COLLECTION: 'fptshop-products',
};

@Injectable()
export class FptshopScraperService {
    constructor(private readonly ProductsService: ProductsService) { }

    async scrapeWebsite(url: string): Promise<string> {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await this.handleRequestInterception(page);
        await page.goto(url, { waitUntil: 'networkidle0' });


        await page.waitForSelector(config.SEARCH_BOX_SELECTOR);
        await this.onSearchBox(page);

        await this.loadMoreProducts(page);
        await this.extractProducts(page);
        //await this.storeDataToDatabase(data);

        await browser.close();
        return 'Scraped data from fptshop.com.vn';
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

    private async extractProducts(page: Page) {
        const productsGridContent = await page.$$eval(config.PRODUCTS_GRID_SELECTOR, (elements) => {
            console.log(elements.length)
            return elements
                .map(element => {
                    console.log(element)
                    const config = {
                        PRODUCT_NAME_SELECTOR: 'div.cdt-product__info > h3 > a',
                        PRICE_SELECTOR: 'div.cdt-product__show-promo > div.progress',
                        //IMAGE_URL_SELECTOR: 'div.cdt-product__img > a > span > img',
                        //DESCRIPTION_SELECTOR: 'div.cdt-product__info > div.cdt-product__config > div',
                        //BASE_URL_SELECTOR: 'div.cdt-product__info > h3 > a',
                    }
                    const nameElement = element.querySelector(config.PRODUCT_NAME_SELECTOR);
                    const name = nameElement ? nameElement.textContent.trim() : '';

                    if (name.toLowerCase().includes('laptop')) {
                        const priceElement = element.querySelector(config.PRICE_SELECTOR);
                        const priceText = priceElement ? priceElement.textContent.trim() : 'Price not available';
                        const price = priceText.includes('Price not available') ? null : parseInt(priceText.replace(/[^\d]/g, ''), 10);
                        //const description = Array.from(element.querySelectorAll(config.DESCRIPTION_SELECTOR)).map(el => el.textContent.trim());
                        //const imageUrl = element.querySelector(config.IMAGE_URL_SELECTOR).getAttribute('src');
                        //const baseUrlElement = element.querySelector(config.BASE_URL_SELECTOR);
                        //const baseUrl = baseUrlElement ? `https://fptshop.com.vn${baseUrlElement.getAttribute('href')}` : '';

                        //console.log('Product price', priceElement)
                        //console.log('Description', description)
                        //console.log('Image URL', imageUrl)    
                        //console.log('Base URL', baseUrl)

                        return { name, price };
                    }

                    return null;
                })
                .filter(product => product !== null);
        });
        console.log(productsGridContent)
        return productsGridContent;
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
                loadMoreCount++;
                console.log(`Load ${loadMoreCount}`);
            }
        }
    }

    private async storeDataToDatabase(data: any) {
        return this.ProductsService.createMany(data, config.COLLECTION);
    }
}
