/* =========================================================================
 * Guided differential for problematic substance use (and gambling). Order:
 *   0. Is it a disorder?   1. Safety first (withdrawal, overdose), feigning
 *   2. Criteria and severity (DSM-5-TR), dependence vs harmful pattern
 *      (ICD-11)   3. Course and setting   4. Induced syndromes
 *   5. Co-occurring mental disorders
 * Rules are written from the DSM-5-TR criteria in our own words, with ICD-11
 * differences noted. They suggest; the clinician decides.
 * ========================================================================= */

(function (root) {
    "use strict";

    const K = root.REASONING_FLOW_KIT || require("./reasoning-flow-kit.js");
    const { YES_NO, picked, newResult, helpers } = K;

    const SUBSTANCES = {
        alcohol: { name: "Alcohol", icd: "6C40", depressant: true },
        cannabis: { name: "Cannabis", icd: "6C41" },
        opioids: { name: "Opioid", icd: "6C43", depressant: true, prescribable: true },
        sedatives: { name: "Sedative, hypnotic or anxiolytic", icd: "6C44", depressant: true, prescribable: true },
        cocaine: { name: "Cocaine", icd: "6C45" },
        stimulants: { name: "Stimulant (amphetamine-type)", icd: "6C46", prescribable: true },
        hallucinogens: { name: "Hallucinogen", icd: "6C49" },
        ketamine: { name: "Ketamine or other dissociative", icd: "6C4D" },
        inhalants: { name: "Inhalant", icd: "6C4B" },
        nicotine: { name: "Tobacco (nicotine)", icd: "6C4A" },
        other: { name: "Other substance", icd: "6C4E" },
        gambling: { name: "Gambling", icd: "6C50", behaviour: true }
    };

    const CRITERIA = [
        { value: "larger", label: "Larger amounts or longer than intended", group: "control" },
        { value: "cutdown", label: "Wants to cut down, or unsuccessful attempts", group: "control" },
        { value: "time", label: "Much time spent getting, using or recovering", group: "precedence" },
        { value: "craving", label: "Craving", group: "control" },
        { value: "roles", label: "Failing major roles at work, study or home", group: "harm" },
        { value: "social", label: "Continues despite social or relationship problems", group: "harm" },
        { value: "givenup", label: "Important activities given up or reduced", group: "precedence" },
        { value: "hazard", label: "Use in physically hazardous situations (e.g. driving)", group: "harm" },
        { value: "despite", label: "Continues despite physical or psychological harm", group: "precedence" },
        { value: "tolerance", label: "Tolerance", group: "physiological" },
        { value: "withdrawal", label: "Withdrawal, or using to avoid it", group: "physiological" }
    ];
    const GAMBLING_CRITERIA = [
        { value: "more", label: "Needs to gamble more to get the same excitement" },
        { value: "restless", label: "Restless or irritable when cutting down" },
        { value: "cutdown", label: "Repeated unsuccessful attempts to cut down" },
        { value: "preoccupied", label: "Preoccupied with gambling" },
        { value: "escape", label: "Gambles when distressed" },
        { value: "chasing", label: "Chases losses" },
        { value: "lies", label: "Lies to hide gambling" },
        { value: "jeopardised", label: "Has jeopardised a relationship, job or opportunity" },
        { value: "bailout", label: "Relies on others for money to relieve debts" }
    ];

    const disorder = a => a.explained === "pattern";
    const isGambling = a => a.substance === "gambling";
    const chemical = a => disorder(a) && a.substance && !isGambling(a);

    const QUESTIONS = [
        {
            id: "explained", step: "0 · Is it a disorder?", type: "choice",
            text: "Which fits best?",
            options: [
                { value: "pattern", label: "A pattern of use causing problems or distress" },
                { value: "episode", label: "A single episode of intoxication or withdrawal" },
                { value: "none", label: "Use without problems, loss of control or distress" }
            ]
        },
        {
            id: "substance", step: "0 · Is it a disorder?", type: "choice",
            text: "Which substance is this about? (Work through each substance separately.)",
            options: Object.keys(SUBSTANCES).map(k => ({ value: k, label: SUBSTANCES[k].name })),
            showIf: a => a.explained === "pattern" || a.explained === "episode"
        },
        {
            id: "withdrawalNow", step: "1 · Safety first", type: "choice",
            text: "Withdrawing now, or likely to soon (time of last use, past seizures or delirium tremens)?",
            options: YES_NO,
            showIf: chemical
        },
        {
            id: "overdose", step: "1 · Safety first", type: "choice",
            text: "Reduced tolerance (after detox, prison or discharge), or mixing depressants such as opioids, benzodiazepines and alcohol?",
            options: YES_NO,
            showIf: chemical
        },
        {
            id: "feigned", step: "1 · Safety first", type: "choice",
            text: "Is there evidence of feigned symptoms (e.g. to obtain prescriptions)?",
            options: [
                { value: "no", label: "No" }, { value: "unclear", label: "Unclear" },
                { value: "external", label: "Yes, for an external gain" }
            ],
            showIf: chemical
        },
        {
            id: "prescribed", step: "2 · Criteria and severity", type: "choice",
            text: "Is it prescribed and taken as directed, under medical supervision?",
            hint: "Tolerance and withdrawal on a prescribed opioid, sedative or stimulant taken as directed don't count towards a use disorder.",
            options: YES_NO,
            showIf: a => chemical(a) && SUBSTANCES[a.substance] && SUBSTANCES[a.substance].prescribable
        },
        {
            id: "criteria", step: "2 · Criteria and severity", type: "multi",
            text: "Which have been present in the same 12 months? (Tick all that apply.)",
            options: CRITERIA.map(c => ({ value: c.value, label: c.label })),
            showIf: chemical
        },
        {
            id: "gamblingCriteria", step: "2 · Criteria and severity", type: "multi",
            text: "Which have been present in the past 12 months? (Tick all that apply.)",
            options: GAMBLING_CRITERIA,
            showIf: a => disorder(a) && isGambling(a)
        },
        {
            id: "maniaOnly", step: "2 · Criteria and severity", type: "choice",
            text: "Has the gambling happened only during manic episodes?",
            options: YES_NO,
            showIf: a => disorder(a) && isGambling(a)
        },
        {
            id: "continuous", step: "2 · Criteria and severity", type: "choice",
            text: "Pattern of use:",
            options: [
                { value: "continuous", label: "Daily or almost daily" },
                { value: "episodic", label: "Episodic (binges or bouts)" }
            ],
            showIf: chemical
        },
        {
            id: "remission", step: "3 · Course and setting", type: "choice",
            text: "Current status:",
            options: [
                { value: "current", label: "Current problem use" },
                { value: "early", label: "Early remission: no criteria (except craving) for 3 to 12 months" },
                { value: "sustained", label: "Sustained remission: no criteria (except craving) for 12 months or more" }
            ],
            showIf: a => disorder(a) && a.substance
        },
        {
            id: "setting", step: "3 · Course and setting", type: "multi",
            text: "Any of these? (Tick all that apply.)",
            options: [
                { value: "none", label: "None" },
                { value: "controlled", label: "In a controlled environment (e.g. prison, locked unit)" },
                { value: "maintenance", label: "On maintenance treatment (e.g. methadone, buprenorphine, nicotine replacement)" }
            ],
            showIf: chemical
        },
        {
            id: "induced", step: "4 · Induced syndromes", type: "multi",
            text: "Psychiatric symptoms that need attention in their own right? (Tick all that apply.)",
            options: [
                { value: "none", label: "None" },
                { value: "psychosis", label: "Psychosis" },
                { value: "depression", label: "Depression" },
                { value: "mania", label: "Mania" },
                { value: "anxiety", label: "Anxiety or panic" },
                { value: "cognitive", label: "Cognitive impairment" },
                { value: "sleep", label: "Sleep disturbance" }
            ],
            showIf: chemical
        },
        {
            id: "cooccurring", step: "5 · Co-occurring conditions", type: "multi",
            text: "Independent mental health conditions (present before use, or through abstinence)? (Tick all that apply.)",
            options: [
                { value: "none", label: "None known" },
                { value: "depression", label: "Depression" },
                { value: "anxiety", label: "Anxiety disorder" },
                { value: "ptsd", label: "PTSD" },
                { value: "psychosis", label: "Psychotic disorder" },
                { value: "bipolar", label: "Bipolar disorder" },
                { value: "adhd", label: "ADHD" },
                { value: "personality", label: "Personality disorder" }
            ],
            showIf: a => disorder(a) && a.substance
        }
    ];

    // Where an induced syndrome is best worked through next.
    const INDUCED_FLOW = { psychosis: "psychosis", depression: "depressed", mania: "elevated", anxiety: "anxiety", cognitive: "cognitive" };

    function evaluate(answers) {
        const a = answers || {};
        const r = newResult();
        const h = helpers(r);

        if (!a.explained) {
            r.pending.push("Start with step 0: is it a disorder?");
            return r;
        }
        if (a.explained === "none") {
            r.trail.push("Use without problems, loss of control or distress.");
            r.suggestion = h.suggest("no-disorder", "No substance use disorder");
            r.also.push("Hazardous use can still warrant brief intervention (e.g. AUDIT, ASSIST).");
            return finish(r);
        }
        const s = SUBSTANCES[a.substance];
        if (!s) {
            r.pending.push("Step 0: which substance.");
            return r;
        }
        if (a.explained === "episode") {
            r.trail.push(`A single episode involving ${s.name.toLowerCase()}, without a pattern of use.`);
            r.suggestion = h.suggest("intoxication", `${s.name} intoxication or withdrawal`);
            r.also.push(`ICD-11 can also code an episode of harmful use (${s.icd}.0) if it caused harm.`);
            h.exclude("sud");
            return finish(r);
        }
        r.trail.push(`A pattern of ${s.behaviour ? "gambling" : s.name.toLowerCase() + " use"} causing problems or distress.`);

        if (s.behaviour) return finish(evaluateGambling(a, r, h));

        // Step 1. Safety.
        const urgent = [];
        if (a.withdrawalNow === "yes") {
            r.ruleOut.withdrawal = "Possible";
            if (a.substance === "alcohol" || a.substance === "sedatives") {
                urgent.push("Withdrawal can cause seizures and delirium: monitor with a withdrawal scale (CIWA-Ar or AWS) and plan management in the right setting." +
                    (a.substance === "alcohol" ? " Thiamine before any glucose load." : " Don't stop benzodiazepines abruptly."));
            } else if (a.substance === "opioids") {
                r.also.push("Opioid withdrawal is rarely dangerous itself, but loss of tolerance afterwards raises overdose risk.");
            }
        } else if (a.withdrawalNow === "no") {
            r.ruleOut.withdrawal = "Excluded";
        }
        if (a.overdose === "yes") {
            r.ruleOut.overdose = "Possible";
            urgent.push("Overdose risk: offer naloxone and overdose education; review co-prescribed sedatives.");
        } else if (a.overdose === "no") {
            r.ruleOut.overdose = "Excluded";
        }
        if (urgent.length) r.urgent = urgent.join(" ");
        if (a.feigned === "external" || a.feigned === "unclear") h.alt("feigning");
        if (a.feigned === "no") h.exclude("feigning");

        // Step 2. Criteria. Tolerance and withdrawal don't count for a drug
        // taken as prescribed under medical supervision.
        let met = picked(a, "criteria");
        if (a.prescribed === "yes") {
            const dropped = met.filter(c => c === "tolerance" || c === "withdrawal");
            met = met.filter(c => c !== "tolerance" && c !== "withdrawal");
            if (dropped.length) r.trail.push("Tolerance and withdrawal not counted: taken as prescribed under medical supervision.");
        }
        if (!Array.isArray(a.criteria)) {
            r.pending.push("Step 2: which criteria are present.");
            return finish(r);
        }
        const n = met.length;
        if (n < 2) {
            r.trail.push(`${n} of 11 criteria: below the threshold for a use disorder.`);
            r.suggestion = h.suggest("no-disorder", `Below the threshold for ${s.name.toLowerCase()} use disorder`);
            r.also.push("If there has been harm, ICD-11 may still code a harmful pattern of use (" + s.icd + ".1).");
            h.exclude("sud");
            return finish(r);
        }
        const severity = n >= 6 ? "severe" : n >= 4 ? "moderate" : "mild";
        r.trail.push(`${n} of 11 criteria in 12 months: ${severity}.`);

        // ICD-11: dependence when two or more of the three central features
        // (impaired control, increasing precedence, physiological features).
        const group = g => CRITERIA.some(c => c.group === g && met.includes(c.value));
        const features = ["control", "precedence", "physiological"].filter(group);
        const words = { control: "impaired control", precedence: "increasing precedence", physiological: "physiological features" };
        let icd;
        if (features.length >= 2) {
            icd = `${s.icd}.2 ${s.name} dependence`;
            r.trail.push(`ICD-11 dependence features: ${features.map(f => words[f]).join(", ")}.`);
            r.also.push("ICD-11 dependence is usually evident over 12 months, or 3 months if use is daily or almost daily.");
        } else {
            icd = `${s.icd}.1 Harmful pattern of use`;
            r.also.push("ICD-11: fewer than two dependence features, so a harmful pattern of use if it has caused harm (evident over 12 months if episodic, or 1 month if continuous).");
        }

        // Step 3. Course.
        const spec = [];
        if (a.remission === "early") spec.push("in early remission");
        if (a.remission === "sustained") spec.push("in sustained remission");
        const setting = picked(a, "setting");
        if (setting.includes("controlled")) spec.push("in a controlled environment");
        if (setting.includes("maintenance")) spec.push("on maintenance therapy");
        r.suggestion = h.suggest("sud", `${s.name} use disorder, ${severity}${spec.length ? ", " + spec.join(", ") : ""} (ICD-11 ${icd})`);
        h.exclude("intoxication");
        h.exclude("no-disorder");

        // Step 4. Induced syndromes.
        const induced = picked(a, "induced");
        if (induced.length) {
            r.trail.push(`Induced symptoms needing attention: ${induced.join(", ")}.`);
            h.alt("induced");
            const next = induced.find(i => INDUCED_FLOW[i]);
            if (next) {
                r.switchTo = INDUCED_FLOW[next];
                r.also.push("Work out whether the symptoms are induced or independent with the questions for that presentation (the 1-month rule).");
            }
        }

        // Step 5. Co-occurring conditions.
        const co = picked(a, "cooccurring");
        if (co.length) {
            r.trail.push(`Co-occurring: ${co.join(", ")}.`);
            r.additional = ["independent"];
            r.also.push("Co-occurring problems are the expectation: treat both together, and don't make mental health care conditional on abstinence.");
        } else if (Array.isArray(a.cooccurring)) {
            h.exclude("independent");
        }
        if (s.depressant) {
            r.also.push("Suicide risk is higher with intoxication and co-occurring conditions: reassess when sober.");
        }
        return finish(r);
    }

    function evaluateGambling(a, r, h) {
        if (a.maniaOnly === "yes") {
            r.trail.push("Gambling only during manic episodes.");
            r.suggestion = h.suggest(null, "Gambling within manic episodes: not gambling disorder");
            r.also.push("Work the mood episodes through with the Elevated mood questions.");
            r.switchTo = "elevated";
            h.exclude("gambling");
            return r;
        }
        if (!Array.isArray(a.gamblingCriteria)) {
            r.pending.push("Step 2: which gambling criteria are present.");
            return r;
        }
        const n = picked(a, "gamblingCriteria").length;
        if (n < 4) {
            r.trail.push(`${n} of 9 criteria: below the threshold of 4.`);
            r.suggestion = h.suggest("no-disorder", "Below the threshold for gambling disorder");
            h.exclude("gambling");
            return r;
        }
        const severity = n >= 8 ? "severe" : n >= 6 ? "moderate" : "mild";
        r.trail.push(`${n} of 9 criteria in 12 months: ${severity}.`);
        const spec = a.remission === "early" ? ", in early remission" : a.remission === "sustained" ? ", in sustained remission" : "";
        r.suggestion = h.suggest("gambling", `Gambling disorder, ${severity}${spec} (ICD-11 6C50)`);
        r.also.push("Suicide risk is markedly raised, especially with debt and legal problems. Ask about family violence and financial abuse.");
        const co = picked(a, "cooccurring");
        if (co.length) {
            r.additional = ["independent"];
            r.trail.push(`Co-occurring: ${co.join(", ")}.`);
        }
        return r;
    }

    function finish(r) {
        if (r.suggestion && r.suggestion.cardId) {
            const keep = id => id !== r.suggestion.cardId && !(r.additional || []).includes(id);
            r.alternatives = r.alternatives.filter(keep);
            r.excluded = r.excluded.filter(keep);
        }
        return r;
    }

    const flows = { substance: { questions: QUESTIONS, evaluate } };
    root.REASONING_FLOWS = Object.assign(root.REASONING_FLOWS || {}, flows);
    if (typeof module !== "undefined" && module.exports) module.exports = flows;
})(typeof window !== "undefined" ? window : globalThis);
