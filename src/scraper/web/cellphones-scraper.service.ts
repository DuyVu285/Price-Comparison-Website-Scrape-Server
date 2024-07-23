import { Injectable } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class CellphonesScraperService {
  private readonly config = {
    WEB_URL: 'https://cellphones.com.vn',
    PRODUCTS_GRID_SELECTOR:
      '#productListSearch > div.product-list-filter.is-flex.is-flex-wrap-wrap > div',
    SEARCH_TARGET: 'laptop',
    PRODUCT_NAME_SELECTOR:
      '#productDetailV2 > section > div.box-header.is-flex.is-align-items-center.box-header-desktop > div.box-product-name > h1',
    DESCRIPTION_SELECTOR:
      '#productDetailV2 > section > div.box-header.is-flex.is-align-items-center.box-header-desktop > div.additional-information.mr-2',
    PRICE_SELECTOR:
      '#trade-price-tabs > div > div > div.tpt-box.has-text-centered.is-flex.is-flex-direction-column.is-flex-wrap-wrap.is-justify-content-center.is-align-items-center.active > p.tpt---sale-price',
    PRICE_SELECTOR_2:
      '#productDetailV2 > section > div.box-detail-product.columns.m-0 > div.box-detail-product__box-center.column.bannerTopHead > div.block-box-price > div.box-info__box-price > p.product__price--show',
    IMAGE_SELECTOR: '#v2Gallery > div > img',
    LOAD_MORE_BUTTON_SELECTOR:
      '#productListSearch > div.has-text-centered > button',
    DELAY_TIME: 3000,
  };

  constructor(private readonly productsService: ProductsService) {}

  async scrapeWebsite(): Promise<any> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const searchURL = `${this.config.WEB_URL}/catalogsearch/result?q=${this.config.SEARCH_TARGET}`;
    await page.goto(searchURL, { waitUntil: 'networkidle0' });
    const totalItems = await this.scrapeAllPages(page);

    await browser.close();
    const result = { url: this.config.WEB_URL, totalItems: totalItems };
    return result;
  }

  private async scrapeAllPages(page: Page): Promise<number> {
    await this.loadMoreProducts(page);

    const productLinks = await page.$$eval(
      this.config.PRODUCTS_GRID_SELECTOR,
      (elements) => {
        return elements
          .map((element) => {
            const config = {
              LINK_SELECTOR: 'div.product-info > a',
              BASE_URL: 'https://cellphones.com.vn',
            };
            const urlElement = element
              .querySelector(config.LINK_SELECTOR)
              .getAttribute('href');
            const url = config.BASE_URL + urlElement;
            return url;
          })
          .filter((link) => link !== null);
      },
    );

    console.log(productLinks);

    let totalItems = 0;

    for (const link of productLinks) {
      try {
        const productData = await this.rightClickAndScrapeProduct(page, link);
        if (productData) {
          totalItems++;
        }
      } catch (error) {
        console.error(`Error scraping product at ${link}:`, error);
      }
    }

    return totalItems;
  }

  private async loadMoreProducts(page: Page) {
    let hasNextPage = true;
    let clickCount = 0;
    const maxClicks = 10;

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
  }

  private async rightClickAndScrapeProduct(
    page: Page,
    link: string,
  ): Promise<any> {
    const browser = page.browser();
    const newPagePromise = new Promise<Page>((resolve) =>
      browser.once('targetcreated', (target) => resolve(target.page())),
    );

    await page.evaluate((link) => {
      window.open(link, '_blank');
    }, link);

    const newPage = await newPagePromise;
    try {
      await newPage.waitForNavigation({ waitUntil: 'domcontentloaded' });
      const data = await this.extractProductData(newPage);
      if (data) {
        await this.filterAndStoreData(data);
      }
      return data;
    } catch (error) {
      console.error(`Error extracting data from ${link}:`, error);
      return null;
    } finally {
      await newPage.close();
    }
  }

  private async extractProductData(page: Page) {
    try {
      const productName = await page.$eval(
        this.config.PRODUCT_NAME_SELECTOR,
        (el) => el.textContent.trim(),
      );

      const description = await page.$eval(
        this.config.DESCRIPTION_SELECTOR,
        (el) => {
          const textContent = el.textContent.trim();
          return textContent.split('/').map((part) => part.trim());
        },
      );

      const priceElement = await page
        .$eval(this.config.PRICE_SELECTOR, (el) => el.textContent.trim())
        .catch(
          async () =>
            await page.$eval(this.config.PRICE_SELECTOR_2, (el) =>
              el.textContent.trim(),
            ),
        );
      const price = priceElement.replace(/[^\d]/g, '');

      if (price === null || price === '') {
        return null;
      }
      
      const url = page.url();

      const imageUrl = await page.$eval(this.config.IMAGE_SELECTOR, (el) =>
        el.getAttribute('src'),
      );

      const content = { productName, description, price, url, imageUrl };

      console.log('Product Scraped From Cellphones:', content);
      return content;
    } catch (error) {
      console.error(`Error extracting product data:`, error);
      return null;
    }
  }

  private async filterAndStoreData(data: any): Promise<void> {
    await this.productsService.filterAndStoreProduct(data);
  }
}
