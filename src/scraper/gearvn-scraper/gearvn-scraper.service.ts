import { ProductsService } from 'src/products/products.service';
import { Injectable } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';

const config = {
    SEARCH_BOX_SELECTOR: '#inputSearchAuto',
    SEARCH_TARGET: 'laptop',
    PRODUCTS_GRID_SELECTOR: '#search > div.listProduct-row.results > div.search-list-results.ajax-render > div',
    LOAD_MORE_BUTTON_SELECTOR: '#load_more_search',
    DELAY_TIME: 2000,
    COLLECTION: 'gearvn-products',
}

@Injectable()
export class GearvnScraperService {
    constructor(private readonly ProductsService: ProductsService) { }

    async scrapeWebsite(url: string): Promise<string> {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await this.handleRequestInterception(page);
        url = `${url}/search?q=laptop`;
        await page.goto(url, { waitUntil: 'networkidle0' });

        await this.loadMoreProducts(page);
        const data = await this.extractProducts(page);
        await this.storeDataToDatabase(data);

        await browser.close();
        return 'Scraped data from gearvn.com';
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

    private async loadMoreProducts(page: Page) {
        let loadMoreCount = 0;
        const maxLoadMoreClicks = 40;
        let loadMoreButton;
        while (loadMoreCount < maxLoadMoreClicks) {
            loadMoreButton = await page.$(config.LOAD_MORE_BUTTON_SELECTOR);
            if (loadMoreButton) {
                await loadMoreButton.click();
                await new Promise(resolve => setTimeout(resolve, config.DELAY_TIME));
                loadMoreCount++;
                console.log(`Load ${loadMoreCount}`);
            }
        }
    }

    private async storeDataToDatabase(data: any) {
        return this.ProductsService.createMany(data, config.COLLECTION);
    }

    private async extractProducts(page: Page) {
        const productsGridContent = await page.$$eval(config.PRODUCTS_GRID_SELECTOR, (elements) => {
            return elements
                .map(element => {
                    const config = {
                        PRODUCT_NAME_SELECTOR: 'div.proloop-detail > h3 > a',
                        PRICE_SELECTOR: 'div.proloop-detail > div.proloop-price > div.proloop-price--default > span.proloop-price--highlight ',
                        DESCRIPTION_SELECTOR: 'div.proloop-detail > div.proloop-technical',
                        URL_SELECTOR: 'div.proloop-img > a',
                    };
                    const nameElement = element.querySelector(config.PRODUCT_NAME_SELECTOR);
                    const name = nameElement ? nameElement.textContent.trim() : '';

                    if (name.toLowerCase().includes('laptop')) {
                        const priceElement = element.querySelector(config.PRICE_SELECTOR);
                        const priceText = priceElement ? priceElement.textContent.trim() : 'Price not available';
                        const price = priceText.includes('Price not available') ? null : parseInt(priceText.replace(/[^\d]/g, ''), 10);

                        const descriptionElement = Array.from(element.querySelectorAll(config.DESCRIPTION_SELECTOR)).map(el => el.textContent.trim());
                        const description = descriptionElement.join(' ');
                        
                        const baseUrlElement = element.querySelector(config.URL_SELECTOR);
                        const url = baseUrlElement ? `https://gearvn.com${baseUrlElement.getAttribute('href')}` : '';

                        return { name, price, description, url };

                    }
                    return null;
                })
                .filter(product => product !== null);
        });
        console.log('Products Scraped: ', productsGridContent.length)
        return productsGridContent;
    }
}
