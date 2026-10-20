import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredUser = { id: string; phone: string; createdAt: string };
export type StoredCode = { phone: string; codeHash: string; expiresAt: string; requestedAt: string; attempts: number };
export type StoredSession = { id: string; userId: string; tokenHash: string; expiresAt: string; createdAt: string };
export type ProductId = "platform_consult_session" | "byok_lifetime";
export type PaymentProvider = "wechat" | "alipay";
export type StoredOrder = {
  id: string;
  userId: string;
  productId: ProductId;
  provider: PaymentProvider;
  amountFen: number;
  status: "pending" | "paid" | "cancelled" | "refunded";
  paymentCodeUrl?: string | null;
  paymentExpiresAt?: string | null;
  channelTransactionId?: string | null;
  createdAt: string;
  paidAt: string | null;
};
export type StoredEntitlement = {
  id: string;
  userId: string;
  orderId: string;
  kind: "platform_session" | "byok_lifetime";
  status: "active" | "revoked" | "expired";
  turnsRemaining: number | null;
  expiresAt: string | null;
  createdAt: string;
};

export type StoreData = {
  users: StoredUser[];
  codes: StoredCode[];
  sessions: StoredSession[];
  orders: StoredOrder[];
  entitlements: StoredEntitlement[];
};

const emptyStore = (): StoreData => ({ users: [], codes: [], sessions: [], orders: [], entitlements: [] });
let mutationQueue = Promise.resolve();

function storePath() {
  if (process.env.NODE_ENV === "production" && process.env.DOGCARE_ALLOW_FILE_STORE !== "true") {
    throw new Error("Local JSON account storage is disabled in production. Configure a durable database adapter before deployment.");
  }
  const configured = process.env.DOGCARE_STORE_FILE?.trim();
  if (configured) return path.resolve(configured);
  if (process.env.NODE_ENV === "production") {
    throw new Error("DOGCARE_STORE_FILE is not configured. File storage is only available for explicit development testing.");
  }
  return path.join(process.cwd(), ".data", "dogcare-dev.json");
}

async function loadStore() {
  const file = storePath();
  try {
    return JSON.parse(await readFile(file, "utf8")) as StoreData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return emptyStore();
  }
}

async function persistStore(data: StoreData) {
  const file = storePath();
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(temporary, file);
}

export async function readStore() {
  return loadStore();
}

export async function updateStore<T>(mutator: (data: StoreData) => T | Promise<T>): Promise<T> {
  let resolveResult!: (value: T) => void;
  let rejectResult!: (reason: unknown) => void;
  const result = new Promise<T>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  mutationQueue = mutationQueue.then(async () => {
    try {
      const data = await loadStore();
      const value = await mutator(data);
      await persistStore(data);
      resolveResult(value);
    } catch (error) {
      rejectResult(error);
    }
  });

  await mutationQueue;
  return result;
}
