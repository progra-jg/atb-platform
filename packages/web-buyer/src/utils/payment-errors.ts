import i18n from "../i18n";

export interface PaymentErrorContext {
  method: string | null;
  provider: string | null;
  attempts?: number;
}

export interface PaymentErrorMessage {
  title: string;
  description: string;
  reassurance: string;
  action?: string;
}

function msg(key: string): string {
  return i18n.t(key);
}

interface ErrorPattern {
  match: RegExp;
  getMessage: (ctx: PaymentErrorContext) => PaymentErrorMessage;
}

const ERROR_PATTERNS: ErrorPattern[] = [
  {
    match: /insufficient|solde|balance/i,
    getMessage: (ctx) => ({
      title: msg("payment.errorInsufficientTitle"),
      description: ctx.method === "mobile_money"
        ? msg("payment.errorInsufficientMoMo")
        : msg("payment.errorInsufficientCard"),
      reassurance: msg("payment.errorNoDebit"),
    }),
  },
  {
    match: /declined|refused|refus|denied/i,
    getMessage: (ctx) => ({
      title: msg("payment.errorDeclinedTitle"),
      description: ctx.method === "card"
        ? msg("payment.errorDeclinedCard")
        : msg("payment.errorDeclinedGeneric"),
      reassurance: msg("payment.errorNoDebit"),
      action: ctx.method === "card" ? msg("payment.errorDeclinedAction") : undefined,
    }),
  },
  {
    match: /expired|timeout/i,
    getMessage: () => ({
      title: msg("payment.errorExpiredTitle"),
      description: msg("payment.errorExpiredDesc"),
      reassurance: msg("payment.errorNoDebit"),
      action: msg("payment.errorExpiredAction"),
    }),
  },
  {
    match: /network|connexion|connection|unreachable/i,
    getMessage: () => ({
      title: msg("payment.errorNetworkTitle"),
      description: msg("payment.errorNetworkDesc"),
      reassurance: msg("payment.errorNoDebit"),
      action: msg("payment.errorNetworkAction"),
    }),
  },
  {
    match: /limit|limite|plafond/i,
    getMessage: () => ({
      title: msg("payment.errorLimitTitle"),
      description: msg("payment.errorLimitDesc"),
      reassurance: msg("payment.errorNoDebit"),
      action: msg("payment.errorLimitAction"),
    }),
  },
  {
    match: /invalid_pin|wrong_pin|mauvais.*pin/i,
    getMessage: () => ({
      title: msg("payment.errorPinTitle"),
      description: msg("payment.errorPinDesc"),
      reassurance: msg("payment.errorNoDebit"),
      action: msg("payment.errorPinAction"),
    }),
  },
  {
    match: /3ds|3d.?secure|authentication.*failed/i,
    getMessage: () => ({
      title: msg("payment.error3dsTitle"),
      description: msg("payment.error3dsDesc"),
      reassurance: msg("payment.errorNoDebit"),
      action: msg("payment.error3dsAction"),
    }),
  },
];

function getFallback(): PaymentErrorMessage {
  return {
    title: msg("payment.errorFallbackTitle"),
    description: msg("payment.errorFallbackDesc"),
    reassurance: msg("payment.errorNoDebit"),
    action: msg("payment.errorFallbackAction"),
  };
}

export function parsePaymentError(errorMessage: string, context: PaymentErrorContext): PaymentErrorMessage {
  for (const { match, getMessage } of ERROR_PATTERNS) {
    if (match.test(errorMessage)) {
      return getMessage(context);
    }
  }
  return getFallback();
}
