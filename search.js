(() => {
  'use strict';
  const { search, matchRanges, excerpt } = window.PortfolioSearch;
  const dialog = document.querySelector('#command-palette');
  const trigger = document.querySelector('.command-trigger');
  const input = document.querySelector('#command-input');
  const results = document.querySelector('#search-results');
  const status = document.querySelector('#search-status');
  const start = document.querySelector('#search-start');
  const empty = document.querySelector('#search-empty');
  const clear = document.querySelector('#search-clear');
  const scopes = [...dialog.querySelectorAll('[data-search-scope]')];
  let scope = 'All';
  let announceTimer;
  let priorFocus;

  // Read only published portfolio copy; form values and decorative mockups are excluded.
  const textOf = element => {
    if (!element) return '';
    const clone = element.cloneNode(true);
    clone.querySelectorAll('script, style, form, button, [aria-hidden="true"], .role-chip, .project-links, .project-index, .project-glyph, .project-art').forEach(node => node.remove());
    return [...clone.childNodes].map(node => node.textContent).join(' ').replace(/\s+/g, ' ').trim();
  };
  const textFrom = (element, selector) => [...element.querySelectorAll(selector)].map(textOf).join(' ');
  const items = [
    { id: 'home', title: 'Home', category: 'Pages', metadata: 'Introduction · Salman Naghori', body: textFrom(document.querySelector('#home'), '.hero-role, .hero-description') },
    { id: 'about', title: 'About me', category: 'Pages', metadata: 'Profile · Ahmedabad · Remote', body: textFrom(document.querySelector('#about'), 'h3, p, .engineering-steps span') },
    { id: 'experience', title: 'Professional experience', category: 'Experience', metadata: 'Impero IT Services · Flutter Developer', body: textFrom(document.querySelector('#experience'), '.experience-meta, .experience-body li') },
    { id: 'work', title: 'Projects', category: 'Pages', metadata: 'Selected work · Case studies', body: textFrom(document.querySelector('#work'), '.section-heading h2, .section-heading p') },
    { id: 'skills', title: 'Skills', category: 'Pages', metadata: 'Technical expertise · Tools', body: textFrom(document.querySelector('#skills'), '.section-heading p, .tool-tile strong, .delivery-strip strong, .delivery-strip small') },
    { id: 'wall', title: 'The Wall', category: 'Pages', metadata: 'Visitor guestbook · Sticky notes · Drawings · CSV export', body: textFrom(document.querySelector('#wall'), '.hero-description, h2') || 'A digital guestbook for visitors, collaborators, and developers to pin notes and drawings. Leave your mark or export the wall to CSV.' },
    { id: 'contact', title: 'Contact', category: 'Pages', metadata: 'Email · LinkedIn · GitHub · Hire', body: textFrom(document.querySelector('#contact'), '.contact-heading p, .contact-availability, .direct-contact-options strong') }
  ];
  document.querySelectorAll('[data-search-item]').forEach(element => {
    items.push({
      id: element.id,
      title: textOf(element.querySelector('h3, strong')),
      category: element.dataset.searchItem,
      metadata: textFrom(element, '.project-type, .role-chip, .tags span, .skill-category, .impact-label, .impact-tech'),
      body: textFrom(element, 'p, .skill-chip-list span') || textOf(element.querySelector('div > span'))
    });
  });

  function highlighted(text, query) {
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    matchRanges(text, query).forEach(([from, to]) => {
      fragment.append(document.createTextNode(text.slice(cursor, from)));
      const mark = document.createElement('mark');
      mark.textContent = text.slice(from, to);
      fragment.append(mark);
      cursor = to;
    });
    fragment.append(document.createTextNode(text.slice(cursor)));
    return fragment;
  }

  function resultGroup(label, matches, query) {
    const group = document.createElement('section');
    group.className = 'search-group';
    const heading = document.createElement('h3');
    heading.className = 'command-label';
    heading.textContent = label;
    const list = document.createElement('ul');
    list.className = 'search-result-list';
    matches.forEach(item => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${item.id}`;
      link.className = 'search-result';
      const location = document.createElement('span');
      location.className = 'search-result-location';
      location.textContent = item.category === 'Pages' ? 'Portfolio · Page' : `Portfolio · ${item.category}`;
      const title = document.createElement('strong');
      title.className = 'search-result-title';
      title.append(highlighted(item.title, query));
      const summary = document.createElement('span');
      summary.className = 'search-result-summary';
      summary.append(highlighted(excerpt(item.body, query), query));
      link.append(location, title, summary);
      if (item.metadata && matchRanges(item.metadata, query).length) {
        const metadata = document.createElement('span');
        metadata.className = 'search-result-tags';
        metadata.append(highlighted(excerpt(item.metadata, query, 110), query));
        link.append(metadata);
      }
      li.append(link);
      list.append(li);
    });
    group.append(heading, list);
    return group;
  }

  function render() {
    const query = input.value.trim();
    const browsing = !query && scope === 'All';
    const matches = search(items, query, scope);
    scopes.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.searchScope === scope)));
    clear.hidden = !input.value;
    start.hidden = !browsing;
    results.hidden = browsing || !matches.length;
    empty.hidden = browsing || matches.length > 0;
    results.replaceChildren();
    if (!browsing && matches.length) {
      if (query) {
        results.append(resultGroup('Top Hit', matches.slice(0, 1), query));
        if (matches.length > 1) results.append(resultGroup('More Results', matches.slice(1), query));
      } else results.append(resultGroup(scope, matches, query));
    }
    if (!empty.hidden) {
      document.querySelector('#search-empty-message').textContent = `Nothing found for “${query}”${scope === 'All' ? '' : ` in ${scope.toLowerCase()}`}. Try fewer words or search All.`;
    }
    const message = browsing ? 'Search titles, descriptions and technologies.' : `${matches.length} ${matches.length === 1 ? 'result' : 'results'}${query ? ` for “${query}”` : ''} · ${scope === 'All' ? 'All content' : scope}`;
    // Delay announcements during typing without delaying the visible results.
    window.clearTimeout(announceTimer);
    announceTimer = window.setTimeout(() => { status.textContent = message; }, 180);
  }

  function close() {
    dialog.close();
    document.body.classList.remove('palette-open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  function open() {
    priorFocus = document.activeElement;
    scope = 'All';
    input.value = '';
    render();
    dialog.showModal();
    document.body.classList.add('palette-open');
    trigger.setAttribute('aria-expanded', 'true');
    input.focus();
  }

  trigger.addEventListener('click', open);
  dialog.querySelector('[data-close-palette]').addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
  // Native dialog supplies background inertness and opener restoration.
  dialog.addEventListener('close', () => {
    if (!dialog.open && document.activeElement === document.body) priorFocus?.focus();
  });
  input.addEventListener('input', render);
  clear.addEventListener('click', () => { input.value = ''; render(); input.focus(); });
  document.querySelector('#search-reset').addEventListener('click', () => { scope = 'All'; input.value = ''; render(); input.focus(); });
  scopes.forEach(button => button.addEventListener('click', () => { scope = button.dataset.searchScope; render(); }));
  dialog.querySelectorAll('[data-search-query]').forEach(button => button.addEventListener('click', () => {
    input.value = button.dataset.searchQuery;
    render();
    input.focus();
  }));
  dialog.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const href = link.getAttribute('href');
    close();
    if (!href.startsWith('#')) return;
    const destination = document.getElementById(href.slice(1));
    if (!destination) return;
    event.preventDefault();
    window.location.hash = href;
    destination.classList.add('is-visible');
    destination.setAttribute('tabindex', '-1');
    destination.focus({ preventScroll: true });
    destination.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  });
  dialog.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'Tab') {
      const controls = [...dialog.querySelectorAll('a[href], button, input')].filter(element => !element.disabled && element.getClientRects().length);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    const links = [...dialog.querySelectorAll('#search-results a, .command-grid a')].filter(link => link.getClientRects().length);
    const index = links.indexOf(document.activeElement);
    if (event.key === 'Enter' && event.target === input && links[0]) {
      event.preventDefault();
      links[0].click();
    }
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && (event.target === input || index !== -1) && links.length) {
      event.preventDefault();
      if (event.key === 'ArrowUp' && index === 0) input.focus();
      else {
        const next = event.key === 'ArrowDown' ? (index + 1) % links.length : index === -1 ? links.length - 1 : index - 1;
        links[next].focus();
      }
    }
  });
  document.addEventListener('keydown', event => {
    if (!event.isComposing && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (dialog.open) close();
      else open();
    }
  });
})();
