const SVG_NS = "http://www.w3.org/2000/svg";
const GRID_SIZE = 20;
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 900;

const PART_PRESETS = {
  door: { label: "ドア", width: 80, height: 20, fill: "#f5e7cc", symbol: "D" },
  window: { label: "窓", width: 90, height: 20, fill: "#d9eef9", symbol: "W" },
  storage: { label: "収納", width: 90, height: 60, fill: "#eee9cf", symbol: "収" },
  toilet: { label: "トイレ", width: 80, height: 60, fill: "#e9f3ff", symbol: "T" },
  bathroom: { label: "浴室", width: 100, height: 80, fill: "#e5f4f0", symbol: "浴" },
  kitchen: { label: "キッチン", width: 120, height: 60, fill: "#f7ece3", symbol: "K" }
};

const state = {
  elements: [],
  selectedId: null,
  drag: null
};

const refs = {
  svg: document.getElementById("floorplan-canvas"),
  nameInput: document.getElementById("element-name"),
  subtextInput: document.getElementById("element-subtext"),
  selectionMeta: document.getElementById("selection-meta"),
  fileInput: document.getElementById("file-input")
};

function snap(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildInitialTemplate() {
  return [
    { id: createId("room"), type: "room", name: "洋室", subtext: "6.0帖", x: 500, y: 180, width: 340, height: 320 },
    { id: createId("room"), type: "room", name: "キッチン", subtext: "3.0帖", x: 320, y: 180, width: 180, height: 180 },
    { id: createId("room"), type: "room", name: "玄関", subtext: "", x: 220, y: 360, width: 100, height: 140 },
    { id: createId("part"), partType: "storage", type: "part", name: "収納", subtext: "", x: 720, y: 180, width: 100, height: 60 },
    { id: createId("part"), partType: "bathroom", type: "part", name: "浴室", subtext: "", x: 220, y: 180, width: 100, height: 100 },
    { id: createId("part"), partType: "toilet", type: "part", name: "トイレ", subtext: "", x: 220, y: 280, width: 100, height: 80 },
    { id: createId("part"), partType: "door", type: "part", name: "ドア", subtext: "", x: 300, y: 500, width: 80, height: 20 },
    { id: createId("part"), partType: "window", type: "part", name: "窓", subtext: "", x: 610, y: 160, width: 120, height: 20 },
    { id: createId("part"), partType: "kitchen", type: "part", name: "キッチン設備", subtext: "", x: 340, y: 220, width: 120, height: 60 }
  ];
}

function getSelectedElement() {
  return state.elements.find((element) => element.id === state.selectedId) || null;
}

function setSelected(id) {
  state.selectedId = id;
  syncInspector();
  render();
}

function syncInspector() {
  const selected = getSelectedElement();
  if (!selected) {
    refs.nameInput.value = "";
    refs.subtextInput.value = "";
    refs.nameInput.disabled = true;
    refs.subtextInput.disabled = true;
    refs.selectionMeta.textContent = "未選択";
    return;
  }

  refs.nameInput.disabled = false;
  refs.subtextInput.disabled = false;
  refs.nameInput.value = selected.name || "";
  refs.subtextInput.value = selected.subtext || "";
  refs.selectionMeta.textContent = `${selected.type === "room" ? "部屋" : "パーツ"} / ${selected.width} × ${selected.height}`;
}

function addRoom() {
  const room = {
    id: createId("room"),
    type: "room",
    name: "新しい部屋",
    subtext: "6.0帖",
    x: 420,
    y: 240,
    width: 200,
    height: 160
  };
  state.elements.push(room);
  setSelected(room.id);
}

function addPart(partType) {
  const preset = PART_PRESETS[partType];
  if (!preset) {
    return;
  }

  const part = {
    id: createId("part"),
    type: "part",
    partType,
    name: preset.label,
    subtext: "",
    x: 360,
    y: 220,
    width: preset.width,
    height: preset.height
  };
  state.elements.push(part);
  setSelected(part.id);
}

function deleteSelected() {
  if (!state.selectedId) {
    return;
  }
  state.elements = state.elements.filter((element) => element.id !== state.selectedId);
  state.selectedId = null;
  syncInspector();
  render();
}

function serializeState() {
  return JSON.stringify(
    {
      version: 1,
      canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, gridSize: GRID_SIZE },
      elements: state.elements
    },
    null,
    2
  );
}

function saveJson() {
  const blob = new Blob([serializeState()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "floorplan.json";
  link.click();
  URL.revokeObjectURL(url);
}

function normalizeElement(element) {
  const width = Math.max(GRID_SIZE * 2, snap(Number(element.width) || GRID_SIZE * 4));
  const height = Math.max(GRID_SIZE * 2, snap(Number(element.height) || GRID_SIZE * 4));
  return {
    ...element,
    x: clamp(snap(Number(element.x) || 0), 0, CANVAS_WIDTH - width),
    y: clamp(snap(Number(element.y) || 0), 0, CANVAS_HEIGHT - height),
    width,
    height
  };
}

function loadJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.elements)) {
        throw new Error("invalid");
      }
      state.elements = data.elements.map(normalizeElement);
      state.selectedId = null;
      syncInspector();
      render();
    } catch (error) {
      window.alert("JSONの読込に失敗しました。形式を確認してください。");
    }
  };
  reader.readAsText(file, "utf-8");
}

function exportPng() {
  const clone = refs.svg.cloneNode(true);
  clone.setAttribute("xmlns", SVG_NS);
  clone.setAttribute("width", CANVAS_WIDTH);
  clone.setAttribute("height", CANVAS_HEIGHT);

  const background = document.createElementNS(SVG_NS, "rect");
  background.setAttribute("width", "100%");
  background.setAttribute("height", "100%");
  background.setAttribute("fill", "#ffffff");
  clone.insertBefore(background, clone.firstChild);

  const svgText = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.drawImage(image, 0, 0);
    URL.revokeObjectURL(url);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "floorplan.png";
    link.click();
  };
  image.src = url;
}

function clientToSvg(event) {
  const point = refs.svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(refs.svg.getScreenCTM().inverse());
}

function beginDrag(event, elementId, mode) {
  event.stopPropagation();
  const element = state.elements.find((item) => item.id === elementId);
  if (!element) {
    return;
  }
  const point = clientToSvg(event);
  state.drag = {
    id: elementId,
    mode,
    startX: point.x,
    startY: point.y,
    originX: element.x,
    originY: element.y,
    originWidth: element.width,
    originHeight: element.height
  };
  setSelected(elementId);
}

function handlePointerMove(event) {
  if (!state.drag) {
    return;
  }

  const element = state.elements.find((item) => item.id === state.drag.id);
  if (!element) {
    return;
  }

  const point = clientToSvg(event);
  const dx = point.x - state.drag.startX;
  const dy = point.y - state.drag.startY;

  if (state.drag.mode === "move") {
    element.x = clamp(snap(state.drag.originX + dx), 0, CANVAS_WIDTH - element.width);
    element.y = clamp(snap(state.drag.originY + dy), 0, CANVAS_HEIGHT - element.height);
  }

  if (state.drag.mode === "resize" && element.type === "room") {
    const newWidth = Math.max(GRID_SIZE * 2, snap(state.drag.originWidth + dx));
    const newHeight = Math.max(GRID_SIZE * 2, snap(state.drag.originHeight + dy));
    element.width = clamp(newWidth, GRID_SIZE * 2, CANVAS_WIDTH - element.x);
    element.height = clamp(newHeight, GRID_SIZE * 2, CANVAS_HEIGHT - element.y);
  }

  syncInspector();
  render();
}

function handlePointerUp() {
  state.drag = null;
}

function createSvgNode(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => {
    node.setAttribute(key, value);
  });
  return node;
}

function renderGrid(layer) {
  for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
    layer.appendChild(
      createSvgNode("line", {
        x1: x,
        y1: 0,
        x2: x,
        y2: CANVAS_HEIGHT,
        stroke: x % (GRID_SIZE * 5) === 0 ? "#d3dfdf" : "#e9f0f0",
        "stroke-width": 1
      })
    );
  }

  for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
    layer.appendChild(
      createSvgNode("line", {
        x1: 0,
        y1: y,
        x2: CANVAS_WIDTH,
        y2: y,
        stroke: y % (GRID_SIZE * 5) === 0 ? "#d3dfdf" : "#e9f0f0",
        "stroke-width": 1
      })
    );
  }
}

function renderRoom(element) {
  const group = createSvgNode("g", { "data-id": element.id });
  const selected = state.selectedId === element.id;

  const rect = createSvgNode("rect", {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rx: 4,
    fill: "#ffffff",
    stroke: selected ? "#1f7a7a" : "#263f3f",
    "stroke-width": selected ? 3 : 2.5
  });

  const label = createSvgNode("text", {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2 - 8,
    "text-anchor": "middle",
    "font-size": 24,
    "font-weight": 700,
    fill: "#213737"
  });
  label.textContent = element.name;

  const subtext = createSvgNode("text", {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2 + 22,
    "text-anchor": "middle",
    "font-size": 17,
    fill: "#586a6a"
  });
  subtext.textContent = element.subtext || "";

  group.append(rect, label, subtext);

  if (selected) {
    const handle = createSvgNode("rect", {
      x: element.x + element.width - 10,
      y: element.y + element.height - 10,
      width: 20,
      height: 20,
      rx: 3,
      fill: "#1f7a7a",
      cursor: "nwse-resize"
    });
    handle.addEventListener("pointerdown", (event) => beginDrag(event, element.id, "resize"));
    group.appendChild(handle);
  }

  group.addEventListener("pointerdown", (event) => beginDrag(event, element.id, "move"));
  return group;
}

function renderPart(element) {
  const preset = PART_PRESETS[element.partType] || PART_PRESETS.storage;
  const selected = state.selectedId === element.id;
  const group = createSvgNode("g", { "data-id": element.id });

  const body = createSvgNode("rect", {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rx: 6,
    fill: preset.fill,
    stroke: selected ? "#1f7a7a" : "#607272",
    "stroke-width": selected ? 2.5 : 1.5
  });

  const symbol = createSvgNode("text", {
    x: element.x + 12,
    y: element.y + 24,
    "font-size": 18,
    "font-weight": 700,
    fill: "#395151"
  });
  symbol.textContent = preset.symbol;

  const label = createSvgNode("text", {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2 + 6,
    "text-anchor": "middle",
    "font-size": 16,
    "font-weight": 700,
    fill: "#314949"
  });
  label.textContent = element.name;

  group.append(body, symbol, label);

  if (element.subtext) {
    const subLabel = createSvgNode("text", {
      x: element.x + element.width / 2,
      y: element.y + element.height + 18,
      "text-anchor": "middle",
      "font-size": 13,
      fill: "#617373"
    });
    subLabel.textContent = element.subtext;
    group.appendChild(subLabel);
  }

  if (selected) {
    group.appendChild(
      createSvgNode("rect", {
        x: element.x - 6,
        y: element.y - 6,
        width: element.width + 12,
        height: element.height + 12,
        fill: "none",
        stroke: "#1f7a7a",
        "stroke-dasharray": "6 4",
        "stroke-width": 1.5
      })
    );
  }

  group.addEventListener("pointerdown", (event) => beginDrag(event, element.id, "move"));
  return group;
}

function renderSelectionFrame(layer) {
  const element = getSelectedElement();
  if (!element || element.type !== "room") {
    return;
  }

  layer.appendChild(
    createSvgNode("rect", {
      x: element.x - 4,
      y: element.y - 4,
      width: element.width + 8,
      height: element.height + 8,
      fill: "none",
      stroke: "#69a9a9",
      "stroke-dasharray": "10 6",
      "stroke-width": 1.5
    })
  );
}

function render() {
  refs.svg.innerHTML = "";

  refs.svg.appendChild(
    createSvgNode("rect", {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      fill: "#ffffff"
    })
  );

  const gridLayer = createSvgNode("g");
  renderGrid(gridLayer);
  refs.svg.appendChild(gridLayer);

  const elementLayer = createSvgNode("g");
  state.elements.forEach((element) => {
    elementLayer.appendChild(element.type === "room" ? renderRoom(element) : renderPart(element));
  });
  refs.svg.appendChild(elementLayer);

  const overlayLayer = createSvgNode("g");
  renderSelectionFrame(overlayLayer);
  refs.svg.appendChild(overlayLayer);
}

function setupEvents() {
  document.querySelector("[data-add-room]").addEventListener("click", addRoom);

  document.querySelectorAll("[data-add-part]").forEach((button) => {
    button.addEventListener("click", () => addPart(button.dataset.addPart));
  });

  document.getElementById("delete-button").addEventListener("click", deleteSelected);
  document.getElementById("save-button").addEventListener("click", saveJson);
  document.getElementById("load-button").addEventListener("click", () => refs.fileInput.click());
  document.getElementById("export-button").addEventListener("click", exportPng);

  refs.fileInput.addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (file) {
      loadJson(file);
    }
    event.target.value = "";
  });

  refs.nameInput.addEventListener("input", (event) => {
    const selected = getSelectedElement();
    if (!selected) {
      return;
    }
    selected.name = event.target.value;
    render();
  });

  refs.subtextInput.addEventListener("input", (event) => {
    const selected = getSelectedElement();
    if (!selected) {
      return;
    }
    selected.subtext = event.target.value;
    render();
  });

  refs.svg.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  refs.svg.addEventListener("pointerdown", () => setSelected(null));

  window.addEventListener("keydown", (event) => {
    if (event.key === "Delete") {
      deleteSelected();
    }
  });
}

function init() {
  state.elements = buildInitialTemplate();
  syncInspector();
  setupEvents();
  render();
}

init();
