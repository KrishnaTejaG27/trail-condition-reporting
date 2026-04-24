import { Router } from 'express';

const router = Router();

/**
 * Get weather data for a location
 * Uses Open-Meteo API (free, no API key required)
 */
router.get('/', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    // Call Open-Meteo API (free, no API key)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

    const response = await fetch(weatherUrl);
    
    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const weatherData = await response.json();

    // Map weather codes to descriptions
    const weatherCodeMap: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };

    // Map weather codes to hazard recommendations
    const getHazardRecommendation = (code: number): string => {
      if (code >= 51 && code <= 65) return 'Caution: Wet trails may be slippery';
      if (code >= 71 && code <= 77) return 'Warning: Snow/ice on trails';
      if (code >= 80 && code <= 82) return 'Caution: Heavy rain, trails may be flooded';
      if (code >= 85 && code <= 86) return 'Warning: Snow showers, poor visibility';
      if (code >= 95) return 'Warning: Thunderstorm, seek shelter';
      if (code >= 45 && code <= 48) return 'Caution: Fog, poor visibility';
      return 'Good conditions for hiking';
    };

    const current = (weatherData as any).current;
    const daily = (weatherData as any).daily;

    res.json({
      success: true,
      data: {
        current: {
          temperature: current.temperature_2m,
          humidity: current.relative_humidity_2m,
          weatherCode: current.weather_code,
          weatherDescription: weatherCodeMap[current.weather_code] || 'Unknown',
          windSpeed: current.wind_speed_10m,
          hazardRecommendation: getHazardRecommendation(current.weather_code)
        },
        forecast: daily.time.slice(0, 7).map((time: string, index: number) => ({
          date: time,
          maxTemp: daily.temperature_2m_max[index],
          minTemp: daily.temperature_2m_min[index],
          weatherCode: daily.weather_code[index],
          weatherDescription: weatherCodeMap[daily.weather_code[index]] || 'Unknown'
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather data'
    });
  }
});

export default router;
