const CRITICAL_REVIEW_ITEMS = {
  preserveLoginFlow: "保留自动登录与协议确认，不得改成人工扫码",
  noFirstResultAssumption: "禁止默认选择第一条搜索结果",
  handleDuplicateNames: "必须处理重名校准，无法唯一匹配时停止",
  verifySuccessSignal: "必须验证明确的同步成功提示"
};

export function getReviewSummary(checks) {
  const missingCriticalItems = Object.entries(CRITICAL_REVIEW_ITEMS)
    .filter(([key]) => !checks[key])
    .map(([, label]) => label);

  return {
    canProceed: missingCriticalItems.length === 0,
    missingCriticalItems,
    riskText:
      missingCriticalItems.length === 0
        ? "关键审核项已完成，可以进入实施阶段。"
        : `当前仍有高风险遗漏：${missingCriticalItems.join("；")}。`
  };
}

export function getTrainingProgress(progressMap) {
  const values = Object.values(progressMap);
  const total = values.length;
  const completed = values.filter(Boolean).length;

  return {
    total,
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100)
  };
}
