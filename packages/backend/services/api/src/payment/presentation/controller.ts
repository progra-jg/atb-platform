import { Controller, Get, Post, Param, Body, Query, Headers, Logger, Res } from "@nestjs/common";
import { Response } from "express";
import { InitiatePaymentUseCase, HandleWebhookUseCase, VerifyBankTransferUseCase, CheckPaymentStatusUseCase, GetPaymentStatsUseCase } from "../application/usecases";
import { PaymentRepository, PaymentFilter } from "../infrastructure/repository";
import { PaymentProviderRegistry } from "../infrastructure/providers";
import { PaymentMethodFactory } from "../domain/methods";
import { InvoiceService } from "../infrastructure/invoice.service";
import { InitiatePaymentDto, PaymentFilterDto, VerifyPaymentDto } from "./dto";

@Controller("api")
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly initiatePayment: InitiatePaymentUseCase,
    private readonly handleWebhook: HandleWebhookUseCase,
    private readonly verifyTransfer: VerifyBankTransferUseCase,
    private readonly checkStatus: CheckPaymentStatusUseCase,
    private readonly getStats: GetPaymentStatsUseCase,
    private readonly repo: PaymentRepository,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Get("payment/methods")
  getMethods(@Query("lang") lang?: string) {
    return { success: true, data: PaymentMethodFactory.getMethods(lang || "fr") };
  }

  @Post("payment/initiate")
  async initiate(@Body() dto: InitiatePaymentDto) {
    this.logger.log(`Initiate payment: order=${dto.orderId}, method=${dto.method}, provider=${dto.provider}, amount=${dto.amount}`);
    return this.initiatePayment.execute({
      orderId: dto.orderId,
      contractId: dto.contractId,
      buyerId: dto.buyerId,
      producteurId: dto.producteurId,
      amount: dto.amount,
      currency: dto.currency,
      method: dto.method,
      provider: dto.provider,
      idempotencyKey: dto.idempotencyKey,
      phone: dto.phone,
    });
  }

  @Post("payment/webhook/:provider")
  async webhook(
    @Param("provider") provider: string,
    @Body() payload: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
  ) {
    this.logger.log(`Webhook received from ${provider}: event=${(payload as any).event_type || (payload as any).status || "unknown"}`);
    const result = await this.handleWebhook.execute(provider, payload, headers);
    return result;
  }

  @Get("payment/:id")
  async getPayment(@Param("id") id: string) {
    const payment = await this.repo.findById(id);
    return { success: true, data: this.toResponse(payment) };
  }

  @Get("payments")
  async listPayments(@Query() filter: PaymentFilterDto) {
    const payments = await this.repo.findWithFilter(filter as PaymentFilter);
    return { success: true, data: payments.map(p => this.toResponse(p)) };
  }

  @Get("payment/stats")
  async stats() {
    return this.getStats.execute();
  }

  @Post("payment/:id/verify")
  async verify(@Param("id") id: string, @Body() dto: VerifyPaymentDto) {
    return this.verifyTransfer.execute(id, dto.adminId);
  }

  @Post("payment/:id/check-status")
  async checkPaymentStatus(@Param("id") id: string) {
    return this.checkStatus.execute(id);
  }

  @Post("payment/:id/invoice")
  async invoice(@Param("id") id: string) {
    const payment = await this.repo.findById(id);
    return {
      success: true,
      data: {
        invoiceNumber: payment.invoiceNumber || `INV-${Date.now()}`,
        date: payment.createdAt.toISOString().split("T")[0],
        buyerId: payment.buyerId,
        orderId: payment.orderId,
        amount: parseFloat(payment.amount as any),
        currency: payment.currency,
        bankDetails: PaymentMethodFactory.getBankDetails(),
        notes: "Veuillez utiliser le numéro de facture comme référence de virement.",
      },
    };
  }

  @Post("payment/:id/crypto")
  async cryptoAddress(@Param("id") id: string) {
    const payment = await this.repo.findById(id);
    const wallets = PaymentMethodFactory.getCryptoWallets();
    const wallet = wallets[payment.provider];
    if (!wallet) throw new Error("Provider not supported");
    return {
      success: true,
      data: {
        address: wallet.address,
        network: wallet.network,
        memo: `ATB-${payment.id.slice(0, 12)}`,
        amount: parseFloat(payment.amount as any),
        currency: payment.provider === "usdt_trc20" ? "USDT" : "USDC",
        qrCode: payment.qrCode,
      },
    };
  }

  @Get("payment/:id/crypto/check")
  async cryptoCheck(@Param("id") id: string) {
    const payment = await this.repo.findById(id);
    const received = payment.status === "completed";
    return {
      success: true,
      data: {
        received,
        confirmations: received ? 12 : 0,
        txHash: payment.providerRef || null,
        status: payment.status,
      },
    };
  }

  @Post("payment/:id/invoice/download")
  async downloadInvoice(@Param("id") id: string, @Query("lang") lang: string, @Res() res: Response) {
    const payment = await this.repo.findById(id);
    if (!payment) throw new Error("Payment not found");

    const langCode = lang === "en" ? "en" : "fr";
    const buyerName = payment.buyerId || "Client";
    const buyerEmail = payment.buyerId || "";
    const invoiceNumber = this.invoiceService.generateInvoiceNumber();
    const amount = parseFloat(payment.amount as any);
    const items = [{ name: "Produit agricole", quantity: 1, price: amount, unit: "kg" }];

    const pdf = await this.invoiceService.generatePDF({
      invoiceNumber,
      orderId: payment.orderId,
      paymentId: payment.id,
      buyerName,
      buyerEmail,
      buyerIfu: "",
      buyerAddress: "",
      items: items,
      amount: amount,
      currency: payment.currency,
      method: payment.method,
      provider: payment.provider,
      paidAt: payment.paidAt || payment.createdAt,
      transactionId: payment.id,
      lang: langCode as any,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="facture-${invoiceNumber}.pdf"`,
      "Content-Length": pdf.length,
    });
    res.send(pdf);
  }

  @Get("payment/invoice/verify/:invoiceNumber")
  async verifyInvoice(@Param("invoiceNumber") invoiceNumber: string, @Query("sig") signature: string) {
    const valid = this.invoiceService.verifySignature(invoiceNumber, signature);
    return {
      success: valid,
      data: {
        invoice: invoiceNumber,
        valid,
        issuedBy: "ATB AgriTrace Bénin",
        verifiedAt: new Date().toISOString(),
      },
    };
  }

  private toResponse(p: any) {
    return {
      id: p.id, orderId: p.orderId, contractId: p.contractId,
      buyerId: p.buyerId, producteurId: p.producteurId,
      amount: parseFloat(p.amount as any), currency: p.currency,
      method: p.method, provider: p.provider,
      providerRef: p.providerRef, status: p.status,
      statusMessage: p.statusMessage,
      paidAt: p.paidAt?.toISOString() || null,
      paymentUrl: p.paymentUrl, qrCode: p.qrCode,
      invoiceNumber: p.invoiceNumber,
      verifiedByAdmin: p.verifiedByAdmin,
      notes: p.notes,
      createdAt: p.createdAt?.toISOString(),
      updatedAt: p.updatedAt?.toISOString(),
    };
  }
}
