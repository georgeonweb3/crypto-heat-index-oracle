const { expose } = require("./sdk");
const axios = require("axios");

const COINGECKO_API = "https://api.coingecko.com/api/v3/coins/";
const WEIGHTS = { priceChange: 0.6, volume: 0.3, trending: 0.1 };
const SENTIMENT_THRESHOLDS = { hot: 80, warm: 60, neutral: 40, cool: 20 };

expose(async ({ payload }) => {
  if (!payload || typeof payload !== "object") {
    return { error: "Invalid payload. Please provide a valid input." };
  }

  const symbol = payload.symbol || "bitcoin";
  try {
    const { data } = await axios.get(`${COINGECKO_API}${symbol}`);
    if (!data.market_data || !data.market_data.current_price?.usd) {
      return { error: `No market data found for ${symbol}.` };
    }

    const priceChange = data.market_data.price_change_percentage_24h || 0;
    const volume = data.market_data.total_volume?.usd || 0;
    const trendingScore = 50; // Fixed for consistency
    const volumeLog = volume > 0 ? Math.min(Math.log(volume), 20) : 0;

    let heatIndex = Math.round(
      Math.abs(priceChange) * WEIGHTS.priceChange +
      volumeLog * WEIGHTS.volume +
      trendingScore * WEIGHTS.trending
    );

    const sentiment =
      heatIndex > SENTIMENT_THRESHOLDS.hot ? "Hot" :
      heatIndex > SENTIMENT_THRESHOLDS.warm ? "Warm" :
      heatIndex > SENTIMENT_THRESHOLDS.neutral ? "Neutral" :
      heatIndex > SENTIMENT_THRESHOLDS.cool ? "Cool" : "Cold";

    return {
      asset: data.name || symbol,
      heatIndex,
      sentiment,
      price: data.market_data.current_price.usd,
      volume,
      change_24h: priceChange,
    };
  } catch (err) {
    console.error("Error fetching data:", err.message);
    if (err.response?.status === 429) {
      return { error: "API rate limit exceeded. Try again later." };
    }
    return { error: `Failed to fetch data for ${symbol}. Check the symbol or try again.` };
  }
});
