import { ProductsService } from 'src/products/products.service';
import { Injectable } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';

@Injectable()
export class XgearScraperService {
  private readonly config = {
    WEB_URL: 'https://xgear.net',
    SEARCH_BOX_SELECTOR:
      '#site-header-center > div > div > div.col-md-4.col-xs-7.col-sm-6.pd-right-0 > div > form > div > input',
    SEARCH_TARGET: 'laptop',
    PRODUCTS_GRID_SELECTOR: '#search > div.results > div > div',
    PAGINATION_SELECTOR: '#pagination',
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
    let currentPage = 1;

    do {
      const data = await this.extractProductsData(page);
      await this.filterAndStoreData(data);

      const nextPageLink = await page.$(`a[data-page="${currentPage + 1}"]`);
      if (nextPageLink) {
        await nextPageLink.click();
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        currentPage++;
      } else {
        break;
      }
    } while (true);
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
          PRODUCT_NAME_SELECTOR: 'div.product-detail > strong > a',
          PRICE_SELECTOR: 'div.product-detail > div.box-pro-prices > p > span',
          DESCRIPTION_SELECTOR:
            'div.product-detail > ul.config-tags > li > span',
          URL_SELECTOR: 'div.product-detail > strong > a',
          BASE_URL: 'https://xgear.net',
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
