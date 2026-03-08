import test from "node:test"
import assert from "node:assert/strict"

import {
  buildDashboardHref,
  parseDashboardRouteState,
} from "./dashboard-route-state"

test("buildDashboardHref includes the dashboard subpage and learner id", () => {
  assert.equal(
    buildDashboardHref({
      page: "dashboard",
      dashboardSubPage: "learners",
      learnerId: "user-doc-1",
    }),
    "/?page=dashboard&dashboardSubPage=learners&learnerId=user-doc-1"
  )
})

test("parseDashboardRouteState falls back to dashboard courses for invalid values", () => {
  const state = parseDashboardRouteState(
    new URLSearchParams("page=dashboard&dashboardSubPage=unknown")
  )

  assert.deepEqual(state, {
    page: "dashboard",
    homeSubPage: "for-you",
    dashboardSubPage: "courses",
    learnerId: null,
  })
})
