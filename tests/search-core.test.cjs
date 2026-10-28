const { test } = require('node:test');
const assert = require('node:assert/strict');
const { search, matchRanges, excerpt } = require('../search-core.js');

const items = [
  { id: 'experience', title: 'Experience', category: 'Experience', body: 'Developed TREX with media uploads.' },
  { id: 'trex', title: 'TREX', category: 'Projects', metadata: 'Flutter Cubit AWS S3', body: 'Background media imports with start and failure notifications.' },
  { id: 'haji', title: 'HajiNaji', category: 'Projects', metadata: 'Flutter ObjectBox PDF', body: 'Cache previously fetched books for offline reading.' },
  { id: 'data', title: 'Data & Device Features', category: 'Skills', metadata: 'ObjectBox Hive Offline Caching', body: 'Local storage.' }
];

test('title matches outrank earlier body matches', () => {
  assert.deepEqual(search(items, 'trex').map(item => item.id), ['trex', 'experience']);
});
test('searches body copy and metadata', () => {
  assert.equal(search(items, 'previously fetched')[0].id, 'haji');
  assert.equal(search(items, 'AWS S3')[0].id, 'trex');
});
test('requires every word, including words across fields', () => {
  assert.equal(search(items, 'flutter offline')[0].id, 'haji');
  assert.equal(search(items, 'flutter nonexistent').length, 0);
});
test('normalizes case, whitespace and duplicate terms', () => {
  assert.deepEqual(search(items, '  FLUTTER  offline flutter '), search(items, 'flutter offline'));
});
test('scope and query compose, and empty queries browse the selected scope', () => {
  assert.deepEqual(search(items, 'ObjectBox', 'Skills').map(item => item.id), ['data']);
  assert.equal(search(items, '', 'Projects').length, 2);
  assert.equal(search(items, '   ').length, items.length);
});
test('punctuation is literal, not a regular expression', () => {
  for (const query of ['[', '.*', '<img src=x onerror=alert(1)>', '()']) {
    assert.equal(search(items, query).length, 0);
  }
  assert.deepEqual(matchRanges('Socket.IO C++ [test]', 'c++ [test]'), [[10, 13], [14, 20]]);
});
test('accents and emoji preserve highlight offsets', () => {
  assert.equal(search([{ title: 'Café 🚀', body: '', category: 'Projects' }], 'cafe').length, 1);
  const text = '🚀 Café Flutter';
  assert.deepEqual(matchRanges(text, 'cafe flutter'), [[3, 7], [8, 15]]);
  assert.deepEqual(matchRanges('Flutter', 'flutter flut'), [[0, 7]]);
});
test('excerpt reveals a deep body match and preserves word boundaries', () => {
  const body = 'Introduction to engineering. '.repeat(20) + 'ObjectBox stores fetched books offline. ' + 'More details. '.repeat(20);
  const result = excerpt(body, 'ObjectBox');
  assert.ok(result.includes('ObjectBox'));
  assert.ok(result.startsWith('…'));
  assert.ok(result.endsWith('…'));
  assert.equal(excerpt('Short copy.', ''), 'Short copy.');
});
