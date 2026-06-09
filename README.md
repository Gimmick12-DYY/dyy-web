# DYY — Personal Website

A personal research site built around a single visual idea: **one luminous line
that begins as a DNA double-helix and morphs into an EEG brain-wave**,
representing two halves of a research focus — genomics and neuroscience.

## Stack

Zero build step. Plain HTML, CSS, and vanilla JS with `<canvas>` animations.
Just open it or serve the folder.

## Run locally

```bash
# from the project root
python3 -m http.server 8000
# then open http://localhost:8000
```

## Files

| File         | Purpose                                                        |
| ------------ | -------------------------------------------------------------- |
| `index.html` | Page structure (hero, about, research, contact).               |
| `styles.css` | Dark theme, layout, the teal/violet "two worlds" palette.      |
| `main.js`    | Canvas animations: the hero helix→wave morph + the two motifs. |

## Sections

Hero → About → Research → Experience → Projects → Publications → Awards → Blog → Contact.
`publications.html` is the full publications page.
The nav links to each. `cv.pdf` is the downloadable resume (replace to update).

## Customize

- **Name**: search for `Yuyang Deng` in `index.html` (nav, hero, footer, `<title>`).
- **Copy**: hero `<h1>` / `.hero__lede`, About, Research cards, Experience,
  Projects, and Awards lists.
- **Links**: the `mailto:` and social `href`s in the Contact section.
- **CV**: replace `cv.pdf` in the project root.
- **Colors**: the `:root` variables in `styles.css` (`--dna`, `--wave`, …).
- **Animation feel**: tweak amplitudes / speeds in `main.js`
  (`helixAmp`, `waveAmp`, `turns`, and the `time +=` increments).
- **Add a Publications or Blog section** later by copying the Experience /
  Awards section markup.

The visuals respect `prefers-reduced-motion`.
