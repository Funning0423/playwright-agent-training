(function () {
  const STORAGE_KEYS = {
    progress: "tutorialProgress",
    promptDraft: "promptBuilderDraft",
    review: "reviewChecklist",
    testStatus: "testStatus"
  };

  const defaultPromptDraft = {
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

  const CRITICAL_REVIEW_ITEMS = {
    preserveLoginFlow: "保留自动登录与协议确认，不得改成人工扫码",
    noFirstResultAssumption: "禁止默认选择第一条搜索结果",
    handleDuplicateNames: "必须处理重名校准，无法唯一匹配时停止",
    verifySuccessSignal: "必须验证明确的同步成功提示"
  };

  function loadState(key, fallback) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS[key]);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveState(key, value) {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
  }

  function clearTrainingState() {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  }

  function validatePromptFields(draft) {
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

  function buildPrompt(draft) {
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

  function getReviewSummary(checks) {
    const missingCriticalItems = Object.entries(CRITICAL_REVIEW_ITEMS)
      .filter(([key]) => !checks[key])
      .map(([, label]) => label);

    return {
      canProceed: missingCriticalItems.length === 0,
      riskText:
        missingCriticalItems.length === 0
          ? "关键审核项已完成，可以进入实施阶段。"
          : `当前仍有高风险遗漏：${missingCriticalItems.join("；")}。`
    };
  }

  function getTrainingProgress(progressMap) {
    const values = Object.values(progressMap);
    const total = values.length;
    const completed = values.filter(Boolean).length;

    return {
      total,
      completed,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100)
    };
  }

  async function copyText(text) {
    if (!text) {
      return false;
    }

    if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall through.
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    textarea.remove();

    if (copied) {
      return true;
    }

    window.prompt("浏览器未直接完成复制，请手动复制下面内容：", text);
    return false;
  }

  function flashButton(button, successText, fallbackText) {
    const original = button.dataset.originalLabel || button.textContent;
    button.dataset.originalLabel = original;
    button.textContent = successText || fallbackText;
    window.setTimeout(() => {
      button.textContent = original;
    }, 1400);
  }

  function initNavigation() {
    const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
    const sections = Array.from(document.querySelectorAll(".training-section"));
    const scrollButtons = Array.from(document.querySelectorAll("[data-scroll-target]"));

    scrollButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = document.querySelector(button.dataset.scrollTarget);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) {
          return;
        }

        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
        });
      },
      {
        threshold: [0.25, 0.5, 0.75],
        rootMargin: "-20% 0px -55% 0px"
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function initCodeTabs() {
    document.querySelectorAll("[data-tabs]").forEach((tabSet) => {
      const buttons = Array.from(tabSet.querySelectorAll("[data-tab-target]"));
      const panels = Array.from(tabSet.querySelectorAll("[data-tab-panel]"));

      const activate = (target) => {
        buttons.forEach((button) => {
          const active = button.dataset.tabTarget === target;
          button.setAttribute("aria-selected", String(active));
        });

        panels.forEach((panel) => {
          panel.classList.toggle("is-active", panel.dataset.tabPanel === target);
        });
      };

      buttons.forEach((button, index) => {
        button.addEventListener("click", () => activate(button.dataset.tabTarget));
        button.addEventListener("keydown", (event) => {
          if (!["ArrowLeft", "ArrowRight"].includes(event.key)) {
            return;
          }
          event.preventDefault();
          const nextIndex =
            event.key === "ArrowRight"
              ? (index + 1) % buttons.length
              : (index - 1 + buttons.length) % buttons.length;
          buttons[nextIndex].focus();
          activate(buttons[nextIndex].dataset.tabTarget);
        });
      });
    });
  }

  function initSwitchers() {
    document.querySelectorAll("[data-switcher]").forEach((root) => {
      const targets = Array.from(root.querySelectorAll("[data-switch-target]"));
      const panels = Array.from(root.querySelectorAll("[data-switch-panel]"));

      const activate = (key) => {
        targets.forEach((item) => item.classList.toggle("is-active", item.dataset.switchTarget === key));
        panels.forEach((item) => item.classList.toggle("is-active", item.dataset.switchPanel === key));
      };

      targets.forEach((target) => {
        target.addEventListener("click", () => activate(target.dataset.switchTarget));
      });
    });
  }

  function initCopyButtons() {
    document.querySelectorAll("[data-copy-target]").forEach((button) => {
      button.addEventListener("click", async () => {
        const target = document.getElementById(button.dataset.copyTarget);
        if (!target) {
          return;
        }
        const copied = await copyText(target.textContent);
        flashButton(button, copied ? "已复制" : "手动复制");
      });
    });
  }

  function initChecklist() {
    const progressSections = Array.from(document.querySelectorAll(".training-section[data-section]"));
    const progressKeys = progressSections.map((section) => section.dataset.section).filter(Boolean);
    const progressState = Object.fromEntries(progressKeys.map((key) => [key, false]));

    const updateProgressUi = () => {
      const summary = getTrainingProgress(progressState);
      document.getElementById("progress-text").textContent = `${summary.percent}%`;
      document.getElementById("progress-fill").style.width = `${summary.percent}%`;
    };

    const markSectionComplete = (key) => {
      if (!key || progressState[key]) {
        return;
      }
      progressState[key] = true;
      updateProgressUi();
    };

    const evaluateScrollProgress = () => {
      const topbar = document.querySelector(".keynote-topbar");
      const threshold = (topbar ? topbar.getBoundingClientRect().height : 0) + 24;

      progressSections.forEach((section) => {
        if (section.getBoundingClientRect().bottom <= threshold) {
          markSectionComplete(section.dataset.section);
        }
      });

      const reachedPageBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
      if (reachedPageBottom) {
        const lastSection = progressSections.at(-1);
        if (lastSection) {
          markSectionComplete(lastSection.dataset.section);
        }
      }
    };

    let ticking = false;
    const queueProgressCheck = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(() => {
        evaluateScrollProgress();
        ticking = false;
      });
    };

    window.addEventListener("scroll", queueProgressCheck, { passive: true });
    window.addEventListener("resize", queueProgressCheck);
    updateProgressUi();
    queueProgressCheck();

    const checklistRoot = document.getElementById("review-checklist");
    const summaryNode = document.getElementById("review-summary");
    const reviewState = loadState("review", {
      preserveLoginFlow: false,
      noFirstResultAssumption: false,
      handleDuplicateNames: false,
      verifySuccessSignal: false
    });

    const renderSummary = () => {
      const summary = getReviewSummary(reviewState);
      summaryNode.textContent = summary.riskText;
      summaryNode.classList.toggle("is-ready", summary.canProceed);
    };

    checklistRoot.querySelectorAll("input[type='checkbox']").forEach((input) => {
      input.checked = Boolean(reviewState[input.name]);
      input.addEventListener("change", () => {
        reviewState[input.name] = input.checked;
        saveState("review", reviewState);
        renderSummary();
      });
    });
    renderSummary();

    const testGrid = document.getElementById("test-grid");
    const defaultTestStatus = {
      login: "pending",
      query: "pending",
      dryrun: "pending",
      single: "pending",
      batch: "pending"
    };
    const testStatus = loadState("testStatus", defaultTestStatus);

    const renderTestStatus = () => {
      testGrid.querySelectorAll(".test-card").forEach((card) => {
        const active = testStatus[card.dataset.testKey] || "pending";
        card.querySelectorAll("[data-status]").forEach((button) => {
          button.classList.toggle("is-active", button.dataset.status === active);
        });
      });
    };

    testGrid.querySelectorAll(".test-card").forEach((card) => {
      card.querySelectorAll("[data-status]").forEach((button) => {
        button.addEventListener("click", () => {
          testStatus[card.dataset.testKey] = button.dataset.status;
          saveState("testStatus", testStatus);
          renderTestStatus();
        });
      });
    });

    document.getElementById("reset-test-status").addEventListener("click", () => {
      Object.assign(testStatus, defaultTestStatus);
      saveState("testStatus", testStatus);
      renderTestStatus();
    });

    renderTestStatus();
  }

  function initPromptBuilder() {
    const form = document.getElementById("prompt-form");
    const preview = document.getElementById("generated-prompt");
    const feedback = document.getElementById("prompt-feedback");
    const copyButton = document.getElementById("copy-generated-prompt");
    const floatingCopy = document.getElementById("floating-copy-prompt");
    const addTagButton = document.getElementById("add-input-tag");
    const tagEntry = document.getElementById("input-tag-entry");
    const tagList = document.getElementById("input-tags");
    const draft = loadState("promptDraft", defaultPromptDraft);

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
        tagList.appendChild(chip);
      });
    };

    const syncForm = () => {
      Object.entries(draft).forEach(([key, value]) => {
        const field = form.elements.namedItem(key);
        if (!field || Array.isArray(value)) {
          return;
        }
        field.value = value;
      });
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
      preview.textContent = buildPrompt(draft);
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
      Object.assign(draft, JSON.parse(JSON.stringify(defaultPromptDraft)));
      persist();
      syncForm();
      feedback.textContent = "已恢复默认示例。";
    });

    const copyPrompt = async () => {
      const copied = await copyText(preview.textContent);
      flashButton(copyButton, copied ? "已复制" : "手动复制");
      flashButton(floatingCopy, copied ? "Prompt 已复制" : "请手动复制");
    };

    copyButton.addEventListener("click", copyPrompt);
    floatingCopy.addEventListener("click", copyPrompt);

    syncForm();
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

  function initScrollReveal() {
    const reveals = Array.from(document.querySelectorAll(".reveal"));
    if (reveals.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    reveals.forEach((el) => observer.observe(el));
  }

  function initFaq() {
    document.querySelectorAll(".faq-item").forEach((item) => {
      const button = item.querySelector(".faq-question");
      if (!button) {
        return;
      }
      button.addEventListener("click", () => {
        const isOpen = item.classList.contains("is-open");
        document.querySelectorAll(".faq-item.is-open").forEach((open) => {
          if (open !== item) {
            open.classList.remove("is-open");
          }
        });
        item.classList.toggle("is-open", !isOpen);
      });
    });
  }

  function initSyntaxHighlight() {
    document.querySelectorAll(".code-block pre code").forEach((block) => {
      let html = block.innerHTML;

      html = html.replace(/(?<!:)(\/\/[^\n]*)/g, '<span class="syntax-cm">$1</span>');

      html = html.replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g, '<span class="syntax-str">$1</span>');

      html = html.replace(
        /\b(await|const|let|var|if|else|throw|new|return|async|function|import|export|from)\b/g,
        '<span class="syntax-kw">$1</span>'
      );

      html = html.replace(/\b(\d+)\b/g, '<span class="syntax-num">$1</span>');

      html = html.replace(
        /\.(goto|click|fill|getByRole|getByText|filter|count|first|toContainText|querySelector)\b/g,
        '.<span class="syntax-fn">$1</span>'
      );

      html = html.replace(
        /\b(Error)\b/g,
        '<span class="syntax-fn">$1</span>'
      );

      block.innerHTML = html;
    });
  }

  function boot() {
    initNavigation();
    initCodeTabs();
    initPromptBuilder();
    initChecklist();
    initCopyButtons();
    initClearData();
    initSwitchers();
    initScrollReveal();
    initFaq();
    initSyntaxHighlight();
    window.__trainingAppReady = true;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
