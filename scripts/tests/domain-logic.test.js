#!/usr/bin/env node
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const KramaMath = require('../../templates/demo/krama-math.js');
const TathyaTokenizer = require('../../templates/demo/tathya-tokenizer.js');

test('KramaMath: canonical 17/25 recovery equals 68.0% and 7 classes', () => {
  const result = KramaMath.analyzeAttendance(17, 25, 0.75);
  assert.equal(result.percentageFormatted, '68.0%');
  assert.equal(result.recoveryNeeded, 7);
  assert.equal(result.isEligible, false);
  assert.equal(KramaMath.classesToRecover(17, 25, 0.75), 7);
  assert.ok(((17 + 7) / (25 + 7)) >= 0.75);
  assert.ok(((17 + 6) / (25 + 6)) < 0.75);
});

test('KramaMath: boundary conditions and buffer math', () => {
  // Exact 75% (15 / 20)
  assert.equal(KramaMath.classesToRecover(15, 20, 0.75), 0);
  assert.equal(KramaMath.safeSkipBuffer(15, 20, 0.75), 0);

  // 20 / 25 = 80% -> can safely skip 1 class (20 / 26 = 76.92% >= 75%, 20 / 27 = 74.07% < 75%)
  assert.equal(KramaMath.safeSkipBuffer(20, 25, 0.75), 1);

  // Exact recovery step (18 / 25 = 72% -> 21 / 28 = 75%)
  assert.equal(KramaMath.classesToRecover(18, 25, 0.75), 3);

  // Zero attended -> 10 total at 75% requires 30 classes (30/40 = 0.75)
  assert.equal(KramaMath.classesToRecover(0, 10, 0.75), 30);
});

test('KramaMath: rejects invalid attendance inputs', () => {
  assert.throws(() => KramaMath.classesToRecover(-1, 10), /Invalid attendance inputs/);
  assert.throws(() => KramaMath.classesToRecover(11, 10), /Invalid attendance inputs/);
  assert.throws(() => KramaMath.classesToRecover(5, 0), /Invalid attendance inputs/);
  assert.throws(() => KramaMath.classesToRecover(5.5, 10), /Invalid attendance inputs/);
  assert.throws(() => KramaMath.classesToRecover(5, 10, 1), /Invalid attendance inputs/);
});

test('TathyaTokenizer: lossless round-trip and separate byte/token/grapheme counts', () => {
  const samples = [
    { dia: 'म्हारी सरकार की लाडो योजना के के फायदे सैं?', std: 'हमारी सरकार की लाडो योजना के क्या लाभ हैं?' },
    { dia: 'ਸਰਕਾਰੀ ਹਸਪਤਾਲ ਵਿਚ ਪਰਚੀ ਕਟਵਾਉਣ ਦਾ ਕੀ ਤਰੀਕਾ ਹੈ?', std: 'सरकारी अस्पताल में पर्ची कटवाने का क्या तरीका है?' },
    { dia: 'ई राशन कार्ड बनावे खातिर कवन कवन कागजात चाहीं?', std: 'यह राशन कार्ड बनवाने के लिए कौन-कौन से दस्तावेज चाहिए?' }
  ];

  for (const s of samples) {
    const diaRes = TathyaTokenizer.encode(s.dia);
    const stdRes = TathyaTokenizer.encode(s.std);

    // Lossless encode -> decode bijection
    assert.equal(TathyaTokenizer.decode(diaRes.tokenIds), s.dia);
    assert.equal(TathyaTokenizer.decode(stdRes.tokenIds), s.std);

    // Exact UTF-8 byte length check
    assert.equal(diaRes.utf8Bytes, Buffer.byteLength(s.dia, 'utf8'));
    assert.equal(stdRes.utf8Bytes, Buffer.byteLength(s.std, 'utf8'));

    // Token array matches ID array matches scalar count
    assert.equal(diaRes.tokens.length, diaRes.tokenCount);
    assert.equal(diaRes.tokenIds.length, diaRes.tokenCount);

    // Manak Hindi produces fewer BPE tokens than dialect/Gurmukhi queries under Hindi-biased BPE
    assert.ok(diaRes.tokenCount > stdRes.tokenCount, `Expected higher token count for dialect: ${diaRes.tokenCount} <= ${stdRes.tokenCount}`);
  }
  const punjabiRes = TathyaTokenizer.encode('ਸਰਕਾਰੀ ਹਸਪਤਾਲ ਵਿਚ ਪਰਚੀ ਕਟਵਾਉਣ ਦਾ ਕੀ ਤਰੀਕਾ ਹੈ?');
  assert.ok(punjabiRes.byteFallbackCount > 0, 'Expected raw UTF-8 byte fallbacks on Gurmukhi script');
});

test('Cash Rush financials preserve 8.85x multiple vs 785% profit vs separate prize', () => {
  const contentPath = path.resolve(__dirname, '../../content/content.json');
  const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  const cashRush = content.competitions.find(c => c.id === 'cash-rush');
  assert.ok(cashRush, 'cash-rush entry missing');
  const f = cashRush.financials;
  assert.equal(f.starting_capital_inr + f.total_service_revenue_inr - f.total_costs_inr, f.ending_fund_inr);
  assert.equal((f.ending_fund_inr / f.starting_capital_inr).toFixed(2) + 'x', f.multiplier);
  assert.equal(Math.round(((f.ending_fund_inr - f.starting_capital_inr) / f.starting_capital_inr) * 100), 785);
  assert.equal(f.cash_prize_inr, 7000);
});
