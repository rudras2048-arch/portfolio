/**
 * ============================================================================
 * TATHYA REFERENCE BYTE-LEVEL BPE & GRAPHEME MICROSCOPE (v0.2 Client-Side)
 * ============================================================================
 * Honest, deterministic, lossless UTF-8 Byte-Pair Encoding implementation.
 * Token IDs 0..255 = raw UTF-8 bytes (byte-level fallback).
 * Token IDs 256+   = formal Manak Hindi (Devanagari) & Latin vocabulary stems
 *                    showing algorithmically why standard web-Hindi vocabularies
 *                    merge formal Hindi cleanly while fracturing colloquial
 *                    Haryanvi/Bhojpuri markers and Gurmukhi into byte/subword pieces.
 * Separately measures Token Count, Token IDs, Grapheme Clusters, & UTF-8 Bytes.
 * ============================================================================
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TathyaTokenizer = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function utf8Encode(str) {
    if (typeof TextEncoder !== 'undefined') {
      return Array.from(new TextEncoder().encode(str));
    }
    if (typeof Buffer !== 'undefined') {
      return Array.from(Buffer.from(str, 'utf8'));
    }
    var utf8 = unescape(encodeURIComponent(str));
    var out = [];
    for (var i = 0; i < utf8.length; i++) {
      out.push(utf8.charCodeAt(i));
    }
    return out;
  }

  function utf8Decode(bytes) {
    if (typeof TextDecoder !== 'undefined') {
      try {
        return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
      } catch (e) {}
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(bytes).toString('utf8');
    }
    return bytes.map(function (b) { return String.fromCharCode(b); }).join('');
  }

  function countGraphemes(str) {
    var input = String(str || '');
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
      try {
        var seg = new Intl.Segmenter('hi', { granularity: 'grapheme' });
        var n = 0;
        var it = seg.segment(input)[Symbol.iterator]();
        while (!it.next().done) n++;
        return n;
      } catch (e) {}
    }
    return Array.from(input).length;
  }

  // Build ordered BPE vocabulary (0..255 raw bytes, 256+ UTF-8 character/word merges).
  // Formal Manak Hindi / common civic stems appear at high frequency rank (lower ID).
  // No raw Gurmukhi or regional colloquial words ('म्हारी', 'सैं', 'खातिर', 'कवन', 'चाहीं', 'ਪਰਚੀ')
  // are added as whole-word merges, mimicking a Manak-Hindi/Web-corpus biased BPE model.
  var CORPUS_MERGE_TERMS = [
    // Core Devanagari matras / common syllables & frequent Manak Hindi civic corpus tokens
    'क', 'र', 'स', 'म', 'न', 'त', 'ल', 'प', 'ह', 'व', 'य', 'ज', 'द', 'ग', 'ब', 'च', 'त', 'श',
    'ा', 'ी', 'ि', 'े', 'ो', 'ु', 'ू', 'ै', 'ं', '्', '?', ' ',
    'का', 'के', 'की', 'को', 'में', 'से', 'ने', 'पर', 'है', 'हैं', 'और', 'यह', 'वह', 'क्या', 'कैसे',
    'लिए', 'के लिए', 'हम', 'हमारी', 'सरकार', 'लाडो', 'योजना', 'लाभ', 'फायदे',
    'सरकारी', 'अस्पताल', 'पर्ची', 'कटवाने', 'तरीका', 'राशन', 'कार्ड', 'बनवाने',
    'कौन', 'कौन-कौन', 'दस्तावेज', 'चाहिए', 'स्वास्थ्य', 'आवेदन', 'जिला', 'मंजूरी',
    'अधिकारी', 'नागरिक', 'सेवा', 'पोर्टल', 'खाता', 'पंजीकरण', 'सत्यापन',
    // Common ASCII/English tokens so mixed queries work cleanly
    'the', 'is', 'for', 'and', 'in', 'to', 'of', 'with', 'status', 'check', 'LLM', 'eval'
  ];

  function buildVocab() {
    var merges = []; // { leftId, rightId, newId, bytes }
    var pairRank = Object.create(null); // "leftId:rightId" -> { rank, newId }
    var idToBytes = [];
    var termToId = Object.create(null);

    for (var b = 0; b < 256; b++) {
      idToBytes[b] = [b];
    }

    var nextId = 256;
    function internMerge(leftId, rightId) {
      var key = leftId + ':' + rightId;
      if (pairRank[key]) return pairRank[key].newId;
      var newId = nextId++;
      var mergedBytes = idToBytes[leftId].concat(idToBytes[rightId]);
      idToBytes[newId] = mergedBytes;
      var rank = merges.length;
      merges.push({ leftId: leftId, rightId: rightId, newId: newId, bytes: mergedBytes });
      pairRank[key] = { rank: rank, newId: newId };
      return newId;
    }

    // Deduplicate terms cleanly and train sequential merges left-to-right per term
    var seen = Object.create(null);
    for (var i = 0; i < CORPUS_MERGE_TERMS.length; i++) {
      var term = CORPUS_MERGE_TERMS[i];
      if (!term || seen[term]) continue;
      seen[term] = true;
      var seq = utf8Encode(term);
      // Apply already-learned merges first so compound words merge into existing subwords
      seq = applyLearnedMerges(seq, pairRank);
      while (seq.length > 1) {
        var mergedId = internMerge(seq[0], seq[1]);
        seq = [mergedId].concat(seq.slice(2));
        if (seq.length > 1) {
          seq = applyLearnedMerges(seq, pairRank);
        }
      }
      if (seq.length === 1) {
        termToId[term] = seq[0];
      }
    }

    return {
      idToBytes: idToBytes,
      pairRank: pairRank,
      mergesCount: merges.length,
      vocabSize: nextId
    };
  }

  function applyLearnedMerges(ids, pairRank) {
    var seq = ids.slice();
    while (seq.length >= 2) {
      var bestRank = Infinity;
      var bestIdx = -1;
      var bestNewId = -1;
      for (var i = 0; i < seq.length - 1; i++) {
        var key = seq[i] + ':' + seq[i + 1];
        var entry = pairRank[key];
        if (entry && entry.rank < bestRank) {
          bestRank = entry.rank;
          bestIdx = i;
          bestNewId = entry.newId;
        }
      }
      if (bestIdx === -1) break;
      var nextSeq = [];
      for (var j = 0; j < seq.length; j++) {
        if (j === bestIdx) {
          nextSeq.push(bestNewId);
          j++; // skip j+1
        } else {
          nextSeq.push(seq[j]);
        }
      }
      seq = nextSeq;
    }
    return seq;
  }

  var VOCAB = buildVocab();

  /**
   * Splits input text along whitespace/punctuation pre-token chunks (preserving spaces & order)
   * then applies Byte-Level BPE over each chunk's UTF-8 bytes so spaces never merge across words
   * unless explicitly present in vocabulary (like "के लिए").
   */
  function pretokenize(text) {
    var str = String(text || '');
    if (!str) return [];
    // Keep exact substring losslessly by separating whitespace runs and non-whitespace tokens
    var parts = str.match(/\s+|[^\s?।!.,;:]+|[?।!.,;:]+/g);
    return parts || [str];
  }

  function formatHexBytes(bytes) {
    return bytes.map(function (b) {
      return (b < 16 ? '0' : '') + b.toString(16).toUpperCase();
    }).join(' ');
  }

  /**
   * Encodes arbitrary string into real BPE tokens + separate byte & grapheme telemetry.
   * @param {string} inputText
   */
  function encode(inputText) {
    var text = String(inputText || '');
    var rawBytesAll = utf8Encode(text);
    var chunks = pretokenize(text);
    var tokenIds = [];
    var tokens = [];
    var byteFallbackCount = 0;

    for (var c = 0; c < chunks.length; c++) {
      var chunkStr = chunks[c];
      // Preserve single space tokens cleanly without displaying empty boxes
      var rawBytes = utf8Encode(chunkStr);
      var mergedIds = applyLearnedMerges(rawBytes, VOCAB.pairRank);

      for (var m = 0; m < mergedIds.length; m++) {
        var tid = mergedIds[m];
        var tBytes = VOCAB.idToBytes[tid];
        var decoded = utf8Decode(tBytes);
        var isWhitespace = /^\s+$/.test(chunkStr);
        var isRawByte = !isWhitespace && tid < 256 && tBytes[0] >= 0x80;
        if (isRawByte) {
          byteFallbackCount++;
        }
        var isMultiPiece = !isWhitespace && mergedIds.length > 1;
        var isFragmented = isRawByte || isMultiPiece || decoded.indexOf('\uFFFD') !== -1;
        var displayText = decoded === ' ' ? '␠' : (decoded.indexOf('\uFFFD') !== -1 ? '<0x' + formatHexBytes(tBytes) + '>' : decoded);

        tokenIds.push(tid);
        tokens.push({
          id: tid,
          text: displayText,
          rawText: decoded,
          hexBytes: formatHexBytes(tBytes),
          byteLength: tBytes.length,
          isByteFallback: isRawByte,
          isFragmented: isFragmented,
          isWhitespace: isWhitespace
        });
      }
    }

    var tokenCount = tokenIds.length;
    var utf8Bytes = rawBytesAll.length;
    var graphemeCount = countGraphemes(text);

    return {
      engine: 'tathya-bpe-v0.2',
      vocabSize: VOCAB.vocabSize,
      text: text,
      tokens: tokens,
      tokenIds: tokenIds,
      tokenCount: tokenCount,
      graphemeCount: graphemeCount,
      utf8Bytes: utf8Bytes,
      hexBytePreview: formatHexBytes(rawBytesAll.slice(0, 12)) + (rawBytesAll.length > 12 ? ' …' : ''),
      byteFallbackCount: byteFallbackCount,
      bytesPerToken: tokenCount > 0 ? Number((utf8Bytes / tokenCount).toFixed(2)) : 0
    };
  }

  /**
   * Decodes token IDs back to exact UTF-8 string (proves lossless bijection).
   * @param {number[]} tokenIds
   */
  function decode(tokenIds) {
    var allBytes = [];
    for (var i = 0; i < tokenIds.length; i++) {
      var b = VOCAB.idToBytes[tokenIds[i]];
      if (b) {
        for (var j = 0; j < b.length; j++) allBytes.push(b[j]);
      }
    }
    return utf8Decode(allBytes);
  }

  return {
    engine: 'tathya-bpe-v0.2',
    vocabSize: VOCAB.vocabSize,
    mergesCount: VOCAB.mergesCount,
    utf8Encode: utf8Encode,
    countGraphemes: countGraphemes,
    encode: encode,
    decode: decode
  };
}));
