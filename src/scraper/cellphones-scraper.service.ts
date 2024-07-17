import { Injectable } from '@nestjs/common';
import puppeteer, { ElementHandle, Page } from 'puppeteer';
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
    LOAD_MORE_BUTTON_SELECTOR:
      '#productListSearch > div.has-text-centered > button',
    DELAY_TIME: 3000,
  };

  constructor(private readonly productsService: ProductsService) {}

  async scrapeWebsite() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const searchURL = `${this.config.WEB_URL}/catalogsearch/result?q=${this.config.SEARCH_TARGET}`;
    await page.goto(searchURL, { waitUntil: 'networkidle0' });
    await this.scrapeAllPages(page);

    await browser.close();
  }

  private async scrapeAllPages(page: Page): Promise<void> {
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

    for (const link of productLinks) {
      await this.rightClickAndScrapeProduct(page, link);
    }
  }

  private async loadMoreProducts(page: Page) {
    let hasNextPage = true;
    let clickCount = 0;
    const maxClicks = 8;

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
  ): Promise<void> {
    const browser = page.browser();
    const newPagePromise = new Promise<Page>((resolve) =>
      browser.once('targetcreated', (target) => resolve(target.page())),
    );

    await page.evaluate((link) => {
      window.open(link, '_blank');
    }, link);

    const newPage = await newPagePromise;
    await newPage.waitForNavigation({ waitUntil: 'domcontentloaded' });

    const data = await this.extractProductData(newPage);
    await this.filterAndStoreData(data);

    await newPage.close();
  }

  private async extractProductData(page: Page) {
    const productName = await page.$eval(
      this.config.PRODUCT_NAME_SELECTOR,
      (el) => el.textContent.trim(),
    );
    const description = await page.$eval(
      this.config.DESCRIPTION_SELECTOR,
      (el) => el.textContent.trim(),
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
    const url = page.url();
    const content = { productName, description, price, url };

    console.log('Product Scraped From CellphoneS:', content);
    return content;
  }

  private async filterAndStoreData(data: any): Promise<void> {
    await this.productsService.filterAndStoreProduct(data);
  }
}
