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

  async scrapeWebsite(): Promise<any> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const searchURL = `${this.config.WEB_URL}/search?q=${this.config.SEARCH_TARGET}`;

    try {
      await page.goto(searchURL, { waitUntil: 'domcontentloaded' });
      const totalItems = await this.scrapeAllPages(page);
      return { url: this.config.WEB_URL, totalItems: totalItems };
    } finally {
      await browser.close();
    }
  }

  private async scrapeAllPages(page: Page): Promise<number> {
    let hasNextPage = true;
    let clickCount = 0;
    const maxClicks = 40;
    let totalItems = 0;

    while (hasNextPage && clickCount < maxClicks) {
      try {
        const loadMoreButton = await page.waitForSelector(
          this.config.LOAD_MORE_BUTTON_SELECTOR,
          { timeout: 5000 },
        );
        if (loadMoreButton) {
          await loadMoreButton.click();
          clickCount++;
          console.log('Click count:', clickCount);
          await page.waitForTimeout(this.config.DELAY_TIME);
        } else {
          hasNextPage = false;
        }
      } catch (error) {
        console.error('Error during load more:', error);
        break; // Exit loop if there's an issue
      }
    }

    try {
      const data = await this.extractProductsData(page);
      totalItems = data.length;
      await this.filterAndStoreData(data);
    } catch (error) {
      console.error('Error scraping all pages:', error);
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
            PRODUCT_NAME_SELECTOR: 'div.proloop-detail > h3 > a',
            PRICE_SELECTOR:
              'div.proloop-detail > div.proloop-price > div.proloop-price--default > span.proloop-price--highlight',
            DESCRIPTION_SELECTOR:
              'div.proloop-detail > div.proloop-technical > div > span',
            URL_SELECTOR: 'div.proloop-detail > h3 > a',
            IMAGE_SELECTOR: 'div.proloop-img > a > picture > img',
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
                : priceText.replace(/[^\d]/g, '');

                if (price === null || price === '') {
                  return null;
                }

              const descriptionElements = Array.from(
                element.querySelectorAll(config.DESCRIPTION_SELECTOR),
              );
              const description = descriptionElements.map((descElement) =>
                descElement.textContent.trim(),
              );

              const urlElement = element.querySelector(config.URL_SELECTOR);
              const url = urlElement
                ? config.BASE_URL + urlElement.getAttribute('href')
                : '';

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
