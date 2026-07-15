const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const pagePath = path.join(__dirname, 'mortgage-calculator.html');
const source = fs.readFileSync(pagePath, 'utf8');
const scriptMatch = source.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, 'inline calculator script should exist');

const context = {
  console,
  document: {
    addEventListener() {},
    querySelectorAll() { return []; }
  },
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  navigator: {},
  window: { matchMedia() { return { matches: false }; } },
  setTimeout() {},
  clearTimeout() {}
};
vm.createContext(context);
new vm.Script(scriptMatch[1], { filename: 'mortgage-calculator.inline.js' }).runInContext(context);

function close(actual, expected, tolerance = 0.02, message = '') {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message} expected ${expected}, received ${actual}`
  );
}

function interest(schedule) {
  return context.sumScheduleInterest(schedule);
}

function assertScheduleIntegrity(schedule, totalAmount) {
  assert.ok(schedule.length > 0, 'schedule should not be empty');
  assert.equal(schedule.at(-1).remainingBalance, 0, 'loan should end with zero balance');
  for (const row of schedule) {
    assert.ok(row.principal >= 0, 'principal should be non-negative');
    assert.ok(row.interest >= 0, 'interest should be non-negative');
    assert.ok(row.prepayment >= 0, 'prepayment should be non-negative');
  }
  const repaidPrincipal = schedule.reduce((sum, row) => sum + row.principal + row.prepayment, 0);
  const displayRoundingTolerance = schedule.length * 0.005 + 0.02;
  close(repaidPrincipal, totalAmount, displayRoundingTolerance, 'repaid principal');
}

function eventImpact(config, prepayments, rateChanges, type, monthIndex) {
  const result = context.calculateSchedule(config, prepayments, rateChanges);
  const impacts = context.calculateInterestImpacts(
    config,
    prepayments,
    rateChanges,
    result.changes,
    interest(result.schedule)
  );
  return { result, impact: impacts.get(`${type}:${monthIndex}`), impacts };
}

// Reproduce the values from the reported loan scenario, including all events.
const screenshotConfig = {
  totalAmount: 2_890_000,
  annualRate: 4.65,
  totalMonths: 360,
  method: 'equal_installment',
  startMonth: '2022-08'
};
const screenshotRates = [
  { monthIndex: 13, rate: 4.55, ym: '2023-09' },
  { monthIndex: 27, rate: 3.9, ym: '2024-11' },
  { monthIndex: 37, rate: 3.2, ym: '2025-09' }
];
const screenshotPrepayments = [
  { monthIndex: 23, amount: 250_000, action: 'shorten_term', ym: '2024-07' },
  { monthIndex: 34, amount: 350_000, action: 'shorten_term', ym: '2025-06' },
  { monthIndex: 37, amount: 160_000, action: 'shorten_term', ym: '2025-09' },
  { monthIndex: 42, amount: 160_000, action: 'shorten_term', ym: '2026-02' },
  { monthIndex: 47, amount: 200_000, action: 'shorten_term', ym: '2026-07' }
];

const screenshotResult = context.calculateSchedule(
  screenshotConfig,
  screenshotPrepayments,
  screenshotRates
);
const screenshotInterest = interest(screenshotResult.schedule);
const screenshotImpacts = context.calculateInterestImpacts(
  screenshotConfig,
  screenshotPrepayments,
  screenshotRates,
  screenshotResult.changes,
  screenshotInterest
);

assert.equal(screenshotResult.schedule.length, 188, 'reported scenario term');
close(screenshotInterest, 717_281.28, 0.02, 'reported scenario total interest');
assertScheduleIntegrity(screenshotResult.schedule, screenshotConfig.totalAmount);

const expectedImpacts = new Map([
  ['rate:13', 1_872.74],
  ['prepay:23', 168_441.91],
  ['rate:27', 6_571.02],
  ['prepay:34', 215_204.57],
  ['rate:37', 74_359.41],
  ['prepay:37', 84_926.41],
  ['prepay:42', 81_607.15],
  ['prepay:47', 99_773.03]
]);
for (const [key, expected] of expectedImpacts) {
  close(screenshotImpacts.get(key), expected, 0.02, `impact ${key}`);
}

// Baselines are checked against closed-form amortization totals.
const installmentConfig = {
  totalAmount: 1_000_000,
  annualRate: 3.6,
  totalMonths: 360,
  method: 'equal_installment',
  startMonth: '2024-01'
};
const installmentBaseline = context.calculateSchedule(installmentConfig, [], []);
const monthlyRate = installmentConfig.annualRate / 100 / 12;
const expectedPayment = installmentConfig.totalAmount * monthlyRate * (1 + monthlyRate) ** 360
  / ((1 + monthlyRate) ** 360 - 1);
close(interest(installmentBaseline.schedule), expectedPayment * 360 - 1_000_000, 2, 'equal-installment closed form');
assert.equal(installmentBaseline.schedule.length, 360);
assertScheduleIntegrity(installmentBaseline.schedule, installmentConfig.totalAmount);

const principalConfig = { ...installmentConfig, method: 'equal_principal' };
const principalBaseline = context.calculateSchedule(principalConfig, [], []);
const expectedPrincipalInterest = principalConfig.totalAmount * monthlyRate * (principalConfig.totalMonths + 1) / 2;
close(interest(principalBaseline.schedule), expectedPrincipalInterest, 0.02, 'equal-principal closed form');
assert.equal(principalBaseline.schedule.length, 360);
assertScheduleIntegrity(principalBaseline.schedule, principalConfig.totalAmount);

// Small loans provide independently hand-checkable event oracles.
const smallPrincipalConfig = {
  totalAmount: 120_000,
  annualRate: 12,
  totalMonths: 12,
  method: 'equal_principal',
  startMonth: '2024-01'
};
close(eventImpact(
  smallPrincipalConfig,
  [],
  [{ monthIndex: 7, rate: 6, ym: '2024-08' }],
  'rate',
  7
).impact, 1_050, 0.02, 'equal-principal rate cut');
close(eventImpact(
  smallPrincipalConfig,
  [{ monthIndex: 6, amount: 20_000, action: 'reduce_payment', ym: '2024-07' }],
  [],
  'prepay',
  6
).impact, 700, 0.02, 'equal-principal reduce-payment prepayment');
close(eventImpact(
  smallPrincipalConfig,
  [{ monthIndex: 6, amount: 20_000, action: 'shorten_term', ym: '2024-07' }],
  [],
  'prepay',
  6
).impact, 1_100, 0.02, 'equal-principal shorten-term prepayment');
close(eventImpact(
  smallPrincipalConfig,
  [{ monthIndex: 6, amount: 15_000, action: 'shorten_term', ym: '2024-07' }],
  [],
  'prepay',
  6
).impact, 850, 0.02, 'equal-principal non-divisible shorten-term prepayment');
const sameMonthSmall = eventImpact(
  smallPrincipalConfig,
  [{ monthIndex: 7, amount: 20_000, action: 'reduce_payment', ym: '2024-08' }],
  [{ monthIndex: 7, rate: 6, ym: '2024-08' }],
  'rate',
  7
);
close(sameMonthSmall.impact, 750, 0.02, 'same-month rate impact');
close(sameMonthSmall.impacts.get('prepay:7'), 300, 0.02, 'same-month prepayment impact');
close(eventImpact(
  smallPrincipalConfig,
  [{ monthIndex: 6, amount: 200_000, action: 'shorten_term', ym: '2024-07' }],
  [],
  'prepay',
  6
).impact, 2_100, 0.02, 'full payoff impact');

const smallInstallmentConfig = { ...smallPrincipalConfig, method: 'equal_installment' };
close(eventImpact(
  smallInstallmentConfig,
  [],
  [{ monthIndex: 7, rate: 6, ym: '2024-08' }],
  'rate',
  7
).impact, 1_094.78, 0.02, 'equal-installment rate cut');
close(eventImpact(
  smallInstallmentConfig,
  [{ monthIndex: 6, amount: 20_000, action: 'reduce_payment', ym: '2024-07' }],
  [],
  'prepay',
  6
).impact, 705.80, 0.02, 'equal-installment reduce-payment prepayment');

// Equal-principal strategy state must survive reduce-payment followed by shorten-term.
const mixedPrincipalEvents = [
  { monthIndex: 12, amount: 500_000, action: 'reduce_payment', ym: '2025-01' },
  { monthIndex: 24, amount: 100_000, action: 'shorten_term', ym: '2026-01' }
];
const mixedPrincipal = context.calculateSchedule(principalConfig, mixedPrincipalEvents, []);
assert.equal(mixedPrincipal.schedule.length, 286, 'mixed equal-principal strategy term');
close(interest(mixedPrincipal.schedule), 189_986.21, 0.02, 'mixed equal-principal total interest');
close(mixedPrincipal.schedule[22].principal, 1_341, 0.02, 'principal before shorten-term');
close(mixedPrincipal.schedule[24].principal, 1_341, 0.02, 'principal after shorten-term');
const mixedImpacts = context.calculateInterestImpacts(
  principalConfig,
  mixedPrincipalEvents,
  [],
  mixedPrincipal.changes,
  interest(mixedPrincipal.schedule)
);
close(mixedImpacts.get('prepay:24'), 89_763.79, 0.02, 'second mixed-strategy prepayment impact');

// A non-divisible equal-principal shortening keeps the existing principal cadence.
const nonDivisiblePrincipal = eventImpact(
  principalConfig,
  [{ monthIndex: 12, amount: 123_456, action: 'shorten_term', ym: '2025-01' }],
  [],
  'prepay',
  12
);
assert.equal(nonDivisiblePrincipal.result.schedule.length, 316, 'non-divisible equal-principal term');
close(interest(nonDivisiblePrincipal.result.schedule), 420_658.53, 0.02, 'non-divisible equal-principal interest');
close(nonDivisiblePrincipal.impact, 120_841.47, 0.02, 'non-divisible equal-principal impact');
close(nonDivisiblePrincipal.result.schedule[12].principal, 2_777.78, 0.02, 'principal cadence after shortening');

// Integer term calculations must not gain a phantom month from floating point noise.
for (const [balance, rate, months] of [[100_000, 0.003, 12], [1_000_000, 0.003, 120]]) {
  const payment = context.calcEqualInstallment(balance, rate, months);
  assert.equal(context.calcNewTerm(balance, rate, payment), months, `integer term ${months}`);
}

// The floating-point term edge must stay correct when a later rate change re-amortizes it.
const floatingTermConfig = {
  totalAmount: 1_000_000,
  annualRate: 3.1,
  totalMonths: 360,
  method: 'equal_installment',
  startMonth: '2024-01'
};
const floatingTerm = context.calculateSchedule(
  floatingTermConfig,
  [{ monthIndex: 4, amount: 198_605.00782096921, action: 'shorten_term', ym: '2024-05' }],
  [{ monthIndex: 5, rate: 3.0, ym: '2024-06' }]
);
assert.equal(floatingTerm.schedule.length, 258, 'floating-point term with later rate change');
close(interest(floatingTerm.schedule), 290_082.97, 0.02, 'floating-point term interest');
close(floatingTerm.schedule[4].monthlyPayment, 4_229.91, 0.02, 'payment after floating-point term rate change');

// Rate cuts save interest; rate increases add interest for both repayment methods.
for (const method of ['equal_installment', 'equal_principal']) {
  const config = { ...installmentConfig, method };
  for (const [rate, expectedSign] of [[3.0, 1], [4.5, -1]]) {
    const { result, impact } = eventImpact(
      config,
      [],
      [{ monthIndex: 12, rate, ym: '2025-01' }],
      'rate',
      12
    );
    assert.equal(Math.sign(impact), expectedSign, `${method} rate ${rate} impact sign`);
    assertScheduleIntegrity(result.schedule, config.totalAmount);
  }
}

// Both prepayment strategies save interest; shortening the term saves more.
for (const method of ['equal_installment', 'equal_principal']) {
  const config = { ...installmentConfig, method };
  const shorten = eventImpact(
    config,
    [{ monthIndex: 24, amount: 200_000, action: 'shorten_term', ym: '2026-01' }],
    [],
    'prepay',
    24
  );
  const reduce = eventImpact(
    config,
    [{ monthIndex: 24, amount: 200_000, action: 'reduce_payment', ym: '2026-01' }],
    [],
    'prepay',
    24
  );
  assert.ok(shorten.impact > reduce.impact && reduce.impact > 0, `${method} prepayment strategy savings`);
  assert.ok(shorten.result.schedule.length < reduce.result.schedule.length, `${method} shortening should reduce term`);
  assert.equal(reduce.result.schedule.length, config.totalMonths, `${method} reducing payment should preserve term`);
  assertScheduleIntegrity(shorten.result.schedule, config.totalAmount);
  assertScheduleIntegrity(reduce.result.schedule, config.totalAmount);
}

// Same-month calculation order is rate change, regular payment, then prepayment.
const sameMonthResult = context.calculateSchedule(
  installmentConfig,
  [{ monthIndex: 12, amount: 200_000, action: 'reduce_payment', ym: '2025-01' }],
  [{ monthIndex: 12, rate: 3.0, ym: '2025-01' }]
);
assert.deepEqual(
  Array.from(sameMonthResult.changes, change => change.type),
  ['rate', 'prepay'],
  'same-month order should be rate then prepayment'
);

// Duplicate UI events normalize deterministically: last rate wins; prepayments add.
context.document.querySelectorAll = selector => {
  if (selector === '.rate-item') {
    return [
      { querySelector(key) { return { value: key === '.rc-month' ? '2025-01' : '3.2' }; } },
      { querySelector(key) { return { value: key === '.rc-month' ? '2025-01' : '3.0' }; } },
      { querySelector(key) { return { value: key === '.rc-month' ? '2026-01' : '2.9' }; } }
    ];
  }
  if (selector === '.prepay-item') {
    return [
      { querySelector(key) { return { value: key === '.pp-month' ? '2025-01' : key === '.pp-amount' ? '10' : 'shorten_term' }; } },
      { querySelector(key) { return { value: key === '.pp-month' ? '2025-01' : key === '.pp-amount' ? '20' : 'reduce_payment' }; } }
    ];
  }
  return [];
};
const normalizedRates = context.getRateChanges('2024-01');
assert.equal(normalizedRates.length, 2, 'same-month rate changes should be normalized');
assert.equal(normalizedRates[0].rate, 3.0, 'last same-month rate change should win');
const normalizedPrepayments = context.getPrepayments('2024-01');
assert.equal(normalizedPrepayments.length, 1, 'same-month prepayments should be merged');
assert.equal(normalizedPrepayments[0].amount, 300_000, 'same-month prepayment amounts should add');
assert.equal(normalizedPrepayments[0].action, 'reduce_payment', 'last same-month strategy should win');

// Events after an early payoff are not rendered or assigned a misleading impact.
const earlyPayoffConfig = { ...installmentConfig, totalAmount: 100_000, totalMonths: 120 };
const earlyPayoff = context.calculateSchedule(
  earlyPayoffConfig,
  [{ monthIndex: 1, amount: 200_000, action: 'shorten_term', ym: '2024-02' }],
  [{ monthIndex: 6, rate: 2.8, ym: '2024-07' }]
);
assert.equal(earlyPayoff.schedule.length, 1);
assert.deepEqual(Array.from(earlyPayoff.changes, event => event.type), ['prepay']);
assertScheduleIntegrity(earlyPayoff.schedule, earlyPayoffConfig.totalAmount);

assert.match(context.renderInterestImpact(1), /预计少付总利息/);
assert.match(context.renderInterestImpact(-1), /预计多付总利息/);
assert.match(context.renderInterestImpact(0), /基本不变/);
assert.match(source, /事件相互联动，各条金额不可直接相加/);
assert.match(source, /还款变化记录/);
assert.match(source, /<summary>计算口径<\/summary>/);
assert.match(source, /role="list"/);
assert.match(source, /aria-describedby="changesMethod"/);

console.log('PASS mortgage calculator: reported scenario, exact financial oracles, 2 methods, 2 strategies, ordering, normalization, payoff and UI semantics');
