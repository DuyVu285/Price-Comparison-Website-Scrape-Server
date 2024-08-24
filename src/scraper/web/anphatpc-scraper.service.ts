import { ProductsService } from 'src/products/products.service';
import { Injectable } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';

@Injectable()
export class AnPhatPCScraperService {
  private readonly config = {
    WEB_URL: 'https://www.anphatpc.com.vn',
    SEARCH_BOX_SELECTOR: '#js-search',
    SEARCH_TARGET: 'laptop',
    PRODUCTS_GRID_SELECTOR:
      'body > section > div > div.product-list-container.bg-white > div.p-list-container.d-flex.flex-wrap > div',
    PAGINATION_SELECTOR:
      'body > section > div > div.product-list-container.bg-white > div.paging',
  };

  constructor(private readonly productsService: ProductsService) {}

  async scrapeWebsite(): Promise<any> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const searchURL = `${this.config.WEB_URL}/tim?scat_id=&q=${this.config.SEARCH_TARGET}`;
    await page.goto(searchURL, { waitUntil: 'domcontentloaded' });
    const totalItems = await this.scrapeAllPages(page);

    await browser.close();
    const result = { url: this.config.WEB_URL, totalItems: totalItems };
    return result;
  }

  private async scrapeAllPages(page: Page): Promise<number> {
    let currentPage = 1;
    let totalItems = 0;
    let maxPages = 23;

    do {
      try {
        const data = await this.extractProductsData(page);
        totalItems += data.length;
        await this.filterAndStoreData(data);

        if (currentPage < maxPages) {
          const nextPage = `${this.config.WEB_URL}/tim?scat_id=&q=${
            this.config.SEARCH_TARGET
          }&page=${currentPage + 1}`;
          await page.goto(nextPage, { waitUntil: 'domcontentloaded' });
          currentPage++;
        } else {
          break;
        }
      } catch (error) {
        console.error(`Error scraping page ${currentPage}:`, error);
        break;
      }
    } while (true);

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
            PRODUCT_NAME_SELECTOR: 'div.p-text > a > h3',
            PRICE_SELECTOR: 'div.p-text > div.price-container > span.p-price',
            DESCRIPTION_SELECTOR:
              'div.p-text > div.box-config > div.product-spec-group.font-300 > div > div > div.txt',
            URL_SELECTOR: 'a',
            IMAGE_SELECTOR: 'a > img',
            BASE_URL: 'https://www.anphatpc.com.vn',
          };

          return elements
            .map((element) => {
              const nameElement = element.querySelector(
                config.PRODUCT_NAME_SELECTOR,
              );
              const RawProductName = nameElement
                ? nameElement.textContent.trim()
                : '';

              if (
                !RawProductName.toLowerCase().includes('laptop') ||
                RawProductName.toLowerCase().includes('ram laptop') ||
                RawProductName.toLowerCase().includes('hdd') ||
                RawProductName.toLowerCase().includes('ssd')
              ) {
                return null;
              }

              const productName = RawProductName.replace(/\(.*?\)/g, '').trim();

              const priceElement = element.querySelector(config.PRICE_SELECTOR);
              const priceText = priceElement
                ? priceElement.textContent.trim()
                : 'Price not available';
              const price = priceText.includes('Price not available')
                ? null
                : priceText.replace(/[^\d]/g, '').toString();

              if (price === null || price === '') {
                return null;
              }
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

              const imageElement = element.querySelector(config.IMAGE_SELECTOR);
              const imageUrl = imageElement
                ? new URL(
                    imageElement.getAttribute('data-src'),
                    config.BASE_URL,
                  ).href
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
