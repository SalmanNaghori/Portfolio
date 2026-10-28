document.body.classList.add('enhanced');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scroll progress, floating navigation and active section.
const siteHeader = document.querySelector('.site-header');
const scrollProgress = document.querySelector('.scroll-progress span');
const navLinks = [...document.querySelectorAll('.primary-nav a')];
let scrollTicking = false;
const updateScroll = () => {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  siteHeader?.classList.toggle('is-scrolled', window.scrollY > 140);
  if (scrollProgress) scrollProgress.style.transform = `scaleX(${Math.min(1, window.scrollY / maxScroll)})`;
  scrollTicking = false;
};
window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    scrollTicking = true;
    window.requestAnimationFrame(updateScroll);
  }
}, { passive: true });
window.addEventListener('resize', updateScroll, { passive: true });
updateScroll();

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach(link => {
        if (link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-30% 0px -55% 0px' });
  document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
}

// Staggered, individually animated hero letters.
let letterIndex = 0;
document.querySelectorAll('[data-split-name]').forEach(word => {
  const content = word.textContent || '';
  const fragment = document.createDocumentFragment();
  for (const letter of content) {
    const span = document.createElement('span');
    span.className = 'name-letter';
    span.textContent = letter;
    span.style.setProperty('--letter-index', String(letterIndex++));
    fragment.appendChild(span);
  }
  word.replaceChildren(fragment);
});

// Small ambient particles and pointer-responsive background.
const cinematicHero = document.querySelector('.cinematic-hero');
const heroParticles = document.querySelector('.hero-particles');
if (!reduceMotion && cinematicHero && heroParticles) {
  for (let i = 0; i < 17; i += 1) {
    const dot = document.createElement('i');
    dot.style.left = `${(i * 37 + 13) % 98}%`;
    dot.style.top = `${(i * 29 + 11) % 83 + 5}%`;
    dot.style.animationDelay = `${(i % 7) * -.8}s`;
    dot.style.animationDuration = `${6 + (i % 5) * 1.8}s`;
    heroParticles.appendChild(dot);
  }
  cinematicHero.addEventListener('pointermove', event => {
    const bounds = cinematicHero.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
    cinematicHero.style.setProperty('--hero-parallax-x', `${x * 12}px`);
    cinematicHero.style.setProperty('--hero-parallax-y', `${y * 12}px`);
  }, { passive: true });
  cinematicHero.addEventListener('pointerleave', () => {
    cinematicHero.style.setProperty('--hero-parallax-x', '0px');
    cinematicHero.style.setProperty('--hero-parallax-y', '0px');
  });
}

// Reveal content progressively without hiding anything when JavaScript is absent.
const revealTargets = document.querySelectorAll('.reveal, .impact-card, .experience-card, .project-card, .tool-tile, .skill-group, .more-projects, .contact-heading, .contact-panel');
if (!reduceMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .07, rootMargin: '0px 0px -35px 0px' });
  revealTargets.forEach((element, index) => {
    element.classList.add('reveal-ready');
    element.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 65}ms`);
    revealObserver.observe(element);
  });
}

// Animate only the metrics documented in the resume.
const counters = [...document.querySelectorAll('[data-count]')];
let countersStarted = false;
const startCounters = () => {
  if (countersStarted) return;
  countersStarted = true;
  counters.forEach(element => {
    const target = Number(element.dataset.count || 0);
    const decimals = Number(element.dataset.decimals || 0);
    if (reduceMotion) {
      element.textContent = `${target.toFixed(decimals)}+`;
      return;
    }
    const start = performance.now();
    const duration = 1400;
    const frame = now => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${(target * eased).toFixed(decimals)}+`;
      if (progress < 1) window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);
  });
};
if ('IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver((entries, observer) => {
    if (entries.some(entry => entry.isIntersecting)) {
      startCounters();
      observer.disconnect();
    }
  }, { threshold: .25 });
  const stats = document.querySelector('.bento-stats');
  if (stats) counterObserver.observe(stats);
} else startCounters();

if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.setProperty('--tilt-x', `${(-y * 3.5).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${(x * 3.5).toFixed(2)}deg`);
      card.style.setProperty('--shine-x', `${(x + .5) * 100}%`);
      card.style.setProperty('--shine-y', `${(y + .5) * 100}%`);
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });
}

// Searchable command menu (Ctrl/Cmd+K), with Escape, filtering and focus trap.
const commandTrigger = document.querySelector('.command-trigger');
const commandPalette = document.querySelector('#command-palette');
const commandSearch = document.querySelector('#command-input');
const quickLinks = [...document.querySelectorAll('[data-quicklink]')];
const commandEmpty = document.querySelector('.command-empty');
let closeTimer;
let priorFocus = null;

const filterQuickLinks = () => {
  const query = (commandSearch?.value || '').trim().toLowerCase();
  let matches = 0;
  quickLinks.forEach(link => {
    const found = !query || (link.dataset.quicklink || '').includes(query) || link.textContent.toLowerCase().includes(query);
    link.hidden = !found;
    if (found) matches += 1;
  });
  if (commandEmpty) commandEmpty.hidden = matches !== 0;
};
const openPalette = () => {
  if (!commandPalette || !commandTrigger) return;
  window.clearTimeout(closeTimer);
  priorFocus = document.activeElement;
  commandPalette.hidden = false;
  document.body.classList.add('palette-open');
  commandTrigger.setAttribute('aria-expanded', 'true');
  if (commandSearch) commandSearch.value = '';
  filterQuickLinks();
  window.requestAnimationFrame(() => commandPalette.classList.add('open'));
  window.setTimeout(() => commandSearch?.focus(), 80);
};
const closePalette = () => {
  if (!commandPalette || commandPalette.hidden) return;
  commandPalette.classList.remove('open');
  document.body.classList.remove('palette-open');
  commandTrigger?.setAttribute('aria-expanded', 'false');
  closeTimer = window.setTimeout(() => { commandPalette.hidden = true; }, 230);
  if (priorFocus && typeof priorFocus.focus === 'function') priorFocus.focus();
};
commandTrigger?.addEventListener('click', () => {
  if (commandPalette?.hidden) openPalette();
  else closePalette();
});
commandPalette?.querySelectorAll('[data-close-palette]').forEach(button => button.addEventListener('click', closePalette));
commandPalette?.querySelectorAll('a').forEach(link => link.addEventListener('click', closePalette));
commandSearch?.addEventListener('input', filterQuickLinks);
commandSearch?.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    const first = quickLinks.find(link => !link.hidden);
    if (first) {
      event.preventDefault();
      first.click();
    }
  }
  if (event.key === 'ArrowDown') {
    const first = quickLinks.find(link => !link.hidden);
    if (first) {
      event.preventDefault();
      first.focus();
    }
  }
});
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (commandPalette?.hidden) openPalette();
    else closePalette();
  }
  if (event.key === 'Escape') closePalette();
  if (event.key === 'Tab' && commandPalette && !commandPalette.hidden) {
    const focusables = [...commandPalette.querySelectorAll('a:not([hidden]),button:not([hidden]),input:not([hidden])')].filter(el => el.getClientRects().length);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

// Real contact choices: either compose an email or use direct channels.
const contactTabs = [...document.querySelectorAll('.contact-methods [role=tab]')];
const contactPanels = [...document.querySelectorAll('.contact-panel[role=tabpanel]')];
const activateContactTab = selected => {
  contactTabs.forEach(tab => {
    const active = tab === selected;
    tab.classList.toggle('method-active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  contactPanels.forEach(panel => {
    panel.hidden = panel.id !== selected.getAttribute('aria-controls');
    if (!panel.hidden && panel.classList.contains('reveal-ready')) panel.classList.add('is-visible');
  });
};
contactTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateContactTab(tab));
  tab.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = contactTabs[(index + (event.key === 'ArrowRight' ? 1 : contactTabs.length - 1)) % contactTabs.length];
    activateContactTab(next);
    next.focus();
  });
});

const copyButton = document.querySelector('#copy-email');
const copyFeedback = document.querySelector('#copy-feedback');
copyButton?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('salmannaghori@gmail.com');
    if (copyFeedback) copyFeedback.textContent = 'Email address copied.';
  } catch {
    if (copyFeedback) copyFeedback.textContent = 'Copy this address: salmannaghori@gmail.com';
  }
});

const contactForm = document.querySelector('#contact-form');
const contactFeedback = document.querySelector('#contact-feedback');

if (contactForm && contactFeedback) {
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;

    const formData = new FormData(contactForm);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const topic = String(formData.get('topic') || 'Portfolio inquiry');
    const message = String(formData.get('message') || '').trim();
    if (!name || !email || !message) {
      contactFeedback.textContent = 'Please complete your name, email and message.';
      return;
    }

    const subject = encodeURIComponent(`Portfolio inquiry: ${topic}`);
    const body = encodeURIComponent(`Hi Salman,\n\n${message}\n\nFrom: ${name}\nEmail: ${email}\nTopic: ${topic}`);
    contactFeedback.textContent = 'Your email app should open with a prepared message. Please send it there. If it does not open, email salmannaghori@gmail.com directly.';
    window.location.href = `mailto:salmannaghori@gmail.com?subject=${subject}&body=${body}`;
  });
}
