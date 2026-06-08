import { Injectable, Logger } from "@nestjs/common";

export enum CircuitState {
  CLOSED = "closed",
  OPEN = "open",
  HALF_OPEN = "half_open",
}

interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  halfOpenMaxRequests: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  successThreshold: 2,
  timeoutMs: 30_000,
  halfOpenMaxRequests: 3,
};

interface CircuitData {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  lastStateChange: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitData>();
  private readonly options: CircuitBreakerOptions;

  constructor() {
    this.options = DEFAULT_OPTIONS;
  }

  allowRequest(circuitId: string): boolean {
    const circuit = this.circuits.get(circuitId);
    if (!circuit || circuit.state === CircuitState.CLOSED) return true;

    if (circuit.state === CircuitState.OPEN) {
      const elapsed = Date.now() - circuit.lastStateChange;
      if (elapsed >= this.options.timeoutMs) {
        this.transitionTo(circuitId, CircuitState.HALF_OPEN);
        return true;
      }
      return false;
    }

    return circuit.successCount < this.options.halfOpenMaxRequests;
  }

  onSuccess(circuitId: string): void {
    let circuit = this.circuits.get(circuitId);
    if (!circuit) {
      circuit = this.createCircuit();
      this.circuits.set(circuitId, circuit);
    }

    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.successCount++;
      if (circuit.successCount >= this.options.successThreshold) {
        this.transitionTo(circuitId, CircuitState.CLOSED);
      }
    }

    circuit.failureCount = 0;
  }

  onFailure(circuitId: string): void {
    let circuit = this.circuits.get(circuitId);
    if (!circuit) {
      circuit = this.createCircuit();
      this.circuits.set(circuitId, circuit);
    }

    circuit.failureCount++;
    circuit.lastFailureTime = Date.now();

    if (circuit.state === CircuitState.HALF_OPEN || circuit.failureCount >= this.options.failureThreshold) {
      this.transitionTo(circuitId, CircuitState.OPEN);
    }
  }

  async call<T>(circuitId: string, fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    if (!this.allowRequest(circuitId)) {
      if (fallback) return fallback();
      throw new Error(`Circuit [${circuitId}] is OPEN`);
    }
    try {
      const result = await fn();
      this.onSuccess(circuitId);
      return result;
    } catch (err) {
      this.onFailure(circuitId);
      if (fallback) return fallback();
      throw err;
    }
  }

  getState(circuitId: string): CircuitState {
    return this.circuits.get(circuitId)?.state ?? CircuitState.CLOSED;
  }

  reset(circuitId: string): void {
    this.circuits.delete(circuitId);
  }

  private transitionTo(circuitId: string, newState: CircuitState): void {
    const circuit = this.circuits.get(circuitId);
    if (circuit) {
      this.logger.warn(`Circuit [${circuitId}]: ${circuit.state} → ${newState}`);
      circuit.state = newState;
      circuit.lastStateChange = Date.now();
      circuit.successCount = 0;
    }
  }

  private createCircuit(): CircuitData {
    return {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      lastStateChange: Date.now(),
    };
  }
}
