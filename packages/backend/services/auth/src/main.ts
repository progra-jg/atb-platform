import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import * as cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.use(cookieParser());
  app.enableCors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  });
  await app.listen(3002);
  console.log("Auth service running on http://localhost:3002");
}
bootstrap();
