const STORAGE_KEY = "bldg-500-posters";
const MAX_ELEMENTS = 18;
const TITLE_ID = "poster-title";

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
  elementKind: "text",
  imageData: "",
  title: { ...defaultTitle },
  elements: [],
  posters: [],
  selectedElementId: TITLE_ID,
  drag: null,
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

function loadPosters() {
  try {
    state.posters = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    state.posters = [];
  }
}

function savePosters() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.posters));
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

function getOrdinalSuffix(day) {
  if (day > 10 && day < 14) return "th";
  const lastDigit = day % 10;
  if (lastDigit === 1) return "st";
  if (lastDigit === 2) return "nd";
  if (lastDigit === 3) return "rd";
  return "th";
}

function formatDate(dateValue) {
  const date = new Date(dateValue);
  const month = date.toLocaleString("en-US", { month: "long" });
  const day = date.getDate();
  return `${month} ${day}${getOrdinalSuffix(day)}`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setView(viewName) {
  page.dataset.view = viewName;
  const isEditor = viewName === "editor";
  boardView.hidden = isEditor;
  editorView.hidden = !isEditor;
  if (isEditor) selectElement(state.selectedElementId || TITLE_ID);
}

function renderBoard() {
  postersGrid.innerHTML = "";

  state.posters.forEach((poster) => {
    const card = document.createElement("figure");
    card.className = "poster-card";

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = "expand-poster";
    button.dataset.posterId = poster.id;
    button.setAttribute("aria-label", "Expand poster");

    const img = document.createElement("img");
    img.src = poster.image;
    img.alt = poster.title || "Uploaded poster";

    const caption = document.createElement("figcaption");
    caption.textContent = formatDate(poster.createdAt);

    button.append(img);
    card.append(button, caption);
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
  elementSize.value = String(Math.round(item?.w || 34));
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

function createElementNode(item) {
  const node = document.createElement("div");
  node.className = `poster-item is-${item.kind}`;
  node.classList.toggle("is-selected", item.id === state.selectedElementId);
  node.dataset.elementId = item.id;
  node.style.setProperty("--item-color", item.color);
  node.style.setProperty("--x", item.x);
  node.style.setProperty("--y", item.y);
  node.style.setProperty("--w", item.w);
  node.style.setProperty("--h", item.h);
  node.style.setProperty("--font-size", item.fontSize || 34);
  node.style.setProperty("--shape-rotation", item.shape === "diamond" ? "45deg" : "0deg");
  node.style.setProperty("--shape-radius", item.shape === "circle" ? "999px" : "0");

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
  const element = {
    id: createId(),
    kind,
    color: elementColor.value,
    text: kind === "text" ? (elementText.value.trim() || "Poster note") : "",
    image: kind === "image" ? state.imageData : "",
    x: position.x,
    y: position.y,
    w: kind === "shape" && shapeType.value === "bar" ? clamp(size * 1.5, 18, 100) : size,
    h: kind === "text" ? Math.max(12, size * 0.4) : kind === "shape" && shapeType.value === "bar" ? Math.max(10, size * 0.24) : size,
    fontSize: kind === "text" ? clamp(size * 0.95, 16, 110) : Number(fontSize.value),
    shape: kind === "shape" ? shapeType.value : "rect",
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
    if (item.shape === "circle") {
      return `<ellipse cx="${x + itemWidth / 2}" cy="${y + itemHeight / 2}" rx="${itemWidth / 2}" ry="${itemHeight / 2}" fill="${color}"/>`;
    }
    if (item.shape === "diamond") {
      return `<rect x="${x}" y="${y}" width="${itemWidth}" height="${itemHeight}" fill="${color}" transform="rotate(45 ${x + itemWidth / 2} ${y + itemHeight / 2})"/>`;
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
  };

  state.posters.unshift(poster);
  savePosters();
  renderBoard();
  closeUploadModal();
  resetEditor();
  setView("board");
}

function expandPoster(posterId) {
  const poster = state.posters.find((item) => item.id === posterId);
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
  } else if (selected.kind === "shape" && selected.shape === "bar") {
    next.h = Math.max(8, size * 0.24);
  } else {
    next.h = size;
  }

  updateSelectedElement(next);
}

document.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;

  const { action } = actionTarget.dataset;

  if (action === "show-editor") {
    setView("editor");
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
  if (selected.shape === "bar") {
    selected.h = Math.max(8, selected.w * 0.24);
  }
  if (selected.shape !== "bar") {
    selected.h = selected.w;
  }
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Backspace" && page.dataset.view === "editor" && document.activeElement === document.body) {
    deleteSelectedElement();
  }
  if (event.key !== "Escape") return;
  closeUploadModal();
  closeLightbox();
});

loadPosters();
renderBoard();
resetEditor();
