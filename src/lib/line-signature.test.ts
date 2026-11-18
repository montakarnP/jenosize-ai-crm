import assert from "node:assert/strict";
import test from "node:test";
import { lineSignaturesMatch, signLineBody } from "./line-signature";

test("a matching LINE signature is accepted and a different body is rejected", () => {
  const secret = "local-test-secret";
  const body = JSON.stringify({ events: [] });
  const signature = signLineBody(body, secret);
  assert.equal(lineSignaturesMatch(body, secret, signature), true);
  assert.equal(lineSignaturesMatch(`${body} `, secret, signature), false);
  assert.equal(lineSignaturesMatch(body, secret, null), false);
  assert.equal(lineSignaturesMatch(body, "", signature), false);
});
