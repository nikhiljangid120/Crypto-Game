const axios = require('axios');

let currentPrices = { BTC: 0, ETH: 0 };

const fetchPrices = async () => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
    currentPrices.BTC = response.data.bitcoin.usd;
    currentPrices.ETH = response.data.ethereum.usd;
    console.log('Updated prices:', currentPrices);
  } catch (error) {
    console.error('Error fetching crypto prices:', error.message);
  }
};

// Fetch prices every 10 seconds
setInterval(fetchPrices, 10000);
// Initial fetch
fetchPrices();

module.exports = { getCurrentPrice: (currency) => currentPrices[currency] };