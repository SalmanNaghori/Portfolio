# Apple Notes search → portfolio search

Reviewed on October 29, 2026. Research is based on Apple's published documentation, not a hands-on inspection of the native Notes app.

## Source evidence

[Apple's “Search your notes on Mac” guide](https://support.apple.com/guide/notes/search-your-notes-not18ab658ed/mac) explicitly includes “The body of each note” in searchable content and states “Top Hits appears first in the results.” It describes suggested searches, account scopes, folder context, and ranking influenced by titles and modification recency. Its [official interface illustration](https://ipcdn-web.apple.com/assets/v2/web/63114421-028d-4674-ad71-6060afe27791) shows suggested searches.

| Documented Notes behavior | Portfolio adaptation |
| --- | --- |
| Search note content, beyond its title | Search project descriptions, technologies, skill groups and experience |
| Suggested searches narrow the search | Suggested keywords: Offline access, Flutter, Notifications |
| Restrict searching to an account | Restrict results to Projects, Skills or Experience; All removes the restriction |
| Top Hits prioritize relevant notes, including title matches | An exact title ranks first, followed by title phrases, title words, metadata and body matches |
| Results identify the containing folder | Results identify the portfolio category and link to the specific card |

The [provided Wall page](https://awrs.me/en/wall) was also inspected. Its extracted page identifies a wall for pinned messages; it is not the evidence source for Apple Notes behavior.

## What changed

The previous menu compared one lowercase query with six hardcoded navigation labels and their aliases. It could find the Projects section, but not a case-study detail such as `previously fetched`.

The new menu builds its index from published page copy on every load: six page/section entries, nine projects, six skill groups and three engineering-impact cards. Text added to these existing entries becomes searchable without updating a duplicate content database. New cards need a unique `id` and a `data-search-item` category, following the existing markup.

Queries match case-insensitively and ignore accents. Every whitespace-separated word must appear somewhere in an entry; punctuation is literal. Equal scores preserve source order. An empty query with a category selected browses that category. Clear removes the text while keeping the category; Reset search removes both. Reopening starts fresh.

Results update while typing, show a Top Hit, highlight matches, provide nearby body text, and announce result counts. These interaction details are our implementation choices, not claims about undocumented Apple behavior. Search uses the portfolio's existing colors and typefaces.

Use the header's Search button or **Cmd/Ctrl+K**. Arrow keys move through results; Enter opens one; Escape closes the dialog. Tab and Shift+Tab stay inside it. Closing returns focus to the opener; choosing a result focuses the destination. The browser's normal Cmd/Ctrl+F remains available.

Everything runs locally in the browser with no new runtime dependencies. Search does not read contact-form values, send queries to a server, or save search history. User queries and highlighted excerpts are inserted as text nodes, not HTML.

This implementation does not provide OCR, attachment indexing, natural-language date parsing, or recency ranking. The portfolio has no note attachments or reliable per-entry modification dates. It is a keyword search adapted to a static portfolio.

## Implementation evidence

These are screenshots of the implemented portfolio, not screenshots of Apple Notes:

- [Desktop suggestions and navigation](evidence/search-suggestions-desktop.png)
- [Desktop search results and highlighting](evidence/search-results-desktop.png)
- [Mobile search results](evidence/search-results-mobile.png)
- [Mobile empty state](evidence/search-empty-mobile.png)

Reproduce useful cases:

| Action | Expected result |
| --- | --- |
| Search `trex` in All | TREX is the Top Hit, above entries mentioning it |
| Search `previously fetched` in Projects | HajiNaji, with matching description text highlighted |
| Search `ObjectBox` in Projects, then Skills | HajiNaji, then Data & Device Features |
| Search `Flutter offline` in Projects | Educational eReader; both words must occur in the published card |
| Select Projects with an empty query | All nine project entries |
| Search `healthcare` in Projects | Hexia, including its existing description |
| Search `no-such-project-123` | Empty state with Reset search |
| Open HajiNaji using Enter | Dialog closes and focuses `#project-hajinaji` |

## Verification

Eight Node tests cover ranking, body/metadata matching, multiword queries, whitespace, scopes, literal punctuation, Unicode highlighting and excerpts:

```sh
node --test tests/search-core.test.cjs
```

The Chrome browser suite checks the actual page: indexing, ranking, categories, highlights, empty/reset states, safe query rendering, dynamic copy changes, keyboard navigation, focus wrapping/restoration, backdrop dismissal, and overflow at 390px and 320px. It captures the screenshots above and fails on page JavaScript errors.

```sh
python3 -m http.server 4173 --bind 127.0.0.1
# In another terminal, using an installed Playwright and Google Chrome:
node tests/search.browser.cjs
```

If Playwright is installed elsewhere, set `PLAYWRIGHT_MODULE` to its `playwright` or `playwright-core` directory. `PORTFOLIO_URL` can override the default `http://127.0.0.1:4173` address.

All eight Node tests and the Chrome suite passed. JavaScript syntax checks and `git diff --check` also passed. Screenshots were visually reviewed. Native Safari, a physical phone/onscreen keyboard, and a screen reader were not tested. Changes are local to this checkout; the existing GitHub Pages deployment has not been updated.
