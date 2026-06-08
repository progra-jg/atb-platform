import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { MarketplaceModule } from "./marketplace.module";

async function bootstrap() {
  const app = await NestFactory.create(MarketplaceModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors();
  await app.listen(3003);
  console.log("Marketplace service running on http://localhost:3003");
}
bootstrap();
