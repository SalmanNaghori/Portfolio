const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_NOTES,
  COLOR_PALETTE,
  escapeCsvField,
  notesToCsv,
  validateNote,
  createNote
} = require('../wall-core.js');

test('wall core: default notes list contains valid notes', () => {
  assert.ok(Array.isArray(DEFAULT_NOTES));
  assert.ok(DEFAULT_NOTES.length >= 3);
  DEFAULT_NOTES.forEach(note => {
    assert.ok(note.id);
    assert.ok(note.name);
    assert.ok(note.date);
    assert.ok(note.message);
    assert.ok(note.color);
  });
});

test('wall core: escapes CSV fields with quotes and commas safely', () => {
  assert.equal(escapeCsvField('Hello World'), '"Hello World"');
  assert.equal(escapeCsvField('Quotes "inside" text'), '"Quotes ""inside"" text"');
  assert.equal(escapeCsvField('Comma, separated, values'), '"Comma, separated, values"');
  assert.equal(escapeCsvField('Line1\nLine2'), '"Line1\nLine2"');
  assert.equal(escapeCsvField(null), '""');
  assert.equal(escapeCsvField(undefined), '""');
});

test('wall core: notesToCsv formats header and fields correctly', () => {
  const sampleNotes = [
    {
      id: '1',
      name: 'Salman',
      date: '2026-10-29',
      message: 'Hello, "world"!',
      color: '#ff99ae',
      has_drawing: false
    },
    {
      id: '2',
      name: 'Visitor',
      date: '2026-10-29',
      message: 'Nice drawing',
      color: '#90abff',
      has_drawing: true,
      drawing: 'data:image/png;base64,sample'
    }
  ];

  const csv = notesToCsv(sampleNotes);
  const lines = csv.trim().split('\n');

  assert.equal(lines[0], 'id,name,date,message,color,has_drawing');
  assert.equal(lines[1], '"1","Salman","2026-10-29","Hello, ""world""!","#ff99ae","false"');
  assert.equal(lines[2], '"2","Visitor","2026-10-29","Nice drawing","#90abff","true"');
});

test('wall core: validates required note fields correctly', () => {
  // Empty name
  const invalidName = validateNote({ name: '', message: 'Test message' });
  assert.equal(invalidName.isValid, false);
  assert.ok(invalidName.errors.some(e => e.includes('Name is required')));

  // Empty message and no drawing
  const emptyContent = validateNote({ name: 'Alex', message: '' });
  assert.equal(emptyContent.isValid, false);
  assert.ok(emptyContent.errors.some(e => e.includes('message or a drawing')));

  // Message too long (> 200 chars)
  const tooLong = validateNote({ name: 'Alex', message: 'a'.repeat(201) });
  assert.equal(tooLong.isValid, false);
  assert.ok(tooLong.errors.some(e => e.includes('200 characters')));

  // Valid with message only
  const validMessage = validateNote({ name: 'Alex', message: 'Great job!' });
  assert.equal(validMessage.isValid, true);

  // Valid with drawing only
  const validDrawing = validateNote({ name: 'Alex', message: '', drawing: 'data:image/png;base64,...' });
  assert.equal(validDrawing.isValid, true);
});

test('wall core: createNote assigns unique id and valid properties', () => {
  const note = createNote({
    name: 'Devin',
    message: 'Testing note creation',
    color: '#90abff'
  });

  assert.ok(note.id.startsWith('note-'));
  assert.equal(note.name, 'Devin');
  assert.equal(note.message, 'Testing note creation');
  assert.equal(note.color, '#90abff');
  assert.equal(note.has_drawing, false);
  assert.ok(note.date);
});

