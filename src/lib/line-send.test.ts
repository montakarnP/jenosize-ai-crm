import assert from "node:assert/strict";
import test from "node:test";
import { deliverLineText } from "./line-send";

const input = {
  to: "UdemoLineUser0001",
  text: "Hello from the mock adapter.",
  replyToken: "reply-demo",
  externalId: "send:msg-test",
};

test("mock mode records a send without calling LINE", async () => {
  const previousMode = process.env.LINE_MODE;
  process.env.LINE_MODE = "mock";
  let calls = 0;
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(null, { status: 500 });
  };
  try {
    const result = await deliverLineText(input);
    assert.deepEqual(result, { ok: true, externalId: "send:msg-test" });
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
    process.env.LINE_MODE = previousMode;
  }
});

test("a rejected reply is sent by push instead", async () => {
  const previousMode = process.env.LINE_MODE;
  const previousToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  process.env.LINE_MODE = "live";
  process.env.LINE_CHANNEL_ACCESS_TOKEN = "test-token-not-a-secret";
  const paths: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => {
    paths.push(String(url));
    const status = paths.length === 1 ? 400 : 200;
    return new Response(JSON.stringify({ message: "Invalid reply token" }), { status });
  };
  try {
    const result = await deliverLineText(input);
    assert.equal(result.ok, true);
    assert.deepEqual(paths, [
      "https://api.line.me/v2/bot/message/reply",
      "https://api.line.me/v2/bot/message/push",
    ]);
  } finally {
    globalThis.fetch = original;
    process.env.LINE_MODE = previousMode;
    process.env.LINE_CHANNEL_ACCESS_TOKEN = previousToken;
  }
});

test("live mode retries once after a server error", async () => {
  const previousMode = process.env.LINE_MODE;
  const previousToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  process.env.LINE_MODE = "live";
  process.env.LINE_CHANNEL_ACCESS_TOKEN = "test-token-not-a-secret";
  const statuses = [500, 200];
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: statuses.shift() ?? 500 });
  try {
    const result = await deliverLineText(input);
    assert.equal(result.ok, true);
    assert.equal(statuses.length, 0);
  } finally {
    globalThis.fetch = original;
    process.env.LINE_MODE = previousMode;
    process.env.LINE_CHANNEL_ACCESS_TOKEN = previousToken;
  }
});
