import { createLocalWallet } from "@faremeter/wallet-evm";
import { createPaymentHandler } from "@faremeter/payment-evm/exact";
import { wrap as wrapFetch } from "@faremeter/fetch";
import { skaleBaseSepoliaTestnetV1 } from "./custom-chain";
import "dotenv/config";

const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY environment variable is required");
}

const wallet = await createLocalWallet(skaleBaseSepoliaTestnetV1, PRIVATE_KEY);

const fetchWithPayment = wrapFetch(fetch, {
  handlers: [
    createPaymentHandler(wallet, {
      asset: {
        address: (process.env.PAYMENT_TOKEN_ADRRESS as `0x${string}`) || "",
        contractName: process.env.PAYMENT_TOKEN_NAME as string || "",
      },
    }),
  ],
});

const BASE_URL = process.env.SELLER_BASE_URL || "http://localhost:3000";

type BigNumberish = bigint | number | string;

export interface BaseRandomResponse {
  network: string;
  contractAddress: string;
  rpcUrl: string;
  randomValue: string;
}

export interface RandomWordResponse extends BaseRandomResponse {
  wordLength: string;
}

function normalizeBigNumberish(value: BigNumberish, label: string): string {
  if (typeof value === "bigint") {
    if (value < 0n) {
      throw new TypeError(`${label} must be non-negative`);
    }
    return value.toString();
  }

  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 0) {
      throw new TypeError(`${label} must be a non-negative integer`);
    }
    return value.toString();
  }

  if (typeof value === "string") {
    if (!/^\d+$/.test(value)) {
      throw new TypeError(`${label} must be a numeric string`);
    }
    return value;
  }

  throw new TypeError(`${label} must be a bigint, number, or numeric string`);
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const bodyText = await response.text();
    if (!bodyText) {
      return `${response.status} ${response.statusText}`;
    }

    try {
      const parsed = JSON.parse(bodyText);
      if (typeof parsed?.error === "string" && parsed.error.trim().length > 0) {
        return parsed.error;
      }
      return bodyText;
    } catch {
      return bodyText;
    }
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

async function postWithPayment<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetchWithPayment(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    const error = new Error(message);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("text/event-stream")) {
    const text = await response.text();
    const parsed = parseEventStreamPayload<T>(text);
    if (parsed !== null) {
      return parsed;
    }
    throw new Error("Unexpected response format from payment stream");
  }

  return response.json() as Promise<T>;
}

export async function getRandomWord(wordLength: BigNumberish): Promise<RandomWordResponse> {
  const normalized = normalizeBigNumberish(wordLength, "wordLength");
  const numeric = BigInt(normalized);

  if (numeric < 3n || numeric > 8n) {
    throw new TypeError("wordLength must be between 3 and 8");
  }

  const payload = { wordLength: normalized };
  return postWithPayment("/tools/skale-rng/random-word", payload);
}

if (import.meta.main) {
  try {
    const result = await getRandomWord(5n);
    console.log("Random word response:", result);
  } catch (error) {
    console.error("Failed to fetch random word:", error);
    process.exitCode = 1;
  }
}

function parseEventStreamPayload<T>(raw: string): T | null {
  const lines = raw.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (!line.startsWith("data:")) {
      continue;
    }

    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") {
      continue;
    }

    try {
      return JSON.parse(payload) as T;
    } catch {
      continue;
    }
  }

  return null;
}
