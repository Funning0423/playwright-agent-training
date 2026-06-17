export function validatePromptFields(draft) {
  const requiredFields = [
    ["workflowName", "工作流名称"],
    ["goal", "业务目标"],
    ["inputs", "输入参数"],
    ["output", "输出结果"],
    ["runMode", "运行模式"],
    ["manualPolicy", "人工介入策略"],
    ["rules", "业务判断规则"],
    ["successCriteria", "成功标准"],
    ["recordedCode", "录制代码"]
  ];

  return requiredFields
    .filter(([key]) => {
      const value = draft[key];
      return Array.isArray(value) ? value.length === 0 : !String(value || "").trim();
    })
    .map(([, label]) => label);
}

export function buildPrompt(draft) {
  const inputLines = draft.inputs.map((item) => `- ${item}`).join("\n");

  return `# 工作流名称
${draft.workflowName}

# 工作流目标
${draft.goal}

# 运行要求
- 使用 Playwright + TypeScript
- ${draft.runMode}
- 人工介入策略：${draft.manualPolicy}

# 输入参数
${inputLines}

# 输出结果
${draft.output}

# 已验证操作
\`\`\`ts
${draft.recordedCode}
\`\`\`

# 业务规则
${draft.rules}

# 不允许修改的流程事实
- 录制中已经成功执行的步骤必须保留
- 不得擅自增加人工扫码、手动登录或授权
- 不得默认选择搜索结果第一条
${draft.extraLimits ? `- ${draft.extraLimits}` : ""}

# 成功标准
${draft.successCriteria}

# Agent 任务
先输出设计方案，不要直接开始编码。`;
}
