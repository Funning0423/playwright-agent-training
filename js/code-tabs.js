export function initCodeTabs() {
  document.querySelectorAll("[data-tabs]").forEach((tabSet) => {
    const buttons = [...tabSet.querySelectorAll("[data-tab-target]")];
    const panels = [...tabSet.querySelectorAll("[data-tab-panel]")];

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

  document.querySelectorAll("[data-compare]").forEach((panel) => {
    const buttons = [...panel.querySelectorAll("[data-compare-target]")];
    const panes = [...panel.querySelectorAll("[data-compare-panel]")];

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.compareTarget;
        buttons.forEach((item) => item.classList.toggle("is-active", item === button));
        panes.forEach((pane) => pane.classList.toggle("is-active", pane.dataset.comparePanel === target));
      });
    });
  });
}
