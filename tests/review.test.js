import test from "node:test";
import assert from "node:assert/strict";

import { getReviewSummary, getTrainingProgress } from "../js/training-state.js";

test("getReviewSummary blocks implementation when critical items are unchecked", () => {
  const summary = getReviewSummary({
    preserveLoginFlow: false,
    noFirstResultAssumption: true,
    handleDuplicateNames: false,
    verifySuccessSignal: true
  });

  assert.equal(summary.canProceed, false);
  assert.match(summary.riskText, /保留自动登录与协议确认/);
  assert.match(summary.riskText, /处理重名校准/);
});

test("getTrainingProgress returns rounded completion percentage", () => {
  const progress = getTrainingProgress({
    chapter1: true,
    chapter2: true,
    chapter3: false,
    chapter4: true
  });

  assert.equal(progress.completed, 3);
  assert.equal(progress.total, 4);
  assert.equal(progress.percent, 75);
});
