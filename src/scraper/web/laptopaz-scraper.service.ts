import { ProductsService } from 'src/products/products.service';
import { Injectable } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';

@Injectable()
export class LaptopAZScraperService {
  private readonly config = {
    WEB_URL: 'https://laptopaz.vn/',
    SEARCH_BOX_SELECTOR: '#stext',
    SEARCH_TARGET: 'laptop',
    PRODUCTS_GRID_SELECTOR: '#product > div ',
    PAGINATION_SELECTOR: 'body > main > div.product-list > div > nav > ul',
  };

  constructor(private readonly productsService: ProductsService) {}

  async scrapeWebsite(): Promise<any> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const searchURL = `${this.config.WEB_URL}/tim?q=${this.config.SEARCH_TARGET}`;
    await page.goto(searchURL, { waitUntil: 'domcontentloaded' });
    const totalItems = await this.scrapeAllPages(page);

    await browser.close();
    const result = { url: this.config.WEB_URL, totalItems: totalItems };
    return result;
  }

  private async scrapeAllPages(page: Page): Promise<number> {
    let currentPage = 1;
    let totalItems = 0;
    let maxPages = 30;

    try {
      while (currentPage <= maxPages) {
        const nextPage = `${this.config.WEB_URL}/tim?scat_id=&q=${this.config.SEARCH_TARGET}&page=${currentPage}`;
        await page.goto(nextPage, { waitUntil: 'domcontentloaded' });
        const data = await this.extractProductsData(page);
        console.log(`Data`, data);
        totalItems += data.length;
        await this.filterAndStoreData(data);

        currentPage++;
      }
    } catch (error) {
      console.error(`Error scraping page ${currentPage}:`, error);
    }

    return totalItems;
  }

  private async filterAndStoreData(data: any): Promise<void> {
    for (const product of data) {
      try {
        await this.productsService.filterAndStoreProduct(product);
      } catch (error) {
        console.error('Error storing product:', product, error);
      }
    }
  }

  private async extractProductsData(page: Page) {
    try {
      const productsGridContent = await page.$$eval(
        this.config.PRODUCTS_GRID_SELECTOR,
        (elements) => {
          const config = {
            PRODUCT_NAME_SELECTOR: 'div.p-emtry > a',
            PRICE_SELECTOR: 'div.p-emtry > span.p-price',
            URL_SELECTOR: 'div.p-emtry > a',
            IMAGE_SELECTOR: 'div.p-img > a > img',
            BASE_URL: 'https://laptopaz.vn',
          };

          return elements
            .map((element) => {
              const nameElement = element.querySelector(
                config.PRODUCT_NAME_SELECTOR,
              );
              const RawProductName = nameElement
                ? nameElement.textContent.trim()
                : '';

              const cleanedName = RawProductName.replace(/\[.*?\]/g, '').trim();

              const match = cleanedName.match(/\((.*?)\)/);
              const description = match ? match[1] : '';
              const productName = cleanedName.replace(/\(.*?\)/g, '').trim();

              if (
                !productName.toLowerCase().includes('laptop') ||
                productName.toLowerCase().includes('ram laptop') ||
                productName.toLowerCase().includes('hdd') ||
                productName.toLowerCase().includes('ssd')
              ) {
                return null;
              }

              const priceElement = element.querySelector(config.PRICE_SELECTOR);
              const priceText = priceElement
                ? priceElement.textContent.trim()
                : 'Price not available';

              const priceMatch = priceText.match(/(\d{1,3}(?:\.\d{3})*)/);
              const price = priceMatch
                ? priceMatch[0].replace(/\./g, '').toString()
                : null;

              if (price === null || price === '') {
                return null;
              }

              const urlElement = element
                .querySelector(config.URL_SELECTOR)
                .getAttribute('href');
              const url = config.BASE_URL + urlElement;

              const imageElement = element.querySelector(config.IMAGE_SELECTOR);
              const imageUrl = imageElement
                ? new URL(imageElement.getAttribute('src'), config.BASE_URL)
                    .href
                : null;

              return { productName, price, description, url, imageUrl };
            })
            .filter((product) => product !== null);
        },
      );
      return productsGridContent;
    } catch (error) {
      console.error('Error extracting products data:', error);
      return [];
    }
  }
}
