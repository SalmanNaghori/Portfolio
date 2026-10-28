/* The Wall — Interactive visitor guestbook & CSV export */
(() => {
  'use strict';

  const { DEFAULT_NOTES, COLOR_PALETTE, notesToCsv, createNote, validateNote } = window.WallCore || {};
  const STORAGE_KEY = 'salman_portfolio_wall_notes';

  // Elements
  const grid = document.querySelector('#wall-grid');
  const countBadge = document.querySelector('#wall-count-badge');
  const dropBtn = document.querySelector('#wall-drop-btn');
  const exportBtn = document.querySelector('#wall-export-btn');
  const dialog = document.querySelector('#wall-dialog');
  const form = document.querySelector('#wall-form');
  const closeBtn = document.querySelector('#wall-modal-close');
  const nameInput = document.querySelector('#wall-name-input');
  const msgInput = document.querySelector('#wall-msg-input');
  const charCount = document.querySelector('#wall-char-count');
  const colorPicker = document.querySelector('#wall-color-picker');
  const canvas = document.querySelector('#wall-canvas');
  const clearBtn = document.querySelector('#wall-canvas-clear');
  const undoBtn = document.querySelector('#wall-canvas-undo');
  const toast = document.querySelector('#wall-toast');

  let notes = [];
  let selectedColor = COLOR_PALETTE ? COLOR_PALETTE[0].hex : '#ff99ae';
  let canvasContext = null;
  let isDrawing = false;
  let strokeHistory = [];
  let currentStroke = [];
  let toastTimer = null;

  // Persistence
  function loadNotes() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        notes = JSON.parse(stored);
      } else {
        notes = [...(DEFAULT_NOTES || [])];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      }
    } catch {
      notes = [...(DEFAULT_NOTES || [])];
    }
  }

  function saveNotes() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // Toast feedback
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 3500);
  }

  // Card Rendering
  function renderNotes() {
    if (!grid) return;
    grid.innerHTML = '';

    if (countBadge) {
      countBadge.innerHTML = `<span class="status-dot"></span><span>${notes.length} note${notes.length === 1 ? '' : 's'} pinned</span>`;
    }

    if (notes.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'wall-card';
      emptyDiv.style.gridColumn = '1 / -1';
      emptyDiv.style.textAlign = 'center';
      emptyDiv.innerHTML = '<p class="wall-card-body" style="margin:0;">The wall is waiting. Be the first to leave a mark!</p>';
      grid.appendChild(emptyDiv);
      return;
    }

    notes.forEach(note => {
      const card = document.createElement('article');
      card.className = 'wall-card';
      card.style.background = `linear-gradient(145deg, rgba(30, 20, 60, 0.7), rgba(18, 14, 45, 0.9))`;
      card.style.borderColor = `${note.color || '#ff99ae'}44`;

      const initial = (note.name || 'G').trim().charAt(0).toUpperCase();
      const accent = document.createElement('div');
      accent.className = 'wall-card-accent';
      accent.style.background = `linear-gradient(90deg, ${note.color || '#ff99ae'}, #ffffff)`;

      const top = document.createElement('div');
      top.className = 'wall-card-top';

      const avatar = document.createElement('div');
      avatar.className = 'wall-card-avatar';
      avatar.style.background = note.color || '#ff99ae';
      avatar.textContent = initial;

      const meta = document.createElement('div');
      meta.className = 'wall-card-meta';

      const nameEl = document.createElement('span');
      nameEl.className = 'wall-card-name';
      nameEl.textContent = note.name;

      const dateEl = document.createElement('span');
      dateEl.className = 'wall-card-date';
      dateEl.textContent = note.date || '';

      meta.appendChild(nameEl);
      meta.appendChild(dateEl);
      top.appendChild(avatar);
      top.appendChild(meta);

      const body = document.createElement('p');
      body.className = 'wall-card-body';
      body.textContent = note.message || '';

      card.appendChild(accent);
      card.appendChild(top);
      if (note.message) card.appendChild(body);

      if (note.drawing) {
        const drawingWrap = document.createElement('div');
        drawingWrap.className = 'wall-card-drawing';
        const img = document.createElement('img');
        img.src = note.drawing;
        img.alt = `Drawing by ${note.name}`;
        img.loading = 'lazy';
        drawingWrap.appendChild(img);
        card.appendChild(drawingWrap);
      }

      grid.appendChild(card);
    });
  }

  // Export Notes to CSV
  function exportNotesToCsv() {
    if (!notesToCsv) return;
    const csvContent = notesToCsv(notes);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = 'notes.csv';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
    showToast(`Exported ${notes.length} notes to notes.csv! 📄`);
  }

  // Canvas Drawing
  function setupCanvas() {
    if (!canvas) return;
    canvasContext = canvas.getContext('2d');
    resizeCanvas();

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
      };
    };

    const startDraw = (e) => {
      isDrawing = true;
      currentStroke = [];
      const pos = getPos(e);
      currentStroke.push(pos);
      canvasContext.beginPath();
      canvasContext.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      currentStroke.push(pos);

      canvasContext.strokeStyle = selectedColor || '#ff99ae';
      canvasContext.lineWidth = 3;
      canvasContext.lineCap = 'round';
      canvasContext.lineJoin = 'round';
      canvasContext.lineTo(pos.x, pos.y);
      canvasContext.stroke();
    };

    const endDraw = () => {
      if (!isDrawing) return;
      isDrawing = false;
      if (currentStroke.length > 0) {
        strokeHistory.push([...currentStroke]);
      }
    };

    canvas.addEventListener('pointerdown', startDraw);
    canvas.addEventListener('pointermove', draw);
    canvas.addEventListener('pointerup', endDraw);
    canvas.addEventListener('pointercancel', endDraw);
    canvas.addEventListener('pointerleave', endDraw);
  }

  function resizeCanvas() {
    if (!canvas || !canvasContext) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      redrawStrokes();
    }
  }

  function redrawStrokes() {
    if (!canvasContext || !canvas) return;
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    canvasContext.lineCap = 'round';
    canvasContext.lineJoin = 'round';
    canvasContext.lineWidth = 3 * 2;

    strokeHistory.forEach(stroke => {
      if (stroke.length < 2) return;
      canvasContext.beginPath();
      canvasContext.strokeStyle = selectedColor || '#ff99ae';
      canvasContext.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        canvasContext.lineTo(stroke[i].x, stroke[i].y);
      }
      canvasContext.stroke();
    });
  }

  function clearCanvas() {
    strokeHistory = [];
    currentStroke = [];
    if (canvasContext && canvas) {
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function undoStroke() {
    strokeHistory.pop();
    redrawStrokes();
  }

  function hasDrawing() {
    return strokeHistory.length > 0;
  }

  function getDrawingDataUrl() {
    if (!hasDrawing() || !canvas) return null;
    return canvas.toDataURL('image/png');
  }

  // Setup Palette
  function setupPalette() {
    if (!colorPicker || !COLOR_PALETTE) return;
    colorPicker.innerHTML = '';
    COLOR_PALETTE.forEach((color, idx) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'wall-color-swatch';
      button.style.backgroundColor = color.hex;
      button.setAttribute('aria-label', color.name);
      button.setAttribute('aria-checked', idx === 0 ? 'true' : 'false');
      button.setAttribute('role', 'radio');

      button.addEventListener('click', () => {
        selectedColor = color.hex;
        colorPicker.querySelectorAll('.wall-color-swatch').forEach(b => b.setAttribute('aria-checked', 'false'));
        button.setAttribute('aria-checked', 'true');
        redrawStrokes();
      });

      colorPicker.appendChild(button);
    });
  }

  // Event Listeners
  if (dropBtn && dialog) {
    dropBtn.addEventListener('click', () => {
      dialog.showModal();
      clearCanvas();
      if (nameInput) nameInput.focus();
      setTimeout(resizeCanvas, 60);
    });
  }

  if (closeBtn && dialog) {
    closeBtn.addEventListener('click', () => dialog.close());
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', exportNotesToCsv);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', clearCanvas);
  }

  if (undoBtn) {
    undoBtn.addEventListener('click', undoStroke);
  }

  if (msgInput && charCount) {
    msgInput.addEventListener('input', () => {
      charCount.textContent = `${msgInput.value.length} / 200`;
    });
  }

  if (form && dialog) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (nameInput?.value || '').trim();
      const message = (msgInput?.value || '').trim();
      const drawing = getDrawingDataUrl();

      const validation = validateNote ? validateNote({ name, message, drawing }) : { isValid: Boolean(name && (message || drawing)) };
      if (!validation.isValid) {
        alert(validation.errors ? validation.errors.join(' ') : 'Please enter your name and a note or drawing.');
        return;
      }

      const newNote = createNote ? createNote({ name, message, color: selectedColor, drawing }) : {
        id: `note-${Date.now()}`,
        name,
        date: new Date().toISOString().split('T')[0],
        message,
        color: selectedColor,
        drawing
      };

      notes.unshift(newNote);
      saveNotes();
      renderNotes();
      form.reset();
      clearCanvas();
      if (charCount) charCount.textContent = '0 / 200';
      dialog.close();
      showToast('Note pinned to the wall! 📌');
    });
  }

  // Initialize
  loadNotes();
  setupPalette();
  setupCanvas();
  renderNotes();

  window.addEventListener('resize', resizeCanvas, { passive: true });
})();

