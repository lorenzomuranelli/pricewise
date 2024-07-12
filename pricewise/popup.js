document.addEventListener('DOMContentLoaded', function() {
    const addButton = document.getElementById('addProduct');
    const productInfo = document.getElementById('productInfo');
    const productList = document.getElementById('productList');
    const priceChart = document.getElementById('priceChart');
    let chart;
  
    function showLoading(element) {
      element.innerHTML = '<p class="loading">Loading...</p>';
    }
  
    function showError(element, message) {
      element.innerHTML = `<p class="error">${message}</p>`;
    }
  
    function getDealRating(currentPrice, lowestPrice) {
      const difference = (currentPrice - lowestPrice) / lowestPrice;
      if (difference <= 0.05) return 'excellent';
      if (difference <= 0.1) return 'good';
      return 'fair';
    }
  
    function updatePriceHistoryChart(product) {
      if (chart) {
        chart.destroy();
      }
      
      const priceHistory = product.priceHistory || [];
      const labels = priceHistory.map(entry => new Date(entry.date).toLocaleDateString());
      const prices = priceHistory.map(entry => parseFloat(entry.price));
  
      chart = new Chart(priceChart, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Price History',
            data: prices,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: false
            }
          }
        }
      });
    }
  
    // Display current page product info
    showLoading(productInfo);
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "getProductInfo"}, function(response) {
        if (chrome.runtime.lastError) {
          showError(productInfo, "Error: Could not communicate with the page.");
          return;
        }
        if (response && response.productInfo) {
          productInfo.innerHTML = `
            <p>Name: ${response.productInfo.name}</p>
            <p>Price: ${response.productInfo.price}</p>
            <p>Website: ${new URL(tabs[0].url).hostname}</p>
          `;
        } else {
          productInfo.innerHTML = "<p>No product detected on this page.</p>";
        }
      });
    });
  
    // Add product to tracking
    addButton.addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.runtime.sendMessage({
          action: "addProduct",
          product: {
            url: tabs[0].url,
            name: productInfo.querySelector('p:nth-child(1)').textContent.split(': ')[1],
            currentPrice: productInfo.querySelector('p:nth-child(2)').textContent.split(': ')[1],
            lowestPrice: productInfo.querySelector('p:nth-child(2)').textContent.split(': ')[1],
            priceHistory: []
          }
        }, function(response) {
          if (chrome.runtime.lastError) {
            showError(productList, "Error: Could not add product.");
          } else {
            displayTrackedProducts();
          }
        });
      });
    });
  
    // Display tracked products
    function displayTrackedProducts() {
      showLoading(productList);
      chrome.storage.local.get('products', function(data) {
        const products = data.products || [];
        if (products.length === 0) {
          productList.innerHTML = '<p>No products tracked yet.</p>';
          return;
        }
        productList.innerHTML = '';
        products.forEach(function(product) {
          const dealRating = getDealRating(parseFloat(product.currentPrice), parseFloat(product.lowestPrice));
          const li = document.createElement('li');
          li.innerHTML = `
            <p>Name: ${product.name}</p>
            <p>Current Price: ${product.currentPrice}</p>
            <p>Lowest Price: ${product.lowestPrice}</p>
            <p class="deal-rating deal-${dealRating}">Deal Rating: ${dealRating.charAt(0).toUpperCase() + dealRating.slice(1)}</p>
            <button class="removeProduct" data-url="${product.url}">Remove</button>
          `;
          productList.appendChild(li);
        });
  
        // Add event listeners to remove buttons
        document.querySelectorAll('.removeProduct').forEach(button => {
          button.addEventListener('click', function() {
            chrome.runtime.sendMessage({
              action: "removeProduct",
              url: this.getAttribute('data-url')
            }, function(response) {
              if (chrome.runtime.lastError) {
                showError(productList, "Error: Could not remove product.");
              } else {
                displayTrackedProducts();
              }
            });
          });
        });
  
        // Update price history chart
        updatePriceHistoryChart(products[0]);
      });
    }
  
    displayTrackedProducts();
  
    // Listen for changes in tracked products
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (namespace === 'local' && changes.products) {
        displayTrackedProducts();
      }
    });
  });