import test from "node:test";
import assert from "node:assert/strict";

import { buildPrompt, validatePromptFields } from "../js/prompt-core.js";

const validDraft = {
  workflowName: "直播老师权限同步",
  goal: "根据老师信息找到准确账号并执行权限同步",
  inputs: ["老师姓名", "用户 ID（可选）"],
  output: "成功名单、失败名单、失败原因、日志",
  runMode: "Headless，从登录开始全自动",
  manualPolicy: "默认不允许",
  rules: "零条停止、多条校准、无法唯一匹配则停止",
  successCriteria: "出现明确同步成功提示",
  recordedCode: "await page.goto('https://edu-admin.qlchat.com/login?...');",
  extraLimits: "不得新增扫码、不得默认第一条"
};

test("validatePromptFields returns required field errors", () => {
  const errors = validatePromptFields({ ...validDraft, workflowName: "", recordedCode: "" });

  assert.deepEqual(errors, ["工作流名称", "录制代码"]);
});

test("buildPrompt preserves recorded code and includes non-negotiable rules", () => {
  const markdown = buildPrompt(validDraft);

  assert.match(markdown, /# 工作流名称/);
  assert.match(markdown, /```ts\nawait page\.goto/);
  assert.match(markdown, /不得擅自增加人工扫码、手动登录或授权/);
  assert.match(markdown, /先输出设计方案，不要直接开始编码/);
});
