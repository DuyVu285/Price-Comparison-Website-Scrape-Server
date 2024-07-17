import { ProductsService } from 'src/products/products.service';
import { Injectable } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';

@Injectable()
export class GearvnScraperService {
  private readonly config = {
    WEB_URL: 'https://gearvn.com',
    SEARCH_BOX_SELECTOR: '#inputSearchAuto',
    SEARCH_TARGET: 'laptop',
    PRODUCTS_GRID_SELECTOR:
      '#search > div.listProduct-row.results > div.search-list-results.ajax-render > div',
    LOAD_MORE_BUTTON_SELECTOR: '#load_more_search',
    DELAY_TIME: 2000,
  };

  constructor(private readonly productsService: ProductsService) {}

  async scrapeWebsite() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const searchURL = `${this.config.WEB_URL}/search?q=${this.config.SEARCH_TARGET}`;
    await page.goto(searchURL, { waitUntil: 'domcontentloaded' });
    const data = await this.scrapeAllPages(page);

    await browser.close();
    return data;
  }

  private async scrapeAllPages(page: Page): Promise<void> {
    let hasNextPage = true;
    let clickCount = 0;
    const maxClicks = 40;

    while (hasNextPage && clickCount < maxClicks) {
      const loadMoreButton = await page.$(
        this.config.LOAD_MORE_BUTTON_SELECTOR,
      );
      if (loadMoreButton) {
        await loadMoreButton.click();
        clickCount++;
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.DELAY_TIME),
        );
      } else {
        hasNextPage = false;
      }
    }
    const data = await this.extractProductsData(page);
    await this.filterAndStoreData(data);
  }

  private async filterAndStoreData(data: any): Promise<void> {
    for (const product of data) {
      await this.productsService.filterAndStoreProduct(product);
    }
  }

  private async extractProductsData(page: Page) {
    const productsGridContent = await page.$$eval(
      this.config.PRODUCTS_GRID_SELECTOR,
      (elements) => {
        const config = {
          PRODUCT_NAME_SELECTOR: 'div.proloop-detail > h3 > a',
          PRICE_SELECTOR:
            'div.proloop-detail > div.proloop-price > div.proloop-price--default > span.proloop-price--highlight',
          DESCRIPTION_SELECTOR:
            'div.proloop-detail > div.proloop-technical > div',
          URL_SELECTOR: 'div.proloop-detail > h3 > a',
          BASE_URL: 'https://gearvn.com',
        };

        return elements
          .map((element) => {
            const nameElement = element.querySelector(
              config.PRODUCT_NAME_SELECTOR,
            );
            const productName = nameElement
              ? nameElement.textContent.trim()
              : '';

            if (
              !productName.toLowerCase().includes('laptop') ||
              productName.toLowerCase().includes('ram laptop')
            ) {
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
          })
          .filter((product) => product !== null);
      },
    );
    return productsGridContent;
  }
}
