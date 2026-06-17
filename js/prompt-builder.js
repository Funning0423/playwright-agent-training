import { copyText } from "./clipboard.js";
import { buildPrompt, validatePromptFields } from "./prompt-core.js";
import { loadState, saveState } from "./storage.js";

const defaultDraft = {
  workflowName: "直播老师权限同步",
  goal: "根据老师信息找到准确账号并执行权限同步",
  inputs: ["老师姓名", "用户 ID（可选）"],
  output: "成功名单、失败名单、失败原因、日志",
  runMode: "Headless，从登录开始全自动",
  manualPolicy: "默认不允许",
  rules: "零条停止、多条校准、无法唯一匹配则停止",
  successCriteria: "出现明确同步成功提示",
  recordedCode: `await page.goto('https://edu-admin.qlchat.com/login?...');
await page.getByRole('img').click();
await page.getByRole('button', { name: '同意协议（4s）' }).click();
await page.goto('https://login.work.weixin.qq.com/...');
await page.getByRole('link', { name: '继续在浏览器中登录访问' }).click();`,
  extraLimits: "不得新增扫码、不得默认第一条"
};

export function initPromptBuilder() {
  const form = document.getElementById("prompt-form");
  const preview = document.getElementById("generated-prompt");
  const feedback = document.getElementById("prompt-feedback");
  const copyButton = document.getElementById("copy-generated-prompt");
  const floatingCopy = document.getElementById("floating-copy-prompt");
  const addTagButton = document.getElementById("add-input-tag");
  const tagEntry = document.getElementById("input-tag-entry");
  const tagList = document.getElementById("input-tags");

  const draft = loadState("promptDraft", defaultDraft);

  const renderTags = () => {
    tagList.innerHTML = "";
    draft.inputs.forEach((value, index) => {
      const chip = document.createElement("div");
      chip.className = "tag-chip";
      chip.innerHTML = `<span>${value}</span><button type="button" aria-label="删除参数">×</button>`;
      chip.querySelector("button").addEventListener("click", () => {
        draft.inputs.splice(index, 1);
        persist();
      });
      tagList.append(chip);
    });
  };

  const syncForm = () => {
    for (const [key, value] of Object.entries(draft)) {
      const field = form.elements.namedItem(key);
      if (!field || Array.isArray(value)) {
        continue;
      }
      field.value = value;
    }
    renderTags();
    preview.textContent = buildPrompt(draft);
  };

  const persist = () => {
    saveState("promptDraft", draft);
    renderTags();
    preview.textContent = buildPrompt(draft);
  };

  form.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) || !target.name) {
      return;
    }
    draft[target.name] = target.value;
    saveState("promptDraft", draft);
  });

  const addTag = () => {
    const value = tagEntry.value.trim();
    if (!value) {
      return;
    }
    draft.inputs.push(value);
    tagEntry.value = "";
    persist();
  };

  addTagButton.addEventListener("click", addTag);
  tagEntry.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addTag();
    }
  });

  document.getElementById("generate-prompt").addEventListener("click", () => {
    const errors = validatePromptFields(draft);
    if (errors.length > 0) {
      feedback.textContent = `请先补全必填项：${errors.join("、")}`;
      return;
    }
    feedback.textContent = "Prompt 已更新，可以直接复制给 Agent。";
    preview.textContent = buildPrompt(draft);
  });

  document.getElementById("reset-prompt").addEventListener("click", () => {
    Object.assign(draft, structuredClone(defaultDraft));
    persist();
    syncForm();
    feedback.textContent = "已恢复默认示例。";
  });

  const copyPrompt = async () => {
    const copied = await copyText(preview.textContent);
    copyButton.textContent = copied ? "已复制" : "手动复制";
    floatingCopy.textContent = copied ? "Prompt 已复制" : "请手动复制 Prompt";
    setTimeout(() => {
      copyButton.textContent = "复制 Prompt";
      floatingCopy.textContent = "复制当前 Prompt";
    }, 1400);
  };

  copyButton.addEventListener("click", copyPrompt);
  floatingCopy.addEventListener("click", copyPrompt);

  syncForm();
}
