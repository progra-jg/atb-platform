import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { HttpModule } from "@nestjs/axios";
import { JwtStrategy } from "./jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { HealthController } from "./controllers/health.controller";
import { AuthController } from "./controllers/auth.controller";
import { DashboardController } from "./controllers/dashboard.controller";
import { FarmersController } from "./controllers/farmers.controller";
import { LotsController } from "./controllers/lots.controller";
import { CertificatesController } from "./controllers/certificates.controller";
import { AlertsController } from "./controllers/alerts.controller";
import { ComplianceController } from "./controllers/compliance.controller";
import { UsersController } from "./controllers/users.controller";
import { OrdersController } from "./controllers/orders.controller";
import { MarketController } from "./controllers/market.controller";
import { NotificationsController } from "./controllers/notifications.controller";
import { ReviewsController } from "./controllers/reviews.controller";
import { MessagesController } from "./controllers/messages.controller";
import { ComplianceCheckController } from "./controllers/compliance-check.controller";
import { PricesController } from "./controllers/prices.controller";
import { UserAlertsController } from "./controllers/user-alerts.controller";
import { FavoritesController } from "./controllers/favorites.controller";
import { SampleRequestsController } from "./controllers/sample-requests.controller";
import { MarketIntelligenceController } from "./controllers/market-intelligence.controller";
import { FrameworkContractsController } from "./controllers/framework-contracts.controller";
import { WeatherController } from "./controllers/weather.controller";
import { DiseaseController } from "./controllers/disease.controller";
import { AIDashboardController } from "./controllers/ai-dashboard.controller";
import { ContactController } from "./controllers/contact.controller";
import { StatusController } from "./controllers/status.controller";
import { VerificationPointsController } from "./controllers/verification-points.controller";
import { NewsletterController } from "./controllers/newsletter.controller";
import { VerificationPoint } from "./entities/verification-point.entity";
import { FinancingOfferEntity } from "./entities/financing-offer.entity";
import { FinancingContractEntity } from "./entities/financing-contract.entity";
import { FinancingRepaymentEntity } from "./entities/financing-repayment.entity";
import { PaymentModule } from "./payment/payment.module";
import { PayoutModule } from "./payout/payout.module";
import { EscrowModule } from "./escrow/escrow.module";
import { FinancingModule } from "./financing/financing.module";
import { PredictionModule } from "./prediction/prediction.module";
import { ApiService } from "./services/api.service";
import { MarketDataSourceService } from "./services/market-data-source.service";
import { SatelliteService } from "./services/satellite.service";
import { WeatherService } from "./services/weather.service";
import { DiseaseService } from "./services/disease.service";
import { AIDashboardService } from "./services/ai-dashboard.service";
import { Farmer } from "./entities/farmer.entity";
import { Buyer } from "./entities/buyer.entity";
import { AdminUser } from "./entities/admin.entity";
import { Parcelle } from "./entities/parcelle.entity";
import { Lot } from "./entities/lot.entity";
import { Certificate } from "./entities/certificate.entity";
import { EudrCompliance } from "./entities/compliance.entity";
import { Notification } from "./entities/notification.entity";
import { Order } from "./entities/order.entity";
import { Product } from "./entities/product.entity";
import { Cooperative } from "./entities/cooperative.entity";
import { AuditLog } from "./entities/audit-log.entity";
import { Transaction } from "./entities/transaction.entity";
import { Review } from "./entities/review.entity";
import { Message } from "./entities/message.entity";
import { PriceRecord } from "./entities/price-record.entity";
import { SampleRequest } from "./entities/sample-request.entity";
import { UserAlert } from "./entities/user-alert.entity";
import { UserFavorite } from "./entities/user-favorite.entity";
import { FrameworkContract } from "./entities/framework-contract.entity";
import { WeatherForecast, WeatherHistory, WeatherAlert, DiseaseRisk, DiseaseReport } from "./entities/weather.entity";
import { PricePrediction, PredictionAccuracy } from "./entities/prediction.entity";

const JWT_SECRET = process.env.JWT_SECRET || "atb_jwt_secret_dev_2024";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USER || "atb",
      password: process.env.DB_PASS || "atb_dev_2024",
      database: process.env.DB_NAME || "atb_agritrace",
      entities: [__dirname + "/entities/*.entity{.ts,.js}"],
      namingStrategy: new SnakeNamingStrategy(),
      synchronize: process.env.DB_SYNCHRONIZE === "true",
      extra: {
        max: 20,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      },
      retryAttempts: 3,
      retryDelay: 3000,
    }),
    TypeOrmModule.forFeature([Farmer, Buyer, AdminUser, Parcelle, Lot, Certificate, EudrCompliance, Notification, Order, Product, Cooperative, AuditLog, Transaction, Review, Message, PriceRecord, UserAlert, UserFavorite, SampleRequest, FrameworkContract, WeatherForecast, WeatherHistory, WeatherAlert, DiseaseRisk, DiseaseReport, PricePrediction, PredictionAccuracy, VerificationPoint, FinancingOfferEntity, FinancingContractEntity, FinancingRepaymentEntity]),
    PaymentModule,
    PayoutModule,
    EscrowModule,
    FinancingModule,
    PredictionModule,
    HttpModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: "24h" } }),
  ],
  controllers: [
    HealthController,
    AuthController,
    DashboardController,
    FarmersController,
    LotsController,
    CertificatesController,
    AlertsController,
    ComplianceController,
    UsersController,
    OrdersController,
    MarketController,
    NotificationsController,
    ComplianceCheckController,
    ReviewsController,
    MessagesController,
    PricesController,
    UserAlertsController,
    FavoritesController,
    SampleRequestsController,
    MarketIntelligenceController,
    FrameworkContractsController,
    WeatherController,
    DiseaseController,
    AIDashboardController,
    ContactController,
    StatusController,
    VerificationPointsController,
    NewsletterController,
  ],
  providers: [ApiService, MarketDataSourceService, JwtStrategy, JwtAuthGuard, RolesGuard, SatelliteService, WeatherService, DiseaseService, AIDashboardService],
})
export class AppModule {}
