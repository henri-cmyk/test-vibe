const test = require('node:test');
const assert = require('node:assert/strict');

const { createCalculator, formatNumber, compute } = require('../calculator-core');

test('compute: opérations de base', () => {
  assert.equal(compute(2, '+', 3), 5);
  assert.equal(compute(7, '-', 4), 3);
  assert.equal(compute(6, '*', 5), 30);
  assert.equal(compute(8, '/', 2), 4);
});

test('compute: division par zéro -> NaN', () => {
  assert.ok(Number.isNaN(compute(8, '/', 0)));
});

test('formatNumber: pas de -0, et trimming', () => {
  assert.equal(formatNumber(-0), '0');
  assert.equal(formatNumber(1.5), '1.5');
});

test('séquence: 2 + 3 = 5', () => {
  const c = createCalculator();
  c.digit(2);
  c.operator('+');
  c.digit(3);
  const s = c.equals();
  assert.equal(s.display, '5');
});

test('séquence: 2 + = => 4 (utilise le même opérande)', () => {
  const c = createCalculator();
  c.digit(2);
  c.operator('+');
  let s = c.equals();
  assert.equal(s.display, '4');
  s = c.equals();
  assert.equal(s.display, '6');
});

test('séquence: enchaînement immédiat (2 + 3 * 4 = => 20)', () => {
  const c = createCalculator();
  c.digit(2);
  c.operator('+');
  c.digit(3);
  c.operator('*');
  c.digit(4);
  const s = c.equals();
  assert.equal(s.display, '20');
});

test('erreur: division par zéro => Erreur puis saisie repart', () => {
  const c = createCalculator();
  c.digit(8);
  c.operator('/');
  c.digit(0);
  let s = c.equals();
  assert.equal(s.display, 'Erreur');
  s = c.digit(7);
  assert.equal(s.display, '7');
});

test('mémoire: M+ / MR / MC', () => {
  const c = createCalculator();
  c.digit(9);
  c.memory('memoryPlus');
  let s = c.memory('memoryRecall');
  assert.equal(s.display, '9');
  c.memory('memoryClear');
  s = c.memory('memoryRecall');
  assert.equal(s.display, '0');
});

