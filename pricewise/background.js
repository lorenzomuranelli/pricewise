chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({products: []});
  chrome.storage.sync.set({
    checkFrequency: 60,
    notificationsEnabled: true
  });
  chrome.alarms.create('checkPrices', { periodInMinutes: 60 });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "addProduct") {
    addProduct(request.url, sendResponse);
    return true; // Indicates we will send a response asynchronously
  } else if (request.action === "removeProduct") {
    removeProduct(request.url, sendResponse);
    return true;
  }
});

function addProduct(url, sendResponse) {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: "getProductInfo"}, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({error: "Could not communicate with the page."});
        return;
      }
      if (response && response.productInfo) {
        chrome.storage.local.get('products', (data) => {
          const products = data.products || [];
          const existingProductIndex = products.findIndex(p => p.url === url);
          const newProduct = {
            url: url,
            name: response.productInfo.name,
            currentPrice: response.productInfo.price,
            lowestPrice: response.productInfo.price,
            dateAdded: new Date().toISOString(),
            priceHistory: [{
              date: new Date().toISOString(),
              price: response.productInfo.price
            }]
          };
          
          if (existingProductIndex !== -1) {
            products[existingProductIndex] = newProduct;
          } else {
            products.push(newProduct);
          }
          
          chrome.storage.local.set({products}, () => {
            if (chrome.runtime.lastError) {
              sendResponse({error: "Could not save product."});
            } else {
              sendResponse({success: true});
            }
          });
        });
      } else {
        sendResponse({error: "Could not extract product info."});
      }
    });
  });
}

function removeProduct(url, sendResponse) {
  chrome.storage.local.get('products', (data) => {
    const products = data.products.filter(product => product.url !== url);
    chrome.storage.local.set({products}, () => {
      if (chrome.runtime.lastError) {
        sendResponse({error: "Could not remove product."});
      } else {
        sendResponse({success: true});
      }
    });
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkPrices') {
    checkPrices();
  }
});

function checkPrices() {
  chrome.storage.sync.get('notificationsEnabled', function(settings) {
    chrome.storage.local.get('products', (data) => {
      const products = data.products || [];
      const updatedProducts = products.map(product => {
        return fetch(product.url)
          .then(response => response.text())
          .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const priceElement = doc.querySelector('.price, [itemprop="price"], .product-price, #priceblock_ourprice, .a-price-whole');
            if (priceElement) {
              const newPrice = priceElement.textContent.trim().replace(/[^\d.,]/g, '');
              if (newPrice !== product.currentPrice) {
                product.currentPrice = newPrice;
                product.priceHistory.push({
                  date: new Date().toISOString(),
                  price: newPrice
                });
                if (parseFloat(newPrice) < parseFloat(product.lowestPrice)) {
                  product.lowestPrice = newPrice;
                  if (settings.notificationsEnabled) {
                    notifyPriceDrop(product);
                  }
                }
              }
            }
            return product;
          })
          .catch(error => {
            console.error('Error checking price:', error);
            return product;
          });
      });

      Promise.all(updatedProducts).then(results => {
        chrome.storage.local.set({products: results});
      });
    });
  });
}

function notifyPriceDrop(product) {
  chrome.notifications.create('', {
    type: 'basic',
    iconUrl: 'images/icon128.png',
    title: 'Price Drop Alert!',
    message: `${product.name} is now ${product.currentPrice}!`
  });
}

chrome.storage.sync.get('checkFrequency', function(result) {
  chrome.alarms.create('checkPrices', { periodInMinutes: result.checkFrequency || 60 });
});