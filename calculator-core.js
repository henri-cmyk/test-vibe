(function (global) {
  const MAX_DISPLAY_CHARS = 14;

  function isFiniteNumber(n) {
    return typeof n === 'number' && Number.isFinite(n);
  }

  function toNumber(text) {
    if (text === '' || text === '-' || text === '.' || text === '-.') return 0;
    const n = Number(text);
    return Number.isFinite(n) ? n : NaN;
  }

  function trimTrailingZeros(s) {
    if (!s.includes('.')) return s;
    return s.replace(/\.?0+$/, '');
  }

  function formatNumber(n) {
    if (!Number.isFinite(n)) return 'Erreur';
    if (Object.is(n, -0)) return '0';
    if (n === 0) return '0';

    const abs = Math.abs(n);
    let s = n.toString();

    if (s.length <= MAX_DISPLAY_CHARS) return s;

    if (abs >= 1e12 || abs < 1e-6) {
      s = n.toExponential(8);
      return s.length <= MAX_DISPLAY_CHARS ? s : n.toExponential(6);
    }

    s = n.toPrecision(12);
    s = trimTrailingZeros(s);
    if (s.length <= MAX_DISPLAY_CHARS) return s;

    s = n.toPrecision(10);
    s = trimTrailingZeros(s);
    return s.length <= MAX_DISPLAY_CHARS ? s : n.toExponential(6);
  }

  function compute(a, op, b) {
    if (!isFiniteNumber(a) || !isFiniteNumber(b)) return NaN;
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        return b === 0 ? NaN : a / b;
      default:
        return NaN;
    }
  }

  function opSymbol(op) {
    switch (op) {
      case '+':
        return '+';
      case '-':
        return '−';
      case '*':
        return '×';
      case '/':
        return '÷';
      default:
        return '';
    }
  }

  function initialState() {
    return {
      display: '0',
      secondary: '',
      acc: null,
      op: null,
      overwrite: true,
      lastOp: null,
      lastOperand: null,
      error: false,
      memory: 0,
    };
  }

  function clearLabel(state) {
    const hasWork =
      state.error ||
      state.display !== '0' ||
      state.secondary !== '' ||
      state.acc !== null ||
      state.op !== null;
    return hasWork ? 'C' : 'AC';
  }

  function resetIfError(state) {
    if (!state.error) return state;
    const next = initialState();
    next.memory = state.memory;
    return next;
  }

  function pressDigit(state, digit) {
    let next = resetIfError(state);
    if (!/^[0-9]$/.test(digit)) return next;

    if (next.overwrite) {
      next.display = digit;
      next.overwrite = false;
      return next;
    }

    if (next.display === '0') {
      next.display = digit;
      return next;
    }

    if (next.display.length >= MAX_DISPLAY_CHARS) return next;
    next.display += digit;
    return next;
  }

  function pressDecimal(state) {
    let next = resetIfError(state);
    if (next.overwrite) {
      next.display = '0.';
      next.overwrite = false;
      return next;
    }
    if (next.display.includes('.')) return next;
    if (next.display.length >= MAX_DISPLAY_CHARS) return next;
    next.display += '.';
    return next;
  }

  function pressBackspace(state) {
    let next = resetIfError(state);
    if (next.overwrite) {
      next.display = '0';
      next.secondary = next.op ? next.secondary : '';
      next.overwrite = true;
      return next;
    }

    if (next.display.length <= 1) {
      next.display = '0';
      next.overwrite = true;
      return next;
    }

    next.display = next.display.slice(0, -1);
    if (next.display === '-' || next.display === '-0') {
      next.display = '0';
      next.overwrite = true;
    }
    return next;
  }

  function pressSign(state) {
    let next = resetIfError(state);
    const n = toNumber(next.display);
    if (!Number.isFinite(n)) return next;
    next.display = formatNumber(-n);
    next.overwrite = false;
    return next;
  }

  function pressPercent(state) {
    let next = resetIfError(state);
    const n = toNumber(next.display);
    if (!Number.isFinite(n)) return next;
    next.display = formatNumber(n / 100);
    next.overwrite = false;
    return next;
  }

  function setError(state) {
    return {
      ...state,
      display: 'Erreur',
      secondary: '',
      acc: null,
      op: null,
      overwrite: true,
      lastOp: null,
      lastOperand: null,
      error: true,
    };
  }

  function pressOperator(state, op) {
    let next = resetIfError(state);
    if (!['+', '-', '*', '/'].includes(op)) return next;

    const current = toNumber(next.display);
    if (!Number.isFinite(current)) return setError(next);

    if (next.op && next.acc !== null && !next.overwrite) {
      const result = compute(next.acc, next.op, current);
      if (!Number.isFinite(result)) return setError(next);
      next.display = formatNumber(result);
      next.acc = result;
    } else if (next.acc === null) {
      next.acc = current;
    }

    next.op = op;
    next.overwrite = true;
    next.secondary = `${formatNumber(next.acc)} ${opSymbol(op)}`;
    return next;
  }

  function pressEquals(state) {
    let next = resetIfError(state);

    const current = toNumber(next.display);
    if (!Number.isFinite(current)) return setError(next);

    if (next.op && next.acc !== null) {
      const a = next.acc;
      const b = next.overwrite ? current : current;
      const result = compute(a, next.op, b);
      if (!Number.isFinite(result)) return setError(next);

      next.secondary = `${formatNumber(a)} ${opSymbol(next.op)} ${formatNumber(b)} =`;
      next.display = formatNumber(result);
      next.lastOp = next.op;
      next.lastOperand = b;
      next.op = null;
      next.acc = null;
      next.overwrite = true;
      return next;
    }

    if (next.lastOp && next.lastOperand !== null) {
      const a = current;
      const b = next.lastOperand;
      const result = compute(a, next.lastOp, b);
      if (!Number.isFinite(result)) return setError(next);
      next.secondary = `${formatNumber(a)} ${opSymbol(next.lastOp)} ${formatNumber(b)} =`;
      next.display = formatNumber(result);
      next.overwrite = true;
      return next;
    }

    next.secondary = '';
    next.overwrite = true;
    return next;
  }

  function pressClear(state) {
    if (state.error) return resetIfError(state);

    if (
      state.display !== '0' ||
      !state.overwrite ||
      state.secondary !== '' ||
      state.acc !== null ||
      state.op !== null
    ) {
      const next = { ...state };
      next.display = '0';
      next.secondary = state.op ? state.secondary : '';
      next.overwrite = true;
      if (!state.op) {
        next.acc = null;
        next.lastOp = null;
        next.lastOperand = null;
      }
      return next;
    }

    return initialState();
  }

  function pressMemory(state, action) {
    let next = resetIfError(state);
    const current = toNumber(next.display);
    if (!Number.isFinite(current)) return next;

    switch (action) {
      case 'memoryClear':
        next.memory = 0;
        return next;
      case 'memoryRecall':
        next.display = formatNumber(next.memory);
        next.overwrite = true;
        return next;
      case 'memoryPlus':
        next.memory = next.memory + current;
        return next;
      case 'memoryMinus':
        next.memory = next.memory - current;
        return next;
      default:
        return next;
    }
  }

  function reduce(state, action) {
    const type = action && action.type;
    switch (type) {
      case 'digit':
        return pressDigit(state, action.value);
      case 'decimal':
        return pressDecimal(state);
      case 'backspace':
        return pressBackspace(state);
      case 'sign':
        return pressSign(state);
      case 'percent':
        return pressPercent(state);
      case 'operator':
        return pressOperator(state, action.value);
      case 'equals':
        return pressEquals(state);
      case 'clear':
        return pressClear(state);
      case 'memory':
        return pressMemory(state, action.value);
      default:
        return state;
    }
  }

  function createCalculator() {
    let state = initialState();

    return {
      getState() {
        return { ...state };
      },
      getClearLabel() {
        return clearLabel(state);
      },
      dispatch(action) {
        state = reduce(state, action);
        return this.getState();
      },
      digit(d) {
        return this.dispatch({ type: 'digit', value: String(d) });
      },
      decimal() {
        return this.dispatch({ type: 'decimal' });
      },
      operator(op) {
        return this.dispatch({ type: 'operator', value: op });
      },
      equals() {
        return this.dispatch({ type: 'equals' });
      },
      clear() {
        return this.dispatch({ type: 'clear' });
      },
      backspace() {
        return this.dispatch({ type: 'backspace' });
      },
      percent() {
        return this.dispatch({ type: 'percent' });
      },
      sign() {
        return this.dispatch({ type: 'sign' });
      },
      memory(action) {
        return this.dispatch({ type: 'memory', value: action });
      },
    };
  }

  const api = { createCalculator, formatNumber, compute };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.CalculatorCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);

