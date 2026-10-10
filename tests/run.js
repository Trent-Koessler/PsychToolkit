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
// PSQI and the Panic & Agoraphobia Scale are left out until their item sets are
// reviewed (they do not currently match the published instruments).
const SCALE_RANGES = {
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
    hamd: [[7, "Normal"], [8, "Mild"], [16, "Mild"], [17, "Moderate"], [23, "Moderate"], [24, "Severe"]]
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

(async () => {
    const server = await startServer();
    const baseUrl = `http://localhost:${server.address().port}`;
    const browser = await chromium.launch(
        process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
    );
    try {
        await testScales(browser, baseUrl);
        await testConverters(browser, baseUrl);
        await testWidmark(browser, baseUrl);
        await testAppShell(browser, baseUrl);
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
