import assert from "node:assert/strict";
import test from "node:test";
import {
  decideLineLink,
  lineEventIdempotencyKey,
  lineFollowIdempotencyKey,
  lineGreetingText,
  lineLinkReply,
  readLineLinkClaim,
  readLineWebhook,
} from "./line-webhook";

const payload = {
  events: [
    {
      type: "message",
      webhookEventId: "evt-demo-0001",
      replyToken: "reply-demo",
      timestamp: 1_700_000_000_000,
      source: { type: "user", userId: "UdemoLineUser0001" },
      message: { type: "text", text: "Can we review the promotion scope tomorrow?" },
    },
    {
      type: "message",
      webhookEventId: "evt-image",
      source: { type: "user", userId: "UdemoLineUser0001" },
      message: { type: "image", id: "img" },
    },
  ],
};

test("text events keep a stable idempotency key and other message types are ignored", () => {
  const parsed = readLineWebhook(payload);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.events.length, 1);
  assert.equal(parsed.events[0]?.userId, "UdemoLineUser0001");
  assert.equal(lineEventIdempotencyKey(parsed.events[0]!.webhookEventId), "line-event:evt-demo-0001");
  assert.equal(
    lineEventIdempotencyKey(parsed.events[0]!.webhookEventId),
    lineEventIdempotencyKey("evt-demo-0001"),
  );
});

test("a payload without events is rejected", () => {
  assert.deepEqual(readLineWebhook({}), { ok: false });
});

test("adding the LINE account is a follow event and other event types stay ignored", () => {
  const parsed = readLineWebhook({
    events: [
      {
        type: "follow",
        webhookEventId: "evt-follow-0001",
        replyToken: "reply-follow",
        timestamp: 1_700_000_000_000,
        source: { type: "user", userId: "UnewFriend0001" },
      },
      {
        type: "unfollow",
        webhookEventId: "evt-unfollow-01",
        source: { type: "user", userId: "UnewFriend0001" },
      },
    ],
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.events.length, 0);
  assert.equal(parsed.follows.length, 1);
  assert.equal(parsed.follows[0]?.userId, "UnewFriend0001");
  assert.equal(parsed.follows[0]?.replyToken, "reply-follow");
  assert.equal(lineFollowIdempotencyKey("evt-follow-0001"), "line-follow:evt-follow-0001");
  assert.match(lineGreetingText(), /I am LK-OISHI/);
  assert.match(lineGreetingText(), /ยินดีต้อนรับสู่ Jenosize/);
});

test("I am claims a free mock LINE id and refuses one that is already connected", () => {
  assert.equal(readLineLinkClaim("I am LK-OISHI"), "LK-OISHI");
  assert.equal(readLineLinkClaim("hello"), null);
  assert.equal(
    decideLineLink({
      senderUserId: "Ureal0001",
      senderContactId: null,
      target: { id: "ct_oishi", lineUserId: null },
    }),
    "connect",
  );
  assert.equal(
    decideLineLink({
      senderUserId: "Ureal0001",
      senderContactId: "ct_tat",
      target: { id: "ct_oishi", lineUserId: null },
    }),
    "taken",
  );
  assert.equal(
    lineLinkReply("taken", "Oishi Contact"),
    "It's cannot connect because it's connected with other account.",
  );
});
