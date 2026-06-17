import { getReviewSummary, getTrainingProgress } from "./training-state.js";
import { loadState, saveState } from "./storage.js";

export function initChecklist() {
  const progressSections = [...document.querySelectorAll(".training-section[data-section]")];
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
