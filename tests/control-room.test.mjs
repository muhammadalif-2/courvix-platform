import assert from "node:assert/strict";
import {
  createDemoState,
  demoIdentity,
  simulateRequest,
} from "../lib/demo-engine.ts";
import { clubControlRoom, trainingControlRoom } from "../lib/control-room.ts";
const state = createDemoState();
state.role = "Owner";
state.club = "demo-batam";
const identity = demoIdentity(state);
let club = clubControlRoom(state.data, identity, state.today);
assert.ok(club.people.length > 0);
assert.equal(club.financial, true);
assert.ok(club.people.every((p) => p.person.club === state.club));
assert.ok(
  club.people.every((p) =>
    p.schedule.every((s) => s.club === state.club && s.team === p.person.team),
  ),
);
assert.ok(
  club.people.every((p) =>
    p.finance.invoices.every((i) => i.member === p.person.id),
  ),
);
assert.ok(club.plans.length);
state.role = "Coach";
const coach = demoIdentity(state);
club = clubControlRoom(state.data, coach, state.today);
assert.equal(club.finance, null);
assert.equal(club.financial, false);
assert.equal(club.plans.length, 0);
assert.ok(
  club.people.every((p) => p.finance === null && p.person.amount === undefined),
);
assert.ok(
  club.people.every((p) =>
    (coach.teams || [coach.team]).includes(p.person.team),
  ),
);
state.role = "Member";
assert.throws(
  () => clubControlRoom(state.data, demoIdentity(state), state.today),
  /staff/,
);
state.club = "demo-nusa";
state.role = "Owner";
let view = simulateRequest(state, "/api/personal-training", "GET", {}).value;
let training = trainingControlRoom(view);
assert.ok(training.people.length);
assert.ok(training.finance.review.length);
assert.ok(
  training.people.every((p) =>
    p.finance.orders.every((o) => o.client === p.person.id),
  ),
);
const foreign = {
  ...view.clients[0],
  id: "foreign",
  club: "another-workspace",
};
assert.ok(
  !trainingControlRoom({
    ...view,
    clients: [...view.clients, foreign],
  }).people.some((p) => p.person.id === "foreign"),
);
state.role = "Coach";
view = simulateRequest(state, "/api/personal-training", "GET", {}).value;
training = trainingControlRoom(view);
assert.equal(training.finance, null);
assert.equal(training.offers.length, 0);
assert.ok(training.people.every((p) => p.finance === null));
assert.equal(
  trainingControlRoom({
    ...view,
    orders: [
      {
        id: "fake",
        club: view.club.id,
        amount: 9999,
        balance: { available: 100 },
      },
    ],
  }).finance,
  null,
);
state.role = "Member";
view = simulateRequest(state, "/api/personal-training", "GET", {}).value;
assert.throws(() => trainingControlRoom(view), /staff/);
console.log(
  "PASS control rooms: linked member/client records, per-workspace isolation, coach scoping, finance suppression and member access boundaries.",
);
