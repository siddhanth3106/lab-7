/**
 * MathCalc Pro - Mathematical Operations Engine
 * Lab 07: Form Elements and JavaScript Arithmetic
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Element Selectors ---
  const calcForm = document.getElementById('calcForm');
  const num1Input = document.getElementById('firstNumber');
  const num2Input = document.getElementById('secondNumber');
  const num1Error = document.getElementById('num1Error');
  const num2Error = document.getElementById('num2Error');
  const clearNum1Btn = document.getElementById('clearNum1');
  const clearNum2Btn = document.getElementById('clearNum2');
  const quickSwapBtn = document.getElementById('quickSwapBtn');
  const resetBtn = document.getElementById('resetBtn');

  // Result Area Elements
  const resultPlaceholder = document.querySelector('.result-placeholder');
  const resultDisplay = document.getElementById('resultDisplay');
  const errorBanner = document.getElementById('errorBanner');
  const errorMessage = document.getElementById('errorMessage');
  const operationBadge = document.getElementById('operationBadge');
  const equationOutput = document.getElementById('equationOutput');
  const resultValue = document.getElementById('resultValue');
  const detailType = document.getElementById('detailType');
  const detailParity = document.getElementById('detailParity');
  const detailFormula = document.getElementById('detailFormula');
  const copyResultBtn = document.getElementById('copyResultBtn');
  const useAsInputBtn = document.getElementById('useAsInputBtn');

  // Sidebar / History Elements
  const historyList = document.getElementById('historyList');
  const historyEmpty = document.getElementById('historyEmpty');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const presetButtons = document.querySelectorAll('.preset-pill');
  const toast = document.getElementById('toast');

  // In-memory / LocalStorage state
  let currentResult = null;
  const STORAGE_KEY = 'mathcalc_history_lab7';
  let historyData = loadHistoryFromStorage();

  // Initialize UI
  renderHistory();
  setupInputListeners();

  // --- Core Calculation Logic ---

  /**
   * Performs the arithmetic calculation based on operator and inputs.
   * @param {number} a - First operand
   * @param {number} b - Second operand
   * @param {string} operation - Operation name ('add', 'subtract', 'multiply', 'divide', 'modulo', 'power')
   * @returns {Object} { success: boolean, result?: number, error?: string, symbol: string, name: string, formula: string }
   */
  function compute(a, b, operation) {
    let result = 0;
    let symbol = '+';
    let name = 'Addition';
    let formula = 'A + B';

    switch (operation) {
      case 'add':
        result = a + b;
        symbol = '+';
        name = 'Addition';
        formula = `${a} + ${b}`;
        break;

      case 'subtract':
        result = a - b;
        symbol = '−';
        name = 'Subtraction';
        formula = `${a} − ${b}`;
        break;

      case 'multiply':
        result = a * b;
        symbol = '×';
        name = 'Multiplication';
        formula = `${a} × ${b}`;
        break;

      case 'divide':
        symbol = '÷';
        name = 'Division';
        formula = `${a} ÷ ${b}`;
        if (b === 0) {
          return {
            success: false,
            error: 'Mathematical Error: Division by zero is undefined.',
            symbol,
            name,
            formula
          };
        }
        result = a / b;
        break;

      case 'modulo':
        symbol = '%';
        name = 'Modulus';
        formula = `${a} mod ${b}`;
        if (b === 0) {
          return {
            success: false,
            error: 'Mathematical Error: Modulo by zero is undefined.',
            symbol,
            name,
            formula
          };
        }
        result = a % b;
        break;

      case 'power':
        symbol = '^';
        name = 'Exponentiation';
        formula = `${a}^${b}`;
        result = Math.pow(a, b);
        if (isNaN(result) || !isFinite(result)) {
          return {
            success: false,
            error: 'Calculation resulted in an undefined or infinite number.',
            symbol,
            name,
            formula
          };
        }
        break;

      default:
        return {
          success: false,
          error: 'Unrecognized mathematical operation requested.',
          symbol: '?',
          name: 'Unknown',
          formula: ''
        };
    }

    // Fix floating point precision artifacts (e.g. 0.1 + 0.2 = 0.30000000000000004)
    result = cleanFloatPrecision(result);

    return {
      success: true,
      result,
      symbol,
      name,
      formula
    };
  }

  /**
   * Normalizes floating point numbers to eliminate JavaScript IEEE 754 precision inaccuracies.
   */
  function cleanFloatPrecision(num) {
    if (!Number.isFinite(num)) return num;
    // Format to 12 decimal places max, then convert back to number to strip trailing zeroes
    return parseFloat(num.toPrecision(12));
  }

  // --- Form Submission Handler ---
  calcForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Reset previous error messages
    clearFieldErrors();

    const val1 = num1Input.value.trim();
    const val2 = num2Input.value.trim();
    let hasError = false;

    // Validate First Operand
    if (val1 === '') {
      showFieldError(num1Input, num1Error, 'Please enter the first operand.');
      hasError = true;
    } else if (isNaN(Number(val1))) {
      showFieldError(num1Input, num1Error, 'Please enter a valid numeric value.');
      hasError = true;
    }

    // Validate Second Operand
    if (val2 === '') {
      showFieldError(num2Input, num2Error, 'Please enter the second operand.');
      hasError = true;
    } else if (isNaN(Number(val2))) {
      showFieldError(num2Input, num2Error, 'Please enter a valid numeric value.');
      hasError = true;
    }

    if (hasError) {
      hideResults();
      return;
    }

    const a = parseFloat(val1);
    const b = parseFloat(val2);
    const selectedOp = document.querySelector('input[name="operation"]:checked')?.value || 'add';

    const calculation = compute(a, b, selectedOp);

    if (!calculation.success) {
      displayError(calculation.error);
    } else {
      currentResult = calculation.result;
      displayResult(a, b, calculation);
      addHistoryRecord(a, b, calculation);
    }
  });

  // --- Display Result View ---
  function displayResult(a, b, calc) {
    hideError();
    resultPlaceholder.classList.add('hidden');
    resultDisplay.classList.remove('hidden');

    operationBadge.textContent = calc.name;
    equationOutput.textContent = `${a} ${calc.symbol} ${b} = ${calc.result}`;
    resultValue.textContent = calc.result;

    // Additional mathematical analysis
    const isInt = Number.isInteger(calc.result);
    detailType.textContent = isInt ? 'Integer' : 'Floating-point Decimal';

    if (calc.result === 0) {
      detailParity.textContent = 'Zero';
    } else {
      const sign = calc.result > 0 ? 'Positive' : 'Negative';
      if (isInt) {
        const parity = Math.abs(calc.result) % 2 === 0 ? 'Even' : 'Odd';
        detailParity.textContent = `${sign} ${parity}`;
      } else {
        detailParity.textContent = sign;
      }
    }

    detailFormula.textContent = `A ${calc.symbol} B`;
  }

  // --- Error Display ---
  function displayError(message) {
    resultPlaceholder.classList.add('hidden');
    resultDisplay.classList.add('hidden');
    errorBanner.classList.remove('hidden');
    errorMessage.textContent = message;
  }

  function hideError() {
    errorBanner.classList.add('hidden');
  }

  function hideResults() {
    resultPlaceholder.classList.remove('hidden');
    resultDisplay.classList.add('hidden');
    hideError();
  }

  // --- Field Validation Feedback ---
  function showFieldError(input, errorElement, message) {
    input.closest('.input-wrapper').classList.add('error-state');
    errorElement.textContent = message;
    input.focus();
  }

  function clearFieldErrors() {
    num1Input.closest('.input-wrapper').classList.remove('error-state');
    num2Input.closest('.input-wrapper').classList.remove('error-state');
    num1Error.textContent = '';
    num2Error.textContent = '';
  }

  // --- Input Listeners & Clear Buttons ---
  function setupInputListeners() {
    [num1Input, num2Input].forEach(input => {
      input.addEventListener('input', () => {
        updateClearButtonVisibility();
        input.closest('.input-wrapper').classList.remove('error-state');
        if (input === num1Input) num1Error.textContent = '';
        if (input === num2Input) num2Error.textContent = '';
      });
    });

    clearNum1Btn.addEventListener('click', () => {
      num1Input.value = '';
      clearNum1Btn.classList.remove('visible');
      num1Input.focus();
    });

    clearNum2Btn.addEventListener('click', () => {
      num2Input.value = '';
      clearNum2Btn.classList.remove('visible');
      num2Input.focus();
    });

    // Reset button logic
    resetBtn.addEventListener('click', () => {
      setTimeout(() => {
        clearFieldErrors();
        hideResults();
        updateClearButtonVisibility();
        document.getElementById('op-add').checked = true;
        currentResult = null;
      }, 10);
    });

    // Quick swap values button
    quickSwapBtn.addEventListener('click', () => {
      const temp = num1Input.value;
      num1Input.value = num2Input.value;
      num2Input.value = temp;
      updateClearButtonVisibility();

      // Trigger animation feedback
      quickSwapBtn.style.transform = 'scale(0.92)';
      setTimeout(() => {
        quickSwapBtn.style.transform = '';
      }, 150);

      // If both inputs have values, recalculate immediately
      if (num1Input.value.trim() !== '' && num2Input.value.trim() !== '') {
        calcForm.dispatchEvent(new Event('submit'));
      }
    });

    // Copy result button
    copyResultBtn.addEventListener('click', () => {
      if (currentResult !== null) {
        navigator.clipboard.writeText(currentResult.toString()).then(() => {
          showToast(`Copied result (${currentResult}) to clipboard!`);
        }).catch(() => {
          showToast('Failed to copy to clipboard.');
        });
      }
    });

    // Use current result as first operand
    useAsInputBtn.addEventListener('click', () => {
      if (currentResult !== null) {
        num1Input.value = currentResult;
        num2Input.value = '';
        updateClearButtonVisibility();
        num2Input.focus();
        showToast('Set as First Operand (A)');
      }
    });

    // Preset Buttons
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const a = btn.getAttribute('data-a');
        const b = btn.getAttribute('data-b');
        const op = btn.getAttribute('data-op');

        num1Input.value = a;
        num2Input.value = b;

        const radio = document.querySelector(`input[name="operation"][value="${op}"]`);
        if (radio) radio.checked = true;

        updateClearButtonVisibility();
        calcForm.dispatchEvent(new Event('submit'));
      });
    });

    // Clear History Button
    clearHistoryBtn.addEventListener('click', () => {
      if (historyData.length === 0) return;
      if (confirm('Are you sure you want to clear your calculation history?')) {
        historyData = [];
        saveHistoryToStorage();
        renderHistory();
        showToast('History cleared.');
      }
    });
  }

  function updateClearButtonVisibility() {
    clearNum1Btn.classList.toggle('visible', num1Input.value.length > 0);
    clearNum2Btn.classList.toggle('visible', num2Input.value.length > 0);
  }

  // --- History Management ---
  function addHistoryRecord(a, b, calc) {
    const item = {
      id: Date.now(),
      a,
      b,
      operation: document.querySelector('input[name="operation"]:checked').value,
      symbol: calc.symbol,
      result: calc.result,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    historyData.unshift(item);
    if (historyData.length > 20) {
      historyData.pop(); // Keep maximum 20 items
    }

    saveHistoryToStorage();
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = '';

    if (historyData.length === 0) {
      historyEmpty.classList.remove('hidden');
      return;
    }

    historyEmpty.classList.add('hidden');

    historyData.forEach(item => {
      const li = document.createElement('li');
      li.className = 'history-item';
      li.title = 'Click to reload this calculation into form';
      li.innerHTML = `
        <div class="history-main">
          <span class="history-expr">${item.a} ${item.symbol} ${item.b}</span>
          <span class="history-res">= ${item.result}</span>
        </div>
        <div class="history-meta">
          <span class="history-time">${item.timestamp}</span>
          <span class="history-load-tag">Load ↵</span>
        </div>
      `;

      li.addEventListener('click', () => {
        num1Input.value = item.a;
        num2Input.value = item.b;
        const radio = document.querySelector(`input[name="operation"][value="${item.operation}"]`);
        if (radio) radio.checked = true;

        updateClearButtonVisibility();
        calcForm.dispatchEvent(new Event('submit'));
        showToast('Calculation reloaded!');
      });

      historyList.appendChild(li);
    });
  }

  function saveHistoryToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historyData));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  function loadHistoryFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
      return [];
    }
  }

  // --- Toast Notification Helper ---
  let toastTimer = null;
  function showToast(message) {
    clearTimeout(toastTimer);
    toast.querySelector('.toast-msg').textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }
});
