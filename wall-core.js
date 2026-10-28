/* Shared, dependency-free Wall guestbook & CSV export core logic. */
(function (root) {
  'use strict';

  const DEFAULT_NOTES = [
    {
      id: 'note-1',
      name: 'Alex Rivera',
      date: '2026-10-25',
      message: 'Great clean architecture breakdown in TREX! The offline BLoC sync strategy is top tier.',
      color: '#ff99ae',
      has_drawing: false,
      drawing: null
    },
    {
      id: 'note-2',
      name: 'Devin Chen',
      date: '2026-10-26',
      message: 'Loved the HajiNaji app case study. Inspiring work on background sync and responsive UI!',
      color: '#90abff',
      has_drawing: false,
      drawing: null
    },
    {
      id: 'note-3',
      name: 'Priya Sharma',
      date: '2026-10-27',
      message: 'Super smooth 60fps animations and attention to detail. Hello from Berlin! 🚀',
      color: '#c7a5ff',
      has_drawing: false,
      drawing: null
    },
    {
      id: 'note-4',
      name: 'Jordan K.',
      date: '2026-10-28',
      message: 'Awesome portfolio aesthetic. Leaving my mark on your wall!',
      color: '#ffbd83',
      has_drawing: false,
      drawing: null
    }
  ];

  const COLOR_PALETTE = [
    { hex: '#ff99ae', name: 'Rose Coral', from: 'rgba(255, 153, 174, 0.18)', to: 'rgba(255, 105, 135, 0.28)', border: '#ff99ae' },
    { hex: '#ffbd83', name: 'Warm Amber', from: 'rgba(255, 189, 131, 0.18)', to: 'rgba(255, 154, 75, 0.28)', border: '#ffbd83' },
    { hex: '#ffd479', name: 'Sunny Gold', from: 'rgba(255, 212, 121, 0.18)', to: 'rgba(245, 180, 50, 0.28)', border: '#ffd479' },
    { hex: '#7ee8b7', name: 'Mint Emerald', from: 'rgba(126, 232, 183, 0.18)', to: 'rgba(60, 205, 140, 0.28)', border: '#7ee8b7' },
    { hex: '#90abff', name: 'Sky Blue', from: 'rgba(144, 171, 255, 0.18)', to: 'rgba(100, 135, 245, 0.28)', border: '#90abff' },
    { hex: '#c7a5ff', name: 'Electric Violet', from: 'rgba(199, 165, 255, 0.18)', to: 'rgba(165, 115, 245, 0.28)', border: '#c7a5ff' }
  ];

  function escapeCsvField(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    return `"${str.replaceAll('"', '""')}"`;
  }

  function notesToCsv(notes) {
    const header = 'id,name,date,message,color,has_drawing';
    const rows = (notes || []).map(note => {
      const id = escapeCsvField(note.id || '');
      const name = escapeCsvField(note.name || '');
      const date = escapeCsvField(note.date || '');
      const message = escapeCsvField(note.message || '');
      const color = escapeCsvField(note.color || '');
      const hasDrawing = escapeCsvField(Boolean(note.drawing || note.has_drawing));
      return `${id},${name},${date},${message},${color},${hasDrawing}`;
    });
    return [header, ...rows].join('\n') + '\n';
  }

  function validateNote(data) {
    const errors = [];
    const name = String(data?.name || '').trim();
    const message = String(data?.message || '').trim();
    const hasDrawing = Boolean(data?.drawing);

    if (!name) {
      errors.push('Name is required.');
    } else if (name.length > 60) {
      errors.push('Name must be 60 characters or fewer.');
    }

    if (!message && !hasDrawing) {
      errors.push('Please provide a message or a drawing.');
    } else if (message.length > 200) {
      errors.push('Message must be 200 characters or fewer.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  function createNote(data) {
    const validation = validateNote(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }
    const today = new Date().toISOString().split('T')[0];
    return {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: String(data.name).trim(),
      date: data.date || today,
      message: String(data.message || '').trim(),
      color: data.color || COLOR_PALETTE[0].hex,
      has_drawing: Boolean(data.drawing),
      drawing: data.drawing || null
    };
  }

  const api = {
    DEFAULT_NOTES,
    COLOR_PALETTE,
    escapeCsvField,
    notesToCsv,
    validateNote,
    createNote
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.WallCore = api;
  }
})(globalThis);

