/* =========================================================================
 * Guided differential for cognitive impairment. Order:
 *   0. Is it decline?   1. Delirium and emergencies first, feigning
 *   2. Substance or medication   3. Depression or another mental disorder
 *   4. Mild or major   5. Cause(s)   6. Behavioural and psychological symptoms
 * Rules are written from the DSM-5-TR criteria in our own words, with ICD-11
 * differences noted. Several causes can contribute, so the result can list
 * more than one ("additional"). They suggest; the clinician decides.
 * ========================================================================= */

(function (root) {
    "use strict";

    const K = root.REASONING_FLOW_KIT || require("./reasoning-flow-kit.js");
    const { YES_NO, YES_NO_UNSURE, picked, newResult, helpers } = K;

    const decline = a => a.explained === "decline";
    // The specific-cause questions only matter once delirium, an acute
    // substance effect, depression and dissociation are out of the way.
    function causeReachable(a) {
        if (!decline(a)) return false;
        if (a.delirium === "yes" || a.wernicke === "yes" || a.depression === "yes" || a.dissociative === "yes") return false;
        if (a.substance === "yes" && a.subTiming === "acute") return false;
        return true;
    }

    const QUESTIONS = [
        {
            id: "explained", step: "0 · Is it cognitive decline?", type: "choice",
            text: "Which fits best?",
            options: [
                { value: "decline", label: "Decline from a previous level, noticed by the person, family or clinician" },
                { value: "lifelong", label: "Lifelong difficulties, without decline" },
                { value: "subjective", label: "Subjective concern only, with normal testing and function" },
                { value: "normal", label: "In keeping with normal ageing (slower, but testing and function normal)" }
            ]
        },
        {
            id: "delirium", step: "1 · Delirium and emergencies first", type: "choice",
            text: "Acute onset (hours to days), with fluctuating attention and awareness (delirium)?",
            hint: "Hypoactive delirium is often missed. Delirium commonly sits on top of dementia.",
            options: YES_NO_UNSURE,
            showIf: decline
        },
        {
            id: "wernicke", step: "1 · Delirium and emergencies first", type: "choice",
            text: "Heavy alcohol use or malnutrition, with confusion, unsteadiness or eye signs (nystagmus, gaze palsy)?",
            options: YES_NO,
            showIf: decline
        },
        {
            id: "rapid", step: "1 · Delirium and emergencies first", type: "choice",
            text: "Rapid decline over weeks to a few months?",
            options: YES_NO,
            showIf: decline
        },
        {
            id: "feigned", step: "1 · Delirium and emergencies first", type: "choice",
            text: "Is there evidence the deficits are deliberately produced or exaggerated?",
            hint: "Clues: worse than severe dementia on simple tasks, inconsistent with everyday function, failed performance validity tests, a legal or compensation context.",
            options: [
                { value: "no", label: "No" }, { value: "unclear", label: "Unclear" },
                { value: "external", label: "Yes, for an external gain" },
                { value: "internal", label: "Yes, without an obvious external gain" }
            ],
            showIf: decline
        },
        {
            id: "substance", step: "2 · Substance or medication", type: "choice",
            text: "Heavy alcohol use, sedatives or benzodiazepines, anticholinergic medicines, opioids, or other drugs that affect cognition?",
            options: YES_NO_UNSURE,
            showIf: a => decline(a) && a.delirium !== "yes" && a.wernicke !== "yes"
        },
        {
            id: "subTiming", step: "2 · Substance or medication", type: "choice",
            text: "Which best fits?",
            options: [
                { value: "acute", label: "Only while intoxicated, withdrawing or on the drug; improves when stopped" },
                { value: "persists", label: "Persists well beyond intoxication and withdrawal (e.g. after months of abstinence)" },
                { value: "early", label: "Too early to tell" }
            ],
            showIf: a => decline(a) && a.delirium !== "yes" && a.wernicke !== "yes" && a.substance === "yes"
        },
        {
            id: "amnestic", step: "2 · Substance or medication", type: "choice",
            text: "Mainly unable to learn new information, often with confabulation, other thinking relatively spared?",
            options: YES_NO,
            showIf: a => causeReachable(a) && a.substance === "yes" && a.subTiming === "persists"
        },
        {
            id: "depression", step: "3 · Depression or another mental disorder", type: "choice",
            text: "Did the cognitive complaints start with a depressive episode (abrupt onset, low mood first, 'don't know' answers, complains of memory loss)?",
            options: YES_NO,
            showIf: a => decline(a) && a.delirium !== "yes" && a.wernicke !== "yes"
        },
        {
            id: "dissociative", step: "3 · Depression or another mental disorder", type: "choice",
            text: "Gaps in personal memory, usually around trauma or stress, with learning of new information intact?",
            options: YES_NO,
            showIf: a => decline(a) && a.delirium !== "yes" && a.wernicke !== "yes" && a.depression !== "yes"
        },
        {
            id: "independence", step: "4 · Mild or major", type: "choice",
            text: "Do the deficits interfere with independence in everyday activities (needs help with bills, medications)?",
            options: YES_NO,
            showIf: causeReachable
        },
        {
            id: "testing", step: "4 · Mild or major", type: "choice",
            text: "On standardised testing (e.g. MoCA, ACE-III, neuropsychology), the decline is:",
            hint: "Adjust for age, education, language and hearing or vision; use KICA-Cog for Aboriginal and Torres Strait Islander people where appropriate.",
            options: [
                { value: "substantial", label: "Substantial" },
                { value: "modest", label: "Modest" },
                { value: "normal", label: "Within normal limits" },
                { value: "not-done", label: "Not tested yet" }
            ],
            showIf: causeReachable
        },
        {
            id: "domains", step: "4 · Mild or major", type: "multi",
            text: "Which domains are affected? (Tick all that apply.)",
            options: [
                { value: "attention", label: "Complex attention" },
                { value: "executive", label: "Executive function" },
                { value: "memory", label: "Learning and memory" },
                { value: "language", label: "Language" },
                { value: "perceptual", label: "Perceptual-motor (visuospatial)" },
                { value: "social", label: "Social cognition" }
            ],
            showIf: causeReachable
        },
        {
            id: "course", step: "5 · Cause", type: "choice",
            text: "Onset and course:",
            options: [
                { value: "gradual", label: "Insidious onset, gradual progression" },
                { value: "stepwise", label: "Stepwise, or starting with a stroke" },
                { value: "injury", label: "Straight after a head injury" },
                { value: "other", label: "Other or unclear" }
            ],
            showIf: causeReachable
        },
        {
            id: "features", step: "5 · Cause", type: "multi",
            text: "Which features fit? (Tick all that apply.)",
            options: [
                { value: "memory-first", label: "Early, prominent memory loss (rapid forgetting, repeated questions)" },
                { value: "vascular", label: "Strokes, focal signs or imaging evidence of vascular disease" },
                { value: "ftd-behaviour", label: "Early disinhibition, apathy, loss of empathy, compulsions or dietary change" },
                { value: "ftd-language", label: "Early, prominent language decline" },
                { value: "parkinson", label: "Parkinson's disease diagnosed at least a year before the decline" },
                { value: "nph", label: "Early gait disturbance and urinary incontinence" },
                { value: "huntington", label: "Chorea, or family history of Huntington's disease" },
                { value: "infection", label: "HIV, syphilis or another infection" },
                { value: "prion", label: "Rapid decline with myoclonus or ataxia" },
                { value: "medical", label: "Another medical cause (e.g. B12 deficiency, hypothyroidism)" }
            ],
            showIf: causeReachable
        },
        {
            id: "lewy", step: "5 · Cause", type: "multi",
            text: "Lewy body features (tick any present):",
            options: [
                { value: "none", label: "None" },
                { value: "fluctuation", label: "Fluctuating attention and alertness" },
                { value: "hallucinations", label: "Recurrent, well-formed visual hallucinations" },
                { value: "parkinsonism", label: "Parkinsonism starting after the cognitive decline" },
                { value: "rbd", label: "REM sleep behaviour disorder (acting out dreams)" },
                { value: "sensitivity", label: "Severe sensitivity to antipsychotics" }
            ],
            showIf: causeReachable
        },
        {
            id: "young", step: "5 · Cause", type: "choice",
            text: "Did it start before age 65?",
            options: YES_NO,
            showIf: causeReachable
        },
        {
            id: "bpsd", step: "6 · Behavioural and psychological symptoms", type: "multi",
            text: "Any of these? (Tick all that apply.)",
            options: [
                { value: "none", label: "None" },
                { value: "psychosis", label: "Psychotic symptoms" },
                { value: "mood", label: "Low mood" },
                { value: "anxiety", label: "Anxiety" },
                { value: "apathy", label: "Apathy" },
                { value: "agitation", label: "Agitation or aggression" },
                { value: "disinhibition", label: "Disinhibition" },
                { value: "wandering", label: "Wandering" }
            ],
            showIf: causeReachable
        }
    ];

    // Cause cards, with the ICD-11 code used when the disorder is major.
    const CAUSES = {
        alzheimers: { name: "Alzheimer's disease", icd: "6D80" },
        vascular: { name: "vascular disease", icd: "6D81", vascular: true },
        lewy: { name: "Lewy bodies", icd: "6D82", with: true },
        ftd: { name: "frontotemporal lobar degeneration", icd: "6D83", frontotemporal: true },
        parkinson: { name: "Parkinson's disease", icd: "6D85" },
        tbi: { name: "traumatic brain injury", icd: "6D85" },
        alcohol: { name: "alcohol or other substances", icd: "6D84", induced: true }
    };
    const OTHER_MEDICAL = {
        nph: "normal pressure hydrocephalus",
        huntington: "Huntington's disease",
        infection: "HIV or another infection",
        prion: "prion disease",
        medical: "another medical condition"
    };

    function causeLabel(id, severity, detail) {
        const sev = severity === "mild" ? "Mild" : severity === "major" ? "Major" : "Major or mild";
        const c = CAUSES[id];
        const code = severity === "mild" ? "6D71" : c.icd;
        let name;
        if (c.induced) name = `${sev} substance/medication-induced neurocognitive disorder`;
        else if (c.vascular) name = `${sev} vascular neurocognitive disorder`;
        else if (c.frontotemporal) name = `${sev} frontotemporal neurocognitive disorder`;
        else if (c.with) name = `${sev} neurocognitive disorder with Lewy bodies`;
        else name = `${sev} neurocognitive disorder due to ${c.name}`;
        return `${name}${detail ? ` (${detail})` : ""} (ICD-11 ${code})`;
    }

    function evaluate(answers) {
        const a = answers || {};
        const r = newResult();
        r.additional = [];
        const h = helpers(r);

        if (!a.explained) {
            r.pending.push("Start with step 0: is it decline?");
            return r;
        }
        if (a.explained === "lifelong") {
            r.trail.push("Lifelong difficulties, without decline from a previous level.");
            r.suggestion = h.suggest("idd", "Intellectual developmental disorder (ICD-11 6A00), not a neurocognitive disorder");
            r.also.push("If there has also been a decline (e.g. Alzheimer's disease in Down syndrome), add the neurocognitive disorder.");
            return finish(r);
        }
        if (a.explained === "subjective" || a.explained === "normal") {
            r.trail.push(a.explained === "normal" ? "Changes in keeping with normal ageing." : "Subjective concern only, with normal testing and function.");
            r.suggestion = h.suggest("normal", a.explained === "normal"
                ? "No disorder: age-related cognitive decline"
                : "No disorder on current testing: subjective cognitive decline");
            r.also.push("Look for depression, anxiety, poor sleep and medication effects, and retest over time.");
            return finish(r);
        }
        r.trail.push("Decline from a previous level.");

        // Step 1. Emergencies first.
        const urgent = [];
        if (a.wernicke === "yes") urgent.push("Possible Wernicke encephalopathy: give parenteral thiamine now (before any glucose load, but never withhold glucose in hypoglycaemia) and check magnesium.");
        if (a.rapid === "yes") urgent.push("Rapidly progressive decline: refer urgently (autoimmune encephalitis, prion disease, malignancy, HIV, neurosyphilis).");
        if (urgent.length) r.urgent = urgent.join(" ");

        if (a.feigned === "external" || a.feigned === "internal" || a.feigned === "unclear") {
            r.trail.push(a.feigned === "unclear" ? "Feigning not excluded." : "Evidence of feigned deficits.");
            h.alt("feigning");
            if (a.feigned !== "unclear") r.also.push("Feigned deficits can co-exist with genuine impairment; performance validity testing helps.");
        } else if (a.feigned === "no") {
            h.exclude("feigning");
        }

        if (a.delirium === "yes") {
            r.trail.push("Acute onset with fluctuating attention and awareness.");
            r.ruleOut.delirium = "Possible";
            r.suggestion = h.suggest("delirium", "Delirium (ICD-11 6D70)");
            r.also.push("Find and treat the cause. Delirium often sits on top of dementia: reassess cognition once it has cleared.");
            return finish(r);
        }
        if (a.delirium === "no") { r.ruleOut.delirium = "Excluded"; h.exclude("delirium"); }
        if (a.delirium === "unsure") r.ruleOut.delirium = "Investigating";
        if (!a.delirium) r.pending.push("Step 1: delirium.");

        if (a.wernicke === "yes") {
            r.trail.push("Heavy alcohol use or malnutrition, with confusion, unsteadiness or eye signs.");
            r.ruleOut.wernicke = "Possible";
            r.suggestion = h.suggest("alcohol", "Possible Wernicke encephalopathy");
            r.also.push("Reassess cognition after treatment: Korsakoff syndrome may emerge as the confusion clears.");
            return finish(r);
        }
        if (a.wernicke === "no") r.ruleOut.wernicke = "Excluded";
        if (a.rapid === "yes") {
            r.trail.push("Rapid decline over weeks to months.");
            h.alt("other-medical");
        }

        // Step 2. Substance or medication.
        let substanceCause = false;
        let provisional = false;
        if (a.substance === "yes") {
            if (a.subTiming === "acute") {
                r.trail.push("Cognitive effects only while the substance or medication is acting.");
                r.ruleOut.medication = "Possible";
                r.suggestion = h.suggest("medication", "Intoxication, withdrawal or medication effect: reassess once it has cleared");
                return finish(r);
            } else if (a.subTiming === "persists") {
                r.trail.push("Deficits persist well beyond intoxication and withdrawal.");
                substanceCause = true;
            } else if (a.subTiming === "early") {
                r.trail.push("Too early to separate a substance effect from another cause.");
                provisional = true;
            } else {
                r.pending.push("Step 2: the substance timeline.");
            }
        } else if (a.substance === "no") {
            r.ruleOut.medication = "Excluded";
            ["alcohol", "medication"].forEach(h.exclude);
        } else if (a.substance === "unsure") {
            r.ruleOut.medication = "Investigating";
            h.alt("medication");
        } else {
            r.pending.push("Step 2: substances and medications.");
        }

        // Step 3. Depression or dissociation.
        if (a.depression === "yes") {
            r.trail.push("The cognitive complaints started with a depressive episode.");
            r.ruleOut.depression = "Possible";
            r.suggestion = h.suggest("depression", "Cognitive impairment due to depression");
            r.also.push("A risk marker for later dementia, not only a mimic: retest cognition after the depression is treated.");
            r.also.push("Work the depression through with the Depressed mood questions.");
            r.switchTo = "depressed";
            return finish(r);
        }
        if (a.depression === "no") { r.ruleOut.depression = "Excluded"; h.exclude("depression"); }
        if (a.dissociative === "yes") {
            r.trail.push("Gaps in personal memory around trauma or stress, with new learning intact.");
            r.suggestion = h.suggest("dissociative", "Dissociative amnesia, or amnesia within PTSD");
            return finish(r);
        }
        if (a.dissociative === "no") h.exclude("dissociative");

        // Step 4. Mild or major.
        let severity = null;
        if (a.independence === "yes") severity = "major";
        else if (a.independence === "no") severity = "mild";
        else r.pending.push("Step 4: independence in everyday activities.");
        if (severity) {
            r.trail.push(severity === "major"
                ? "Deficits interfere with independence in everyday activities: major (dementia)."
                : "Independence preserved (perhaps with extra effort): mild.");
        }
        if (a.testing === "normal" && severity === "mild") {
            r.trail.push("Testing is within normal limits.");
            r.suggestion = h.suggest("normal", "No disorder on current testing: subjective cognitive decline");
            r.also.push("Mild neurocognitive disorder needs objective evidence of decline. Retest over time, or refer for neuropsychology.");
            return finish(r);
        }
        if (a.testing === "not-done") r.also.push("Confirm with standardised testing, adjusted for age, education, language and sensory impairment.");

        // Step 5. Cause or causes.
        const domains = picked(a, "domains");
        const f = picked(a, "features");
        const lewy = picked(a, "lewy");
        const core = ["fluctuation", "hallucinations", "parkinsonism"].filter(x => lewy.includes(x)).length;
        const suggestive = ["rbd", "sensitivity"].filter(x => lewy.includes(x)).length;
        const lewyLevel = (core >= 2 || (core >= 1 && suggestive >= 1)) ? "probable" : (core === 1 || suggestive >= 1) ? "possible" : null;

        const causes = [];
        if (substanceCause) {
            causes.push({ id: "alcohol", detail: a.amnestic === "yes" ? "amnestic-confabulatory type, e.g. Korsakoff syndrome" : null });
            if (a.amnestic === "yes") r.also.push("ICD-11 can code an amnestic disorder due to psychoactive substances (6D72) when memory is affected out of proportion.");
            r.also.push("Cognition can improve over months of abstinence and nutrition: don't finalise placement on a short assessment.");
        }
        if (f.includes("vascular") || a.course === "stepwise") causes.push({ id: "vascular" });
        // The 1-year rule: established Parkinson's disease first means Parkinson's
        // disease dementia, where hallucinations and fluctuation are common too.
        if (lewyLevel && !f.includes("parkinson")) causes.push({ id: "lewy", detail: lewyLevel });
        if (f.includes("ftd-behaviour") || f.includes("ftd-language")) {
            const variant = f.includes("ftd-behaviour") && f.includes("ftd-language") ? "behavioural and language variants"
                : f.includes("ftd-behaviour") ? "behavioural variant" : "language variant";
            causes.push({ id: "ftd", detail: variant });
        }
        if (f.includes("parkinson")) causes.push({ id: "parkinson" });
        if (a.course === "injury") causes.push({ id: "tbi" });
        const otherMedical = Object.keys(OTHER_MEDICAL).filter(k => f.includes(k));
        if (f.includes("memory-first") && a.course === "gradual") {
            // Probable Alzheimer's (major): memory plus another domain, steadily
            // progressive, and no sign of another contributing cause.
            const clean = !causes.length && !otherMedical.length;
            const probable = severity === "major" && clean && domains.includes("memory") && domains.length >= 2;
            causes.unshift({ id: "alzheimers", detail: probable ? "probable" : "possible" });
        }

        if (f.includes("parkinson") && lewyLevel) {
            r.also.push("The 1-year rule: Parkinson's disease more than a year before the decline means Parkinson's disease dementia, even with hallucinations or fluctuation. Parkinsonism within a year of the decline, or after it, points to Lewy body disease.");
        }
        if (lewyLevel || f.includes("parkinson")) r.also.push("Lewy bodies: severe antipsychotic sensitivity, so avoid antipsychotics where possible. The 2017 consortium criteria also count REM sleep behaviour disorder as a core feature.");
        if (a.young === "yes") r.also.push("Young onset: involve neurology, and consider frontotemporal and genetic causes.");

        if (!severity && !causes.length && !otherMedical.length) {
            r.pending.push("Steps 4 and 5: severity and features.");
        } else if (causes.length + otherMedical.length === 0) {
            if (a.course || f.length || lewy.length) {
                r.trail.push("Clear decline, but no cause identified yet.");
                r.suggestion = h.suggest("unspecified", `${severity === "mild" ? "Mild" : "Major"} neurocognitive disorder, cause not yet known`);
                r.also.push("Outstanding work-up: imaging, bloods, neuropsychology or specialist review.");
            } else {
                r.pending.push("Step 5: onset, course and features.");
            }
        } else {
            const cards = causes.map(c => h.suggest(c.id, causeLabel(c.id, severity, c.detail)));
            if (otherMedical.length) {
                const sev = severity === "mild" ? "Mild" : severity === "major" ? "Major" : "Major or mild";
                cards.push(h.suggest("other-medical", `${sev} neurocognitive disorder due to ${otherMedical.map(k => OTHER_MEDICAL[k]).join(", ")} (ICD-11 ${severity === "mild" ? "6D71" : "6D85"})`));
            }
            const why = {
                alzheimers: "Early, prominent memory loss with gradual progression.",
                vascular: "Vascular features or a stepwise course.",
                lewy: `Lewy body features: ${core} core, ${suggestive} suggestive (${lewyLevel}).`,
                ftd: "Early change in behaviour or language.",
                parkinson: "Parkinson's disease established at least a year before the decline.",
                tbi: "Decline straight after a head injury.",
                alcohol: "Persisting effects of alcohol or other substances."
            };
            causes.forEach(c => r.trail.push(why[c.id]));
            if (otherMedical.length) r.trail.push(`Features of ${otherMedical.map(k => OTHER_MEDICAL[k]).join(", ")}.`);
            if (cards.length > 1) r.trail.push("More than one cause appears to contribute.");
            if (cards.length > 1) {
                r.suggestion = h.suggest("multiple", `${severity === "mild" ? "Mild" : "Major"} neurocognitive disorder due to multiple causes`);
                r.additional = cards.map(c => c.cardId);
                r.also.unshift("Contributing: " + cards.map(c => c.label).join("; ") + ".");
            } else {
                r.suggestion = cards[0];
            }
            h.exclude("unspecified");
        }

        if (severity === "major") r.also.push("ICD-11 calls major neurocognitive disorder dementia (6D8x) and also codes the underlying disease from the neurology chapter.");

        // Step 6. Behavioural and psychological symptoms.
        const bpsd = picked(a, "bpsd");
        if (bpsd.length && r.suggestion) {
            r.also.push("With behavioural disturbance (DSM-5-TR specifier). ICD-11 adds 6D86 codes, e.g. 6D86.0 psychotic symptoms in dementia. Look for pain, constipation, boredom and communication problems before medicating.");
        }

        if (provisional) {
            if (r.suggestion && r.suggestion.cardId) {
                h.alt(r.suggestion.cardId);
                r.also.push(`If deficits persist well after stopping: ${r.suggestion.label}.`);
            }
            r.suggestion = h.suggest("alcohol", "Substance/medication-induced neurocognitive disorder", true);
            r.additional = [];
        }
        if (!r.suggestion && (a.feigned === "external" || a.feigned === "internal")) {
            r.suggestion = h.suggest("feigning", a.feigned === "external" ? "Malingering (ICD-11 QC30)" : "Factitious disorder imposed on self (ICD-11 6D50)");
        }
        return finish(r);
    }

    function finish(r) {
        if (r.suggestion && r.suggestion.cardId) {
            const keep = id => id !== r.suggestion.cardId && !(r.additional || []).includes(id);
            r.alternatives = r.alternatives.filter(keep);
            r.excluded = r.excluded.filter(keep);
        }
        return r;
    }

    const flows = { cognitive: { questions: QUESTIONS, evaluate } };
    root.REASONING_FLOWS = Object.assign(root.REASONING_FLOWS || {}, flows);
    if (typeof module !== "undefined" && module.exports) module.exports = flows;
})(typeof window !== "undefined" ? window : globalThis);
