function extractProductInfo() {
    let name, price;
  
    // Try different selectors for product name
    const nameSelectors = [
      'h1',
      '[itemprop="name"]',
      '.product-title',
      '#productTitle'
    ];
  
    for (let selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        name = element.textContent.trim();
        break;
      }
    }
  
    // Try different selectors for product price
    const priceSelectors = [
      '.price',
      '[itemprop="price"]',
      '.product-price',
      '#priceblock_ourprice',
      '.a-price-whole'
    ];
  
    for (let selector of priceSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const priceText = element.textContent.trim();
        price = extractNumericPrice(priceText);
        if (price !== null) {
          break;
        }
      }
    }
  
    return { name, price };
  }
  
  function extractNumericPrice(priceText) {
    const regex = /\d+(\.\d+)?/;
    const match = priceText.match(regex);
    if (match) {
      return match[0];
    } else {
      return null;
    }
  }