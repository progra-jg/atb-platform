import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import * as cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
import * as fs from "fs";
import * as path from "path";
import { AppModule } from "./app.module";

const LOG = path.join(__dirname, "../api-service-error.log");
const logger = new Logger("Bootstrap");

function logError(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(LOG, line); } catch {}
  console.error(line.trim());
}

const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(s => s.trim())
  : ["http://localhost:5173", "http://localhost:5174"];

const isProduction = process.env.NODE_ENV === "production";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: isProduction ? ["error", "warn", "log"] : ["log", "error", "warn", "debug", "verbose"],
  });

  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: isProduction ? undefined : false,
  }));

  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 100 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many requests, please try again later." },
  }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: isProduction,
  }));

  app.use(cookieParser());
  app.enableCors({ origin: CORS_ORIGINS, credentials: true });
  app.enableShutdownHooks();

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === "/health") return next();
    logger.log(`${req.method} ${req.path}`);
    next();
  });

  const port = parseInt(process.env.API_PORT || "4000");
  await app.listen(port);
  logger.log(`API service running on http://localhost:${port} [${isProduction ? "PRODUCTION" : "DEVELOPMENT"}]`);
}

const APP = {
  startTime: Date.now(),
  health: { status: "healthy", uptime: 0 },
};

process.on("unhandledRejection", (reason) => {
  logError(`[UNHANDLED REJECTION] ${reason instanceof Error ? reason.stack : reason}`);
});

process.on("uncaughtException", (error) => {
  logError(`[UNCAUGHT EXCEPTION] ${error.stack || error.message}`);
  APP.health.status = "degraded";
  setTimeout(() => process.exit(1), 1500);
});

bootstrap().catch((err) => {
  logError(`[BOOTSTRAP FAILED] ${err instanceof Error ? err.stack : err}`);
  process.exit(1);
});