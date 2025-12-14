# HTML → Elementor Flexbox JSON Converter (MVP)

This is a small backend MVP that converts simple HTML into an Elementor template JSON using Flexbox Containers and native widgets (heading, text-editor, image, button).

Quick start

1. Install dependencies:

```bash
npm install
```

2. Run the converter on the example input:

```bash
node index.js example/input.html example/output.json
```

Files
- `index.js` — CLI entrypoint
- `lib/convert.js` — HTML parsing and mapping logic (Cheerio)
- `example/input.html` — sample input HTML
- `example/output.json` — sample expected JSON (illustrative)

Mapping notes (brief)
- `<section>` -> top-level Flexbox `section` element (Elementor `section`)
- `<div>` used for layout -> `column` inside a `section` when multiple sibling `div`s are present; otherwise a single `column` wraps content

Elementor format target
- This converter now emits a structure matching common Elementor 3.x JSON exports using `elType` values: `section`, `column`, `widget` and includes widget `elements` arrays and a `version`/`exported_by` top-level keys. That increases the chance the produced JSON will import as editable native widgets in Elementor. You may still need to tweak minor keys to match your specific Elementor version.
Limitations / scope
- Minimal styling (padding/gap defaults hardcoded)
- No WordPress integration — this outputs a JSON file you can try to import into Elementor
- Format is a minimal, pragmatic representation modeled after Elementor exports; depending on Elementor version you may need to adjust keys for exact imports.

Next steps you might ask me to do
- Tweak JSON structure to match specific Elementor version used in your environment
- Add an Express endpoint to accept HTML via POST and return a downloadable JSON
- Improve column width detection and styling mappings
