// chart.js
function updatePriceHistoryChart() {
  // Assuming you have a canvas element with the id "priceChart"
  const ctx = document.getElementById('priceChart').getContext('2d');

  // Example data for the chart
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{
      label: 'Price History',
      data: [100, 120, 110, 130, 140],
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1
    }]
  };

  // Create the chart
  const chart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}