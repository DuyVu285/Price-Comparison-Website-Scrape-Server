import { ProductsService } from 'src/products/products.service';
import { Injectable } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';

@Injectable()
export class cellphoneSSearchService {
  private readonly config = {
    WEB_URL: 'https://cellphones.com.vn',
    LINK_SELECTOR:
      '#productListSearch > div.product-list-filter.is-flex.is-flex-wrap-wrap > div:nth-child(1) > div.product-info > a',
    PRODUCT_NAME_SELECTOR:
      '#productDetailV2 > section > div.box-header.is-flex.is-align-items-center.box-header-desktop > div.box-product-name > h1',
    DESCRIPTION_SELECTOR:
      '#productDetailV2 > section > div.box-header.is-flex.is-align-items-center.box-header-desktop > div.additional-information.mr-2',
    PRICE_SELECTOR:
      '#trade-price-tabs > div > div > div.tpt-box.has-text-centered.is-flex.is-flex-direction-column.is-flex-wrap-wrap.is-justify-content-center.is-align-items-center.active > p.tpt---sale-price',
    PRICE_SELECTOR_2:
      '#productDetailV2 > section > div.box-detail-product.columns.m-0 > div.box-detail-product__box-center.column.bannerTopHead > div.block-box-price > div.box-info__box-price > p.product__price--show',
  };
  constructor(private readonly productsService: ProductsService) {}

  async scrapeWebsite(searchQuery: string) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    const searchURL = `${this.config.WEB_URL}/catalogsearch/result?q=${searchQuery}`;
    await page.goto(searchURL, { waitUntil: 'networkidle0' });
    await page.click(this.config.LINK_SELECTOR);
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
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
    const productName = await page.$eval(
      this.config.PRODUCT_NAME_SELECTOR,
      (el) => el.textContent,
    );

    const description = await page.$eval(
      this.config.DESCRIPTION_SELECTOR,
      (el) => el.textContent.trim(),
    );

    const priceElement = await page
      .$eval(this.config.PRICE_SELECTOR, (el) => el.textContent.trim())
      .catch(async () => {
        return await page.$eval(this.config.PRICE_SELECTOR_2, (el) =>
          el.textContent.trim(),
        );
      });

    const price = priceElement.replace(/[^\d]/g, '');
    const url = page.url();
    const content = {
      productName,
      description,
      price,
      url,
    };
    console.log('Product Scraped From CellphoneS: ', content);
    return content;
  }
}
