import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ParcelleModule } from "./parcelle.module";

async function bootstrap() {
  const app = await NestFactory.create(ParcelleModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors();
  await app.listen(3001);
  console.log("Parcelle service running on http://localhost:3001");
}
bootstrap();
