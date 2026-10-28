/* Shared, dependency-free search rules for the browser and Node verification. */
(function (root) {
  'use strict';
  const normalize = value => String(value).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const termsFor = query => [...new Set(normalize(query).trim().split(/\s+/u).filter(Boolean))];

  function search(items, query, scope = 'All') {
    const terms = termsFor(query);
    const phrase = terms.join(' ');
    return items.filter(item => scope === 'All' || item.category === scope).map(item => {
      const title = normalize(item.title);
      const metadata = normalize(item.metadata || '');
      const body = normalize(item.body || '');
      const content = `${title} ${metadata} ${body}`;
      if (!terms.every(term => content.includes(term))) return null;
      let score = 0;
      if (terms.length) {
        if (title === phrase) score += 1000;
        else if (title.includes(phrase)) score += 400;
        else if (terms.every(term => title.includes(term))) score += 200;
        terms.forEach(term => { score += title.includes(term) ? 40 : metadata.includes(term) ? 12 : 4; });
      }
      return { ...item, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score);
  }

  // Map folded characters back to the original text, keeping accents and emoji intact.
  function matchRanges(text, query) {
    let folded = '';
    const offsets = [];
    let offset = 0;
    for (const character of text) {
      const normalized = normalize(character);
      folded += normalized;
      for (let i = 0; i < normalized.length; i += 1) offsets.push([offset, offset + character.length]);
      offset += character.length;
    }
    const ranges = [];
    termsFor(query).forEach(term => {
      let start = folded.indexOf(term);
      while (start !== -1) {
        ranges.push([offsets[start][0], offsets[start + term.length - 1][1]]);
        start = folded.indexOf(term, start + term.length);
      }
    });
    return ranges.sort((a, b) => a[0] - b[0]).reduce((merged, range) => {
      const last = merged[merged.length - 1];
      if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
      else merged.push([...range]);
      return merged;
    }, []);
  }

  function excerpt(text, query, maxLength = 170) {
    const first = matchRanges(text, query)[0];
    let start = first ? Math.max(0, first[0] - 48) : 0;
    if (start > 0) {
      const boundary = text.lastIndexOf(' ', start);
      start = boundary < 0 ? 0 : boundary + 1;
    }
    let end = Math.min(text.length, start + maxLength);
    if (end < text.length) {
      const boundary = text.lastIndexOf(' ', end);
      if (boundary > start) end = boundary;
    }
    return `${start ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
  }

  const api = { search, matchRanges, excerpt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PortfolioSearch = api;
})(globalThis);
