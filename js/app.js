import { initChecklist } from "./checklist.js";
import { copyText } from "./clipboard.js";
import { initCodeTabs } from "./code-tabs.js";
import { initNavigation } from "./navigation.js";
import { initPromptBuilder } from "./prompt-builder.js";
import { clearTrainingState } from "./storage.js";

function initCopyButtons() {
  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.getElementById(button.dataset.copyTarget);
      if (!target) {
        return;
      }
      const copied = await copyText(target.textContent);
      const original = button.textContent;
      button.textContent = copied ? "已复制" : "手动复制";
      setTimeout(() => {
        button.textContent = original;
      }, 1200);
    });
  });
}

function initClearData() {
  document.getElementById("clear-local-data").addEventListener("click", () => {
    const ok = window.confirm("确定清除本页面保存的进度、Prompt 草稿和测试状态吗？");
    if (!ok) {
      return;
    }
    clearTrainingState();
    window.location.reload();
  });
}

function initSwitchers() {
  document.querySelectorAll("[data-switcher]").forEach((root) => {
    const targets = [...root.querySelectorAll("[data-switch-target]")];
    const panels = [...root.querySelectorAll("[data-switch-panel]")];

    const activate = (key) => {
      targets.forEach((item) => item.classList.toggle("is-active", item.dataset.switchTarget === key));
      panels.forEach((item) => item.classList.toggle("is-active", item.dataset.switchPanel === key));
    };

    targets.forEach((target) => {
      target.addEventListener("click", () => activate(target.dataset.switchTarget));
    });
  });
}

initNavigation();
initCodeTabs();
initPromptBuilder();
initChecklist();
initCopyButtons();
initClearData();
initSwitchers();
