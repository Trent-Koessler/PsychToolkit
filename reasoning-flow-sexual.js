/* =========================================================================
 * Guided differential for sexual problems (DSM-5-TR trees for female and
 * male sexual response). Rules are written from the DSM-5-TR criteria in our
 * own words, with ICD-11 differences noted. They suggest; the clinician
 * decides.
 *
 * DSM-5-TR rules a sexual dysfunction out when a substance, a medical
 * condition, another mental disorder or relationship factors fully explain
 * it. ICD-11 instead diagnoses the dysfunction and records the cause as a
 * qualifier; the results say so.
 * ========================================================================= */

(function (root) {
    "use strict";

    const K = root.REASONING_FLOW_KIT || require("./reasoning-flow-kit.js");
    const { YES_NO, picked, newResult, helpers } = K;

    function finish(r) {
        if (r.suggestion && r.suggestion.cardId) {
            const keep = id => id !== r.suggestion.cardId && !(r.additional || []).includes(id);
            r.alternatives = r.alternatives.filter(keep);
            r.excluded = r.excluded.filter(keep);
        }
        return r;
    }

    const PROBLEMS = {
        female: [
            { value: "fsiad", label: "Low sexual interest or arousal" },
            { value: "fod", label: "Delayed, infrequent or absent orgasm, or much less intense" },
            { value: "gppd", label: "Pain, fear of pain, or pelvic floor tightening with vaginal penetration" }
        ],
        male: [
            { value: "hsdd", label: "Low or absent sexual desire and thoughts" },
            { value: "ed", label: "Trouble getting or keeping an erection" },
            { value: "pe", label: "Ejaculating early, before wished" },
            { value: "de", label: "Marked delay in, or absence of, ejaculation" }
        ]
    };
    const LABELS = {
        fsiad: "Female sexual interest/arousal disorder (ICD-11 HA00 and/or HA01.0)",
        fod: "Female orgasmic disorder (ICD-11 HA02)",
        gppd: "Genito-pelvic pain/penetration disorder (ICD-11 HA20 Sexual pain-penetration disorder)",
        hsdd: "Male hypoactive sexual desire disorder (ICD-11 HA00)",
        ed: "Erectile disorder (ICD-11 HA01.1)",
        pe: "Premature (early) ejaculation (ICD-11 HA03.0)",
        de: "Delayed ejaculation (ICD-11 HA03.1)"
    };

    const problems = a => picked(a, a.response === "female" ? "problemF" : "problemM").filter(p => LABELS[p]);
    const started = a => a.distress === "yes" && problems(a).length > 0;

    const gates = K.gateQuestions({ subject: "the sexual problem", change: "the problem", disorder: "sexual dysfunction", medicalHint: "", extraTiming: null })
        .filter(q => q.id === "substance" || q.id === "subTiming")
        .map(q => Object.assign({}, q, {
            step: "1 · Substance or medication",
            text: q.id === "substance"
                ? "Did it start or worsen with a substance or medication (SSRIs, SNRIs, antipsychotics, antihypertensives, opioids, alcohol)?"
                : q.text,
            showIf: a => started(a) && (q.id === "substance" || a.substance === "yes")
        }));
    const pastSubstance = a => a.substance === "no" || a.substance === "unsure" || (a.substance === "yes" && a.subTiming && a.subTiming !== "during");
    const pastMedical = a => pastSubstance(a) && a.medicalSex && a.medicalSex !== "entirely";
    const pastMental = a => pastMedical(a) && a.mentalSex && a.mentalSex !== "only";
    const pastContext = a => pastMental(a) && a.context === "no";
    const has = (a, p) => pastContext(a) && problems(a).includes(p);

    const SEXUAL_QUESTIONS = [
        {
            id: "distress", step: "0 · What is the problem?", type: "choice",
            text: "Is the person distressed by it?",
            hint: "A difference in desire that doesn't distress them (including asexual identity), or a concern raised only by a partner, is not a dysfunction.",
            options: YES_NO
        },
        {
            id: "response", step: "0 · What is the problem?", type: "choice",
            text: "DSM-5-TR criteria differ for female and male sexual response. Which applies?",
            options: [
                { value: "female", label: "Female sexual response" },
                { value: "male", label: "Male sexual response" }
            ],
            showIf: a => a.distress === "yes"
        },
        {
            id: "problemF", step: "0 · What is the problem?", type: "multi",
            text: "Which problems? (Tick all that apply; they often co-occur.)",
            options: PROBLEMS.female,
            showIf: a => a.distress === "yes" && a.response === "female"
        },
        {
            id: "problemM", step: "0 · What is the problem?", type: "multi",
            text: "Which problems? (Tick all that apply; they often co-occur.)",
            options: PROBLEMS.male,
            showIf: a => a.distress === "yes" && a.response === "male"
        }
    ].concat(gates, [
        {
            id: "medicalSex", step: "2 · Medical condition", type: "choice",
            text: "Could a medical condition explain it (diabetes, vascular disease, neuropathy, low testosterone, high prolactin, menopause, a pelvic condition)?",
            options: [
                { value: "entirely", label: "Yes, it fully explains it" },
                { value: "contributes", label: "It contributes, but psychological factors matter too" },
                { value: "investigating", label: "Not yet investigated" },
                { value: "no", label: "No" }
            ],
            showIf: a => started(a) && pastSubstance(a)
        },
        {
            id: "mentalSex", step: "3 · Another mental disorder?", type: "choice",
            text: "Is it part of another mental disorder (e.g. depression, PTSD)?",
            options: [
                { value: "only", label: "Yes, it occurs only during that disorder" },
                { value: "outside", label: "It began before, or persists after, that disorder" },
                { value: "no", label: "No other mental disorder" }
            ],
            showIf: a => started(a) && pastMedical(a)
        },
        {
            id: "context", step: "4 · Relationship and context", type: "choice",
            text: "Is it better explained by any of these?",
            options: [
                { value: "violence", label: "Partner violence or sexual coercion" },
                { value: "distress", label: "Severe relationship distress" },
                { value: "stimulation", label: "Inadequate stimulation or sexual knowledge" },
                { value: "no", label: "None of these" }
            ],
            showIf: a => started(a) && pastMental(a)
        },
        {
            id: "fsiadCount", step: "5 · Which dysfunction?", type: "choice",
            text: "Interest/arousal: at least 3 of low interest, few sexual thoughts, rarely initiating or unreceptive, little excitement or pleasure, little response to cues, little genital or other sensation?",
            options: YES_NO,
            showIf: a => has(a, "fsiad")
        },
        {
            id: "latency", step: "5 · Which dysfunction?", type: "choice",
            text: "Early ejaculation: usual time from vaginal penetration to ejaculation?",
            hint: "DSM-5-TR's time criterion is set for vaginal intercourse; for other sexual activity, use clinical judgement.",
            options: [
                { value: "15", label: "Under 15 seconds" },
                { value: "30", label: "15 to 30 seconds" },
                { value: "60", label: "30 seconds to 1 minute" },
                { value: "longer", label: "More than 1 minute" }
            ],
            showIf: a => has(a, "pe")
        },
        {
            id: "occasions", step: "5 · Which dysfunction?", type: "choice",
            text: "On almost all or all occasions (about 75–100%)?",
            options: YES_NO,
            showIf: a => pastContext(a) && problems(a).some(p => p !== "gppd")
        },
        {
            id: "months6", step: "5 · Which dysfunction?", type: "choice",
            text: "For about 6 months or more?",
            options: YES_NO,
            showIf: pastContext
        },
        {
            id: "stressor", step: "5 · Which dysfunction?", type: "choice",
            text: "Did it begin within 3 months of an identifiable stressor?",
            options: YES_NO,
            showIf: a => pastContext(a) && a.months6 === "no"
        },
        {
            id: "onset", step: "6 · Specifiers", type: "choice",
            text: "Onset:",
            options: [
                { value: "lifelong", label: "Lifelong (since first sexual experiences)" },
                { value: "acquired", label: "Acquired (after a period of normal function)" }
            ],
            showIf: a => pastContext(a) && a.months6 === "yes"
        },
        {
            id: "scope", step: "6 · Specifiers", type: "choice",
            text: "Situations:",
            options: [
                { value: "generalised", label: "Generalised (all partners and situations)" },
                { value: "situational", label: "Situational (some partners, situations or types of stimulation)" }
            ],
            showIf: a => pastContext(a) && a.months6 === "yes"
        }
    ]);

    const PE_SEVERITY = { "15": "severe", "30": "moderate", "60": "mild" };

    function evaluateSexual(answers) {
        const a = answers || {};
        const r = newResult();
        r.additional = [];
        const h = helpers(r);

        if (a.distress === "no") {
            r.trail.push("The person isn't distressed by it.");
            r.suggestion = h.suggest("none", "No disorder: a difference in desire or function that doesn't distress the person");
            r.also.push("Someone who identifies as asexual is not diagnosed. If a partner is distressed, consider relationship counselling.");
            return r;
        }
        if (!a.distress) { r.pending.push("Start with step 0: is the person distressed?"); return r; }
        const list = problems(a);
        if (!a.response || !list.length) { r.pending.push("Step 0: which problems."); return r; }
        r.trail.push("A distressing sexual problem.");

        // Step 1. Substance or medication.
        if (a.substance === "yes" && a.subTiming === "during") {
            r.trail.push("Began or worsened with a substance or medication.");
            r.ruleOut.medication = "Possible";
            r.suggestion = h.suggest("substance-induced", "Substance/medication-induced sexual dysfunction");
            r.also.push("Consider a lower dose or switching (e.g. bupropion, mirtazapine or vortioxetine for an SSRI; aripiprazole for a prolactin-raising antipsychotic). Check prolactin on a prolactin-raising antipsychotic.");
            r.also.push("ICD-11 records the dysfunction with the qualifier 'associated with a substance or medication'.");
            return finish(r);
        }
        if (a.substance === "no" || (a.substance === "yes" && ["before", "persisted"].includes(a.subTiming))) {
            r.ruleOut.medication = "Excluded";
            r.ruleOut.substance = "Excluded";
            h.exclude("substance-induced");
        } else if (a.substance === "unsure" || a.subTiming === "early") {
            r.ruleOut.medication = "Investigating";
            h.alt("substance-induced");
        } else {
            r.pending.push("Step 1: substances or medication.");
            return r;
        }

        // Step 2. Medical condition.
        if (a.medicalSex === "entirely") {
            r.trail.push("A medical condition fully explains it.");
            r.ruleOut.medical = "Possible";
            r.suggestion = h.suggest("medical", "Sexual dysfunction due to a medical condition (DSM-5-TR: no mental disorder)");
            r.also.push("ICD-11 differs: diagnose the dysfunction and add the qualifier 'associated with a medical condition'. Refer for medical treatment.");
            return finish(r);
        }
        if (a.medicalSex === "contributes") {
            r.trail.push("A medical condition contributes, with psychological factors too.");
            r.ruleOut.medical = "Possible";
        } else if (a.medicalSex === "investigating") {
            r.ruleOut.medical = "Investigating";
            h.alt("medical");
        } else if (a.medicalSex === "no") {
            r.ruleOut.medical = "Excluded";
            h.exclude("medical");
        } else {
            r.pending.push("Step 2: medical conditions.");
            return r;
        }

        // Step 3. Another mental disorder.
        if (a.mentalSex === "only") {
            r.trail.push("Occurs only during another mental disorder.");
            r.ruleOut.mental = "Possible";
            r.suggestion = h.suggest("mental-disorder", "Diagnose the other mental disorder only (e.g. depression, PTSD)");
            r.also.push("If it begins before, or persists after, that disorder, diagnose both.");
            return finish(r);
        }
        if (a.mentalSex === "outside") {
            r.trail.push("Began before, or persists after, another mental disorder: both are diagnosed.");
            r.additional.push("mental-disorder");
        } else if (a.mentalSex === "no") {
            h.exclude("mental-disorder");
        } else {
            r.pending.push("Step 3: other mental disorders.");
            return r;
        }

        // Step 4. Relationship, safety and knowledge.
        if (a.context === "violence") {
            r.urgent = "Partner violence or sexual coercion: ask about safety alone, and follow local domestic violence procedures.";
            r.ruleOut.safety = "Possible";
            r.trail.push("Better explained by partner violence or coercion.");
            r.suggestion = h.suggest("relationship", "No sexual dysfunction diagnosis: partner violence or coercion");
            r.additional = [];
            return finish(r);
        }
        if (a.context === "distress" || a.context === "stimulation") {
            r.trail.push(a.context === "distress"
                ? "Better explained by severe relationship distress."
                : "Better explained by inadequate stimulation or sexual knowledge.");
            r.suggestion = h.suggest("relationship", a.context === "distress"
                ? "No sexual dysfunction diagnosis: relationship distress (consider couples therapy)"
                : "No sexual dysfunction diagnosis: inadequate stimulation or knowledge (sex education or counselling)");
            r.additional = [];
            return finish(r);
        }
        if (a.context !== "no") { r.pending.push("Step 4: relationship and context."); return r; }
        r.ruleOut.safety = "Excluded";
        h.exclude("relationship");

        // Step 5. Which dysfunction.
        if (!a.months6 || (list.some(p => p !== "gppd") && !a.occasions)) {
            r.pending.push("Step 5: how often and for how long.");
            return finish(r);
        }
        const threshold = a.months6 === "yes" && (a.occasions === "yes" || list.every(p => p === "gppd"));
        if (!threshold) {
            if (a.months6 === "no" && a.stressor === "yes") {
                r.trail.push("Under 6 months, after an identifiable stressor.");
                r.suggestion = h.suggest(null, "Adjustment disorder (ICD-11 6B43)");
                h.alt("other-sexual");
            } else if (a.months6 === "no" && !a.stressor) {
                r.pending.push("Step 5: a recent stressor.");
                return finish(r);
            } else {
                r.trail.push(a.months6 === "no" ? "Under 6 months." : "On fewer occasions than needed for a specific diagnosis.");
                r.suggestion = h.suggest("other-sexual", "Other specified sexual dysfunction (ICD-11 HA0Y)");
            }
            list.forEach(h.alt);
            return finish(r);
        }

        const met = [];
        list.forEach(p => {
            if (p === "fsiad") {
                if (a.fsiadCount === "no") { h.alt("fsiad"); r.trail.push("Fewer than 3 interest/arousal features."); return; }
                if (!a.fsiadCount) { r.pending.push("Step 5: interest/arousal features."); return; }
            }
            if (p === "pe") {
                if (a.latency === "longer") { h.alt("pe"); r.trail.push("Ejaculation more than a minute after penetration."); return; }
                if (!a.latency) { r.pending.push("Step 5: time to ejaculation."); return; }
            }
            met.push(p);
        });
        if (!met.length) {
            if (!r.pending.length) r.suggestion = h.suggest("other-sexual", "Other specified sexual dysfunction (ICD-11 HA0Y)");
            return finish(r);
        }
        r.trail.push("On almost all occasions for about 6 months or more, with distress.");
        const spec = [{ lifelong: "lifelong", acquired: "acquired" }[a.onset], { generalised: "generalised", situational: "situational" }[a.scope]].filter(Boolean);
        if (!a.onset || !a.scope) r.pending.push("Step 6: onset and situations.");
        const label = p => {
            const extra = [...(p === "pe" && PE_SEVERITY[a.latency] ? [PE_SEVERITY[a.latency]] : []), ...spec];
            return LABELS[p].replace(" (ICD-11", (extra.length ? ", " + extra.join(", ") : "") + " (ICD-11");
        };
        r.suggestion = h.suggest(met[0], label(met[0]));
        r.additional = r.additional.concat(met.slice(1));
        if (met.length > 1) r.also.unshift("Also meets criteria for: " + met.slice(1).map(label).join("; ") + ".");
        if (r.additional.includes("mental-disorder")) r.also.push("Diagnose the other mental disorder as well.");
        if (a.medicalSex === "contributes") r.also.push("ICD-11 adds the qualifier 'associated with a medical condition'; treat the condition too.");
        if (a.medicalSex === "investigating") {
            r.suggestion.provisional = true;
            r.also.push("Provisional until medical causes are checked.");
        }
        if (met.includes("ed")) r.also.push("Check cardiovascular risk (BP, lipids, glucose): erectile problems can come years before heart disease.");
        if (met.includes("gppd")) r.also.push("Refer for gynaecological assessment; pelvic floor physiotherapy and CBT help. Ask about sexual trauma, safely.");
        ["fsiad", "fod", "gppd", "hsdd", "ed", "pe", "de"].forEach(id => {
            if (!met.includes(id) && !list.includes(id)) h.exclude(id);
        });
        h.exclude("other-sexual");
        h.exclude("none");
        return finish(r);
    }

    const flows = { sexual: { questions: SEXUAL_QUESTIONS, evaluate: evaluateSexual } };
    root.REASONING_FLOWS = Object.assign(root.REASONING_FLOWS || {}, flows);
    if (typeof module !== "undefined" && module.exports) module.exports = flows;
})(typeof window !== "undefined" ? window : globalThis);
