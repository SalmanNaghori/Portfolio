# Salman Naghori — Flutter Developer Portfolio

My portfolio showcases 3.6+ years of Flutter development experience, selected projects, technical skills and professional achievements.

**Live website:** https://salmannaghori.github.io/Portfolio/

## Highlights

- Professional experience at Impero IT Services and key Flutter accomplishments
- Selected work including TREX, HajiNaji, CrackIt, NorseMap / iViking and educational apps
- Skills across Flutter, Dart, BLoC/Cubit, Clean Architecture, Firebase, APIs, caching and deployment
- Responsive contact and resume links

Built as a static, responsive website with HTML, CSS and JavaScript, hosted on GitHub Pages.

## Portfolio search

Click **Search** or press **Cmd/Ctrl+K** to search project descriptions, technologies, skills and experience. Filter by category, browse highlighted matches, and use the arrow keys and Enter to jump to a result.

The search is inspired by Apple Notes. See the [research, source evidence, screenshots and verification guide](docs/search-evidence.md).

Preview locally with `python3 -m http.server 4173 --bind 127.0.0.1` and open `http://127.0.0.1:4173`. Run the dependency-free search tests with `node --test tests/search-core.test.cjs`.

## The Wall (Visitor Guestbook & CSV Export)

Visitors can leave digital sticky notes and touch/mouse drawings directly on **The Wall**:
- **Drop a note:** Choose from 6 vibrant note colors, write a message, and sketch on an interactive drawing canvas with undo and clear tools.
- **Export notes (CSV):** Click **Export notes (CSV)** to instantly compile and download all pinned notes to `notes.csv`.
- **Local persistence:** Stored in `localStorage` with initial community notes.
- **Search integration:** Search for `#wall` or guestbook notes directly via the Command Palette (`Cmd/Ctrl+K`).

Run unit tests with:
```bash
node --test tests/search-core.test.cjs tests/wall-core.test.cjs
```
