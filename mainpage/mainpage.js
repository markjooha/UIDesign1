(function () {
  const FIGMA_P1 = "https://www.figma.com/proto/Cz07qN8osHBQ8b6Uuhk4f2/Jooha-Eom?node-id=409-432&viewport=438%2C261%2C0.26&t=LZ8laOa4cKX1rTb0-1&scaling=scale-down&content-scaling=fixed&starting-point-node-id=409%3A432&show-proto-sidebar=1&page-id=0%3A1";
  const P2_LINK = "https://markjooha.github.io/UIDesign1/P2/index.html?bldg=50";

  const stage = document.querySelector("#content-stage");
  const buttons = Array.from(document.querySelectorAll("[data-panel]"));
  const dashLines = Array.from(document.querySelectorAll(".dash-line"));
  const dashFillers = new Set();

  const panels = {
    about: {
      type: "list",
      className: "about-list",
      lines: [
        "I enjoy indie rock.",
        "My favorite Pokemon is Greninja. (it looks cool)",
        "My favorite food is paccheri with porcini.",
        'My favorite song is <a href="https://youtu.be/yacnXJCi4No?si=6dVwnA06I5r7JI4r/">Lean</a> by Tuesday Beach Club.',
        'My favorite website is <a href="https://www.typographicposters.com/">typo/graphic posters</a>'
      ]
    },
    exercises: {
      type: "list",
      className: "exercise-list",
      lines: [
        '<a href="ascii/exterior-JoohaEom.html">ASCII TOWN</a>',
        '<a href="codingfromlife/index.html">CODING FROM LIFE</a>',
        '<a href="myshelf/index.html">CODE MY SHELF</a>',
        '<a href="assets/emoji_animation.gif">EMOJI ANIMATION</a>',
        '<a href="https://www.figma.com/proto/2RHbsKp5i9l2WAG6rzQmpb/Jooha-Eom-Poster?node-id=3-2&page-id=0%3A1&starting-point-node-id=3%3A2&t=5GJujOcrVv4KcN35-1">INTERACTIVE POSTER</a>',
        '<a href="https://markjooha.github.io/UIDesign1/Workshop_Clock/clock.html">CLOCK WORKSHOP [A CHAPTER A MINUTE]</a>'
      ]
    },
    p1: {
      type: "project",
      className: "p1-panel",
      label: "TP-Neo",
      href: FIGMA_P1,
      image: "mainpage/P1-Reel.png",
      imageClass: "reel-art",
      alt: "P1 TP-Neo reel graphic"
    },
    p2: {
      type: "project",
      className: "p2-panel",
      label: "Bldg __",
      href: P2_LINK,
      image: "mainpage/P2-Poster.png",
      imageClass: "poster-art",
      alt: "P2 Bldg poster graphic"
    }
  };

  function refreshDashLines() {
    const dashCount = Math.ceil(window.innerWidth / 12) + 24;
    const dashes = Array.from({ length: dashCount }, () => "-").join(" ");
    dashLines.forEach((line) => {
      line.textContent = dashes;
    });
  }

  function fitDashes(element, label) {
    if (!element) return;

    const suffix = label ? ` ${label} ` : "";
    let previous = "-";

    for (let count = 2; count < 160; count += 1) {
      const dashes = "-".repeat(count);
      element.textContent = label ? `${dashes}${suffix}${dashes}` : dashes;

      if (element.scrollWidth > element.clientWidth) {
        element.textContent = label ? `${previous}${suffix}${previous}` : previous;
        return;
      }

      previous = dashes;
    }
  }

  function refreshDashFillers() {
    dashFillers.forEach(({ element, label }) => fitDashes(element, label));
  }

  function setActive(panelName) {
    buttons.forEach((button) => {
      const active = button.dataset.panel === panelName;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderList(panel) {
    const list = document.createElement("ul");
    list.className = `terminal-list ${panel.className}`;

    panel.lines.forEach((line, index) => {
      const item = document.createElement("li");
      item.className = "terminal-line";
      item.style.animationDelay = `${index * 140}ms`;
      item.innerHTML = line;
      list.appendChild(item);
    });

    stage.appendChild(list);
  }

  function renderProject(panel) {
    const wrapper = document.createElement("div");
    wrapper.className = `project-panel ${panel.className}`;

    const slots = document.createElement("div");
    slots.className = "project-slots";

    const drawer = document.createElement("div");
    drawer.className = "drawer";

    const title = document.createElement("div");
    title.className = "drawer-title";
    title.dataset.label = panel.label;

    const body = document.createElement("div");
    body.className = "drawer-body";

    const link = document.createElement("a");
    link.href = panel.href;
    link.setAttribute("aria-label", panel.alt);

    const image = document.createElement("img");
    image.className = panel.imageClass;
    image.src = panel.image;
    image.alt = panel.alt;

    const footer = document.createElement("div");
    footer.className = "drawer-footer";

    link.appendChild(image);
    body.appendChild(link);
    drawer.append(title, body, footer);
    slots.appendChild(drawer);
    wrapper.appendChild(slots);
    stage.appendChild(wrapper);
    dashFillers.clear();
    dashFillers.add({ element: title, label: panel.label });
    dashFillers.add({ element: footer, label: "" });

    requestAnimationFrame(() => {
      drawer.classList.add("is-open");
      refreshDashFillers();
    });
  }

  function renderPanel(panelName) {
    const panel = panels[panelName];
    if (!panel) return;

    setActive(panelName);
    stage.classList.add("is-switching");

    window.setTimeout(() => {
      stage.replaceChildren();
      stage.classList.remove("is-switching");

      if (panel.type === "list") {
        renderList(panel);
      } else {
        renderProject(panel);
      }
    }, 90);
  }

  buttons.forEach((button) => {
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => renderPanel(button.dataset.panel));
  });

  refreshDashLines();
  window.addEventListener("resize", () => {
    refreshDashLines();
    refreshDashFillers();
  });
})();
