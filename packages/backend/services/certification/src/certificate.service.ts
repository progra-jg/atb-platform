import { Injectable, Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { NestMinioService } from "nestjs-minio";

@Injectable()
export class CertificateService {
  constructor(
    @Inject("CERTIFICATION_QUEUE") private readonly client: ClientProxy,
    private readonly minioService: NestMinioService,
  ) {}

  async generateCertificate(lotId: string, type: "EUDR" | "GlobalGAP") {
    // Request certificate generation from Python service
    const result = await this.client
      .send({ cmd: "generate_certificate" }, { lotId, type })
      .toPromise();

    // Store in MinIO
    const bucket = "certificates";
    const objectName = `${type}/${lotId}_${Date.now()}.pdf`;

    await this.minioService
      .getMinio()
      .putObject(bucket, objectName, result.pdf, result.pdf.length);

    return {
      lotId,
      type,
      url: `/certificates/${objectName}`,
      issuedAt: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };
  }

  async verifyCertificate(certId: string) {
    return {
      id: certId,
      valid: true,
      verifiedAt: new Date(),
    };
  }
}
