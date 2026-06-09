const BUILDINGS = ["50", "49", "74"];
const LEGACY_STORAGE_KEY = "bldg-500-posters";
const MAX_ELEMENTS = 18;
const TITLE_ID = "poster-title";
const VIEW_TRANSITION_MS = 360;
const DAY_MS = 24 * 60 * 60 * 1000;
const POSTER_LIFETIME_DAYS = 14;
const AGED_DEMO_DAYS = 5;
const WALL_RANDOM_X_MIN = 12;
const WALL_RANDOM_X_MAX = 88;
const WALL_RANDOM_Y_MIN = 34;
const WALL_RANDOM_Y_MAX = 76;
const POSTER_WIDTH_TO_HEIGHT = 520 / 734;

const wallSlots = [
  { x: 10, y: 32 },
  { x: 27, y: 36 },
  { x: 45, y: 31 },
  { x: 63, y: 37 },
  { x: 82, y: 32 },
  { x: 18, y: 64 },
  { x: 37, y: 70 },
  { x: 56, y: 63 },
  { x: 75, y: 71 },
  { x: 90, y: 61 },
  { x: 31, y: 50 },
  { x: 69, y: 51 },
];

const defaultTitle = {
  id: TITLE_ID,
  kind: "title",
  text: "Title",
  color: "#000000",
  x: 26,
  y: 10,
  w: 52,
  h: 13,
  fontSize: 58,
  shape: "rect",
  image: "",
};

const state = {
  building: "50",
  elementKind: "text",
  imageData: "",
  title: { ...defaultTitle },
  elements: [],
  posters: [],
  selectedElementId: TITLE_ID,
  drag: null,
  viewTransition: null,
};

const page = document.querySelector(".page");
const boardView = document.querySelector(".board-view");
const editorView = document.querySelector(".editor-view");
const postersGrid = document.querySelector("#posters");
const posterEditor = document.querySelector("#posterEditor");
const elementLayout = document.querySelector("#elementLayout");
const elementText = document.querySelector("#elementText");
const elementColor = document.querySelector("#elementColor");
const posterColor = document.querySelector("#posterColor");
const elementSize = document.querySelector("#elementSize");
const fontSize = document.querySelector("#fontSize");
const shapeType = document.querySelector("#shapeType");
const imageUpload = document.querySelector("#imageUpload");
const toolPanel = document.querySelector(".tool-panel");
const uploadModal = document.querySelector("#uploadModal");
const posterLightbox = document.querySelector("#posterLightbox");
const lightboxImage = document.querySelector("#lightboxImage");
const brandTitle = document.querySelector(".brand-title");
const siteHeader = document.querySelector(".site-header");
const buildingOverlay = document.querySelector("#buildingOverlay");

function getBuildingFromUrl() {
  const building = new URLSearchParams(window.location.search).get("bldg");
  return BUILDINGS.includes(building) ? building : "50";
}

function getStorageKey(building = state.building) {
  return `bldg-${building}-posters`;
}

function loadPosters() {
  try {
    const currentKey = getStorageKey();
    const legacyPosters = state.building === "50" ? localStorage.getItem(LEGACY_STORAGE_KEY) : null;
    const storedPosters = localStorage.getItem(currentKey) || legacyPosters;
    state.posters = JSON.parse(storedPosters) || [];
    state.posters = state.posters.filter((poster) => getPosterAgeDays(poster.createdAt) < POSTER_LIFETIME_DAYS);
  } catch {
    state.posters = [];
  }
}

function savePosters() {
  localStorage.setItem(getStorageKey(), JSON.stringify(state.posters));
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getPosterAgeDays(dateValue) {
  return Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / DAY_MS));
}

function getPosterAgeClass(ageDays) {
  if (ageDays >= 10) return "is-vanishing";
  if (ageDays >= 6) return "is-aged";
  if (ageDays >= 3) return "is-aging";
  return "";
}

function getWallSlot(index) {
  const slot = wallSlots[index % wallSlots.length];
  const layer = Math.floor(index / wallSlots.length);
  const xOffset = ((layer % 3) - 1) * 2.4;
  const yOffset = ((layer % 2) - 0.5) * 4.2;
  return {
    x: clamp(slot.x + xOffset, 7, 93),
    y: clamp(slot.y + yOffset, 13, 87),
    r: 0,
  };
}

function getRandomWallPlacement() {
  return {
    x: Number((WALL_RANDOM_X_MIN + Math.random() * (WALL_RANDOM_X_MAX - WALL_RANDOM_X_MIN)).toFixed(2)),
    y: Number((WALL_RANDOM_Y_MIN + Math.random() * (WALL_RANDOM_Y_MAX - WALL_RANDOM_Y_MIN)).toFixed(2)),
    r: 0,
  };
}

function getPosterWallPlacement(poster, index) {
  const placement = poster.wall || getWallSlot(index);
  return { ...placement, r: 0 };
}

function getAgedDemoPoster() {
  const createdAt = new Date(Date.now() - AGED_DEMO_DAYS * DAY_MS);
  return {
    id: `aged-demo-poster-${state.building}`,
    title: "Aged sample poster",
    createdAt: createdAt.toISOString(),
    image: buildAgedDemoSvg(),
    isDemo: true,
  };
}

function getBoardPosters() {
  return [...state.posters, getAgedDemoPoster()]
    .filter((poster) => poster.isDemo || getPosterAgeDays(poster.createdAt) < POSTER_LIFETIME_DAYS);
}

function buildAgedDemoSvg() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="520" height="734" viewBox="0 0 520 734">
      <defs>
        <filter id="paperNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="5" seed="50"/>
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.18"/>
          </feComponentTransfer>
          <feBlend mode="multiply" in2="SourceGraphic"/>
        </filter>
      </defs>
      <rect width="520" height="734" fill="#eee9df"/>
      <path d="M31 25 L109 16 L184 27 L264 18 L353 31 L472 17 L500 52 L489 248 L503 372 L487 689 L386 704 L303 691 L222 715 L126 694 L34 710 L18 587 L33 451 L19 309 Z" fill="#f6f2e8" filter="url(#paperNoise)"/>
      <path d="M34 104 C82 79 135 130 185 93 C242 51 279 139 336 92 C390 48 445 105 492 83" fill="none" stroke="#111" stroke-width="8" opacity="0.68"/>
      <text x="56" y="223" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="780" fill="#111">Bldg ${state.building}</text>
      <text x="56" y="283" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="520" fill="#111">weathered notice</text>
      <text x="56" y="340" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="520" fill="#555">${AGED_DEMO_DAYS} days on the wall</text>
      <path d="M58 507 L466 482" stroke="#111" stroke-width="3" opacity="0.42"/>
      <path d="M84 538 L302 525" stroke="#111" stroke-width="2" opacity="0.26"/>
      <rect x="0" y="0" width="520" height="734" fill="none" stroke="#111" stroke-width="4" opacity="0.58"/>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function updateBuildingIdentity() {
  const label = `Bldg ${state.building}`;
  document.title = label;
  brandTitle.textContent = label;
  siteHeader.setAttribute("aria-label", `${label} poster board`);
  document.querySelectorAll("[data-building]").forEach((button) => {
    const isCurrent = button.dataset.building === state.building;
    button.classList.toggle("is-current", isCurrent);
    button.setAttribute("aria-current", isCurrent ? "page" : "false");
  });
}

function setView(viewName) {
  const currentView = page.dataset.view;
  if (currentView === viewName || state.viewTransition) return;

  const outgoing = currentView === "editor" ? editorView : boardView;
  const incoming = viewName === "editor" ? editorView : boardView;
  state.viewTransition = window.setTimeout(() => {
    outgoing.hidden = true;
    outgoing.classList.remove("is-leaving");
    state.viewTransition = null;
  }, VIEW_TRANSITION_MS);

  outgoing.classList.add("is-leaving");
  incoming.hidden = false;
  incoming.classList.add("is-entering");
  page.dataset.view = viewName;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => incoming.classList.remove("is-entering"));
  });

  const isEditor = viewName === "editor";
  if (isEditor) selectElement(state.selectedElementId || TITLE_ID);
}

function openBuildingMenu() {
  updateBuildingIdentity();
  buildingOverlay.hidden = false;
  document.body.classList.add("is-modal-open");
  requestAnimationFrame(() => buildingOverlay.classList.add("is-open"));
}

function closeBuildingMenu() {
  if (buildingOverlay.hidden) return;
  buildingOverlay.classList.remove("is-open");
  window.setTimeout(() => {
    buildingOverlay.hidden = true;
    document.body.classList.remove("is-modal-open");
  }, 240);
}

function switchBuilding(building, updateHistory = true) {
  if (!BUILDINGS.includes(building) || building === state.building) {
    closeBuildingMenu();
    return;
  }

  closeBuildingMenu();
  const activeView = page.dataset.view === "editor" ? editorView : boardView;
  activeView.classList.add("is-leaving");

  window.setTimeout(() => {
    state.building = building;
    if (updateHistory) {
      const url = new URL(window.location.href);
      url.searchParams.set("bldg", building);
      window.history.pushState({ building }, "", url);
    }
    loadPosters();
    renderBoard();
    resetEditor();
    updateBuildingIdentity();

    boardView.hidden = false;
    editorView.hidden = true;
    page.dataset.view = "board";
    activeView.classList.remove("is-leaving");
    boardView.classList.add("is-entering");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => boardView.classList.remove("is-entering"));
    });
  }, VIEW_TRANSITION_MS);
}

function renderBoard() {
  postersGrid.innerHTML = "";

  getBoardPosters().forEach((poster, index) => {
    const ageDays = getPosterAgeDays(poster.createdAt);
    const ageClass = getPosterAgeClass(ageDays);
    const slot = getPosterWallPlacement(poster, index);
    const card = document.createElement("figure");
    card.className = `poster-card ${ageClass}`.trim();
    card.style.setProperty("--wall-x", slot.x);
    card.style.setProperty("--wall-y", slot.y);
    card.style.setProperty("--wall-r", `${slot.r}deg`);
    card.style.setProperty("--wall-z", String(1000 - index));
    card.style.setProperty("--arrival-index", String(Math.min(index, 12)));

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = "expand-poster";
    button.dataset.posterId = poster.id;
    button.setAttribute("aria-label", "Expand poster");

    const img = document.createElement("img");
    img.src = poster.image;
    img.alt = poster.title || "Uploaded poster";

    button.append(img);
    card.append(button);
    postersGrid.append(card);
  });
}

function getSelectedElement() {
  if (state.selectedElementId === TITLE_ID) return state.title;
  return state.elements.find((item) => item.id === state.selectedElementId);
}

function getToolMode(item = getSelectedElement()) {
  if (!item) return state.elementKind;
  return item.kind === "title" ? "text" : item.kind;
}

function updateToolSelection(kind) {
  state.elementKind = kind;
  document.querySelectorAll(".tool-choice").forEach((button) => {
    const isSelected = button.dataset.kind === kind;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
  toolPanel.dataset.mode = kind;
}

function syncControls(item) {
  const mode = getToolMode(item);
  updateToolSelection(mode);
  elementText.value = item?.text || (mode === "text" ? "Poster note" : "");
  elementColor.value = item?.color || "#1649ff";
  elementSize.value = String(Math.round(item?.kind === "shape" ? (item.size || item.w) : (item?.w || 34)));
  fontSize.value = String(Math.round(item?.fontSize || 34));
  shapeType.value = item?.shape || "circle";
  const itemIndex = state.elements.findIndex((element) => element.id === item?.id);
  const isEditableElement = Boolean(item && item.id !== TITLE_ID);
  document.querySelectorAll('[data-action="delete-element"], [data-action="duplicate-element"], [data-action="bring-forward"]').forEach((button) => {
    const isForwardButton = button.dataset.action === "bring-forward";
    button.disabled = !isEditableElement || (isForwardButton && itemIndex === state.elements.length - 1);
  });
}

function selectElement(id) {
  state.selectedElementId = id;
  const selected = getSelectedElement();
  syncControls(selected);
  renderEditorElements();
}

function updateSelectedElement(values) {
  const selected = getSelectedElement();
  if (!selected) return;
  Object.assign(selected, values);
  renderEditorElements();
}

function getNextPosition() {
  const index = state.elements.length;
  return {
    x: 22 + (index * 17) % 58,
    y: 31 + (index * 19) % 56,
  };
}

function getShapeDimensions(shape, size) {
  if (shape === "capsule") {
    return {
      w: clamp(size * 1.55, 18, 100),
      h: Math.max(7, size * 0.55 * POSTER_WIDTH_TO_HEIGHT),
    };
  }
  if (shape === "arch") {
    return { w: size, h: clamp(size * 1.22 * POSTER_WIDTH_TO_HEIGHT, 12, 100) };
  }
  return { w: size, h: size * POSTER_WIDTH_TO_HEIGHT };
}

function createElementNode(item) {
  const node = document.createElement("div");
  node.className = `poster-item is-${item.kind}`;
  if (item.kind === "shape") node.classList.add(`shape-${item.shape}`);
  node.classList.toggle("is-selected", item.id === state.selectedElementId);
  node.dataset.elementId = item.id;
  node.style.setProperty("--item-color", item.color);
  node.style.setProperty("--x", item.x);
  node.style.setProperty("--y", item.y);
  node.style.setProperty("--w", item.w);
  node.style.setProperty("--h", item.h);
  node.style.setProperty("--font-size", item.fontSize || 34);

  if (item.kind === "image" && item.image) {
    const img = document.createElement("img");
    img.src = item.image;
    img.alt = "";
    node.append(img);
  } else {
    node.textContent = item.text;
  }

  return node;
}

function renderEditorElements() {
  elementLayout.innerHTML = "";
  elementLayout.append(createElementNode(state.title));
  state.elements.forEach((item) => elementLayout.append(createElementNode(item)));
}

function addElement() {
  if (state.elements.length >= MAX_ELEMENTS) return;

  const position = getNextPosition();
  const size = Number(elementSize.value);
  const kind = state.elementKind;
  const shape = kind === "shape" ? shapeType.value : "square";
  const shapeDimensions = getShapeDimensions(shape, size);
  const element = {
    id: createId(),
    kind,
    color: elementColor.value,
    text: kind === "text" ? (elementText.value.trim() || "Poster note") : "",
    image: kind === "image" ? state.imageData : "",
    x: position.x,
    y: position.y,
    w: kind === "shape" ? shapeDimensions.w : size,
    h: kind === "text" ? Math.max(12, size * 0.4) : kind === "shape" ? shapeDimensions.h : size,
    fontSize: kind === "text" ? clamp(size * 0.95, 16, 110) : Number(fontSize.value),
    shape,
    size,
  };

  if (kind === "image" && !state.imageData) {
    element.text = "Image";
    element.kind = "text";
  }

  state.elements.push(element);
  selectElement(element.id);
}

function deleteSelectedElement() {
  if (state.selectedElementId === TITLE_ID) return;
  state.elements = state.elements.filter((item) => item.id !== state.selectedElementId);
  selectElement(TITLE_ID);
}

function duplicateSelectedElement() {
  const selected = getSelectedElement();
  if (!selected || selected.id === TITLE_ID || state.elements.length >= MAX_ELEMENTS) return;
  const copy = {
    ...selected,
    id: createId(),
    x: clamp(selected.x + 7, selected.w / 2, 100 - selected.w / 2),
    y: clamp(selected.y + 7, selected.h / 2, 100 - selected.h / 2),
  };
  state.elements.push(copy);
  selectElement(copy.id);
}

function bringSelectedForward() {
  const index = state.elements.findIndex((item) => item.id === state.selectedElementId);
  if (index < 0 || index === state.elements.length - 1) return;
  const [item] = state.elements.splice(index, 1);
  state.elements.splice(index + 1, 0, item);
  renderEditorElements();
  syncControls(item);
}

function resetEditor() {
  state.title = { ...defaultTitle };
  state.elements = [];
  state.imageData = "";
  state.selectedElementId = TITLE_ID;
  elementText.value = "Poster note";
  elementColor.value = "#1649ff";
  posterColor.value = "#ffffff";
  elementSize.value = "34";
  fontSize.value = "34";
  shapeType.value = "circle";
  imageUpload.value = "";
  posterEditor.style.setProperty("--poster-bg", posterColor.value);
  updateToolSelection("text");
  selectElement(TITLE_ID);
}

function wrapLines(text, maxChars = 13, maxLines = 3) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > maxChars && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines.slice(0, maxLines);
}

function renderSvgElement(item, area) {
  const itemWidth = area.width * (item.w / 100);
  const itemHeight = area.height * (item.h / 100);
  const x = area.x + area.width * (item.x / 100) - itemWidth / 2;
  const y = area.y + area.height * (item.y / 100) - itemHeight / 2;
  const color = escapeXml(item.color);

  if (item.kind === "image" && item.image) {
    return `<image href="${escapeXml(item.image)}" x="${x}" y="${y}" width="${itemWidth}" height="${itemHeight}" preserveAspectRatio="xMidYMid slice"/>`;
  }

  if (item.kind === "shape") {
    const right = x + itemWidth;
    const bottom = y + itemHeight;
    const centerX = x + itemWidth / 2;
    const centerY = y + itemHeight / 2;

    if (item.shape === "circle") {
      const radius = Math.min(itemWidth, itemHeight) / 2;
      return `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${color}"/>`;
    }
    if (item.shape === "triangle") {
      return `<polygon points="${centerX},${y} ${right},${bottom} ${x},${bottom}" fill="${color}"/>`;
    }
    if (item.shape === "star") {
      const points = [
        [50, 0], [61, 35], [98, 35], [68, 57], [79, 94],
        [50, 72], [21, 94], [32, 57], [2, 35], [39, 35],
      ].map(([px, py]) => `${x + itemWidth * px / 100},${y + itemHeight * py / 100}`).join(" ");
      return `<polygon points="${points}" fill="${color}"/>`;
    }
    if (item.shape === "hexagon") {
      return `<polygon points="${x + itemWidth * 0.25},${y} ${x + itemWidth * 0.75},${y} ${right},${centerY} ${x + itemWidth * 0.75},${bottom} ${x + itemWidth * 0.25},${bottom} ${x},${centerY}" fill="${color}"/>`;
    }
    if (item.shape === "diamond") {
      return `<polygon points="${centerX},${y} ${right},${centerY} ${centerX},${bottom} ${x},${centerY}" fill="${color}"/>`;
    }
    if (item.shape === "cross") {
      const points = [
        [35, 0], [65, 0], [65, 35], [100, 35], [100, 65], [65, 65],
        [65, 100], [35, 100], [35, 65], [0, 65], [0, 35], [35, 35],
      ].map(([px, py]) => `${x + itemWidth * px / 100},${y + itemHeight * py / 100}`).join(" ");
      return `<polygon points="${points}" fill="${color}"/>`;
    }
    if (item.shape === "ring") {
      const radius = Math.min(itemWidth, itemHeight) * 0.4;
      const strokeWidth = Math.max(6, Math.min(itemWidth, itemHeight) * 0.15);
      return `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"/>`;
    }
    if (item.shape === "capsule") {
      return `<rect x="${x}" y="${y}" width="${itemWidth}" height="${itemHeight}" rx="${itemHeight / 2}" fill="${color}"/>`;
    }
    if (item.shape === "arch") {
      return `<path d="M ${x} ${bottom} L ${x} ${centerY} A ${itemWidth / 2} ${itemHeight / 2} 0 0 1 ${right} ${centerY} L ${right} ${bottom} Z" fill="${color}"/>`;
    }
    return `<rect x="${x}" y="${y}" width="${itemWidth}" height="${itemHeight}" fill="${color}"/>`;
  }

  const lines = wrapLines(item.text, item.kind === "title" ? 18 : 13, item.kind === "title" ? 2 : 4);
  const lineHeight = (item.fontSize || 34) * 1.05;
  return lines.map((line, lineIndex) => {
    const offset = lineIndex - (lines.length - 1) / 2;
    const lineY = y + itemHeight / 2 + offset * lineHeight + (item.fontSize || 34) * 0.34;
    return `<text x="${x + itemWidth / 2}" y="${lineY}" text-anchor="middle" font-size="${item.fontSize || 34}" font-weight="800" fill="${color}">${escapeXml(line)}</text>`;
  }).join("");
}

function buildPosterSvg() {
  const width = 520;
  const height = 734;
  const bg = posterColor.value;
  const area = { x: 0, y: 0, width, height };
  const elementsMarkup = [state.title, ...state.elements].map((item) => renderSvgElement(item, area)).join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="${escapeXml(bg)}"/>
      ${elementsMarkup}
      <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#111" stroke-width="4"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

function openUploadModal() {
  uploadModal.hidden = false;
  document.body.classList.add("is-modal-open");
}

function closeUploadModal() {
  uploadModal.hidden = true;
  document.body.classList.remove("is-modal-open");
}

function uploadPoster() {
  const poster = {
    id: createId(),
    title: state.title.text || "Title",
    createdAt: new Date().toISOString(),
    image: buildPosterSvg(),
    wall: getRandomWallPlacement(),
  };

  state.posters.unshift(poster);
  savePosters();
  renderBoard();
  closeUploadModal();
  resetEditor();
  setView("board");
}

function expandPoster(posterId) {
  const poster = getBoardPosters().find((item) => item.id === posterId);
  if (!poster) return;
  lightboxImage.src = poster.image;
  posterLightbox.hidden = false;
  posterLightbox.classList.remove("is-closing");
  document.body.classList.add("is-modal-open");
  requestAnimationFrame(() => posterLightbox.classList.add("is-open"));
}

function closeLightbox() {
  if (posterLightbox.hidden) return;
  posterLightbox.classList.remove("is-open");
  posterLightbox.classList.add("is-closing");
  window.setTimeout(() => {
    posterLightbox.hidden = true;
    posterLightbox.classList.remove("is-closing");
    lightboxImage.src = "";
  }, 260);
  document.body.classList.remove("is-modal-open");
}

function handleImageUpload(event) {
  const [file] = event.target.files;
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    state.imageData = String(reader.result);
    const selected = getSelectedElement();
    if (selected?.kind === "image") {
      updateSelectedElement({ image: state.imageData });
      return;
    }
    state.selectedElementId = "";
    updateToolSelection("image");
    syncControls(null);
    renderEditorElements();
  });
  reader.readAsDataURL(file);
}

function updateSelectedSize(size) {
  const selected = getSelectedElement();
  if (!selected) {
    if (state.elementKind === "text") {
      fontSize.value = String(Math.round(clamp(size * 0.95, 16, 110)));
    }
    return;
  }

  const next = { w: size };
  if (selected.kind === "text" || selected.kind === "title") {
    next.h = Math.max(10, size * 0.38);
    next.fontSize = clamp(selected.kind === "title" ? size * 1.1 : size * 0.95, 16, 110);
    fontSize.value = String(Math.round(next.fontSize));
  } else if (selected.kind === "shape") {
    next.size = size;
    Object.assign(next, getShapeDimensions(selected.shape, size));
  } else {
    next.h = size;
  }

  updateSelectedElement(next);
}

document.addEventListener("click", (event) => {
  const buildingTarget = event.target.closest("[data-building]");
  if (buildingTarget) {
    switchBuilding(buildingTarget.dataset.building);
    return;
  }

  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;

  const { action } = actionTarget.dataset;

  if (action === "show-editor") {
    setView("editor");
  }

  if (action === "open-building-menu") {
    openBuildingMenu();
  }

  if (action === "close-building-menu") {
    closeBuildingMenu();
  }

  if (action === "show-board") {
    event.preventDefault();
    setView("board");
  }

  if (action === "go-back" && page.dataset.view === "editor") {
    event.preventDefault();
    setView("board");
  }

  if (action === "add-element") addElement();
  if (action === "delete-element") deleteSelectedElement();
  if (action === "duplicate-element") duplicateSelectedElement();
  if (action === "bring-forward") bringSelectedForward();
  if (action === "confirm-upload") openUploadModal();
  if (action === "cancel-upload") closeUploadModal();
  if (action === "upload-poster") uploadPoster();
  if (action === "expand-poster") expandPoster(actionTarget.dataset.posterId);
});

document.querySelectorAll(".tool-choice").forEach((button) => {
  button.addEventListener("click", () => {
    state.selectedElementId = "";
    updateToolSelection(button.dataset.kind);
    syncControls(null);
    renderEditorElements();
  });
});

posterColor.addEventListener("input", () => {
  posterEditor.style.setProperty("--poster-bg", posterColor.value);
});

elementText.addEventListener("input", () => {
  updateSelectedElement({ text: elementText.value });
});

elementColor.addEventListener("input", () => {
  updateSelectedElement({ color: elementColor.value });
});

elementSize.addEventListener("input", () => {
  updateSelectedSize(Number(elementSize.value));
});

fontSize.addEventListener("input", () => {
  updateSelectedElement({ fontSize: Number(fontSize.value) });
});

shapeType.addEventListener("change", () => {
  const selected = getSelectedElement();
  if (!selected || selected.kind !== "shape") return;
  selected.shape = shapeType.value;
  Object.assign(selected, getShapeDimensions(selected.shape, selected.size || Number(elementSize.value)));
  renderEditorElements();
  syncControls(selected);
});

imageUpload.addEventListener("change", handleImageUpload);

elementLayout.addEventListener("pointerdown", (event) => {
  const item = event.target.closest(".poster-item");
  if (!item) return;

  const selected = item.dataset.elementId === TITLE_ID
    ? state.title
    : state.elements.find((element) => element.id === item.dataset.elementId);
  if (!selected) return;

  selectElement(selected.id);
  state.drag = {
    id: selected.id,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    elementX: selected.x,
    elementY: selected.y,
  };
});

document.addEventListener("pointermove", (event) => {
  if (!state.drag || state.drag.pointerId !== event.pointerId) return;
  const selected = getSelectedElement();
  if (!selected) return;

  const rect = elementLayout.getBoundingClientRect();
  const deltaX = ((event.clientX - state.drag.startX) / rect.width) * 100;
  const deltaY = ((event.clientY - state.drag.startY) / rect.height) * 100;
  selected.x = clamp(state.drag.elementX + deltaX, selected.w / 2, 100 - selected.w / 2);
  selected.y = clamp(state.drag.elementY + deltaY, selected.h / 2, 100 - selected.h / 2);
  renderEditorElements();
});

document.addEventListener("pointerup", () => {
  state.drag = null;
});

uploadModal.addEventListener("click", (event) => {
  if (event.target === uploadModal) closeUploadModal();
});

posterLightbox.addEventListener("click", closeLightbox);
buildingOverlay.addEventListener("click", (event) => {
  if (event.target === buildingOverlay) closeBuildingMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Backspace" && page.dataset.view === "editor" && document.activeElement === document.body) {
    deleteSelectedElement();
  }
  if (event.key !== "Escape") return;
  closeUploadModal();
  closeLightbox();
  closeBuildingMenu();
});

window.addEventListener("popstate", () => {
  const building = getBuildingFromUrl();
  if (building !== state.building) switchBuilding(building, false);
});

state.building = getBuildingFromUrl();
if (!new URLSearchParams(window.location.search).has("bldg")) {
  const url = new URL(window.location.href);
  url.searchParams.set("bldg", state.building);
  window.history.replaceState({ building: state.building }, "", url);
}
loadPosters();
renderBoard();
resetEditor();
updateBuildingIdentity();
