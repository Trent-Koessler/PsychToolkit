// Automated checks for PsychToolkit's calculators and scales.
//
// Run with:  npm test
//
// It serves the site locally, opens it in a headless Chromium browser, fills in
// the calculators the way a person would, and compares the answers with known
// correct values. Any mismatch is listed and the run exits with an error.

const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };

function startServer() {
    const server = http.createServer((req, res) => {
        const urlPath = decodeURIComponent(req.url.split("?")[0]);
        const file = path.join(ROOT, urlPath === "/" ? "index.html" : urlPath);
        if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
            res.writeHead(404);
            res.end();
            return;
        }
        res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
        fs.createReadStream(file).pipe(res);
    });
    return new Promise(resolve => server.listen(0, () => resolve(server)));
}

// Published score ranges. If a scale's lowest/highest possible total in the app
// differs from these, an item or option value is wrong.
// The PSQI is scored from typed answers, so it has its own test below.
const SCALE_RANGES = {
    panic: [0, 28],
    phq9: [0, 27], gad7: [0, 21], epds: [0, 30], pcl5: [0, 80], ymrs: [0, 60],
    asrs: [0, 24], hamd: [0, 52], hama: [0, 56], bfcrs: [0, 42], bprs: [18, 126],
    panss: [30, 210], aims: [0, 28], audit: [0, 40], dast10: [0, 10], cuditr: [0, 32],
    pgsi: [0, 27], moca: [0, 30], mmse: [0, 30], fab: [0, 18], pclr: [0, 40],
    aq10: [0, 10], sapas: [0, 8], bis11: [30, 120]
};

// Score -> expected severity text (a substring is enough), at each cut-off.
const SEVERITY_BANDS = {
    phq9: [[4, "Minimal"], [5, "Mild"], [9, "Mild"], [10, "Moderate"], [14, "Moderate Depression"],
        [15, "Moderately Severe"], [19, "Moderately Severe"], [20, "Severe Depression"]],
    gad7: [[4, "Minimal"], [5, "Mild"], [10, "Moderate"], [15, "Severe"]],
    audit: [[7, "Low risk"], [8, "Hazardous"]],
    pgsi: [[0, "Non-problem"], [1, "Low"], [2, "Low"], [3, "Moderate"], [7, "Moderate"], [8, "Problem gambler"]],
    hamd: [[7, "Normal"], [8, "Mild"], [16, "Mild"], [17, "Moderate"], [23, "Moderate"], [24, "Severe"]],
    // PDSS without agoraphobia (Furukawa et al. 2009); the helper answers "No".
    panic: [[1, "Normal"], [2, "Borderline"], [5, "remission"], [6, "Slightly ill"], [9, "Slightly ill"],
        [10, "Moderately ill"], [13, "Moderately ill"], [14, "Markedly ill"]]
};

const failures = [];
let checks = 0;
function expect(label, actual, expected) {
    checks++;
    if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function expectIncludes(label, actual, expected) {
    checks++;
    if (!String(actual).includes(expected)) failures.push(`${label}: expected text containing ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

// Answer every item of a scale so the total is `target` (or all-min / all-max),
// then return the displayed total and severity text.
async function answerScale(page, scaleId, target) {
    return page.evaluate(({ scaleId, target }) => {
        const section = document.getElementById(scaleId);
        const fieldsets = Array.from(section.querySelectorAll("fieldset.calculator-item"));
        const valuesOf = fs => Array.from(fs.querySelectorAll("input[type=radio]")).map(r => Number(r.value));
        let remaining = typeof target === "number"
            ? target - fieldsets.reduce((sum, fs) => sum + Math.min(...valuesOf(fs)), 0)
            : 0;
        fieldsets.forEach(fs => {
            const radios = Array.from(fs.querySelectorAll("input[type=radio]"));
            const values = valuesOf(fs);
            const min = Math.min(...values);
            let want;
            if (target === "min") want = min;
            else if (target === "max") want = Math.max(...values);
            else {
                // Greedy: take as much of the remaining score as this item allows.
                want = Math.max(...values.filter(v => v - min <= remaining));
                remaining -= want - min;
            }
            const radio = radios.find(r => Number(r.value) === want);
            radio.checked = true;
            radio.dispatchEvent(new Event("change", { bubbles: true }));
        });
        return {
            total: section.querySelector(".total-score").textContent.trim(),
            severity: section.querySelector(".severity").textContent.trim(),
            summary: section.querySelector(".emr-summary").value
        };
    }, { scaleId, target });
}

async function newUnlockedPage(browser, baseUrl, hash = "") {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on("pageerror", err => failures.push(`Page error: ${err.message}`));
    await page.addInitScript(() => {
        sessionStorage.setItem("unlocked", "true");
        localStorage.setItem("disclaimer_accepted", "1");
    });
    await page.goto(baseUrl + "/index.html" + hash);
    return page;
}

async function testScales(browser, baseUrl) {
    const page = await newUnlockedPage(browser, baseUrl, "#scales-page");
    for (const [id, [min, max]] of Object.entries(SCALE_RANGES)) {
        expect(`${id} lowest total`, (await answerScale(page, id, "min")).total, String(min));
        expect(`${id} highest total`, (await answerScale(page, id, "max")).total, String(max));
    }
    for (const [id, bands] of Object.entries(SEVERITY_BANDS)) {
        for (const [score, text] of bands) {
            const result = await answerScale(page, id, score);
            expect(`${id} total for target ${score}`, result.total, String(score));
            expectIncludes(`${id} severity at ${score}`, result.severity, text);
        }
    }

    // An untouched scale must not look like a score of zero.
    const fresh = await newUnlockedPage(browser, baseUrl, "#scales-page");
    expectIncludes("untouched PHQ-9", await fresh.textContent("#phq9 .severity"), "Incomplete");

    // EPDS item 10 (self-harm) must raise an alert even when the total is low.
    await answerScale(page, "epds", "min");
    await page.evaluate(() => {
        const radio = document.querySelector('input[name="epds-q-9"][value="1"]');
        radio.checked = true;
        radio.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expectIncludes("EPDS self-harm alert", await page.inputValue("#epds .emr-summary"), "ALERT");
}

// PSQI: typed answers by item index (0-3), then radio values for items 4-17.
async function scorePsqi(page, typed, radios) {
    return page.evaluate(({ typed, radios }) => {
        const section = document.getElementById("psqi");
        typed.forEach((value, i) => {
            const field = section.querySelector(`input[name="psqi-q-${i}"]`);
            field.value = value;
            field.dispatchEvent(new Event("input", { bubbles: true }));
        });
        radios.forEach((value, i) => {
            const radio = section.querySelector(`input[name="psqi-q-${i + 4}"][value="${value}"]`);
            radio.checked = true;
            radio.dispatchEvent(new Event("change", { bubbles: true }));
        });
        return {
            total: section.querySelector(".total-score").textContent.trim(),
            severity: section.querySelector(".severity").textContent.trim()
        };
    }, { typed, radios });
}

async function testPsqiAndPdss(browser, baseUrl) {
    const page = await newUnlockedPage(browser, baseUrl, "#scales-page");
    //          Q5a-j                          Q6 Q7 Q8 Q9
    const none = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // Worked example: latency 20 min (1) + Q5a 2 = 3 -> C2 2; 6.5 h sleep -> C3 1;
    // 6.5 / 8 h in bed = 81% -> C4 1; Q5b-j sum 5 -> C5 1; Q6 2; Q7 0; Q8+Q9 = 3 -> C7 2.
    let r = await scorePsqi(page, ["23:00", "20", "07:00", "6.5"], [2, 3, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1, 2]);
    expect("PSQI worked example", r.total, "9");
    expectIncludes("PSQI worked example verdict", r.severity, "Poor sleep quality");

    r = await scorePsqi(page, ["22:30", "10", "06:30", "7.5"], none);
    expect("PSQI good sleeper", r.total, "0");

    // Cut-off is "greater than 5": 5 is good, 6 is poor.
    r = await scorePsqi(page, ["22:30", "10", "06:30", "7.5"], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 2, 0, 0]);
    expect("PSQI total 5", r.total, "5");
    expectIncludes("PSQI 5 is good", r.severity, "Good sleep quality");
    r = await scorePsqi(page, ["22:30", "10", "06:30", "7.5"], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 2, 1, 0]);
    expectIncludes("PSQI 6 is poor", r.severity, "Poor sleep quality");

    // Bed time after midnight: 01:00 to 06:00 is 5 h in bed.
    r = await scorePsqi(page, ["01:00", "10", "06:00", "4.5"], none);
    expect("PSQI after-midnight bed time", r.total, "3"); // C3 3 (under 5 h); 4.5 / 5 h = 90% -> C4 0
    r = await scorePsqi(page, ["23:00", "10", "06:00", "8"], none);
    expectIncludes("PSQI sleep longer than time in bed", r.severity, "cannot be more than the time in bed");

    // PDSS with agoraphobia uses the higher bands: 7 is borderline, 16 markedly ill.
    const pdss = async (score) => {
        const result = await answerScale(page, "panic", score);
        await page.evaluate(() => {
            const yes = document.querySelectorAll('input[name="panic-q-7"]')[1];
            yes.checked = true;
            yes.dispatchEvent(new Event("change", { bubbles: true }));
        });
        return page.textContent("#panic .severity");
    };
    expectIncludes("PDSS agoraphobia 7", await pdss(7), "Borderline ill (with agoraphobia)");
    expectIncludes("PDSS agoraphobia 15", await pdss(15), "Moderately ill");
    expectIncludes("PDSS agoraphobia 16", await pdss(16), "Markedly ill");
}

async function testConverters(browser, baseUrl) {
    const page = await newUnlockedPage(browser, baseUrl, "#equivalents-page");
    const ap = async (drug, dose) => {
        await page.selectOption("#ap-from-drug", drug);
        await page.fill("#ap-from-dose", String(dose));
        return [await page.textContent("#ap-cpz-out"), await page.textContent("#ap-olz-out")];
    };
    expect("risperidone 6 mg", await ap("risperidone", 6), ["600.00 mg", "20.00 mg"]);
    expect("haloperidol 5 mg", await ap("haloperidol", 5), ["300.00 mg", "10.00 mg"]);
    expect("quetiapine 375 mg", await ap("quetiapine", 375), ["300.00 mg", "10.00 mg"]);
    expect("blank antipsychotic dose", await ap("olanzapine", ""), ["0.00 mg", "0.00 mg"]);

    const benzo = async (from, dose, to) => {
        await page.selectOption("#benzo-from-drug", from);
        await page.selectOption("#benzo-to-drug", to);
        await page.fill("#benzo-from-dose", String(dose));
        return [await page.textContent("#benzo-dde-out"), await page.textContent("#benzo-target-out")];
    };
    expect("alprazolam 1 mg -> diazepam", await benzo("alprazolam", 1, "diazepam"), ["20.00 mg", "20.00 mg"]);
    expect("oxazepam 30 mg -> lorazepam", await benzo("oxazepam", 30, "lorazepam"), ["10.00 mg", "1.00 mg"]);
}

async function testWidmark(browser, baseUrl) {
    const page = await newUnlockedPage(browser, baseUrl, "#withdrawal-page");
    await page.evaluate(() => {
        const set = (id, v) => { document.getElementById(id).value = v; };
        set("wid-sex", "male"); set("wid-weight", "70"); set("wid-drinks", "4"); set("wid-hours", "2");
        document.getElementById("wid-calculate-btn").click();
    });
    const out = await page.inputValue("#wid-schedule-out");
    // 40 g / (70 kg x 1000 x 0.68) x 100 = 0.084 %; minus 2 h x 0.015 = 0.054 %
    expectIncludes("Widmark peak BAC", out, "Estimated Peak BAC: 0.084%");
    expectIncludes("Widmark current BAC", out, "Current Estimated BAC: 0.054%");
    expectIncludes("Widmark time to zero", out, "3.6 hours");
}

// EEG for ECT dose helper, checked against NSW ECT Handbook v1.2 Appendix 6.
async function testEctHelper(browser, baseUrl) {
    const page = await newUnlockedPage(browser, baseUrl, "#ect-page");
    await page.click('.tab-button[data-tab="ect-dosing"]');
    const run = async (chart, age, st, treatment) => {
        await page.selectOption("#ect-chart", chart);
        await page.selectOption("#ect-age", age);
        await page.selectOption("#ect-st", st);
        if (treatment !== undefined) await page.selectOption("#ect-treatment", treatment);
        return [await page.textContent("#ect-titration-out"), await page.textContent("#ect-treatment-out")];
    };

    // Ultra-brief RUL: start T1 (<50) / T2 (>=50); ST T2 -> R2 25%, next R2.5 35%.
    let [titration, treat] = await run("ub", "under50", "1");
    expectIncludes("UB start <50", titration, "start at T1 (2%)");
    expectIncludes("UB 4th stimulus jumps two levels", titration, "Stimulus 4: T5 (25%)");
    expectIncludes("UB ST T2", treat, "Treat at R2 (25%)");
    expectIncludes("UB next step", treat, "R2.5 (35%)");
    [titration] = await run("ub", "50plus", "1");
    expectIncludes("UB start >=50", titration, "start at T2 (4%)");

    // 1.0 ms: high-dose unilateral +5 levels, but Level 1 -> Level 5.
    [titration, treat] = await run("p10", "under50", "0", "0");
    expectIncludes("1.0 ms start <50", titration, "start at Level 1 (5%)");
    expectIncludes("1.0 ms HDU from L1", treat, "Treat at Level 5 (25%)");
    [, treat] = await run("p10", "under50", "1", "0");
    expectIncludes("1.0 ms HDU from L2", treat, "Treat at Level 7 (50%)");
    [, treat] = await run("p10", "under50", "0", "1");
    expectIncludes("1.0 ms MDU from L1", treat, "Treat at Level 4 (20%)");
    [, treat] = await run("p10", "under50", "9", "0");
    expectIncludes("1.0 ms beyond chart", treat, "Beyond the top of the chart");

    // 0.5 ms: RUL +4 from Level 0, else +5; bitemporal low dose +1.
    [titration, treat] = await run("p05", "50plus", "0", "4");
    expectIncludes("0.5 ms start >=50", titration, "start at Level 1 (6%)");
    expectIncludes("0.5 ms RUL from L0", treat, "Treat at Level 4 (20%)");
    [, treat] = await run("p05", "50plus", "3", "4");
    expectIncludes("0.5 ms RUL from L3", treat, "Treat at Level 8 (75%)");
    [, treat] = await run("p05", "50plus", "6", "4");
    expectIncludes("0.5 ms >125% warning", treat, "above 90 Hz");
    [, treat] = await run("p05", "50plus", "4", "2");
    expectIncludes("0.5 ms low-dose BT", treat, "Treat at Level 5 (25%)");
}

async function testAppShell(browser, baseUrl) {
    // Lock screen: correct passphrase (with stray spaces/caps) unlocks, wrong one does not.
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(baseUrl + "/index.html");
    await page.fill("#passphrase-input", "wrong");
    await page.press("#passphrase-input", "Enter");
    await page.waitForSelector("#lock-error", { state: "visible" });
    expect("wrong passphrase keeps lock", await page.isVisible("#lock-screen"), true);
    await page.fill("#passphrase-input", " Psych123 ");
    await page.press("#passphrase-input", "Enter");
    await page.waitForSelector("#lock-screen", { state: "hidden" });

    // Disclaimer shows once, then stays dismissed after reload.
    expect("disclaimer on first visit", await page.isVisible("#disclaimer-modal"), true);
    await page.click("#accept-disclaimer-btn");
    await page.reload();
    expect("disclaimer after accepting", await page.isVisible("#disclaimer-modal"), false);

    // Home search filters tiles and offers a direct link to matching scales.
    await page.fill("#home-search-input", "lithium");
    const visible = await page.$$eval("#home-tiles .home-tile", tiles => tiles.filter(t => !t.hidden).map(t => t.dataset.page));
    expect("search 'lithium' tiles", visible.includes("monitoring-page") && !visible.includes("contacts-page"), true);
    await page.fill("#home-search-input", "hamilton depression");
    await page.click(".home-scale-chip");
    expect("scale chip opens HAM-D", await page.inputValue("#scale-selector"), "hamd");

    // Note drafts must not be written to long-lived localStorage.
    await page.goto(baseUrl + "/index.html#generators-page");
    await page.evaluate(() => document.querySelectorAll("#generators-page select").forEach(s => s.dispatchEvent(new Event("change", { bubbles: true }))));
    const leaked = await page.evaluate(() => Object.keys(localStorage).filter(k => k.includes("draft")));
    expect("drafts kept out of localStorage", leaked, []);
    await context.close();
}

// Note templates: editing and saving, the workspace picker, draft recovery,
// tDose import and sync (against a stand-in server).
async function testNoteTemplates(browser, baseUrl) {
    const context = await browser.newContext({ acceptDownloads: true });
    const open = async (hash) => {
        const page = await context.newPage();
        page.on("pageerror", err => failures.push(`Page error: ${err.message}`));
        page.on("dialog", d => d.type() === "prompt" ? d.accept(page.promptAnswer || "") : d.accept());
        await page.addInitScript(() => {
            sessionStorage.setItem("unlocked", "true");
            localStorage.setItem("disclaimer_accepted", "1");
        });
        await page.goto(baseUrl + "/index.html" + hash);
        return page;
    };
    const optionNames = (page, sel) => page.$$eval(sel + " option", os => os.map(o => o.textContent));

    // The workspace starts from the OCA template.
    let page = await open("#oca-assessment-page");
    expectIncludes("workspace starts with OCA template", await page.inputValue("#oca-editor"), "Registrar Initial Review");

    // Edit and save the OCA template; a new tab starts from the edited text.
    await page.goto(baseUrl + "/index.html#generators-page");
    await page.click('[data-tab="gen-templates"]');
    expect("manager opens OCA template", await page.inputValue("#template-select"), "oca");
    await page.fill("#template-note-out", "EDITED OCA\nMSE\nPhysical examination:");
    expect("unsaved state shown", await page.textContent("#template-save-state"), "Unsaved changes");
    await page.click("#template-save-btn");
    expect("saved state shown", await page.textContent("#template-save-state"), "Saved");
    expect("edited template marked", (await optionNames(page, "#template-select"))[0].includes("(edited)"), true);
    await page.close();
    page = await open("#oca-assessment-page");
    expect("workspace uses edited template", await page.inputValue("#oca-editor"), "EDITED OCA\nMSE\nPhysical examination:");

    // A new template appears in the workspace picker and loads while the note is untouched.
    await page.goto(baseUrl + "/index.html#generators-page");
    await page.click('[data-tab="gen-templates"]');
    page.promptAnswer = "Ward review";
    await page.click("#template-new-btn");
    await page.fill("#template-note-out", "WARD REVIEW BODY");
    await page.click("#template-save-btn");
    await page.close();
    page = await open("#oca-assessment-page");
    expect("new template in workspace picker", (await optionNames(page, "#oca-template-select")).includes("Ward review"), true);
    const wardId = await page.$eval("#oca-template-select", s => [...s.options].find(o => o.textContent === "Ward review").value);
    await page.selectOption("#oca-template-select", wardId);
    expect("untouched note switches template", await page.inputValue("#oca-editor"), "WARD REVIEW BODY");

    // Typed notes survive a reload in the same tab, and are never put in localStorage.
    await page.fill("#oca-editor", "Patient note in progress");
    await page.reload();
    expect("draft restored after reload", await page.inputValue("#oca-editor"), "Patient note in progress");
    const inLocal = await page.evaluate(() => Object.values(localStorage).some(v => v.includes("Patient note in progress")));
    expect("note kept out of localStorage", inLocal, false);
    // Start from template replaces the note (after the confirm) and Undo brings it back.
    await page.selectOption("#oca-template-select", "oca");
    expect("typed note not replaced by picking", await page.inputValue("#oca-editor"), "Patient note in progress");
    await page.click("#oca-template-load-btn");
    expect("start from template", await page.inputValue("#oca-editor"), "EDITED OCA\nMSE\nPhysical examination:");
    await page.click("#oca-undo-btn");
    expect("undo restores note", await page.inputValue("#oca-editor"), "Patient note in progress");

    // tDose's templates.json imports; importing it twice does not duplicate.
    await page.goto(baseUrl + "/index.html#generators-page");
    await page.click('[data-tab="gen-templates"]');
    const tdose = { name: "templates.json", mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify({ safety_plan: "SAFETY PLAN BODY", gp_letter: "Dear Dr", worst: 3 })) };
    await page.setInputFiles("#template-import-file", tdose);
    await page.setInputFiles("#template-import-file", tdose);
    const names = await optionNames(page, "#template-select");
    expect("tDose templates imported once", names.filter(n => n === "Safety Plan").length, 1);
    expect("tDose letters imported", names.includes("Letters"), true);
    expect("tDose non-text values skipped", names.length, 5 + 1 + 2);

    // Export, wipe and re-import restores the templates.
    const [download] = await Promise.all([page.waitForEvent("download"), page.click("#template-export-btn")]);
    const exported = fs.readFileSync(await download.path(), "utf8");
    await page.evaluate(() => { localStorage.removeItem("psych_note_templates"); });
    await page.reload();
    await page.click('[data-tab="gen-templates"]');
    expect("templates cleared", (await optionNames(page, "#template-select")).length, 5);
    await page.setInputFiles("#template-import-file", { name: "export.json", mimeType: "application/json", buffer: Buffer.from(exported) });
    expect("export round trip", (await optionNames(page, "#template-select")).length, 8);

    // Reset to default brings back the built-in text.
    await page.selectOption("#template-select", "oca");
    await page.click("#template-delete-btn");
    expectIncludes("reset to default", await page.inputValue("#template-note-out"), "Registrar Initial Review");

    // Sync: off without a key; with a key it pulls new templates and pushes local ones.
    expectIncludes("sync off by default", await page.textContent("#template-sync-status"), "Sync is off");
    let pushed = null;
    let authHeader = null;
    await page.route("**/api/templates", async route => {
        authHeader = route.request().headers()["authorization"];
        if (authHeader !== "Bearer right-key") return route.fulfill({ status: 401, body: "{}" });
        if (route.request().method() === "PUT") {
            pushed = JSON.parse(route.request().postData());
            return route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" });
        }
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ version: 1, records: {
            "custom-remote": { id: "custom-remote", name: "From other device", body: "REMOTE", updatedAt: Date.now() + 1000, deleted: false }
        } }) });
    });
    await page.click(".tpl-sync-settings summary");
    await page.fill("#template-sync-key", "wrong-key");
    await page.click("#template-sync-save-btn");
    await page.waitForFunction(() => document.getElementById("template-sync-status").dataset.state === "error");
    expectIncludes("wrong sync key reported", await page.textContent("#template-sync-status"), "not accepted");
    await page.fill("#template-sync-key", "right-key");
    await page.click("#template-sync-save-btn");
    await page.waitForFunction(() => document.getElementById("template-sync-status").dataset.state === "ok");
    expect("remote template pulled", (await optionNames(page, "#template-select")).includes("From other device"), true);
    expect("local templates pushed", pushed && Object.values(pushed.records).some(r => r.name === "Safety Plan"), true);
    expect("sync key kept out of the page", await page.inputValue("#template-sync-key"), "");
    await context.close();
}

// Reasoning tab: differential helper and suicide risk formulation write into
// the right place in the note, update rather than duplicate, and Undo/Reset work.
async function testReasoning(browser, baseUrl) {
    const page = await newUnlockedPage(browser, baseUrl, "#oca-assessment-page");
    page.on("dialog", d => d.accept());
    await page.click('[data-oca-tab="oca-reasoning-panel"]');
    expect("reasoning tab widens panel", await page.$eval(".oca-split-view", e => e.classList.contains("oca-wide")), true);
    const note = () => page.inputValue("#oca-editor");
    const lineAfter = (text, heading) => {
        const lines = text.split("\n");
        return lines[lines.findIndex(l => l.trim() === heading) + 1];
    };

    // Differential: statuses and For text go under "# Differentials:".
    const rule = name => `#oca-reasoning-body select[aria-label="${name} status"]`;
    await page.selectOption(rule("Delirium (rule-out)"), "Excluded");
    await page.selectOption(rule("Autoimmune encephalitis (rule-out)"), "Investigating");
    await page.selectOption(rule("Substance/medication-induced psychotic disorder"), "Leading");
    await page.selectOption(rule("Schizophreniform disorder"), "Possible");
    await page.selectOption(rule("Delusional disorder"), "Excluded");
    await page.fill('#oca-reasoning-body .rz-card:has-text("Substance/medication-induced") input >> nth=0', "onset during daily methamphetamine use");
    await page.click("#rz-dx-insert");
    let text = await note();
    expect("differential under heading", lineAfter(text, "# Differentials:"), "Differential diagnosis:");
    expectIncludes("leading differential first", text, "1. Substance/medication-induced psychotic disorder (ICD-11 6C4x.6, by substance): leading. For: onset during daily methamphetamine use.");
    expectIncludes("second differential", text, "2. Schizophreniform disorder (DSM-5-TR only): possible.");
    expectIncludes("excluded listed", text, "Considered and excluded: Delusional disorder.");
    expectIncludes("medical causes line", text, "Rule-out checks - excluded: delirium; investigating: autoimmune encephalitis.");

    // Inserting again updates the block instead of adding a second one.
    await page.selectOption(rule("Schizophreniform disorder"), "Less likely");
    await page.click("#rz-dx-insert");
    text = await note();
    expect("differential not duplicated", text.split("Differential diagnosis:").length - 1, 1);
    expectIncludes("differential updated", text, "2. Schizophreniform disorder (DSM-5-TR only): less likely.");

    // Suicide risk formulation: no risk tier, goes under "Risk to Self:".
    const tick = label => page.click(`#oca-reasoning-body label.rz-chip:has-text("${label}")`);
    await tick("Previous suicide attempt");
    await tick("Current suicidal ideation");
    await tick("Insomnia");
    await tick("Family or social support");
    await tick("Safety plan completed with the person (Stanley-Brown)");
    await page.selectOption("#rz-sr-baseline", "Raised");
    await page.click("#rz-sr-insert");
    text = await note();
    expect("formulation under Risk to Self", lineAfter(text, "Risk to Self:"), "Suicide risk formulation:");
    expectIncludes("risk status line", text, "Why this person (compared with others): previous suicide attempt.");
    expectIncludes("risk state line", text, "Why now (compared with their usual: raised): current suicidal ideation; insomnia.");
    expectIncludes("modifiable targets", text, "Modifiable drivers to target: insomnia.");
    const block = text.slice(text.indexOf("Suicide risk formulation:"), text.indexOf("Suicide risk formulation:") + 600);
    expect("no risk tier in formulation", /\b(low|moderate|high) risk\b/i.test(block), false);

    // Acute features show the act-now warning.
    await tick("Command hallucinations, nihilistic delusions or agitated psychotic depression");
    expect("acute warning shown", await page.isVisible(".rz-acute"), true);

    // Undo removes the last insertion; Reset clears the tab.
    await page.click("#oca-undo-btn");
    expect("undo removes formulation", (await note()).includes("Suicide risk formulation:"), false);
    await page.click("#oca-reset-btn");
    expect("reset clears differential", await page.inputValue(rule("Delirium (rule-out)")), "Not assessed");
    expect("reset clears chips", await page.$$eval("#oca-reasoning-body label.rz-chip.on", l => l.length), 0);

    // The safety plan button opens the template.
    await page.click("text=Open safety plan template");
    expect("safety plan template opens", await page.inputValue("#template-select"), "safety-plan");
    await page.context().close();
}

// Guided psychosis questions: the rules give the expected suggestion for
// textbook presentations (checked without a browser), and the screen applies
// the result to the cards and the note.
function testPsychosisFlowRules() {
    const flow = require(path.join(ROOT, "reasoning-flow.js"));
    const base = { explained: "none", feigned: "no", substance: "no", delirium: "no", cognitive: "no", medical: "no", catatonia: ["none"] };
    const cases = [
        ["schizophrenia", { symptoms: ["delusions", "hallucinations", "negative"], duration: "6m+", function: "yes", mood: "none" }, "schizophrenia", false],
        ["schizophreniform", { symptoms: ["delusions", "hallucinations"], duration: "3-6m", function: "yes", mood: "none" }, "schizophreniform", false],
        ["brief, recovered", { symptoms: ["delusions", "speech"], duration: "1d-1m", returned: "yes", function: "yes", mood: "none" }, "brief", false],
        ["brief, not yet recovered", { symptoms: ["hallucinations"], duration: "1d-1m", returned: "not-yet", function: "yes", mood: "none" }, "brief", true],
        ["psychotic depression", { symptoms: ["delusions"], ocdBdd: "no", duration: "1-3m", function: "yes", mood: "depressive", moodOnly: "yes" }, "depression", false],
        ["bipolar with psychosis", { symptoms: ["delusions", "speech"], duration: "1-3m", function: "yes", mood: "manic", moodOnly: "yes" }, "bipolar", false],
        ["schizoaffective", { symptoms: ["delusions", "hallucinations"], duration: "6m+", function: "yes", mood: "manic", moodOnly: "no", psychWithoutMood: "yes", moodShare: "yes" }, "schizoaffective", false],
        ["delusional", { symptoms: ["delusions", "hallucinations"], halMinor: "yes", ocdBdd: "no", duration: "3-6m", function: "no", mood: "none" }, "delusional", false],
        ["delusions, impaired", { symptoms: ["delusions"], ocdBdd: "no", duration: "6m+", function: "yes", mood: "none" }, "other-specified", false],
        ["OCD content", { symptoms: ["delusions"], ocdBdd: "yes" }, "other", false],
        ["substance during", { substance: "yes", subTiming: "during" }, "substance-induced", false],
        ["substance too early", { substance: "yes", subTiming: "early", symptoms: ["delusions", "hallucinations"], duration: "1-3m", function: "yes", mood: "none" }, "substance-induced", true],
        ["medical cause", { medical: "yes" }, "medical", false],
        ["malingering only", { feigned: "external" }, "feigning", false]
    ];
    cases.forEach(([name, answers, cardId, provisional]) => {
        const r = flow.evaluate(Object.assign({}, base, answers));
        expect(`flow: ${name}`, r.suggestion && r.suggestion.cardId, cardId);
        expect(`flow: ${name} provisional`, !!(r.suggestion && r.suggestion.provisional), provisional);
    });
    // Delirium outranks a primary psychotic disorder, and feigning is recorded alongside one.
    const delirium = flow.evaluate(Object.assign({}, base, { delirium: "yes", symptoms: ["delusions", "hallucinations"], duration: "6m+" }));
    expectIncludes("flow: delirium first", delirium.suggestion.label, "Delirium");
    const both = flow.evaluate(Object.assign({}, base, { feigned: "external", symptoms: ["delusions", "hallucinations"], duration: "6m+", function: "yes", mood: "none" }));
    expect("flow: feigning alongside illness", [both.suggestion.cardId, both.alternatives.includes("feigning")], ["schizophrenia", true]);
    // Schizophrenia with mood episodes outside the illness adds the mood diagnosis.
    const mood = flow.evaluate(Object.assign({}, base, { symptoms: ["delusions", "hallucinations"], duration: "6m+", function: "yes", mood: "depressive", moodOnly: "no", psychWithoutMood: "yes", moodShare: "no", moodOutside: "yes" }));
    expect("flow: comorbid mood", [mood.suggestion.cardId, mood.also.some(n => n.includes("add the full mood diagnosis"))], ["schizophrenia", true]);
    // Three catatonic signs adds catatonia.
    const cat = flow.evaluate(Object.assign({}, base, { symptoms: ["delusions", "behaviour"], duration: "6m+", function: "yes", mood: "none", catatonia: ["mutism", "posturing", "negativism"] }));
    expect("flow: catatonia noted", cat.also.some(n => n.includes("Catatonia (3 or more signs)")), true);
    // Nothing answered: no suggestion, and it says where to start.
    expect("flow: empty", [flow.evaluate({}).suggestion, flow.evaluate({}).pending.length > 0], [null, true]);
}

async function testPsychosisFlowScreen(browser, baseUrl) {
    const page = await newUnlockedPage(browser, baseUrl, "#oca-assessment-page");
    page.on("dialog", d => d.accept());
    await page.click('[data-oca-tab="oca-reasoning-panel"]');
    // Short answers ("No") must match exactly, or they also hit "Red flags, not yet confirmed".
    const answer = (q, label) => page.click(`#oca-reasoning-body fieldset[data-q="${q}"] label.rz-chip` +
        (label.length <= 6 ? `:text-is("${label}")` : `:has-text("${label}")`));
    const visible = q => page.isVisible(`#oca-reasoning-body fieldset[data-q="${q}"]`);

    expect("flow: later steps hidden at first", await visible("feigned"), false);
    await answer("explained", "None: this is a psychotic experience");
    await answer("feigned", "No");
    await answer("substance", "Yes");
    expect("flow: timeline question appears", await visible("subTiming"), true);
    await answer("substance", "No");
    expect("flow: timeline question hides again", await visible("subTiming"), false);
    await answer("delirium", "No");
    await answer("cognitive", "No");
    await answer("medical", "No");
    await answer("symptoms", "Delusions");
    await answer("symptoms", "Hallucinations");
    await answer("halMinor", "No, they're prominent");
    await answer("ocdBdd", "No");
    await answer("duration", "1 to under 3 months");
    await answer("function", "Yes");
    await answer("mood", "None");
    await answer("catatonia", "None");
    expectIncludes("flow: suggestion shown", await page.textContent(".rz-result-title"), "Schizophreniform disorder");

    await page.click("#rz-flow-apply");
    const status = name => page.inputValue(`#oca-reasoning-body select[aria-label="${name} status"]`);
    expect("flow: applied leading", await status("Schizophreniform disorder"), "Leading");
    expect("flow: applied possible", await status("Schizophrenia"), "Possible");
    expect("flow: applied excluded", await status("Substance/medication-induced psychotic disorder"), "Excluded");
    expect("flow: rule-out applied", await status("Delirium (rule-out)"), "Excluded");
    expect("flow: answers kept after apply", await page.isChecked('#oca-reasoning-body fieldset[data-q="duration"] input[value="1-3m"]'), true);

    await page.click("#rz-dx-insert");
    const text = await page.inputValue("#oca-editor");
    expectIncludes("flow: note has suggestion", text, "Guided assessment suggests: Schizophreniform disorder");
    expectIncludes("flow: note has reasoning", text, "Reasoning: Psychotic experience, not explained by culture");
    expectIncludes("flow: note has ICD-11 point", text, "Note: ICD-11 would code schizophrenia (6A20)");
    expectIncludes("flow: note lists cards", text, "1. Schizophreniform disorder (DSM-5-TR only): leading.");

    await page.click("#oca-reset-btn");
    expect("flow: reset clears answers", await page.isChecked('#oca-reasoning-body fieldset[data-q="explained"] input[value="none"]'), false);
    await page.context().close();
}

// Guided mood questions: expected suggestions for textbook presentations,
// and the hand-over to the psychosis questions on screen.
function testMoodFlowRules() {
    const flows = require(path.join(ROOT, "reasoning-flow-mood.js"));
    const gates = { explained: "clinical", feigned: "no", substance: "no", delirium: "no", cognitive: "no", medical: "no" };
    const five = ["mood", "anhedonia", "sleep", "energy", "guilt"];
    const mde = { depSx: five, twoWeeks: "yes", impair: "yes" };
    const manic = ["grandiosity", "sleep", "talkative", "racing"];
    const cases = [
        ["depressed", "MDD single episode", { ...mde, maniaHistory: "none", previous: "no", psychosis: "none", chronic: "no" }, "mdd", /single episode/],
        ["depressed", "MDD recurrent, psychotic", { ...mde, maniaHistory: "none", previous: "yes", psychosis: "during", chronic: "no" }, "mdd", /recurrent, with psychotic features/],
        ["depressed", "bipolar II", { ...mde, maniaHistory: "hypomania" }, "bipolar2", /current episode depressed/],
        ["depressed", "bipolar I from past mania", { ...mde, maniaHistory: "mania" }, "bipolar1", /6A60/],
        ["depressed", "PDD with MDD", { ...mde, maniaHistory: "none", chronic: "yes", persistentMDE: "yes" }, "pdd", /persistent major depressive episode, plus major depressive disorder/],
        ["depressed", "dysthymia", { depSx: ["mood", "energy"], twoWeeks: "yes", impair: "yes", maniaHistory: "none", chronic: "yes" }, "pdd", /pure dysthymic/],
        ["depressed", "PMDD", { depSx: ["mood"], twoWeeks: "no", impair: "yes", maniaHistory: "none", chronic: "no", pmdd: "yes" }, "pmdd", /GA34.41/],
        ["depressed", "prolonged grief", { depSx: ["mood"], twoWeeks: "yes", impair: "yes", maniaHistory: "none", chronic: "no", pmdd: "na", grief: "prolonged" }, "pgd", /6B42/],
        ["depressed", "adjustment", { depSx: ["mood", "sleep"], twoWeeks: "yes", impair: "yes", maniaHistory: "none", chronic: "no", pmdd: "no", grief: "no", stressor: "yes" }, "adjustment", /6B43/],
        ["depressed", "short hypomania with depression", { ...mde, maniaHistory: "subthreshold" }, "other-bipolar", /short-duration/],
        ["depressed", "medical cause", { medical: "yes" }, "medical", /due to another medical condition/],
        ["depressed", "substance during", { substance: "yes", subTiming: "during" }, "substance-induced", /depressive disorder/],
        ["elevated", "mania", { moodType: "elevated", energy: "yes", manSx: manic, duration: "1w+", severe: "yes", psychosis: "none" }, "bipolar1", /current episode manic/],
        ["elevated", "mania when admitted early", { moodType: "elevated", energy: "yes", manSx: manic, duration: "admitted", severe: "yes", psychosis: "during" }, "bipolar1", /with psychotic features/],
        ["elevated", "hypomania, past depression", { moodType: "elevated", energy: "yes", manSx: manic, duration: "4-6d", severe: "no", previous: "yes" }, "bipolar2", /current episode hypomanic/],
        ["elevated", "hypomania, no depression", { moodType: "elevated", energy: "yes", manSx: manic, duration: "1w+", severe: "no", previous: "no" }, "other-bipolar", /without a major depressive episode/],
        ["elevated", "irritable needs 4", { moodType: "irritable", energy: "yes", manSx: ["sleep", "talkative", "racing"], duration: "1w+", severe: "yes", previous: "no", chronic: "no" }, "other-bipolar", /6A6Y/],
        ["elevated", "cyclothymia", { moodType: "elevated", energy: "no", manSx: ["talkative"], duration: "lt4d", severe: "no", previous: "no", chronic: "yes" }, "cyclothymic", /6A62/],
        ["elevated", "antidepressant-emergent, persisting", { substance: "yes", subTiming: "treatment", moodType: "elevated", energy: "yes", manSx: manic, duration: "1w+", severe: "yes", psychosis: "none" }, "bipolar1", /6A60/],
        ["elevated", "borderline fits better", { moodType: "irritable", energy: "no", manSx: ["talkative"], duration: "lt4d", severe: "no", previous: "no", chronic: "no", otherFit: ["bpd"] }, "other", /Borderline/]
    ];
    cases.forEach(([flow, name, answers, cardId, label]) => {
        const r = flows[flow].evaluate(Object.assign({}, gates, answers));
        expect(`mood flow: ${name}`, r.suggestion && r.suggestion.cardId, cardId);
        checks++;
        if (!(r.suggestion && label.test(r.suggestion.label))) failures.push(`mood flow: ${name} label: got ${JSON.stringify(r.suggestion && r.suggestion.label)}`);
    });
    // Hypomania without knowing about depressive episodes waits rather than guessing unipolar.
    const waiting = flows.depressed.evaluate(Object.assign({}, gates, { depSx: ["mood", "sleep"], twoWeeks: "yes", impair: "yes", maniaHistory: "hypomania" }));
    expect("mood flow: waits on bipolar question", [waiting.suggestion, waiting.pending.some(p => p.includes("major depressive episode"))], [null, true]);
    // Psychosis outside mood episodes hands over to the psychosis questions.
    const handover = flows.depressed.evaluate(Object.assign({}, gates, mde, { psychosis: "outside" }));
    expect("mood flow: psychosis hand-over", handover.switchTo, "psychosis");
    // Too early to tell after a substance: provisional, with the mood disorder as the alternative.
    const early = flows.elevated.evaluate(Object.assign({}, gates, { substance: "yes", subTiming: "early", moodType: "elevated", energy: "yes", manSx: manic, duration: "1w+", severe: "yes", psychosis: "none" }));
    expect("mood flow: provisional substance", [early.suggestion.cardId, early.suggestion.provisional, early.alternatives.includes("bipolar1")], ["substance-induced", true, true]);
}

async function testMoodFlowScreen(browser, baseUrl) {
    const page = await newUnlockedPage(browser, baseUrl, "#oca-assessment-page");
    page.on("dialog", d => d.accept());
    await page.click('[data-oca-tab="oca-reasoning-panel"]');
    await page.selectOption("#rz-problem", "depressed");
    // Short answers ("No") must match exactly, or they also hit "Red flags, not yet confirmed".
    const answer = (q, label) => page.click(`#oca-reasoning-body fieldset[data-q="${q}"] label.rz-chip` +
        (label.length <= 6 ? `:text-is("${label}")` : `:has-text("${label}")`));
    await answer("explained", "Clinically significant low mood");
    await answer("feigned", "No");
    await answer("substance", "Yes");
    await answer("subTiming", "Began before the substance use");
    await answer("delirium", "No");
    await answer("cognitive", "No");
    await answer("medical", "No");
    for (const s of ["Depressed mood", "Loss of interest", "Sleeping too little", "Fatigue", "Worthlessness"]) await answer("depSx", s);
    await answer("twoWeeks", "Yes");
    await answer("impair", "Yes");
    await answer("maniaHistory", "No");
    await answer("previous", "Yes");
    await answer("psychosis", "None");
    await answer("chronic", "No");
    expectIncludes("mood screen: suggestion", await page.textContent(".rz-result-title"), "Major depressive disorder, recurrent");
    await page.click("#rz-flow-apply");
    expect("mood screen: card applied", await page.inputValue('#oca-reasoning-body select[aria-label="Major depressive disorder status"]'), "Leading");
    expect("mood screen: bipolar excluded", await page.inputValue('#oca-reasoning-body select[aria-label="Bipolar II disorder, current episode depressed status"]'), "Excluded");

    // Psychosis outside mood episodes: switch to the psychosis questions, keeping shared answers.
    await answer("psychosis", "Also outside mood episodes");
    await page.click("text=Open the Psychosis questions");
    expect("mood screen: switched problem", await page.inputValue("#rz-problem"), "psychosis");
    expect("mood screen: carried substance answer", await page.isChecked('#oca-reasoning-body fieldset[data-q="subTiming"] input[value="before"]'), true);
    expect("mood screen: carried medical answer", await page.isChecked('#oca-reasoning-body fieldset[data-q="medical"] input[value="no"]'), true);
    await page.context().close();
}

// Guided anxiety and catatonia questions.
function testAnxietyCatatoniaRules() {
    const flows = require(path.join(ROOT, "reasoning-flow-anxiety.js"));
    const g = { explained: "clinical", feigned: "no", substance: "no", akathisia: "no", delirium: "no", cognitive: "no", medical: "no", withinMood: "no", withinPsychosis: "no", impair: "yes" };
    const c = { danger: "no", drba: "no", feigned: "no", intox: "no", withdrawal: "no", delirium: "no", seizures: "no", medical: "no" };
    const three = ["mutism", "negativism", "posturing"];
    const cases = [
        ["anxiety", "GAD", { ...g, focus: ["worry"], worrySx: "yes", months6: "yes" }, "gad"],
        ["anxiety", "GAD under 6 months", { ...g, focus: ["worry"], worrySx: "yes", months6: "no" }, "other-anxiety"],
        ["anxiety", "panic disorder", { ...g, focus: ["panic"], panicUnexpected: "yes", panicMonth: "yes" }, "panic"],
        ["anxiety", "social with cued panic", { ...g, focus: ["social", "panic"], panicUnexpected: "no", months6: "yes", performanceOnly: "no" }, "social"],
        ["anxiety", "specific phobia", { ...g, focus: ["specific"], months6: "yes" }, "specific"],
        ["anxiety", "PTSD", { ...g, focus: ["trauma"], traumaTime: "long", traumaSx: "yes", complex: "no" }, "ptsd"],
        ["anxiety", "acute stress", { ...g, focus: ["trauma"], traumaTime: "short", traumaSx: "yes" }, "acute-stress"],
        ["anxiety", "OCD", { ...g, focus: ["obsessions"], ocdTime: "yes", insight: "good" }, "ocd"],
        ["anxiety", "illness anxiety", { ...g, focus: ["health"], healthSomatic: "no", months6: "yes" }, "health"],
        ["anxiety", "somatic symptom", { ...g, focus: ["health"], healthSomatic: "yes", months6: "yes" }, "somatic"],
        ["anxiety", "adjustment", { ...g, focus: ["stressor"], stressorRecent: "yes" }, "adjustment"],
        ["anxiety", "akathisia", { ...g, akathisia: "yes" }, "akathisia"],
        ["anxiety", "medical", { ...g, medical: "yes" }, "medical"],
        ["anxiety", "substance during", { ...g, substance: "yes", subTiming: "during" }, "substance-induced"],
        ["catatonia", "with bipolar", { ...c, signs: three, context: "bipolar" }, "associated"],
        ["catatonia", "benzodiazepine withdrawal", { ...c, signs: three, withdrawal: "yes" }, "induced"],
        ["catatonia", "medical", { ...c, signs: three, medical: "yes" }, "medical"],
        ["catatonia", "delirium", { ...c, signs: three, delirium: "yes" }, "delirium"],
        ["catatonia", "cause unknown", { ...c, signs: three, context: "none" }, "unspecified"],
        ["catatonia", "2 signs after antipsychotic", { ...c, signs: ["stupor", "posturing"], drba: "yes" }, "drba"]
    ];
    cases.forEach(([flow, name, answers, cardId]) => {
        const r = flows[flow].evaluate(answers);
        expect(`${flow} flow: ${name}`, r.suggestion && r.suggestion.cardId, cardId);
    });
    const both = flows.anxiety.evaluate({ ...g, focus: ["panic", "agoraphobia"], panicUnexpected: "yes", panicMonth: "yes", agoraTwo: "yes", months6: "yes" });
    expect("anxiety flow: panic with agoraphobia", [both.suggestion.cardId, both.additional], ["panic", ["agoraphobia"]]);
    const mood = flows.anxiety.evaluate({ ...g, withinMood: "yes" });
    expect("anxiety flow: mood hand-over", mood.switchTo, "depressed");
    const nms = flows.catatonia.evaluate({ ...c, signs: three, danger: "yes", drba: "yes", context: "psychotic" });
    expectIncludes("catatonia flow: emergency shown", nms.urgent, "neuroleptic malignant syndrome");
    const seizures = flows.catatonia.evaluate({ ...c, signs: three, seizures: "unsure", context: "none" });
    expect("catatonia flow: EEG prompt, medical kept open", [seizures.also.some(n => n.includes("EEG")), seizures.excluded.includes("medical")], [true, false]);
}

async function testAnxietyCatatoniaScreen(browser, baseUrl) {
    const page = await newUnlockedPage(browser, baseUrl, "#oca-assessment-page");
    page.on("dialog", d => d.accept());
    await page.click('[data-oca-tab="oca-reasoning-panel"]');
    const answer = (q, label) => page.click(`#oca-reasoning-body fieldset[data-q="${q}"] label.rz-chip` +
        (label.length <= 6 ? `:text-is("${label}")` : `:has-text("${label}")`));
    const status = name => page.inputValue(`#oca-reasoning-body select[aria-label="${name} status"]`);

    await page.selectOption("#rz-problem", "anxiety");
    await answer("explained", "Clinically significant anxiety");
    for (const [q, label] of [["feigned", "No"], ["substance", "No"], ["akathisia", "No"], ["delirium", "No"], ["cognitive", "No"], ["medical", "No"], ["withinMood", "No"], ["withinPsychosis", "No"]]) await answer(q, label);
    await answer("focus", "Sudden attacks");
    await answer("focus", "Places where escape");
    await answer("impair", "Yes");
    await answer("panicUnexpected", "Yes");
    await answer("panicMonth", "Yes");
    await answer("agoraTwo", "Yes");
    await answer("months6", "Yes");
    expectIncludes("anxiety screen: suggestion", await page.textContent(".rz-result-title"), "Panic disorder");
    await page.click("#rz-flow-apply");
    expect("anxiety screen: panic leading", await status("Panic disorder"), "Leading");
    expect("anxiety screen: agoraphobia also leading", await status("Agoraphobia"), "Leading");

    await page.selectOption("#rz-problem", "catatonia");
    for (const s of ["Mutism", "Negativism", "Posturing"]) await answer("signs", s);
    await answer("danger", "Yes");
    await answer("drba", "Yes");
    expect("catatonia screen: emergency box", await page.isVisible("#oca-reasoning-body .rz-result .rz-acute"), true);
    await answer("context", "A psychotic disorder");
    await page.click("#rz-dx-insert");
    expectIncludes("catatonia screen: urgent line in note", await page.inputValue("#oca-editor"), "URGENT: Fever, autonomic instability");
    await page.context().close();
}

// Guided cognitive impairment questions.
function testCognitiveRules() {
    const flow = require(path.join(ROOT, "reasoning-flow-cognitive.js")).cognitive;
    const g = { explained: "decline", delirium: "no", wernicke: "no", rapid: "no", feigned: "no", substance: "no", depression: "no", dissociative: "no" };
    const major = { independence: "yes", testing: "substantial", lewy: ["none"] };
    const cases = [
        ["probable Alzheimer's", { ...g, ...major, domains: ["memory", "language"], course: "gradual", features: ["memory-first"] }, "alzheimers", /Major .*Alzheimer's disease \(probable\).*6D80/],
        ["mild, possible Alzheimer's", { ...g, ...major, independence: "no", testing: "modest", domains: ["memory"], course: "gradual", features: ["memory-first"] }, "alzheimers", /Mild .*\(possible\).*6D71/],
        ["mixed Alzheimer's and vascular", { ...g, ...major, domains: ["memory", "executive"], course: "gradual", features: ["memory-first", "vascular"] }, "multiple", /multiple causes/],
        ["probable Lewy bodies", { ...g, ...major, domains: ["attention"], course: "gradual", features: [], lewy: ["fluctuation", "hallucinations"] }, "lewy", /Lewy bodies \(probable\)/],
        ["possible Lewy bodies", { ...g, ...major, domains: ["attention"], course: "gradual", features: [], lewy: ["rbd"] }, "lewy", /\(possible\)/],
        ["Parkinson's disease dementia", { ...g, ...major, domains: ["executive"], course: "gradual", features: ["parkinson"], lewy: ["hallucinations"] }, "parkinson", /Parkinson's disease/],
        ["frontotemporal", { ...g, ...major, domains: ["executive", "social"], course: "gradual", features: ["ftd-behaviour"] }, "ftd", /behavioural variant/],
        ["Korsakoff", { ...g, ...major, substance: "yes", subTiming: "persists", amnestic: "yes", domains: ["memory"], course: "other", features: [] }, "alcohol", /Korsakoff/],
        ["traumatic brain injury", { ...g, ...major, independence: "no", testing: "modest", domains: ["attention"], course: "injury", features: [] }, "tbi", /traumatic brain injury/],
        ["cause unknown", { ...g, ...major, domains: ["memory"], course: "other", features: [] }, "unspecified", /not yet known/],
        ["delirium", { ...g, delirium: "yes" }, "delirium", /6D70/],
        ["depression", { ...g, depression: "yes" }, "depression", /depression/],
        ["medication effect", { ...g, substance: "yes", subTiming: "acute" }, "medication", /reassess/],
        ["mild with normal testing", { ...g, independence: "no", testing: "normal" }, "normal", /subjective/],
        ["lifelong", { explained: "lifelong" }, "idd", /Intellectual developmental disorder/]
    ];
    cases.forEach(([name, answers, cardId, label]) => {
        const r = flow.evaluate(answers);
        expect(`cognitive flow: ${name}`, r.suggestion && r.suggestion.cardId, cardId);
        checks++;
        if (!(r.suggestion && label.test(r.suggestion.label))) failures.push(`cognitive flow: ${name} label: got ${JSON.stringify(r.suggestion && r.suggestion.label)}`);
    });
    const mixed = flow.evaluate({ ...g, ...major, domains: ["memory", "executive"], course: "gradual", features: ["memory-first", "vascular"] });
    expect("cognitive flow: mixed causes listed", mixed.additional, ["alzheimers", "vascular"]);
    const wernicke = flow.evaluate({ ...g, wernicke: "yes" });
    expect("cognitive flow: Wernicke urgent", [wernicke.suggestion.cardId, /thiamine/.test(wernicke.urgent)], ["alcohol", true]);
    const rapid = flow.evaluate({ ...g, rapid: "yes", ...major, domains: ["memory"], course: "other", features: ["prion"] });
    expectIncludes("cognitive flow: rapid decline urgent", rapid.urgent, "refer urgently");
}

async function testCognitiveScreen(browser, baseUrl) {
    const page = await newUnlockedPage(browser, baseUrl, "#oca-assessment-page");
    page.on("dialog", d => d.accept());
    await page.click('[data-oca-tab="oca-reasoning-panel"]');
    const answer = (q, label) => page.click(`#oca-reasoning-body fieldset[data-q="${q}"] label.rz-chip` +
        (label.length <= 6 ? `:text-is("${label}")` : `:has-text("${label}")`));
    await page.selectOption("#rz-problem", "cognitive");
    await answer("explained", "Decline from a previous level");
    for (const [q, l] of [["delirium", "No"], ["wernicke", "No"], ["rapid", "No"], ["feigned", "No"], ["substance", "No"], ["depression", "No"], ["dissociative", "No"], ["independence", "Yes"], ["testing", "Substantial"]]) await answer(q, l);
    await answer("domains", "Learning and memory");
    await answer("domains", "Executive function");
    await answer("course", "Insidious onset");
    await answer("features", "Early, prominent memory loss");
    await answer("features", "Strokes, focal signs");
    await answer("lewy", "None");
    expectIncludes("cognitive screen: suggestion", await page.textContent(".rz-result-title"), "multiple causes");
    await page.click("#rz-flow-apply");
    const status = name => page.inputValue(`#oca-reasoning-body select[aria-label="${name} status"]`);
    expect("cognitive screen: Alzheimer's leading", await status("Neurocognitive disorder due to Alzheimer's disease"), "Leading");
    expect("cognitive screen: vascular leading", await status("Vascular neurocognitive disorder"), "Leading");
    expect("cognitive screen: delirium excluded", await status("Delirium"), "Excluded");
    expect("cognitive screen: delirium rule-out excluded", await status("Delirium (rule-out)"), "Excluded");
    await page.context().close();
}

// Guided substance use and risk behaviour questions.
function testSubstanceRiskRules() {
    const S = require(path.join(ROOT, "reasoning-flow-substance.js")).substance;
    const R = require(path.join(ROOT, "reasoning-flow-risk.js")).risk;
    const base = { explained: "pattern", withdrawalNow: "no", overdose: "no", feigned: "no", continuous: "continuous", remission: "current", setting: ["none"], induced: ["none"], cooccurring: ["none"] };
    const label = (name, r, re) => { checks++; if (!(r.suggestion && re.test(r.suggestion.label))) failures.push(`${name}: got ${JSON.stringify(r.suggestion && r.suggestion.label)}`); };

    let r = S.evaluate({ ...base, substance: "alcohol", criteria: ["larger", "cutdown", "craving", "time", "givenup", "despite", "tolerance", "withdrawal"] });
    label("substance flow: severe alcohol, dependence", r, /Alcohol use disorder, severe \(ICD-11 6C40.2 Alcohol dependence\)/);
    r = S.evaluate({ ...base, substance: "cannabis", criteria: ["roles", "hazard"] });
    label("substance flow: mild, harmful pattern", r, /Cannabis use disorder, mild \(ICD-11 6C41.1 Harmful pattern/);
    r = S.evaluate({ ...base, substance: "opioids", prescribed: "yes", criteria: ["tolerance", "withdrawal"] });
    expect("substance flow: prescribed tolerance not counted", r.suggestion.cardId, "no-disorder");
    r = S.evaluate({ ...base, substance: "opioids", prescribed: "no", criteria: ["larger", "craving", "time", "withdrawal", "tolerance"], remission: "early", setting: ["maintenance"] });
    label("substance flow: remission and maintenance", r, /moderate, in early remission, on maintenance therapy/);
    r = S.evaluate({ ...base, substance: "alcohol", withdrawalNow: "yes", criteria: ["larger", "craving"] });
    expectIncludes("substance flow: withdrawal urgent", r.urgent, "Thiamine before any glucose load");
    r = S.evaluate({ ...base, substance: "stimulants", prescribed: "no", criteria: ["larger", "craving", "time"], induced: ["psychosis"], cooccurring: ["ptsd"] });
    expect("substance flow: induced psychosis hand-over, co-occurring", [r.switchTo, r.additional], ["psychosis", ["independent"]]);
    r = S.evaluate({ explained: "pattern", substance: "gambling", gamblingCriteria: ["more", "chasing", "lies", "bailout"], maniaOnly: "no" });
    label("substance flow: gambling", r, /Gambling disorder, mild \(ICD-11 6C50\)/);
    r = S.evaluate({ explained: "pattern", substance: "gambling", maniaOnly: "yes" });
    expect("substance flow: gambling only in mania", r.switchTo, "elevated");
    r = S.evaluate({ explained: "episode", substance: "alcohol" });
    expect("substance flow: single episode", r.suggestion.cardId, "intoxication");

    const rb = { danger: "no", feigned: "no", intoxicated: "no", sud: "no", delirium: "no", medical: "no", akathisia: "no" };
    r = R.evaluate({ ...rb, behaviour: ["suicidal"], intoxicated: "yes", sud: "yes", drivers: ["bpd"] });
    expect("risk flow: BPD with substance use", [r.suggestion.cardId, r.additional], ["bpd", ["substance"]]);
    r = R.evaluate({ ...rb, behaviour: ["aggression"], danger: "yes", drivers: ["psychotic"] });
    expect("risk flow: psychotic aggression", [r.suggestion.cardId, r.switchTo, /Check a BGL/.test(r.urgent)], ["psychotic", "psychosis", true]);
    r = R.evaluate({ ...rb, behaviour: ["aggression"], medical: "yes" });
    expect("risk flow: medical cause first", r.suggestion.cardId, "medical");
    r = R.evaluate({ ...rb, behaviour: ["suicidal"], drivers: ["depression", "stressor"] });
    expect("risk flow: adjustment dropped when depression explains it", [r.suggestion.cardId, r.additional, r.excluded.includes("adjustment")], ["depression", [], true]);
    r = R.evaluate({ ...rb, behaviour: ["nssi"], drivers: ["stressor"] });
    expect("risk flow: adjustment alone", r.suggestion.cardId, "adjustment");
    r = R.evaluate({ ...rb, behaviour: ["aggression"], drivers: ["instrumental"] });
    expect("risk flow: instrumental aggression", r.suggestion.cardId, "none");
    r = R.evaluate({ ...rb, behaviour: ["nssi"], drivers: ["bpd"] });
    expect("risk flow: points to suicide formulation", r.also.some(n => n.includes("Suicide risk formulation")), true);
}

async function testSubstanceScreen(browser, baseUrl) {
    const page = await newUnlockedPage(browser, baseUrl, "#oca-assessment-page");
    page.on("dialog", d => d.accept());
    await page.click('[data-oca-tab="oca-reasoning-panel"]');
    const answer = (q, label) => page.click(`#oca-reasoning-body fieldset[data-q="${q}"] label.rz-chip` +
        (label.length <= 6 ? `:text-is("${label}")` : `:has-text("${label}")`));
    await page.selectOption("#rz-problem", "substance");
    await answer("explained", "A pattern of use");
    await answer("substance", "Stimulant (amphetamine-type)");
    for (const [q, l] of [["withdrawalNow", "No"], ["overdose", "No"], ["feigned", "No"], ["prescribed", "No"]]) await answer(q, l);
    for (const c of ["Larger amounts", "Craving", "Much time spent", "Failing major roles"]) await answer("criteria", c);
    await answer("continuous", "Daily or almost daily");
    await answer("remission", "Current problem use");
    await answer("induced", "Psychosis");
    expectIncludes("substance screen: suggestion", await page.textContent(".rz-result-title"), "Stimulant (amphetamine-type) use disorder, moderate");
    await page.click("text=Open the Psychosis questions");
    expect("substance screen: switched", await page.inputValue("#rz-problem"), "psychosis");
    expect("substance screen: substance carried as yes", await page.isChecked('#oca-reasoning-body fieldset[data-q="substance"] input[value="yes"]'), true);
    await page.context().close();
}

function testSleepEatingRules() {
    const F = require(path.join(ROOT, "reasoning-flow-sleep-eating.js"));
    const g = { feigned: "no", substance: "no", delirium: "no", cognitive: "no", medical: "no" };
    const ins = { ...g, complaint: "insomnia", drowsy: "no", opportunity: "yes", osa: "no", rls: "no", circadian: "no", mania: "no" };
    const sl = { ...g, complaint: "sleepiness", drowsy: "no", shortSleep: "no", osa: "no", circadian: "no" };
    const S = a => F.sleep.evaluate(a);
    const E = a => F.eating.evaluate(a);
    const shown = (flow, a) => F[flow].questions.filter(q => !q.showIf || q.showIf(a)).map(q => q.id);

    let r = S({ ...ins, mental: "none", freq: "yes", duration: "3plus", impair: "yes" });
    expect("sleep flow: chronic insomnia", [r.suggestion.cardId, r.excluded.includes("short-insomnia")], ["insomnia", true]);
    r = S({ ...ins, mental: "depression", predominant: "yes", freq: "yes", duration: "3plus", impair: "yes" });
    expect("sleep flow: insomnia with depression, both diagnosed", [r.suggestion.cardId, r.additional], ["insomnia", ["mental"]]);
    r = S({ ...ins, mental: "depression", predominant: "no" });
    expect("sleep flow: insomnia only a symptom", [r.suggestion.cardId, r.switchTo], ["mental", "depressed"]);
    r = S({ ...ins, mental: "none", freq: "yes", duration: "1to3", impair: "yes" });
    expect("sleep flow: short-term insomnia", r.suggestion.cardId, "short-insomnia");
    r = S({ ...ins, mania: "yes" });
    expect("sleep flow: reduced need for sleep", [r.suggestion.cardId, r.switchTo], ["mental", "elevated"]);
    r = S({ ...ins, rls: "yes" });
    expect("sleep flow: restless legs", r.suggestion.cardId, "rls");
    r = S({ ...g, complaint: "insomnia", opportunity: "no" });
    expect("sleep flow: no opportunity", r.suggestion.cardId, "none");
    r = S({ ...ins, circadian: "late" });
    expectIncludes("sleep flow: delayed phase", r.suggestion.label, "7A60");
    r = S({ ...ins, substance: "yes", subTiming: "early", mental: "none", freq: "yes", duration: "3plus", impair: "yes" });
    expect("sleep flow: too early to tell", [r.suggestion.cardId, r.suggestion.provisional, r.alternatives.includes("insomnia")], ["substance-induced", true, true]);
    r = S({ ...sl, drowsy: "yes", osa: "yes" });
    expect("sleep flow: apnoea, drowsy driving urgent", [r.suggestion.cardId, /fitness to drive/i.test(r.urgent)], ["breathing", true]);
    r = S({ ...sl, cataplexy: "cataplexy" });
    expect("sleep flow: narcolepsy", r.suggestion.cardId, "narcolepsy");
    r = S({ ...sl, cataplexy: "no", mental: "none", hyperSx: "yes", freq: "yes", duration: "3plus", impair: "yes" });
    expect("sleep flow: hypersomnolence", r.suggestion.cardId, "hypersomnolence");
    r = S({ ...sl, cataplexy: "no", mental: "none", hyperSx: "no" });
    expectIncludes("sleep flow: fatigue not sleepiness", r.suggestion.label, "fatigue");
    r = S({ ...g, complaint: "sleepiness", shortSleep: "yes" });
    expect("sleep flow: insufficient sleep", r.suggestion.cardId, "insufficient");
    r = S({ ...g, complaint: "episodes", injury: "yes", episode: "rbd", impair: "yes" });
    expect("sleep flow: RBD with injury risk", [r.suggestion.cardId, !!r.urgent], ["rbd", true]);
    r = S({ ...g, complaint: "episodes", episode: "nightmares", trauma: "yes" });
    expect("sleep flow: trauma nightmares", r.switchTo, "anxiety");
    r = S({ ...g, complaint: "episodes", episode: "seizure" });
    expect("sleep flow: nocturnal seizures", r.ruleOut.seizure, "Investigating");
    expect("sleep flow: steps wait their turn", shown("sleep", { ...g, complaint: "insomnia", opportunity: "yes" }).includes("mental"), false);

    const e = { ...g, unstable: ["none"] };
    r = E({ ...e, problem: "restrict", unstable: ["hr"], psychosisFood: "no", lowWeight: "yes", bmi: "under14", fear: "yes", image: "yes", bingePurge: "no" });
    expect("eating flow: AN, extreme, unstable", [r.suggestion.label, /refeeding/i.test(r.urgent)],
        ["Anorexia nervosa, restricting type, extreme (ICD-11 6B80.1 dangerously low body weight)", true]);
    r = E({ ...e, problem: "binge", lowWeight: "yes", bmi: "16", fear: "yes", image: "yes" });
    expectIncludes("eating flow: binges at low weight are AN", r.suggestion.label, "binge-eating/purging type, moderate");
    r = E({ ...e, problem: "restrict", psychosisFood: "no", lowWeight: "no", fear: "yes", image: "yes" });
    expectIncludes("eating flow: atypical AN", r.suggestion.label, "Atypical anorexia nervosa");
    r = E({ ...e, problem: "restrict", psychosisFood: "no", lowWeight: "yes", bmi: "17", fear: "no", image: "no" });
    expect("eating flow: low weight without concern", [r.suggestion.cardId, r.alternatives.includes("medical")], ["arfid", false]);
    r = E({ ...e, problem: "binge", lowWeight: "no", compensate: "yes", shapeWeight: "yes", weekly: "4to7", months: "3plus" });
    expect("eating flow: bulimia", r.suggestion.label, "Bulimia nervosa, moderate (4–7 a week) (ICD-11 6B81)");
    r = E({ ...e, problem: "binge", lowWeight: "no", compensate: "yes", shapeWeight: "yes", weekly: "1to3", months: "1to3" });
    expect("eating flow: bulimia under 3 months", [r.suggestion.cardId, r.also.some(n => n.includes("meets ICD-11"))], ["osfed", true]);
    r = E({ ...e, problem: "binge", lowWeight: "no", compensate: "no", bedFeatures: "yes", weekly: "8to13", months: "3plus" });
    expectIncludes("eating flow: binge-eating disorder", r.suggestion.label, "Binge-eating disorder, severe");
    r = E({ ...e, problem: "purge", lowWeight: "no", shapeWeight: "yes" });
    expectIncludes("eating flow: purging disorder", r.suggestion.label, "Purging disorder");
    r = E({ ...e, problem: "avoid", psychosisFood: "no", avoidImpact: "yes", avoidShape: "no" });
    expect("eating flow: ARFID", r.suggestion.cardId, "arfid");
    r = E({ problem: "nonfood", picaCriteria: "yes" });
    expect("eating flow: pica", r.suggestion.cardId, "pica");
    r = E({ problem: "regurg", rumCriteria: "yes" });
    expect("eating flow: rumination", r.suggestion.cardId, "rumination");
    r = E({ ...e, problem: "loss", psychosisFood: "yes" });
    expect("eating flow: food delusions", r.switchTo, "psychosis");
    r = E({ ...e, problem: "loss", psychosisFood: "no", mood: "depression" });
    expect("eating flow: appetite loss in depression", r.switchTo, "depressed");
    r = E({ ...g, problem: "gain", mood: "no", nightEating: "yes" });
    expectIncludes("eating flow: night eating", r.suggestion.label, "Night eating syndrome");
    r = E({ ...g, problem: "gain", substance: "yes", subTiming: "during" });
    expect("eating flow: medication weight gain", r.suggestion.cardId, "substance-induced");
}

async function testSleepEatingScreen(browser, baseUrl) {
    const page = await newUnlockedPage(browser, baseUrl, "#oca-assessment-page");
    page.on("dialog", d => d.accept());
    await page.click('[data-oca-tab="oca-reasoning-panel"]');
    const answer = (q, label) => page.click(`#oca-reasoning-body fieldset[data-q="${q}"] label.rz-chip` +
        (label.length <= 6 ? `:text-is("${label}")` : `:has-text("${label}")`));
    await page.selectOption("#rz-problem", "sleep");
    await answer("complaint", "Trouble getting to sleep");
    for (const q of ["drowsy", "feigned", "substance", "delirium", "cognitive", "medical"]) await answer(q, "No");
    await answer("opportunity", "Yes");
    for (const q of ["osa", "rls", "circadian", "mania"]) await answer(q, "No");
    await answer("mental", "Depression");
    await answer("predominant", "Yes");
    await answer("freq", "Yes");
    await answer("duration", "3 months or more");
    await answer("impair", "Yes");
    expectIncludes("sleep screen: suggestion", await page.textContent(".rz-result-title"), "Insomnia disorder, persistent");
    await page.click("text=Apply to the cards below");
    expect("sleep screen: insomnia leading", await page.inputValue('select[aria-label="Insomnia disorder status"]'), "Leading");
    expect("sleep screen: depression also leading", await page.inputValue('select[aria-label="Part of another mental disorder status"]'), "Leading");

    await page.selectOption("#rz-problem", "eating");
    await answer("problem", "Restricting food");
    await answer("unstable", "Heart rate under 40");
    for (const q of ["feigned", "substance", "delirium", "cognitive", "medical", "psychosisFood"]) await answer(q, "No");
    await answer("lowWeight", "Yes");
    await answer("bmi", "Under 14");
    for (const q of ["fear", "image"]) await answer(q, "Yes");
    await answer("bingePurge", "No");
    expectIncludes("eating screen: suggestion", await page.textContent(".rz-result-title"), "Anorexia nervosa, restricting type, extreme");
    expectIncludes("eating screen: instability urgent", await page.textContent(".rz-acute"), "medical instability");
    await page.context().close();
}

function testSomaticDissociativeRules() {
    const F = require(path.join(ROOT, "reasoning-flow-somatic.js"));
    const S = a => F.somatic.evaluate(a);
    const D = a => F.depersonalisation.evaluate(a);
    const s = { feigned: "no", substance: "no", medicalDx: "no", delusional: "no", panicOnly: "no", moodOnly: "no" };

    let r = S({ ...s, focus: "symptoms", sxB: "two", pain: "yes", months6: "yes" });
    expect("somatic flow: SSD moderate with pain", r.suggestion.label, "Somatic symptom disorder, moderate, with predominant pain (ICD-11 6C20.1 Bodily distress disorder, moderate)");
    r = S({ ...s, focus: "symptoms", medicalDx: "excessive", sxB: "one", months6: "yes" });
    expect("somatic flow: SSD alongside a medical condition", r.suggestion.cardId, "ssd");
    r = S({ ...s, focus: "symptoms", medicalDx: "investigating", sxB: "severe", months6: "yes" });
    expect("somatic flow: provisional while investigating", [r.suggestion.provisional, r.alternatives.includes("medical")], [true, true]);
    r = S({ ...s, focus: "symptoms", sxB: "one", months6: "no" });
    expect("somatic flow: brief SSD", r.suggestion.cardId, "osrd");
    r = S({ focus: "symptoms", feigned: "no", substance: "no", medicalDx: "explains" });
    expect("somatic flow: proportionate response", r.suggestion.cardId, "medical");
    r = S({ focus: "symptoms", feigned: "external" });
    expect("somatic flow: malingering first", r.suggestion.cardId, "feigning");
    r = S({ ...s, focus: "illness", delusional: "yes" });
    expect("somatic flow: somatic delusions", r.switchTo, "psychosis");
    r = S({ ...s, focus: "illness", moodOnly: "gad" });
    expect("somatic flow: within GAD", r.switchTo, "anxiety");
    r = S({ ...s, focus: "illness", illnessSx: "yes", illnessBehaviour: "avoidant", months6: "yes" });
    expectIncludes("somatic flow: illness anxiety", r.suggestion.label, "Illness anxiety disorder, care-avoidant type");
    r = S({ ...s, focus: "neuro", positiveSigns: "yes", fndType: "seizures" });
    expectIncludes("somatic flow: functional seizures", r.suggestion.label, "6B60.4");
    r = S({ ...s, focus: "neuro", positiveSigns: "unclear" });
    expect("somatic flow: FND needs positive signs", [r.suggestion.cardId, r.suggestion.provisional], ["fnd", true]);
    r = S({ focus: "appearance", delusional: "yes", weightOnly: "no", repetitive: "yes", insight: "absent", muscle: "no" });
    expect("somatic flow: BDD with absent insight, not delusional disorder", [r.suggestion.cardId, r.excluded.includes("delusional")], ["bdd", true]);
    r = S({ focus: "appearance", delusional: "no", weightOnly: "yes" });
    expect("somatic flow: weight or shape only", r.switchTo, "eating");
    r = S({ focus: "condition", pfacOther: "no", pfacEffect: "yes" });
    expect("somatic flow: psychological factors", r.suggestion.cardId, "pfac");

    const d = { explained: "clinical", feigned: "no", substance: "no", delirium: "no", cognitive: "no", medical: "no", reality: "yes", only: "no", trauma: "no", amnesia: "no", functional: "no", personality: "no" };
    r = D({ ...d, dpType: "both" });
    expect("dissociation flow: DPDR", r.suggestion.cardId, "dpdr");
    r = D({ ...d, substance: "yes", subTiming: "persisted", dpType: "dp" });
    expect("dissociation flow: persists after cannabis", r.suggestion.cardId, "dpdr");
    r = D({ ...d, substance: "yes", subTiming: "during" });
    expect("dissociation flow: during intoxication", r.suggestion.cardId, "substance-induced");
    r = D({ ...d, medical: "flags", dpType: "dr" });
    expect("dissociation flow: provisional while red flags open", [r.suggestion.cardId, r.suggestion.provisional], ["dpdr", true]);
    r = D({ ...d, medical: "yes" });
    expectIncludes("dissociation flow: medical cause", r.suggestion.label, "6E65");
    r = D({ ...d, reality: "no" });
    expect("dissociation flow: reality testing lost", r.switchTo, "psychosis");
    r = D({ ...d, only: "panic" });
    expect("dissociation flow: only in panic", r.switchTo, "anxiety");
    r = D({ ...d, trauma: "long" });
    expect("dissociation flow: PTSD", r.suggestion.cardId, "ptsd");
    r = D({ ...d, amnesia: "yes", identity: "fugue" });
    expectIncludes("dissociation flow: fugue", r.suggestion.label, "with dissociative fugue");
    r = D({ ...d, personality: "bpd" });
    expect("dissociation flow: BPD", r.suggestion.cardId, "personality");
    r = D({ explained: "transient" });
    expect("dissociation flow: transient", r.suggestion.cardId, "none");
}

async function testSomaticScreen(browser, baseUrl) {
    const page = await newUnlockedPage(browser, baseUrl, "#oca-assessment-page");
    page.on("dialog", d => d.accept());
    await page.click('[data-oca-tab="oca-reasoning-panel"]');
    const answer = (q, label) => page.click(`#oca-reasoning-body fieldset[data-q="${q}"] label.rz-chip` +
        (label.length <= 6 ? `:text-is("${label}")` : `:has-text("${label}")`));
    await page.selectOption("#rz-problem", "somatic");
    await answer("focus", "Distressing physical symptoms");
    for (const q of ["feigned", "substance"]) await answer(q, "No");
    await answer("medicalDx", "Yes, but the worry");
    for (const q of ["delusional", "panicOnly", "moodOnly"]) await answer(q, "No");
    await answer("sxB", "Two or more, with several");
    await answer("pain", "Yes");
    await answer("months6", "Yes");
    expectIncludes("somatic screen: suggestion", await page.textContent(".rz-result-title"), "Somatic symptom disorder, severe, with predominant pain");
    await page.click("text=Apply to the cards below");
    expect("somatic screen: SSD leading", await page.inputValue('select[aria-label="Somatic symptom disorder status"]'), "Leading");
    expect("somatic screen: medical rule-out possible", await page.inputValue('select[aria-label="Medical conditions (rule-out) status"]'), "Possible");

    await page.selectOption("#rz-problem", "depersonalisation");
    await answer("explained", "Persistent or recurrent");
    for (const q of ["feigned", "delirium", "cognitive", "medical"]) await answer(q, "No");
    await answer("substance", "Yes");
    await answer("subTiming", "Has lasted about a month");
    await answer("reality", "Yes");
    await answer("only", "No, it happens outside");
    for (const q of ["trauma", "amnesia", "functional", "personality"]) await answer(q, "No");
    await answer("dpType", "Both");
    expectIncludes("dissociation screen: suggestion", await page.textContent(".rz-result-title"), "Depersonalisation-derealisation disorder");
    await page.context().close();
}

function testAvoidanceSlowingRules() {
    const F = require(path.join(ROOT, "reasoning-flow-avoidance.js"));
    const A = a => F.avoidance.evaluate(a);
    const S = a => F.slowing.evaluate(a);
    const v = { threat: "no", impair: "yes" };

    let r = A({ ...v, avoided: ["agoraphobia", "social"], socialMedical: "none", pervasive: "yes" });
    expect("avoidance flow: hands fears to Anxiety", [r.suggestion.cardId, r.switchTo, r.carry.focus, r.additional],
        ["anxiety", "anxiety", ["agoraphobia", "social"], ["avpd"]]);
    r = A({ ...v, avoided: ["social", "delusion"], socialMedical: "none", pervasive: "no" });
    expect("avoidance flow: delusions come first", [r.suggestion.cardId, r.switchTo], ["psychosis", "psychosis"]);
    r = A({ ...v, avoided: ["energy"], energyContext: "depression" });
    expect("avoidance flow: loss of drive", r.switchTo, "depressed");
    r = A({ ...v, avoided: ["food"], foodWeight: "no" });
    expect("avoidance flow: food without weight concern", [r.switchTo, r.carry], ["eating", { problem: "avoid" }]);
    r = A({ ...v, avoided: ["stressor"], stressorRecent: "yes" });
    expect("avoidance flow: adjustment alone", r.suggestion.cardId, "adjustment");
    r = A({ ...v, avoided: ["stressor", "specific"], stressorRecent: "yes" });
    expect("avoidance flow: adjustment dropped for a phobia", [r.suggestion.label, r.excluded.includes("adjustment")], ["Specific phobia (ICD-11 6B03)", true]);
    r = A({ ...v, avoided: ["social"], socialMedical: "proportionate" });
    expect("avoidance flow: proportionate to a medical condition", r.suggestion.cardId, "none");
    r = A({ avoided: ["social"], threat: "yes" });
    expect("avoidance flow: real threat", [r.suggestion.cardId, r.ruleOut.safety], ["none", "Possible"]);

    const s = { explained: "clinical", nms: "no", parkinsonism: "no", feigned: "no", substance: "no", delirium: "no", cognitive: "no", medical: "no" };
    r = S({ explained: "clinical", nms: "yes" });
    expect("slowing flow: NMS urgent", [r.suggestion.cardId, /urgent medical review/.test(r.urgent)], ["medication", true]);
    r = S({ explained: "clinical", nms: "no", parkinsonism: "yes" });
    expectIncludes("slowing flow: parkinsonism", r.suggestion.label, "Medication-induced parkinsonism");
    r = S({ ...s, nms: "unsure", catatonic: "no", depressed: "yes" });
    expect("slowing flow: NMS unsure still continues", [!!r.urgent, r.suggestion.cardId,
        F.slowing.questions.filter(q => !q.showIf || q.showIf({ ...s, nms: "unsure" })).some(q => q.id === "catatonic")], [true, "depression", true]);
    r = S({ ...s, delirium: "yes" });
    expectIncludes("slowing flow: hypoactive delirium", r.suggestion.label, "Hypoactive delirium");
    r = S({ ...s, catatonic: "yes" });
    expect("slowing flow: catatonia", r.switchTo, "catatonia");
    r = S({ ...s, catatonic: "no", depressed: "yes" });
    expect("slowing flow: depression", r.switchTo, "depressed");
    r = S({ ...s, catatonic: "no", depressed: "no", psychotic: "negative" });
    expect("slowing flow: negative symptoms", r.switchTo, "psychosis");
    r = S({ ...s, catatonic: "no", depressed: "no", psychotic: "no" });
    expect("slowing flow: residual", [r.suggestion.cardId, r.alternatives.includes("medical")], ["other", false]);
    r = S({ ...s, substance: "yes", subTiming: "early", catatonic: "no", depressed: "yes" });
    expect("slowing flow: too early to tell", [r.suggestion.cardId, r.switchTo], ["substance-induced", null]);
}

async function testAvoidanceScreen(browser, baseUrl) {
    const page = await newUnlockedPage(browser, baseUrl, "#oca-assessment-page");
    page.on("dialog", d => d.accept());
    await page.click('[data-oca-tab="oca-reasoning-panel"]');
    const answer = (q, label) => page.click(`#oca-reasoning-body fieldset[data-q="${q}"] label.rz-chip` +
        (label.length <= 6 ? `:text-is("${label}")` : `:has-text("${label}")`));
    await page.selectOption("#rz-problem", "avoidance");
    await answer("avoided", "Places where escape");
    await answer("avoided", "Social or performance");
    await answer("threat", "No");
    await answer("impair", "Yes");
    await answer("socialMedical", "No");
    await answer("pervasive", "No");
    expectIncludes("avoidance screen: suggestion", await page.textContent(".rz-result-title"), "Agoraphobia");
    await page.click("text=Open the Anxiety questions");
    expect("avoidance screen: switched", await page.inputValue("#rz-problem"), "anxiety");
    const checked = v => page.isChecked(`#oca-reasoning-body fieldset[data-q="focus"] input[value="${v}"]`);
    expect("avoidance screen: fears carried over", [await checked("agoraphobia"), await checked("social"), await checked("panic")], [true, true, false]);
    expect("avoidance screen: impairment carried over", await page.isChecked('#oca-reasoning-body fieldset[data-q="impair"] input[value="yes"]'), true);
    await page.context().close();
}

// The Cloudflare Pages function that stores synced templates.
async function testTemplateFunction() {
    const src = fs.readFileSync(path.join(ROOT, "functions/api/templates.js"), "utf8");
    const { onRequest } = await import("data:text/javascript," + encodeURIComponent(src));
    const kv = new Map();
    const env = { SYNC_TOKEN: "secret", TEMPLATES: { get: async k => kv.get(k) || null, put: async (k, v) => { kv.set(k, v); } } };
    const call = (method, token, body) => onRequest({ env, request: new Request("https://x/api/templates", {
        method, body, headers: token ? { Authorization: "Bearer " + token } : {}
    }) });
    expect("function: no key", (await call("GET")).status, 401);
    expect("function: wrong key", (await call("GET", "nope")).status, 401);
    expect("function: not configured", (await onRequest({ env: {}, request: new Request("https://x/api/templates") })).status, 503);
    expect("function: empty store", (await (await call("GET", "secret")).json()).records, {});
    const records = { a: { id: "a", name: "A", body: "Body", updatedAt: 5, deleted: false } };
    expect("function: save", (await call("PUT", "secret", JSON.stringify({ records }))).status, 200);
    expect("function: read back", (await (await call("GET", "secret")).json()).records, records);
    expect("function: rejects bad data", (await call("PUT", "secret", JSON.stringify({ records: { a: { name: 1 } } }))).status, 400);
    expect("function: rejects other methods", (await call("DELETE", "secret")).status, 405);
}

// Mental Health Act: the pathway maps are drawn without overlapping boxes,
// clipped text or hidden Yes/No labels (desktop and phone layouts), and the
// guided pathway does not ask about the first examination twice.
async function testMhaPathway(browser, baseUrl) {
    for (const [name, viewport] of [["desktop", { width: 1300, height: 900 }], ["phone", { width: 390, height: 844 }]]) {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        page.on("pageerror", err => failures.push(`Page error: ${err.message}`));
        await page.addInitScript(() => {
            sessionStorage.setItem("unlocked", "true");
            localStorage.setItem("disclaimer_accepted", "1");
        });
        await page.goto(baseUrl + "/index.html#mha-page");
        await page.click('#mha-page .tab-button[data-tab="mha-map"]');
        const problems = await page.evaluate(() => {
            const out = [];
            const overlap = (a, b, pad = 0) => a.x < b.x + b.width + pad && b.x < a.x + a.width + pad &&
                a.y < b.y + b.height + pad && b.y < a.y + a.height + pad;
            document.querySelectorAll(".mha-flow-svg").forEach(svg => {
                const flow = svg.parentElement.id;
                const vb = svg.viewBox.baseVal;
                const nodes = Array.from(svg.querySelectorAll(".mha-flow-node:not(.mha-flow-group)")).map(g => ({
                    box: g.querySelector("rect").getBBox(),
                    texts: Array.from(g.querySelectorAll("text")).map(t => ({ s: t.textContent, b: t.getBBox() }))
                }));
                nodes.forEach((n, i) => {
                    const r = n.box, name = n.texts.map(t => t.s).join(" ").slice(0, 40);
                    if (r.x < 0 || r.y < 0 || r.x + r.width > vb.width || r.y + r.height > vb.height) out.push(`${flow}: "${name}" is outside the diagram`);
                    n.texts.forEach(t => {
                        if (t.b.x < r.x + 2 || t.b.x + t.b.width > r.x + r.width - 2 || t.b.y < r.y + 1 || t.b.y + t.b.height > r.y + r.height - 1)
                            out.push(`${flow}: text "${t.s}" spills out of its box`);
                    });
                    nodes.slice(i + 1).forEach(m => { if (overlap(r, m.box)) out.push(`${flow}: "${name}" overlaps another box`); });
                });
                const labels = Array.from(svg.querySelectorAll(".mha-flow-edge-label")).map(l => ({ s: l.textContent, b: l.getBBox() }));
                labels.forEach((l, i) => {
                    if (nodes.some(n => overlap(l.b, n.box))) out.push(`${flow}: edge label "${l.s}" sits on a box`);
                    labels.slice(i + 1).forEach(m => { if (overlap(l.b, m.b)) out.push(`${flow}: edge labels "${l.s}" and "${m.s}" overlap`); });
                });
            });
            return out;
        });
        expect(`MHA flowcharts drawn cleanly (${name})`, problems, []);
        if (name === "phone") {
            expect("phone gets the stacked involuntary pathway",
                await page.$eval("#mha-flow-involuntary svg", s => s.classList.contains("mha-flow-svg--compact")), true);
            expect("stacked pathway needs no sideways scroll",
                await page.$eval("#mha-flow-involuntary", el => el.scrollWidth <= el.clientWidth + 1), true);
        }
        await context.close();
    }

    // Step 1 and step 2 both mentally disordered: straight to the s 31 card,
    // and Back returns to the step 2 question rather than the skipped one.
    const page = await newUnlockedPage(browser, baseUrl, "#mha-page");
    const click = async (sel, text) => page.locator(sel, { hasText: text }).first().click();
    const heading = () => page.textContent("#mha-wizard .mha-card h4");
    await click(".mha-role-btn", "Psychiatry registrar");
    await click(".mha-option", "already detained");
    await click(".mha-option", "First examination");
    await click(".mha-option", "Mentally disordered person");
    await click(".mha-next-btn", "second examination");
    await click(".mha-option", "Mentally disordered person");
    expectIncludes("MD + MD skips the repeat question", await heading(), "Detained as a mentally disordered person");
    await click(".mha-trail-btn", "Back");
    expectIncludes("Back skips over the auto-answered step", await heading(), "Second examination");
    await click(".mha-option", "Mentally ill person");
    expectIncludes("MD + MI goes to an inquiry", await heading(), "mental health inquiry must be held");
    await page.context().close();
}

(async () => {
    const server = await startServer();
    const baseUrl = `http://localhost:${server.address().port}`;
    const browser = await chromium.launch(
        process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
    );
    try {
        await testScales(browser, baseUrl);
        await testPsqiAndPdss(browser, baseUrl);
        await testConverters(browser, baseUrl);
        await testWidmark(browser, baseUrl);
        await testEctHelper(browser, baseUrl);
        await testAppShell(browser, baseUrl);
        await testMhaPathway(browser, baseUrl);
        await testNoteTemplates(browser, baseUrl);
        await testTemplateFunction();
        await testReasoning(browser, baseUrl);
        testPsychosisFlowRules();
        await testPsychosisFlowScreen(browser, baseUrl);
        testMoodFlowRules();
        await testMoodFlowScreen(browser, baseUrl);
        testAnxietyCatatoniaRules();
        await testAnxietyCatatoniaScreen(browser, baseUrl);
        testCognitiveRules();
        await testCognitiveScreen(browser, baseUrl);
        testSubstanceRiskRules();
        await testSubstanceScreen(browser, baseUrl);
        testSleepEatingRules();
        await testSleepEatingScreen(browser, baseUrl);
        testSomaticDissociativeRules();
        await testSomaticScreen(browser, baseUrl);
        testAvoidanceSlowingRules();
        await testAvoidanceScreen(browser, baseUrl);
    } finally {
        await browser.close();
        server.close();
    }

    if (failures.length) {
        console.error(`\n${failures.length} of ${checks} checks FAILED:\n- ` + failures.join("\n- "));
        process.exit(1);
    }
    console.log(`All ${checks} checks passed.`);
})();
