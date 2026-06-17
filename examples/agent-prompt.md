# 工作流名称
直播老师权限同步

# 工作流目标
根据老师信息找到准确账号并执行权限同步。

# 运行要求
- 使用 Playwright + TypeScript
- Headless，从登录开始全自动
- 人工介入策略：默认不允许

# 输入参数
- 老师姓名
- 用户 ID（可选）

# 已验证操作
```ts
await page.goto("https://edu-admin.qlchat.com/login?...");
await page.getByRole("img").click();
await page.getByRole("button", { name: "同意协议（4s）" }).click();
```

# 业务规则
零条停止、多条校准、无法唯一匹配则停止。

# 不允许修改的流程事实
- 录制中已经成功执行的步骤必须保留
- 不得擅自增加人工扫码、手动登录或授权
- 不得默认选择搜索结果第一条

# 成功标准
出现明确同步成功提示。

# Agent 任务
先输出设计方案，不要直接开始编码。
