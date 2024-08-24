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

  async scrapeWebsite(): Promise<any> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const searchURL = `${this.config.WEB_URL}/search?q=${this.config.SEARCH_TARGET}`;
    await page.goto(searchURL, { waitUntil: 'domcontentloaded' });
    const totalItems = await this.scrapeAllPages(page);

    await browser.close();
    const result = { url: this.config.WEB_URL, totalItems: totalItems };
    return result;
  }

  private async scrapeAllPages(page: Page): Promise<number> {
    let currentPage = 1;
    let totalItems = 0;

    do {
      try {
        const data = await this.extractProductsData(page);
        totalItems += data.length;
        await this.filterAndStoreData(data);

        const nextPageLink = await page.$(`a[data-page="${currentPage + 1}"]`);
        if (nextPageLink) {
          await nextPageLink.click();
          await page.waitForNavigation({ waitUntil: 'networkidle0' });
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
            PRODUCT_NAME_SELECTOR: 'div.product-detail > strong > a',
            PRICE_SELECTOR:
              'div.product-detail > div.box-pro-prices > p > span',
            DESCRIPTION_SELECTOR:
              'div.product-detail > ul.config-tags > div > li > span',
            URL_SELECTOR: 'div.product-detail > strong > a',
            IMAGE_SELECTOR: 'div.product-img.has-hover > a > img',
            BASE_URL: 'https://xgear.net',
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

              const descriptionPart = description[0].toLowerCase();
              let productName: string;

              if (!RawProductName.toLowerCase().includes(descriptionPart)) {
                productName = RawProductName;
              } else {
                const index =
                  RawProductName.toLowerCase().indexOf(descriptionPart);
                RawProductName.replace(/\(.*?\)/g, '').trim();
                productName = RawProductName.substring(0, index).trim();
              }

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
