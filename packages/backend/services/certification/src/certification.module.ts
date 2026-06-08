import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { NestMinioModule } from "nestjs-minio";
import { CertificateController } from "./certificate.controller";
import { CertificateService } from "./certificate.service";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "CERTIFICATION_QUEUE",
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || "amqp://atb:atb_dev@localhost:5672"],
          queue: "certification_queue",
        },
      },
    ]),
    NestMinioModule.register({
      endPoint: process.env.MINIO_ENDPOINT || "localhost",
      port: parseInt(process.env.MINIO_PORT || "9000"),
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || "atb_minio",
      secretKey: process.env.MINIO_SECRET_KEY || "atb_minio_secret",
    }),
  ],
  controllers: [CertificateController],
  providers: [CertificateService],
})
export class CertificationModule {}
