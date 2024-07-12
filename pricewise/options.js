document.addEventListener('DOMContentLoaded', function() {
  const settingsForm = document.getElementById('settingsForm');
  const exportButton = document.getElementById('exportData');
  const importInput = document.getElementById('importData');
  const importButton = document.getElementById('importButton');

  // Load current settings
  chrome.storage.sync.get(['checkFrequency', 'notificationsEnabled'], function(result) {
    document.getElementById('checkFrequency').value = result.checkFrequency || 60;
    document.getElementById('notificationsEnabled').checked = result.notificationsEnabled !== false;
  });

  // Save settings
  settingsForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const checkFrequency = parseInt(document.getElementById('checkFrequency').value);
    const notificationsEnabled = document.getElementById('notificationsEnabled').checked;

    chrome.storage.sync.set({
      checkFrequency: checkFrequency,
      notificationsEnabled: notificationsEnabled
    }, function() {
      alert('Settings saved!');
      chrome.alarms.create('checkPrices', { periodInMinutes: checkFrequency });
    });
  });

  // Export data
  exportButton.addEventListener('click', function() {
    chrome.storage.local.get('products', function(data) {
      const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pricewise_data.json';
      a.click();
    });
  });

  // Import data
  importButton.addEventListener('click', function() {
    const file = importInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = JSON.parse(e.target.result);
          chrome.storage.local.set(data, function() {
            alert('Data imported successfully!');
          });
        } catch (error) {
          alert('Error importing data: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  });
});