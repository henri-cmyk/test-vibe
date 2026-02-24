/* global CalculatorCore */

(function () {
  const mainEl = document.getElementById('displayMain');
  const secondaryEl = document.getElementById('displaySecondary');
  const memoryEl = document.getElementById('memoryIndicator');
  const clearKeyEl = document.getElementById('clearKey');
  const keysEl = document.querySelector('.keys');

  if (!mainEl || !secondaryEl || !memoryEl || !clearKeyEl || !keysEl) return;
  if (!window.CalculatorCore || typeof window.CalculatorCore.createCalculator !== 'function') return;

  const calc = window.CalculatorCore.createCalculator();

  function render() {
    const state = calc.getState();
    mainEl.textContent = state.display;
    secondaryEl.textContent = state.secondary || '';
    clearKeyEl.textContent = calc.getClearLabel();

    if (state.memory !== 0) memoryEl.classList.add('is-on');
    else memoryEl.classList.remove('is-on');
  }

  function dispatchFromAction(action, value) {
    switch (action) {
      case 'digit':
        calc.digit(value);
        break;
      case 'decimal':
        calc.decimal();
        break;
      case 'operator':
        calc.operator(value);
        break;
      case 'equals':
        calc.equals();
        break;
      case 'clear':
        calc.clear();
        break;
      case 'backspace':
        calc.backspace();
        break;
      case 'percent':
        calc.percent();
        break;
      case 'sign':
        calc.sign();
        break;
      case 'memoryClear':
      case 'memoryRecall':
      case 'memoryPlus':
      case 'memoryMinus':
        calc.memory(action);
        break;
      default:
        break;
    }

    render();
  }

  keysEl.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('button[data-action]') : null;
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const value = btn.getAttribute('data-value');
    dispatchFromAction(action, value);
  });

  function handleKey(key) {
    if (/^[0-9]$/.test(key)) return dispatchFromAction('digit', key);
    if (key === '.' || key === ',') return dispatchFromAction('decimal');
    if (key === '+' || key === '-' || key === '*' || key === '/') return dispatchFromAction('operator', key);
    if (key === '=' || key === 'Enter') return dispatchFromAction('equals');
    if (key === 'Backspace') return dispatchFromAction('backspace');
    if (key === 'Escape') return dispatchFromAction('clear');
    if (key === '%') return dispatchFromAction('percent');
    if (key === 'F9') return dispatchFromAction('sign'); // convention Windows
    return null;
  }

  window.addEventListener('keydown', (e) => {
    const used = handleKey(e.key);
    if (used === null) return;
    e.preventDefault();
  });

  render();
})();

