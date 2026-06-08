export interface WeatherForecast {
  date: string;
  tempMin: number;
  tempMax: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  solarRadiation: number;
  weatherCode: number;
  weatherLabel: string;
}

export interface RegionForecast {
  region: string;
  source: string;
  forecasts: WeatherForecast[];
}

export interface WeatherAlert {
  region: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface CropAdvisory {
  region: string;
  crop: string;
  source: string;
  advisories: {
    date: string;
    condition: "favorable" | "défavorable";
    details: string;
    avgTemp: number;
    precipitation: number;
    humidity: number;
    windSpeed: number;
  }[];
}

export interface RegionWeather {
  name: string;
  temp: number;
  condition: string;
  humidity: number;
  rain: number;
  risk: string;
  riskLevel: "low" | "moderate" | "high";
  affectedCrops: string[];
  forecast: WeatherForecast[];
  source: string;
}

export type AlertSeverity = "low" | "moderate" | "high" | "extreme";
