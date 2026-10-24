// Builds CHECK-ITEMS.md: every point in reasoning-content.js marked "check"
// (a code or fact not yet confirmed against the primary source). Clinical
// content shows a "draft" banner until these are reviewed and
// REASONING_CONTENT.reviewed is set to true.
//
// Run with:  npm run checks
// The tests fail if CHECK-ITEMS.md is out of date.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "CHECK-ITEMS.md");

function collect() {
    const sandbox = { window: {} };
    const source = fs.readFileSync(path.join(ROOT, "reasoning-content.js"), "utf8");
    new Function("window", source)(sandbox.window);
    const C = sandbox.window.REASONING_CONTENT;
    const groups = [];

    const suicide = [];
    (function walk(node) {
        if (!node || typeof node !== "object") return;
        Object.keys(node).forEach(key => {
            if (/check$/i.test(key) && typeof node[key] === "string") suicide.push({ where: "Follow-up", text: node[key] });
            else walk(node[key]);
        });
    })(C.suicide);
    if (suicide.length) groups.push({ name: "Suicide risk formulation", items: suicide });

    Object.keys(C.differentials).forEach(key => {
        const p = C.differentials[key];
        const seen = new Set();
        const items = [];
        [...p.ruleOut, ...p.differentials].forEach(entry => {
            if (!entry.check || seen.has(entry.check)) return;
            seen.add(entry.check);
            items.push({ where: entry.name, text: entry.check });
        });
        if (items.length) groups.push({ name: p.name, items });
    });
    return { reviewed: !!C.reviewed, groups };
}

function render() {
    const { reviewed, groups } = collect();
    const total = groups.reduce((n, g) => n + g.items.length, 0);
    const lines = [
        "# Clinical reasoning: items to check",
        "",
        "Points in the Reasoning tab that could not be confirmed against the primary source (mostly ICD-11 codes found only on coding sites, not the WHO browser at icd.who.int).",
        "Each one shows as a \"Check:\" note in the app until it is confirmed.",
        "",
        "When an item is confirmed (or corrected), remove its `check` line in `reasoning-content.js` and run `npm run checks` to update this list.",
        "When the list is empty and the content has been reviewed, set `reviewed: true` in `reasoning-content.js` to remove the draft banner.",
        "",
        `**${total} item${total === 1 ? "" : "s"} to check.** Draft banner: ${reviewed ? "off (reviewed)" : "on"}.`,
        ""
    ];
    groups.forEach(g => {
        lines.push(`## ${g.name}`, "");
        g.items.forEach(item => lines.push(`- [ ] **${item.where}:** ${item.text}`));
        lines.push("");
    });
    return lines.join("\n");
}

if (require.main === module) {
    fs.writeFileSync(OUT, render());
    console.log(`Wrote ${path.relative(ROOT, OUT)}.`);
}
module.exports = { render, OUT };
