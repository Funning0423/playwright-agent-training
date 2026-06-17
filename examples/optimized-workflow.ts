const targetRows = page.getByRole("row").filter({ hasText: teacherName });
const count = await targetRows.count();

if (count === 0) {
  throw new Error(`未找到老师：${teacherName}`);
}

if (count > 1) {
  throw new Error(`存在多个同名结果，禁止默认选择第一条：${teacherName}`);
}

const targetRow = targetRows.first();
await expect(targetRow).toContainText(teacherName);
await targetRow.getByRole("button", { name: "修改" }).click();
await page.getByRole("button", { name: "同步" }).click();
