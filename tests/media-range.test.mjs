import assert from "node:assert/strict";
import { mediaRange } from "../lib/media-range.ts";
assert.deepEqual(mediaRange("bytes=0-1023", 4096), { start: 0, end: 1023 });
assert.deepEqual(mediaRange("bytes=1024-", 4096), { start: 1024, end: 4095 });
assert.deepEqual(mediaRange("bytes=-100", 4096), { start: 3996, end: 4095 });
assert.deepEqual(mediaRange("bytes=4000-9999", 4096), {
  start: 4000,
  end: 4095,
});
for (const s of [
  "bytes=4096-",
  "bytes=9-3",
  "bytes=-0",
  "bytes=-",
  "bytes=0-1,5-6",
  "bytes=999999999999999999-",
  "not-a-range",
])
  assert.equal(mediaRange(s, 4096), null, s);
console.log(
  "PASS media ranges: first chunk, seeking, suffix, EOF bounds and invalid/multiple range denial.",
);
