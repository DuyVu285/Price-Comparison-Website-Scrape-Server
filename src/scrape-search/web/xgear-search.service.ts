import { ProductsService } from 'src/products/products.service';
import { Injectable } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';

@Injectable()
export class XgearSearchService {
  private readonly config = {
    WEB_URL: 'https://xgear.net',
    SEARCH_BOX_SELECTOR:
      '#site-header-center > div > div > div.col-md-4.col-xs-6.col-sm-6.pd-right-0 > div > form > div > input',
    PRODUCTS_GRID_SELECTOR: '#search > div.results > div > div',
  };

  constructor(private readonly productsService: ProductsService) {}

  async scrapeWebsite(searchQuery: string) {
    const query = searchQuery.replace('-', ' ');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const searchURL = `${this.config.WEB_URL}/search?q=${query}`;
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
          PRODUCT_NAME_SELECTOR: 'div.product-detail > strong > a',
          PRICE_SELECTOR: 'div.product-detail > div.box-pro-prices > p > span',
          DESCRIPTION_SELECTOR:
            'div.product-detail > ul.config-tags > li > span',
          URL_SELECTOR: 'div.product-detail > strong > a',
          BASE_URL: 'https://xgear.net',
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

    console.log('Product Scraped From Xgear: ', productsGridContent);

    return productsGridContent;
  }
}
