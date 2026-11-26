/**
 * ============================================================================
 * KRAMA ATTENDANCE RECOVERY CALCULUS — SHARED DOMAIN MODULE
 * Single pure calculation engine powering UI widgets, CLI, & unit tests.
 * ============================================================================
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KramaMath = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Computes attendance percentage (0..100).
   * @param {number} attended
   * @param {number} total
   * @returns {number}
   */
  function calculatePercentage(attended, total) {
    if (!Number.isInteger(attended) || !Number.isInteger(total) || attended < 0 || total <= 0 || attended > total) {
      throw new Error('Invalid attendance inputs');
    }
    return (attended / total) * 100;
  }

  /**
   * Computes exact consecutive classes required to reach target ratio (default 0.75).
   * Formula: ceil((target * total - attended) / (1 - target))
   * Example: (17, 25, 0.75) -> 7 (24 / 32 = 75.0%)
   * @param {number} attended
   * @param {number} total
   * @param {number} [target=0.75]
   * @returns {number}
   */
  function classesToRecover(attended, total, target) {
    var tgt = typeof target === 'number' ? target : 0.75;
    if (
      !Number.isInteger(attended) ||
      !Number.isInteger(total) ||
      attended < 0 ||
      total <= 0 ||
      attended > total ||
      !(tgt > 0 && tgt < 1)
    ) {
      throw new Error('Invalid attendance inputs');
    }
    if (attended / total >= tgt) {
      return 0;
    }
    return Math.ceil((tgt * total - attended - 1e-12) / (1 - tgt));
  }

  /**
   * Computes maximum consecutive classes that can be missed while remaining >= target.
   * @param {number} attended
   * @param {number} total
   * @param {number} [target=0.75]
   * @returns {number}
   */
  function safeSkipBuffer(attended, total, target) {
    var tgt = typeof target === 'number' ? target : 0.75;
    if (
      !Number.isInteger(attended) ||
      !Number.isInteger(total) ||
      attended < 0 ||
      total <= 0 ||
      attended > total ||
      !(tgt > 0 && tgt < 1)
    ) {
      throw new Error('Invalid attendance inputs');
    }
    if (attended / total < tgt) {
      return 0;
    }
    return Math.max(0, Math.floor((attended - tgt * total + 1e-12) / tgt));
  }

  /**
   * Returns complete structured status & plain-English advice for Krama UI / CLI.
   * @param {number} attended
   * @param {number} total
   * @param {number} [target=0.75]
   */
  function analyzeAttendance(attended, total, target) {
    var tgt = typeof target === 'number' ? target : 0.75;
    var percentage = calculatePercentage(attended, total);
    var recoveryNeeded = classesToRecover(attended, total, tgt);
    var skipBuffer = safeSkipBuffer(attended, total, tgt);
    var targetPctLabel = (tgt * 100).toFixed(1) + '%';

    var advice;
    if (recoveryNeeded > 0) {
      advice = 'Attend next ' + recoveryNeeded + ' consecutive class' + (recoveryNeeded === 1 ? '' : 'es') + ' to recover ' + targetPctLabel + '.';
    } else if (skipBuffer > 0) {
      advice = 'Safe buffer: can skip ' + skipBuffer + ' class' + (skipBuffer === 1 ? '' : 'es') + ' while staying ≥' + targetPctLabel + '.';
    } else {
      advice = 'On ' + targetPctLabel + ' threshold — attend next class to build margin.';
    }

    return {
      attended: attended,
      total: total,
      target: tgt,
      percentage: percentage,
      percentageFormatted: percentage.toFixed(1) + '%',
      isEligible: percentage >= tgt * 100 - 1e-9,
      recoveryNeeded: recoveryNeeded,
      skipBuffer: skipBuffer,
      advice: advice
    };
  }

  return {
    calculatePercentage: calculatePercentage,
    classesToRecover: classesToRecover,
    safeSkipBuffer: safeSkipBuffer,
    analyzeAttendance: analyzeAttendance
  };
}));
