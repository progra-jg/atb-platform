import { Controller, Get, Param, Query } from "@nestjs/common";
import { WeatherService } from "../services/weather.service";

@Controller("api/weather")
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get("forecast/:region")
  async getForecast(@Param("region") region: string) {
    return this.weatherService.getForecast(region);
  }

  @Get("history/:region")
  async getHistory(@Param("region") region: string, @Query("days") days?: string) {
    const d = days ? parseInt(days, 10) : 30;
    return this.weatherService.getHistory(region, Math.min(d, 90));
  }

  @Get("alerts/:region")
  async getAlertsByRegion(@Param("region") region: string) {
    return this.weatherService.getAlerts(region);
  }

  @Get("alerts")
  async getAllAlerts() {
    return this.weatherService.getAlerts();
  }

  @Get("advisory/:region/:crop")
  async getAdvisory(@Param("region") region: string, @Param("crop") crop: string) {
    return this.weatherService.getCropAdvisory(region, crop);
  }
}
