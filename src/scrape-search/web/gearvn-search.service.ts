import { ProductsService } from 'src/products/products.service';
import { Injectable } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';

@Injectable()
export class gearVnSearchService {
  private readonly config = {
    WEB_URL: 'https://gearvn.com',
    SEARCH_BOX_SELECTOR: '#inputSearchAuto',
    PRODUCTS_GRID_SELECTOR:
      '#search > div.listProduct-row.results > div.search-list-results.ajax-render > div',
  };

  constructor(private readonly productsService: ProductsService) {}

  async scrapeWebsite(searchQuery: string) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const searchURL = `${this.config.WEB_URL}/search?q=${searchQuery}`;
    await page.goto(searchURL, { waitUntil: 'domcontentloaded' });
    const data = await this.scrapeSearchData(page);

    await browser.close();
    return data;
  }

  private async scrapeSearchData(page: Page) {
    const data = await this.extractProductData(page);
    await this.filterAndStoreData(data);
    return data;
  }

  private async filterAndStoreData(data: any): Promise<void> {
    await this.productsService.filterAndStoreProduct(data);
  }

  private async extractProductData(page: Page) {
    const productsGridContent = await page.$$eval(
      this.config.PRODUCTS_GRID_SELECTOR,
      (elements) => {
        const config = {
          PRODUCT_NAME_SELECTOR: 'div.proloop-detail > h3 > a',
          PRICE_SELECTOR:
            'div.proloop-detail > div.proloop-price > div.proloop-price--default > span.proloop-price--highlight',
          DESCRIPTION_SELECTOR:
            'div.proloop-detail > div.proloop-technical > div > span',
          URL_SELECTOR: 'div.proloop-detail > h3 > a',
          BASE_URL: 'https://gearvn.com',
        };

        const element = elements[0];

        const nameElement = element.querySelector(config.PRODUCT_NAME_SELECTOR);
        const productName = nameElement ? nameElement.textContent.trim() : '';

        if (!productName.toLowerCase().includes('laptop')) {
          return null;
        }

        const priceElement = element.querySelector(config.PRICE_SELECTOR);
        const priceText = priceElement
          ? priceElement.textContent.trim()
          : 'Price not available';
        const price = priceText.includes('Price not available')
          ? null
          : priceText.replace(/[^\d]/g, '').toString();

        const descriptionElements = Array.from(
          element.querySelectorAll(config.DESCRIPTION_SELECTOR),
        );
        const description = descriptionElements.map((descElement) =>
          descElement.textContent.trim(),
        );

        const urlElement = element
          .querySelector(config.URL_SELECTOR)
          .getAttribute('href');
        const url = config.BASE_URL + urlElement;

        return { productName, price, description, url };
      },
    );

    console.log('Product Scraped From GearVN: ', productsGridContent);

    return productsGridContent;
  }
}
