const Y_VALUES = [-3, -2, -1, 0, 1, 2, 3, 4, 5];
const R_VALUES = [1, 1.5, 2, 2.5, 3];

const X_MIN = -3;
const X_MAX = 5;

const STORAGE_KEY = "lab12618_records";

/* Попадание */
function isInside(x, y, r) {
  if (x <= 0 && y >= 0) {
    return x * x + y * y <= r * r;
  }
  if (x <= 0 && y <= 0) {
    return x >= -r && y >= -r;
  }
  if (x >= 0 && y >= 0) {
    return x + y <= r / 2;
  }
  return false;
}

/* localStorage */
function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Не удалось прочитать localStorage:", e);
    return [];
  }
}

function saveRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error("Не удалось записать в localStorage:", e);
  }
}

let records = loadRecords();

/* Дата и время */
function formatDateTime(timestampMs) {
  const date = new Date(timestampMs);
  return date.toLocaleString("ru-RU", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

/* Кнопки Y */
const yGroup = document.getElementById("y_group");
const yInput = document.getElementById("y_input");
let selectedYs = []; 

Y_VALUES.forEach((value) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = value;
  btn.addEventListener("click", () => {
    const index = selectedYs.indexOf(value);
    if (index === -1) {
      selectedYs.push(value);
      btn.classList.add("active");
    } else {
      selectedYs.splice(index, 1);
      btn.classList.remove("active");
    }
    yInput.value = selectedYs.join(","); 
    document.getElementById("y_error").textContent = "";
  });
  yGroup.appendChild(btn);
});

/* Чекбоксы R */
const rGroup = document.getElementById("r_group");
let selectedRs = [];

R_VALUES.forEach((value) => {
  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.value = value;
  const span = document.createElement("span");
  span.textContent = "R = " + value;

  checkbox.addEventListener("change", () => {
    const index = selectedRs.indexOf(value);
    if (checkbox.checked) {
      if (index === -1) selectedRs.push(value);
    } else {
      if (index !== -1) selectedRs.splice(index, 1);
    }
    document.getElementById("r_error").textContent = "";
    drawScene(selectedRs, lastPoints);
  });

  label.appendChild(checkbox);
  label.appendChild(span);
  rGroup.appendChild(label);
});

/* Валидация X */
const xInput = document.getElementById("x_input");
const xError = document.getElementById("x_error");

function parseX(rawValue) {
  const normalized = rawValue.trim().replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return { ok: false, message: "Введите число (например, -1.3)" };
  }
  const value = parseFloat(normalized);
  if (value < X_MIN || value > X_MAX) {
    return { ok: false, message: `Значение должно быть в диапазоне от ${X_MIN} до ${X_MAX}` };
  }
  return { ok: true, value, raw: normalized };
}

xInput.addEventListener("input", () => {
  const rawValue = xInput.value;
  if (rawValue.trim() === "") {
    xInput.classList.remove("invalid");
    xError.textContent = "";
    return;
  }
  const result = parseX(rawValue);
  if (!result.ok) {
    xInput.classList.add("invalid");
    xError.textContent = result.message;
  } else {
    xInput.classList.remove("invalid");
    xError.textContent = "";
  }
});

/* Canvas */
const canvas = document.getElementById("plane");
const ctx = canvas.getContext("2d");

const WORLD_MIN = -6;
const WORLD_MAX = 6;
const PADDING = 30;

function toPx(x) {
  const scale = (canvas.width - 2 * PADDING) / (WORLD_MAX - WORLD_MIN);
  return PADDING + (x - WORLD_MIN) * scale;
}
function toPy(y) {
  const scale = (canvas.height - 2 * PADDING) / (WORLD_MAX - WORLD_MIN);
  return canvas.height - PADDING - (y - WORLD_MIN) * scale;
}

let lastPoints = [];

function drawScene(rs, points) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  const rList = (rs && rs.length) ? rs : [];
  rList.forEach(r => drawRegion(r));

  const axisR = rList.length ? Math.max(...rList) : R_VALUES[0];
  drawAxes(axisR);

  if (points && points.length) {
    points.forEach(p => drawPoint(p.x, p.y, p.hit));
  }
}

function drawGrid() {
  ctx.strokeStyle = "#eef1f4";
  ctx.lineWidth = 1;
  for (let v = WORLD_MIN; v <= WORLD_MAX; v++) {
    ctx.beginPath();
    ctx.moveTo(toPx(v), toPy(WORLD_MIN));
    ctx.lineTo(toPx(v), toPy(WORLD_MAX));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toPx(WORLD_MIN), toPy(v));
    ctx.lineTo(toPx(WORLD_MAX), toPy(v));
    ctx.stroke();
  }
}

function drawRegion(r) {
  ctx.beginPath();
  ctx.moveTo(toPx(-r), toPy(-r));
  ctx.lineTo(toPx(-r), toPy(0));

  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const angle = Math.PI - (Math.PI / 2) * (i / steps);
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    ctx.lineTo(toPx(x), toPy(y));
  }

  ctx.lineTo(toPx(0), toPy(r / 2));
  ctx.lineTo(toPx(r / 2), toPy(0));
  ctx.lineTo(toPx(0), toPy(0));
  ctx.lineTo(toPx(0), toPy(-r));
  ctx.closePath();

  ctx.fillStyle = "rgba(255, 105, 180, 0.45)";
  ctx.fill();
  ctx.strokeStyle = "#FF1493";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawAxes(r) {
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1.5;
  ctx.fillStyle = "#333333";
  ctx.font = "12px sans-serif";

// X
  ctx.beginPath();
  ctx.moveTo(toPx(WORLD_MIN), toPy(0));
  ctx.lineTo(toPx(WORLD_MAX), toPy(0));
  ctx.stroke();

// Стрелочка на X 
  const arrowX = toPx(WORLD_MAX);
  const arrowY = toPy(0);
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY);  
  ctx.lineTo(arrowX - 10, arrowY - 5);
  ctx.lineTo(arrowX - 10, arrowY + 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillText("x", arrowX - 20, arrowY - 8);

// Y
  ctx.beginPath();
  ctx.moveTo(toPx(0), toPy(WORLD_MIN));
  ctx.lineTo(toPx(0), toPy(WORLD_MAX));
  ctx.stroke();

// Стрелочка на Y
  const arrowXy = toPx(0);
  const arrowYy = toPy(WORLD_MAX);
  ctx.beginPath();
  ctx.moveTo(arrowXy, arrowYy);
  ctx.lineTo(arrowXy - 5, arrowYy + 10);
  ctx.lineTo(arrowXy + 5, arrowYy + 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillText("y", arrowXy + 8, arrowYy + 20);

// Метки R на осях
  const marks = [
    { v: -r, label: "-R" },
    { v: -r / 2, label: "-R/2" },
    { v: r / 2, label: "R/2" },
    { v: r, label: "R" },
  ];
  marks.forEach(({ v, label }) => {
// На X
    ctx.beginPath();
    ctx.moveTo(toPx(v), toPy(0) - 4);
    ctx.lineTo(toPx(v), toPy(0) + 4);
    ctx.stroke();
    ctx.fillText(label, toPx(v) - 10, toPy(0) + 18);

// На Y
    ctx.beginPath();
    ctx.moveTo(toPx(0) - 4, toPy(v));
    ctx.lineTo(toPx(0) + 4, toPy(v));
    ctx.stroke();
    ctx.fillText(label, toPx(0) + 8, toPy(v) + 4);
  });
}

function drawPoint(x, y, hit) {
  ctx.beginPath();
  ctx.arc(toPx(x), toPy(y), 6, 0, Math.PI * 2);
  ctx.fillStyle = hit ? "#1a7f37" : "#c0392b";
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

/* Таблица результатов */
const resultsBody = document.getElementById("result_body");
const emptyHint = document.getElementById("empty_hint");

function renderResults() {
  resultsBody.innerHTML = "";
  emptyHint.style.display = records.length ? "none" : "block";

  records.forEach((rec, index) => {
    const tr = document.createElement("tr");

    const cells = [
      index + 1,
      rec.xDisplay !== undefined ? rec.xDisplay : rec.x,
      rec.y,
      rec.r,
      rec.hit ? "Попадает" : "Не попадает",
      formatDateTime(rec.ts),
    ];

    cells.forEach((value, i) => {
      const td = document.createElement("td");
      td.textContent = value;
      if (i === 4) td.classList.add(rec.hit ? "hit" : "miss");
      tr.appendChild(td);
    });

    resultsBody.appendChild(tr);
  });
}

/* Отправка формы */
const form = document.getElementById("point_form");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  let valid = true;

  const xResult = parseX(xInput.value);
  if (!xResult.ok) {
    xInput.classList.add("invalid");
    xError.textContent = xResult.message || "Заполните поле X";
    valid = false;
  }

  if (selectedYs.length === 0) {
    document.getElementById("y_error").textContent = "Выберите хотя бы одно значение Y";
    valid = false;
  }

  if (selectedRs.length === 0) {
    document.getElementById("r_error").textContent = "Выберите хотя бы одно значение R";
    valid = false;
  }

  if (!valid) return;

  const x = xResult.value;
  const xDisplay = xResult.raw;

  selectedRs.forEach(r => {
    selectedYs.forEach(y => {
      const hit = isInside(x, y, r);
      const record = { x, xDisplay, y, r, hit, ts: Date.now() };
      records.push(record);
    });
  });

  const newPoints = selectedYs.map(y => ({
    x,
    y,
    hit: selectedRs.some(r => isInside(x, y, r)),
  }));

  saveRecords(records);
  renderResults();

  lastPoints = newPoints;
  drawScene(selectedRs, lastPoints);
});

/* Очистка истории */
document.getElementById("clear_btn").addEventListener("click", () => {
  records = [];
  saveRecords(records);
  renderResults();
  lastPoints = [];
  drawScene(selectedRs, null);
});

/* Инициализация */
renderResults();
drawScene(selectedRs, null);