import { Hono } from 'hono';
import { createMiddleware } from "@faremeter/middleware/hono";
import 'dotenv/config'
import { randomWordContract, RECEIVING_ADDRESS ,SKALE_RANDOM_CONTRACT_ADDRESS, SKALE_RPC_URL, FACILITATOR_URL,TOKEN_PAYMENT_ADDRESS,NETWORK_CHAIN_ID } from "./config.js";

const app = new Hono();
const CONTRACT_ADDRESS = SKALE_RANDOM_CONTRACT_ADDRESS;

if (!RECEIVING_ADDRESS) {
  throw new Error("RECEIVING_ADDRESS environment variable is required");
}

// Free health check endpoint
app.get("/health", (c) => c.json({ status: "healthy" }));

// Free info endpoint
app.get("/info", (c) => c.json({
  name: "Simple SKALE RNG",
  description: "Paid SKALE RNG service on SKALE Base Sepolia testnet",
  endpoints: ["/tools/skale-rng/random-value-range"]
}));

// Create payment middleware for SKALE Base Sepolia testnet
const skaleMiddleware = await createMiddleware({
  facilitatorURL: FACILITATOR_URL,
  accepts: [
    {
      scheme: "exact",
      network: "eip155:" + NETWORK_CHAIN_ID,
      maxAmountRequired: "10000", // 0.00001 Axios USD
      maxTimeoutSeconds: 5000,
      payTo: RECEIVING_ADDRESS,
      asset: TOKEN_PAYMENT_ADDRESS, 
      description: "skale random word",
      mimeType: "application/json"
    }
  ]
});


app.post("/tools/skale-rng/random-word", skaleMiddleware, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const wordLength = body?.wordLength ?? 5;

    if (!isValidNumericInput(wordLength)) {
      return c.json({ error: "nextIndex and max must be non-negative integers" }, 400);
    }

    const wordLengthVal = BigInt(wordLength);

    if (wordLengthVal < 3n || wordLengthVal > 8n) {
      return c.json({ error: "wordLength must be between 3 and 8" }, 400);
    }

    const randomValue = await randomWordContract.getRandomWord(wordLengthVal);

    return c.json({
      network: "skale-base-sepolia",
      contractAddress: CONTRACT_ADDRESS,
      rpcUrl: SKALE_RPC_URL,
      wordLength: wordLengthVal.toString(),
      randomValue: randomValue.toString()
    });
  } catch (error) {
    console.error("Failed to fetch random value", error);
    return c.json({ error: "Failed to fetch random value from SKALE" }, 502);
  }
});


export default app;

function isValidNumericInput(value: unknown): value is number | string | bigint {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 0;
  }

  if (typeof value === "string") {
    if (!/^\d+$/.test(value)) {
      return false;
    }
    return true;
  }

  if (typeof value === "bigint") {
    return value >= 0n;
  }

  return false;
}