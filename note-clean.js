/* =========================================================================
 * "Copy clean note": leaves out what wasn't filled in, so the note can be
 * pasted into the medical record. Used by the Patient Review Workspace,
 * which shows the result in an editable preview before copying.
 *
 * It compares the note with the template it started from, one block at a
 * time (blocks are separated by blank lines):
 *   - empty fields are left out: lines ending in "-", "–" or "__"
 *     ("Address - ", "-Legal status: __");
 *   - lines unchanged from the template are left out, except
 *       - headings with something written under them in the same block
 *         (lines ending in ":" or starting with "#", and short template
 *         lines like "Risk Assessment");
 *       - the note's first line (its title) and a sign-off block left as
 *         the template had it (name and role at the end);
 *   - a template prompt in brackets at the start of a filled-in line is
 *     trimmed ("Suicidal Ideation: (Current/past...) Denies" keeps
 *     "Suicidal Ideation: Denies");
 *   - blank lines are reduced to one between blocks.
 * Anything written or changed is kept, and nothing is reworded.
 * ========================================================================= */

(function (root) {
    "use strict";

    const isEmptyField = t => t.length < 150 && /(?:[-–]|_{2,})$/.test(t);
    const isWrapped = t => /^\(.*\)$/.test(t) || /^\[.*\]$/.test(t);

    function cleanNote(text, templateBody) {
        const template = new Set(String(templateBody || "").split("\n").map(l => l.trim()).filter(Boolean));
        const templatePrompts = [...template].filter(t => /\([^)]*\)\s*$/.test(t) && !isWrapped(t));
        const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");

        const blocks = [];
        let block = [];
        lines.forEach(raw => {
            const t = raw.trim();
            if (!t) {
                if (block.length) blocks.push(block);
                block = [];
                return;
            }
            block.push({ raw, t, unchanged: template.has(t) });
        });
        if (block.length) blocks.push(block);

        const isHeading = l => /:$/.test(l.t) || /^#/.test(l.t) ||
            (l.unchanged && l.t.length < 60 && !/[.?!)\]]$/.test(l.t) && !/^[-–•*]/.test(l.t));

        let removed = 0;
        const kept = [];
        // Headings in a block with nothing under them wait here: if the next
        // block starts with something written ("On review:", blank lines,
        // then the review), they are kept above it.
        let waiting = [];
        blocks.forEach((lines, b) => {
            const signOff = b === blocks.length - 1 && b > 0 && lines.every(l => l.unchanged && !isEmptyField(l.t) && !/:$/.test(l.t));
            if (signOff) { kept.push(lines.map(l => l.raw).join("\n")); return; }

            const title = (l, i) => b === 0 && i === 0;
            const prompts = lines.map((l, i) => !title(l, i) && (l.t === "#" || isEmptyField(l.t) || (l.unchanged && !isHeading(l))));
            const headings = lines.map((l, i) => !title(l, i) && !prompts[i] && isHeading(l));

            const out = [];
            const orphans = [];
            let startsWritten = null;
            lines.forEach((l, i) => {
                if (prompts[i]) { removed++; return; }
                if (headings[i]) {
                    const writtenBelow = lines.slice(i + 1).some((m, j) => !prompts[i + 1 + j] && !headings[i + 1 + j]);
                    if (!writtenBelow) { removed++; orphans.push(l.raw); return; }
                }
                if (startsWritten === null) startsWritten = !headings[i];
                let raw = l.raw;
                if (!l.unchanged) {
                    const prompt = templatePrompts.find(p => l.t.startsWith(p) && l.t.length > p.length);
                    if (prompt) {
                        const label = prompt.replace(/\s*\([^)]*\)\s*$/, "");
                        raw = raw.match(/^\s*/)[0] + (label + " " + l.t.slice(prompt.length).trim()).trim();
                    }
                }
                out.push(raw);
            });
            if (out.length) {
                if (waiting.length && startsWritten) {
                    kept.push(waiting.join("\n"));
                    removed -= waiting.length;
                }
                kept.push(out.join("\n"));
                waiting = [];
            } else {
                waiting = orphans;
            }
        });

        return { text: kept.join("\n\n"), removed };
    }

    const api = { cleanNote };
    root.NOTE_CLEAN = api;
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
