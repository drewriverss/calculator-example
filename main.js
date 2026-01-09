// =================================================================
// 1. CONSTANTS & DOM
// =================================================================
const screenTopRow = document.querySelector(".screen-top-row");
const screenBottomRow = document.querySelector(".screen-bottom-row");
const buttonContainer = document.querySelector(".button-container");

const SYMBOLS = { "/": "\u00F7", "*": "\u00D7", "-": "\u2212", "+": "\u002B" };

// =================================================================
// 2. STATE
// =================================================================
let digitBuffer = [];
let num1 = null;
let num2 = null;
let operator = null;
let hasResult = false;

// =================================================================
// 3. MATH ENGINE
// =================================================================
function operate(a, b, op) {
  const operations = {
    "+": a + b,
    "-": a - b,
    "*": a * b,
    "/": a / b
  };
  return operations[op] ?? null;
}

function compute() {
  if (num1 === null || num2 === null || operator === null) return null;

  if (operator === "/" && num2 === 0) {
    return { error: "DIV_BY_ZERO" };
  }

  let result = operate(num1, num2, operator);
  return Math.round(result * 1000) / 1000;
}

function parseCurrentInput() {
  return digitBuffer.length > 0 ? parseFloat(digitBuffer.join("")) : null;
}

// =================================================================
// 4. DISPLAY
// =================================================================
function renderDisplay() {
  if (digitBuffer.length === 0) {
    if (num1 !== null && hasResult) {
      screenBottomRow.textContent = num1;
    } else {
      screenBottomRow.textContent = "0";
    }
  } else {
    screenBottomRow.textContent = digitBuffer.join("");
  }
  updateDecimalState();
}

function renderExpression(forceFullExpression = false) {
  let display = "";

  if (forceFullExpression && num1 !== null && num2 !== null && operator !== null) {
    display = `${num1} ${SYMBOLS[operator]} ${num2}`;
    screenTopRow.textContent = display;
    return;
  }

  if (num1 !== null) {
    display += num1;
  }

  if (operator !== null) {
    display += ` ${SYMBOLS[operator]} `;
  }

  if (operator !== null && !hasResult) {
    if (digitBuffer.length > 0) {
      display += digitBuffer.join("");
    } else if (num2 !== null) {
      display += num2;
    }
  }

  screenTopRow.textContent = display;
}

function updateDecimalState() {
  const pointButton = document.querySelector('[data-value="point"]');
  if (pointButton) {
    const hasDecimal = digitBuffer.includes(".") || screenBottomRow.textContent.includes(".");
    pointButton.disabled = hasDecimal;
  }
}

// =================================================================
// 5. STATE MUTATIONS
// =================================================================
function reset() {
  digitBuffer = [];
  num1 = null;
  num2 = null;
  operator = null;
  hasResult = false;
  renderDisplay();
  renderExpression();
}

function backspace() {
  if (digitBuffer.length > 0) {
    digitBuffer.pop();
    renderDisplay();
    renderExpression();
  }
}

function handleDecimal() {
  if (hasResult) reset();

  if (!digitBuffer.includes(".")) {
    if (digitBuffer.length === 0) digitBuffer.push("0", ".");
    else digitBuffer.push(".");

    renderDisplay();
    renderExpression();
  }
}

function handleDigit(value) {
  if (hasResult) reset();

  if (digitBuffer.length === 1 && digitBuffer[0] === 0) {
    if (value === 0) return;
    digitBuffer.pop();
  }

  digitBuffer.push(value);
  renderDisplay();
  renderExpression();
}

function captureOperand() {
  const parsed = parseCurrentInput();
  if (parsed !== null) {
    if (num1 === null) {
      num1 = parsed;
    } else if (operator !== null && !hasResult) {
      num2 = parsed;
    }
  }
}

function executeCalculation() {
  if (num1 === null || num2 === null || operator === null) return;

  const result = compute();

  if (result && result.error === "DIV_BY_ZERO") {
    reset();
    screenTopRow.textContent = "DIV BY ZERO 🌌";
    screenBottomRow.textContent = "INFINITY";
    return;
  }

  // Antes de sobrescribir num1, actualizamos la pantalla superior con la expresión completa
  renderExpression(true);

  // Actualizamos estado para el siguiente paso
  num1 = result;
  hasResult = true;
  digitBuffer = [];

  // Mostramos el resultado abajo
  screenBottomRow.textContent = result;

  // Limpiamos operator y num2 para la lógica
  operator = null;
  num2 = null;
}

function handleOperator(action) {
  // Encadenamiento: 5 + 5 + ...
  if (num1 !== null && operator !== null && digitBuffer.length > 0 && !hasResult) {
    num2 = parseCurrentInput();

    // Calculamos el intermedio
    const result = compute();

    if (result && result.error === "DIV_BY_ZERO") {
      reset();
      screenTopRow.textContent = "DIV BY ZERO 🌌";
      screenBottomRow.textContent = "INFINITY";
      return;
    }

    num1 = result;
    num2 = null;
    screenBottomRow.textContent = result;
  } else {
    captureOperand();
  }

  const operatorMap = {
    divide: "/",
    multiply: "*",
    subtract: "-",
    add: "+"
  };

  operator = operatorMap[action] || "+";
  hasResult = false;
  digitBuffer = [];
  renderExpression();
}

function handleEquals() {
  if (num1 === null || operator === null) return;

  if (digitBuffer.length > 0) {
    num2 = parseCurrentInput();
  } else if (num2 === null) {
    return;
  }

  executeCalculation();
}

function handleCommand(action) {
  switch (action) {
    case "clear":
      reset();
      break;
    case "backspace":
      backspace();
      break;
    case "equals":
      handleEquals();
      break;
  }
}

// =================================================================
// 6. EVENT LISTENER & INIT
// =================================================================
function findButtonTarget(event) {
  let target = event.target;
  while (target && !target.classList.contains("button") && target !== buttonContainer) {
    target = target.parentElement;
  }
  if (!target || !target.classList.contains("button")) return null;
  return target;
}

const handlers = {
  digit: (action, value) => value === "point" ? handleDecimal() : handleDigit(Number(value)),
  operator: (action) => handleOperator(action),
  command: (action) => handleCommand(action)
};

buttonContainer.addEventListener("click", (event) => {
  const target = findButtonTarget(event);
  if (!target) return;

  const { type, action, value } = target.dataset;
  handlers[type]?.(action, value);
});

// App Initialization
renderDisplay();
renderExpression();