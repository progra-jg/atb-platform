import { NestFactory } from "@nestjs/core";
import { CertificationModule } from "./certification.module";

async function bootstrap() {
  const app = await NestFactory.create(CertificationModule);
  app.enableCors();
  await app.listen(3002);
  console.log("Certification service running on http://localhost:3002");
}
bootstrap();
