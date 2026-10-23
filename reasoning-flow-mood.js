/* =========================================================================
 * Guided differentials for depressed mood and for elevated or irritable mood.
 * Same stepwise order as the psychosis questions (reasoning-flow.js):
 *   0. Is it a mood disorder?   1. Feigned?   2. Substance or medication?
 *   3. Medical condition?       4. Building blocks (episodes, time)
 *   5. Specific mood disorder   6. Other conditions that fit better
 * Rules are written from the DSM-5-TR criteria in our own words, with ICD-11
 * differences noted. They suggest; the clinician decides.
 * ========================================================================= */

(function (root) {
    "use strict";

    const YES_NO = [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }];
    const YES_NO_UNSURE = [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "unsure", label: "Unsure" }];
    const picked = (a, id) => (Array.isArray(a[id]) ? a[id].filter(v => v !== "none") : []);

    const DEPRESSIVE_SYMPTOMS = [
        { value: "mood", label: "Depressed mood most of the day" },
        { value: "anhedonia", label: "Loss of interest or pleasure" },
        { value: "appetite", label: "Appetite or weight change" },
        { value: "sleep", label: "Sleeping too little or too much" },
        { value: "psychomotor", label: "Slowed or agitated (seen by others)" },
        { value: "energy", label: "Fatigue or loss of energy" },
        { value: "guilt", label: "Worthlessness or excessive guilt" },
        { value: "concentration", label: "Poor concentration or indecision" },
        { value: "death", label: "Thoughts of death or suicide" }
    ];
    const MANIC_SYMPTOMS = [
        { value: "grandiosity", label: "Inflated self-esteem or grandiosity" },
        { value: "sleep", label: "Less need for sleep" },
        { value: "talkative", label: "More talkative, or pressured speech" },
        { value: "racing", label: "Racing thoughts or flight of ideas" },
        { value: "distractible", label: "Distractibility" },
        { value: "activity", label: "More goal-directed activity, or agitation" },
        { value: "risky", label: "Risky activities (spending, sex, investments)" }
    ];

    const FEATURE_NOTES = {
        anxious: "with anxious distress (linked to higher suicide risk; ask directly)",
        melancholic: "with melancholic features",
        atypical: "with atypical features",
        peripartum: "with peripartum onset",
        seasonal: "with seasonal pattern",
        rapid: "with rapid cycling (check thyroid function, antidepressant exposure and substance use)",
        catatonia: "with catatonia (exclude neuroleptic malignant syndrome and medical causes)"
    };

    /* ----------------------------------------------- shared steps 1 to 3 */

    // Steps 1-3 are the same idea for both moods; only the wording differs.
    function gateQuestions(kind) {
        const mood = kind === "elevated" ? "elevated or irritable mood" : "low mood";
        const timing = [
            { value: "during", label: "Began during or soon after use, and hasn't outlasted it by about a month" },
            { value: "before", label: "Began before the substance use" },
            { value: "persisted", label: "Has lasted about a month or more after stopping" },
            { value: "early", label: "Too early to tell (still using, or stopped under a month ago)" }
        ];
        if (kind === "elevated") {
            timing.splice(3, 0, { value: "treatment", label: "Began on an antidepressant or ECT, and persists at full strength beyond the treatment's effect" });
        }
        const reachable = a => a.explained === "clinical";
        return [
            {
                id: "feigned", step: "1 · Feigned symptoms", type: "choice",
                text: "Is there evidence the symptoms are deliberately produced or exaggerated?",
                hint: "Clues: symptoms that don't match observed behaviour, or change with who is watching; a legal, housing, disability or drug-seeking context. Feigning can sit alongside genuine illness.",
                options: [
                    { value: "no", label: "No" }, { value: "unclear", label: "Unclear" },
                    { value: "external", label: "Yes, for an external gain" },
                    { value: "internal", label: "Yes, without an obvious external gain" }
                ],
                showIf: reachable
            },
            {
                id: "substance", step: "2 · Substance or medication", type: "choice",
                text: `Was there substance use, withdrawal, or a medication that can cause ${mood}, around the time it began?`,
                options: YES_NO_UNSURE,
                showIf: reachable
            },
            {
                id: "subTiming", step: "2 · Substance or medication", type: "choice",
                text: "Which best fits the timeline?",
                options: timing,
                showIf: a => reachable(a) && a.substance === "yes"
            },
            {
                id: "delirium", step: "3 · Medical condition", type: "choice",
                text: "Is attention and awareness disturbed, and does it fluctuate (delirium)?",
                options: YES_NO_UNSURE,
                showIf: reachable
            },
            {
                id: "cognitive", step: "3 · Medical condition", type: "choice",
                text: "Has there been a decline in memory or other thinking skills, from before the mood change?",
                options: YES_NO_UNSURE,
                showIf: a => reachable(a) && a.delirium !== "yes"
            },
            {
                id: "medical", step: "3 · Medical condition", type: "choice",
                text: `Is there a medical condition whose timing and nature could directly cause the ${mood}?`,
                hint: kind === "elevated"
                    ? "For example hyperthyroidism, Cushing's syndrome, right-sided or frontal stroke, head injury, MS, frontotemporal dementia. Red flags: first episode after about 50, neurological signs, cognitive change."
                    : "For example hypothyroidism, Cushing's or Addison's disease, stroke, Parkinson's disease, MS, sleep apnoea, cancer. A psychological reaction to an illness is not 'due to' it.",
                options: [
                    { value: "yes", label: "Yes" },
                    { value: "flags", label: "Red flags, not yet confirmed" },
                    { value: "no", label: "No" }
                ],
                showIf: a => reachable(a) && a.delirium !== "yes" && a.cognitive !== "yes"
            }
        ];
    }

    // Whether the specific-disorder questions still matter.
    function primaryReachable(a) {
        if (a.explained !== "clinical") return false;
        if (a.delirium === "yes" || a.cognitive === "yes" || a.medical === "yes") return false;
        if (a.substance === "yes" && a.subTiming === "during") return false;
        return true;
    }

    function newResult() {
        return { suggestion: null, also: [], alternatives: [], excluded: [], ruleOut: {}, trail: [], pending: [], switchTo: null };
    }

    function helpers(r) {
        return {
            alt: id => { if (!r.alternatives.includes(id)) r.alternatives.push(id); },
            exclude: id => { if (!r.excluded.includes(id)) r.excluded.push(id); },
            suggest: (cardId, label, provisional) => ({ cardId, label, provisional: !!provisional })
        };
    }

    // Steps 1-3. Returns "stop" when a substance, delirium, dementia or
    // medical cause explains the picture, "provisional" when the substance
    // question can't be settled yet, otherwise null.
    function evaluateGates(a, r, h, kind) {
        const labels = kind === "elevated"
            ? { induced: "Substance/medication-induced bipolar disorder (ICD-11 6C4x.70, by substance)",
                medical: "Bipolar and related disorder due to another medical condition (ICD-11 6E62)",
                dementia: "Major or mild neurocognitive disorder with mood symptoms" }
            : { induced: "Substance/medication-induced depressive disorder (ICD-11 6C4x.70, by substance)",
                medical: "Depressive disorder due to another medical condition (ICD-11 6E62)",
                dementia: "Major or mild neurocognitive disorder with mood symptoms" };

        if (a.feigned === "external") {
            r.also.push("Feigning for external gain suggests malingering (DSM-5-TR: a condition for clinical attention, not a mental disorder; ICD-11 QC30). It can co-exist with genuine illness.");
            r.trail.push("Evidence of feigning for external gain.");
            h.alt("feigning");
        } else if (a.feigned === "internal") {
            r.also.push("Feigning without obvious external gain suggests factitious disorder imposed on self (ICD-11 6D50).");
            r.trail.push("Evidence of feigning without obvious external gain.");
            h.alt("feigning");
        } else if (a.feigned === "unclear") {
            r.trail.push("Feigning not excluded.");
            h.alt("feigning");
        } else if (a.feigned === "no") {
            r.trail.push("No evidence of feigning.");
            h.exclude("feigning");
        } else {
            r.pending.push("Step 1: feigned symptoms.");
        }

        let state = null;
        if (a.substance === "no") {
            r.trail.push("No relevant substance or medication.");
            r.ruleOut.substance = "Excluded";
            r.ruleOut.medication = "Excluded";
            h.exclude("substance-induced");
        } else if (a.substance === "unsure") {
            r.trail.push("Substance or medication role unknown.");
            r.ruleOut.substance = "Investigating";
            h.alt("substance-induced");
        } else if (a.substance === "yes") {
            if (a.subTiming === "during") {
                r.trail.push("Began during or soon after substance or medication exposure and has not outlasted it.");
                r.ruleOut.substance = "Possible";
                r.suggestion = h.suggest("substance-induced", labels.induced);
                r.also.push("Reassess about a month after stopping. Suicide risk is high, especially early in abstinence or withdrawal.");
                state = "stop";
            } else if (a.subTiming === "before" || a.subTiming === "persisted") {
                r.trail.push(a.subTiming === "before"
                    ? "Began before the substance use, so an independent mood disorder is likely."
                    : "Has lasted about a month or more after stopping, so an independent mood disorder is likely.");
                r.ruleOut.substance = "Excluded";
                h.exclude("substance-induced");
            } else if (a.subTiming === "treatment") {
                r.trail.push("Began on an antidepressant or ECT but persists at full strength beyond its effect: this counts as a true episode.");
                r.ruleOut.medication = "Excluded";
                h.exclude("substance-induced");
            } else if (a.subTiming === "early") {
                r.trail.push("Too early to separate a substance-induced from an independent mood disorder.");
                r.ruleOut.substance = "Possible";
                state = "provisional";
            } else {
                r.pending.push("Step 2: the substance timeline.");
            }
        } else {
            r.pending.push("Step 2: substance or medication.");
        }

        if (a.delirium === "yes") {
            r.trail.push("Disturbed, fluctuating attention and awareness: the mood change belongs to the delirium.");
            r.ruleOut.delirium = "Possible";
            r.suggestion = h.suggest(null, "Delirium (substance-related or due to a medical condition)");
            return "stop";
        }
        if (a.delirium === "no") r.ruleOut.delirium = "Excluded";
        if (a.delirium === "unsure") r.ruleOut.delirium = "Investigating";
        if (!a.delirium) r.pending.push("Step 3: delirium.");

        if (a.cognitive === "yes") {
            r.trail.push("Cognitive decline predates the mood change.");
            r.ruleOut.neuro = "Investigating";
            r.suggestion = h.suggest(null, labels.dementia);
            return "stop";
        }
        if (a.medical === "yes") {
            r.trail.push("A medical condition directly explains the mood change.");
            r.suggestion = h.suggest("medical", labels.medical);
            return "stop";
        }
        if (a.medical === "flags") {
            r.trail.push("Red flags for a medical cause: investigate before settling on a primary mood disorder.");
            r.ruleOut.neuro = "Investigating";
            h.alt("medical");
        } else if (a.medical === "no") {
            r.trail.push("No medical cause identified.");
            h.exclude("medical");
        } else if (a.cognitive !== "yes") {
            r.pending.push("Step 3: a medical cause.");
        }
        return state;
    }

    // Shared ending: specifiers, other conditions, tidy-up.
    function finish(a, r, h) {
        const features = picked(a, "features").filter(f => FEATURE_NOTES[f]);
        if (features.length) r.also.push("Specifiers to record: " + features.map(f => FEATURE_NOTES[f]).join("; ") + ".");
        const other = picked(a, "otherFit");
        if (other.includes("bpd")) {
            r.also.push("Brief mood shifts over hours, triggered by relationships, fit borderline personality disorder better than a mood episode.");
            h.alt("other");
        }
        if (other.includes("adhd")) {
            r.also.push("Lifelong restlessness and distractibility that isn't episodic fits ADHD better than hypomania.");
            h.alt("other");
        }
        if (r.suggestion && r.suggestion.cardId) {
            r.alternatives = r.alternatives.filter(id => id !== r.suggestion.cardId);
            r.excluded = r.excluded.filter(id => id !== r.suggestion.cardId);
        }
        return r;
    }

    // Delusions or hallucinations outside mood episodes are a job for the
    // psychosis questions; the screen offers to switch.
    function psychosisOutside(r, h) {
        r.trail.push("Delusions or hallucinations also occur outside mood episodes.");
        r.suggestion = h.suggest("psychotic", "Psychotic symptoms outside mood episodes: schizoaffective disorder or a primary psychotic disorder");
        r.also.push("Work this through with the Psychosis questions.");
        r.switchTo = "psychosis";
    }

    /* ---------------------------------------------------- depressed mood */

    const DEPRESSED_QUESTIONS = [
        {
            id: "explained", step: "0 · Is it a mood disorder?", type: "choice",
            text: "Which fits best?",
            options: [
                { value: "clinical", label: "Clinically significant low mood or loss of interest" },
                { value: "proportionate", label: "Sadness in proportion to what is happening, without significant impairment" }
            ]
        }
    ].concat(gateQuestions("depressed"), [
        {
            id: "depSx", step: "4 · Episodes and time", type: "multi",
            text: "Which have been present most of the day, nearly every day? (Tick all that apply.)",
            options: DEPRESSIVE_SYMPTOMS,
            showIf: primaryReachable
        },
        {
            id: "twoWeeks", step: "4 · Episodes and time", type: "choice",
            text: "Have they lasted 2 weeks or more?",
            options: YES_NO,
            showIf: primaryReachable
        },
        {
            id: "impair", step: "4 · Episodes and time", type: "choice",
            text: "Do they cause clinically significant distress or impairment?",
            options: YES_NO,
            showIf: primaryReachable
        },
        {
            id: "maniaHistory", step: "4 · Episodes and time", type: "choice",
            text: "Has there ever been a period of elevated or irritable mood with increased energy?",
            hint: "Hypomania is often missed: ask family. A full episode that started on an antidepressant or ECT and lasted beyond its effect counts as hypomania or mania.",
            options: [
                { value: "none", label: "No" },
                { value: "hypomania", label: "Hypomania: 4+ days, noticed by others, no marked impairment, psychosis or admission" },
                { value: "mania", label: "Mania: 1+ week (or admitted), with marked impairment, psychosis or admission" },
                { value: "subthreshold", label: "Some manic symptoms, below these thresholds (e.g. lasting 2-3 days)" },
                { value: "treatment-only", label: "Only on an antidepressant, and it settled when the effect wore off" }
            ],
            showIf: primaryReachable
        },
        {
            id: "previous", step: "4 · Episodes and time", type: "choice",
            text: "Has there been an earlier major depressive episode, with at least 2 months well in between?",
            options: YES_NO,
            showIf: primaryReachable
        },
        {
            id: "psychosis", step: "4 · Episodes and time", type: "choice",
            text: "Delusions or hallucinations?",
            options: [
                { value: "none", label: "None" },
                { value: "during", label: "Only during mood episodes" },
                { value: "outside", label: "Also outside mood episodes" }
            ],
            showIf: primaryReachable
        },
        {
            id: "mixed", step: "4 · Episodes and time", type: "choice",
            text: "During this episode, 3 or more manic symptoms (e.g. raised mood, grandiosity, pressured speech, racing thoughts, more activity, risk-taking, less need for sleep)?",
            options: YES_NO,
            showIf: primaryReachable
        },
        {
            id: "chronic", step: "4 · Episodes and time", type: "choice",
            text: "Has low mood been present more days than not, for 2 years or more?",
            options: YES_NO,
            showIf: primaryReachable
        },
        {
            id: "persistentMDE", step: "4 · Episodes and time", type: "choice",
            text: "Have full depressive episode criteria been met throughout the past 2 years?",
            options: YES_NO,
            showIf: a => primaryReachable(a) && a.chronic === "yes"
        },
        {
            id: "swings", step: "4 · Episodes and time", type: "choice",
            text: "Over those 2 years, have there been many periods of hypomanic symptoms as well as low periods, never well for more than 2 months?",
            options: YES_NO,
            showIf: a => primaryReachable(a) && a.chronic === "yes" && a.maniaHistory === "subthreshold"
        },
        {
            id: "features", step: "4 · Episodes and time", type: "multi",
            text: "Features present (these add specifiers)",
            options: [
                { value: "none", label: "None" },
                { value: "anxious", label: "Anxious distress" },
                { value: "melancholic", label: "Melancholic (no reactivity, worse in the morning, early waking)" },
                { value: "atypical", label: "Atypical (mood reactivity, oversleeping, overeating, leaden paralysis)" },
                { value: "peripartum", label: "Onset in pregnancy or within 4 weeks after birth" },
                { value: "seasonal", label: "Seasonal pattern" },
                { value: "catatonia", label: "Catatonia (3 or more signs)" }
            ],
            showIf: primaryReachable
        },
        {
            id: "pmdd", step: "6 · Something else fits better?", type: "choice",
            text: "Does it come in the final week before menses and ease within a few days after, in most cycles over the past year?",
            options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "na", label: "Not applicable" }],
            showIf: primaryReachable
        },
        {
            id: "grief", step: "6 · Something else fits better?", type: "choice",
            text: "Has someone close to them died?",
            options: [
                { value: "no", label: "No" },
                { value: "recent", label: "Yes, under 12 months ago" },
                { value: "prolonged", label: "Yes, 12+ months ago, with intense yearning or preoccupation most days" }
            ],
            showIf: primaryReachable
        },
        {
            id: "stressor", step: "6 · Something else fits better?", type: "choice",
            text: "Did it start within 3 months of an identifiable stressor?",
            options: YES_NO,
            showIf: primaryReachable
        }
    ]);

    function evaluateDepressed(answers) {
        const a = answers || {};
        const r = newResult();
        const h = helpers(r);

        if (!a.explained) {
            r.pending.push("Start with step 0: is it a mood disorder?");
            return r;
        }
        if (a.explained === "proportionate") {
            r.trail.push("Sadness in proportion to circumstances, without significant impairment.");
            r.suggestion = h.suggest(null, "No mental disorder: understandable sadness");
            return r;
        }
        r.trail.push("Clinically significant low mood or loss of interest.");

        const gate = evaluateGates(a, r, h, "depressed");
        if (gate === "stop") return finish(a, r, h);

        // Building blocks: is there a major depressive episode now?
        const sx = picked(a, "depSx");
        const core = sx.includes("mood") || sx.includes("anhedonia");
        let mde = null;
        if (!sx.length) {
            r.pending.push("Step 4: which depressive symptoms are present.");
        } else if (!a.twoWeeks || !a.impair) {
            r.pending.push("Step 4: duration and impairment.");
        } else {
            mde = sx.length >= 5 && core && a.twoWeeks === "yes" && a.impair === "yes";
            r.trail.push(`${sx.length} of 9 depressive symptoms${core ? "" : ", without low mood or loss of interest"}` +
                (mde ? ": a full major depressive episode." : ": below the threshold for a major depressive episode."));
        }

        if (a.psychosis === "outside") {
            psychosisOutside(r, h);
            return finish(a, r, h);
        }
        const psychotic = a.psychosis === "during";
        if (psychotic) r.trail.push("Delusions or hallucinations only during mood episodes.");

        let result = null;
        // Set while a bipolar diagnosis is still possible but unsettled, so the
        // unipolar branches below don't jump ahead of it.
        let bipolarPending = false;
        const mh = a.maniaHistory;
        if (!mh) r.pending.push("Step 4: any past hypomania or mania.");

        if (mh === "mania") {
            r.trail.push("A manic episode at any time means bipolar I, whatever the current episode.");
            ["mdd", "pdd", "bipolar2", "cyclothymic"].forEach(h.exclude);
            result = h.suggest("bipolar1", `Bipolar I disorder${mde ? ", current episode depressed" : ""}${psychotic ? ", with psychotic features" : ""} (ICD-11 6A60)`);
        } else if (mh === "hypomania") {
            ["mdd", "bipolar1", "cyclothymic"].forEach(h.exclude);
            if (mde || a.previous === "yes") {
                r.trail.push("Past hypomania with a major depressive episode, never mania.");
                result = h.suggest("bipolar2", `Bipolar II disorder${mde ? ", current episode depressed" : ""}${psychotic ? ", with psychotic features" : ""} (ICD-11 6A61)`);
            } else if (mde === false && a.previous === "no") {
                r.trail.push("Hypomania, but never a major depressive episode.");
                result = h.suggest("other-bipolar", "Other specified bipolar and related disorder (hypomania without a major depressive episode) (ICD-11 6A6Y)");
            } else {
                r.pending.push("Step 4: whether there has been a major depressive episode.");
                bipolarPending = true;
            }
        } else if (mh === "subthreshold") {
            if (mde || a.previous === "yes") {
                r.trail.push("Depressive episodes with hypomanic symptoms below threshold.");
                h.alt("mdd");
                h.exclude("bipolar1");
                result = h.suggest("other-bipolar", "Other specified bipolar and related disorder (e.g. short-duration hypomania with depressive episodes) (ICD-11 6A6Y)");
            } else if (a.chronic === "yes" && a.swings === "yes") {
                r.trail.push("2 years or more of hypomanic and depressive symptoms that never reached a full episode.");
                ["mdd", "bipolar1", "bipolar2"].forEach(h.exclude);
                result = h.suggest("cyclothymic", "Cyclothymic disorder (ICD-11 6A62)");
            }
        } else if (mh === "none" || mh === "treatment-only") {
            r.trail.push(mh === "none" ? "No past hypomania or mania." : "Manic symptoms only on an antidepressant, settling as its effect wore off: not a bipolar episode.");
            ["bipolar1", "bipolar2", "cyclothymic"].forEach(h.exclude);
            if (mh === "treatment-only") h.alt("other-bipolar");
        }

        if (!result && !bipolarPending && mde === true) {
            ["adjustment", "other-depressive"].forEach(h.exclude);
            if (a.chronic === "yes") {
                const course = a.persistentMDE === "yes" ? "with persistent major depressive episode" : "with intermittent major depressive episodes";
                if (!a.persistentMDE) r.pending.push("Step 4: whether full criteria have been met throughout the 2 years.");
                r.trail.push("Low mood for 2 years or more, with a full episode now.");
                result = h.suggest("pdd", `Persistent depressive disorder, ${course}, plus major depressive disorder`);
                h.alt("mdd");
                r.also.push("DSM-5-TR records major depressive disorder as well when a full episode occurs. ICD-11 keeps dysthymic disorder (6A72) for chronic low mood without a full episode in the first 2 years; otherwise code a single episode or recurrent depressive disorder.");
            } else if (a.previous) {
                const recurrent = a.previous === "yes";
                r.trail.push(recurrent ? "An earlier episode with at least 2 months well in between." : "No earlier episode.");
                result = h.suggest("mdd", `Major depressive disorder, ${recurrent ? "recurrent" : "single episode"}${psychotic ? ", with psychotic features" : ""} (ICD-11 ${recurrent ? "6A71" : "6A70"})`);
                h.exclude("pdd");
            } else {
                r.pending.push("Step 4: whether there has been an earlier episode.");
            }
            if (a.pmdd === "yes") r.also.push("Premenstrual worsening of an ongoing depressive disorder is a premenstrual exacerbation, not PMDD.");
            if (a.grief === "recent" || a.grief === "prolonged") {
                r.also.push("Bereavement doesn't rule out a major depressive episode. Pervasive worthlessness or self-loathing points to depression; waves of yearning with self-esteem intact point to grief.");
            }
        } else if (!result && !bipolarPending && mde === false) {
            h.exclude("mdd");
            if (a.chronic === "yes") {
                r.trail.push("Low mood more days than not for 2 years or more, without a full episode now.");
                result = h.suggest("pdd", "Persistent depressive disorder, with pure dysthymic syndrome (ICD-11 6A72 Dysthymic disorder)");
            } else if (a.pmdd === "yes") {
                r.trail.push("Symptoms are tied to the premenstrual week.");
                result = h.suggest("pmdd", "Premenstrual dysphoric disorder (ICD-11 GA34.41)");
                r.also.push("Confirm with daily symptom ratings over at least two cycles.");
            } else if (a.grief === "prolonged") {
                r.trail.push("Intense grief persisting 12 months or more after the death.");
                result = h.suggest("pgd", "Prolonged grief disorder (ICD-11 6B42)");
                r.also.push("ICD-11 needs at least 6 months since the death; DSM-5-TR needs 12.");
            } else if (a.stressor === "yes") {
                r.trail.push("A response to an identifiable stressor, below the threshold for another disorder.");
                result = h.suggest("adjustment", "Adjustment disorder, with depressed mood (ICD-11 6B43)");
            } else if (a.chronic && a.stressor) {
                r.trail.push("Clinically significant, but below the threshold for a specific depressive disorder.");
                result = h.suggest("other-depressive", "Other specified depressive disorder (ICD-11 6A7Y)");
            } else {
                r.pending.push("Steps 4 and 6: chronicity and possible stressors.");
            }
        }

        if (gate === "provisional") {
            if (result && result.cardId) {
                h.alt(result.cardId);
                r.also.push(`If it lasts about a month or more after stopping: ${result.label}.`);
            }
            result = h.suggest("substance-induced", "Substance/medication-induced depressive disorder (ICD-11 6C4x.70, by substance)", true);
        }
        r.suggestion = result || r.suggestion;
        if (a.mixed === "yes" && result) {
            r.also.push("With mixed features (3 or more manic symptoms): higher risk of bipolar disorder and suicide; review any antidepressant.");
        }
        if (!r.suggestion && (a.feigned === "external" || a.feigned === "internal")) {
            r.suggestion = h.suggest("feigning", a.feigned === "external" ? "Malingering (ICD-11 QC30)" : "Factitious disorder imposed on self (ICD-11 6D50)");
        }
        return finish(a, r, h);
    }

    /* ------------------------------------------- elevated or irritable mood */

    const ELEVATED_QUESTIONS = [
        {
            id: "explained", step: "0 · Is it a mood disorder?", type: "choice",
            text: "Which fits best?",
            options: [
                { value: "clinical", label: "A distinct change: elevated, expansive or irritable mood beyond the person's usual self" },
                { value: "proportionate", label: "Happiness or excitement in proportion to what is happening" }
            ]
        }
    ].concat(gateQuestions("elevated"), [
        {
            id: "moodType", step: "4 · Episodes and time", type: "choice",
            text: "Is the mood elevated or expansive, or only irritable?",
            options: [
                { value: "elevated", label: "Elevated or expansive (with or without irritability)" },
                { value: "irritable", label: "Only irritable" }
            ],
            showIf: primaryReachable
        },
        {
            id: "energy", step: "4 · Episodes and time", type: "choice",
            text: "Has activity or energy been persistently increased as well?",
            options: YES_NO,
            showIf: primaryReachable
        },
        {
            id: "manSx", step: "4 · Episodes and time", type: "multi",
            text: "Which are present? (Tick all that apply.)",
            options: MANIC_SYMPTOMS,
            showIf: primaryReachable
        },
        {
            id: "duration", step: "4 · Episodes and time", type: "choice",
            text: "How long has the episode lasted?",
            options: [
                { value: "lt4d", label: "Under 4 days" },
                { value: "4-6d", label: "4 to 6 days" },
                { value: "1w+", label: "1 week or more" },
                { value: "admitted", label: "Admitted to hospital (any duration)" }
            ],
            showIf: primaryReachable
        },
        {
            id: "severe", step: "4 · Episodes and time", type: "choice",
            text: "Marked impairment, admission needed to prevent harm, or psychotic features?",
            options: YES_NO,
            showIf: primaryReachable
        },
        {
            id: "psychosis", step: "4 · Episodes and time", type: "choice",
            text: "Delusions or hallucinations?",
            options: [
                { value: "none", label: "None" },
                { value: "during", label: "Only during mood episodes" },
                { value: "outside", label: "Also outside mood episodes" }
            ],
            showIf: a => primaryReachable(a) && a.severe === "yes"
        },
        {
            id: "previous", step: "4 · Episodes and time", type: "choice",
            text: "Has there ever been a major depressive episode?",
            options: YES_NO,
            showIf: primaryReachable
        },
        {
            id: "mixed", step: "4 · Episodes and time", type: "choice",
            text: "During this episode, 3 or more depressive symptoms?",
            options: YES_NO,
            showIf: primaryReachable
        },
        {
            id: "chronic", step: "4 · Episodes and time", type: "choice",
            text: "For 2 years or more, many periods of hypomanic and depressive symptoms that never met full criteria, never well for more than 2 months?",
            options: YES_NO,
            showIf: primaryReachable
        },
        {
            id: "features", step: "4 · Episodes and time", type: "multi",
            text: "Features present (these add specifiers)",
            options: [
                { value: "none", label: "None" },
                { value: "anxious", label: "Anxious distress" },
                { value: "rapid", label: "Rapid cycling (4+ episodes in 12 months)" },
                { value: "peripartum", label: "Onset in pregnancy or within 4 weeks after birth" },
                { value: "seasonal", label: "Seasonal pattern" },
                { value: "catatonia", label: "Catatonia (3 or more signs)" }
            ],
            showIf: primaryReachable
        },
        {
            id: "otherFit", step: "6 · Something else fits better?", type: "multi",
            text: "Could it fit better within any of these? (Tick any that apply.)",
            options: [
                { value: "bpd", label: "Mood shifts over hours, triggered by relationships (borderline personality disorder)" },
                { value: "adhd", label: "Lifelong restlessness and distractibility, not episodic (ADHD)" }
            ],
            showIf: primaryReachable
        }
    ]);

    function evaluateElevated(answers) {
        const a = answers || {};
        const r = newResult();
        const h = helpers(r);

        if (!a.explained) {
            r.pending.push("Start with step 0: is it a mood disorder?");
            return r;
        }
        if (a.explained === "proportionate") {
            r.trail.push("Happiness or excitement in proportion to circumstances.");
            r.suggestion = h.suggest(null, "No mental disorder: understandable elation");
            return r;
        }
        r.trail.push("A distinct change to elevated, expansive or irritable mood.");

        const gate = evaluateGates(a, r, h, "elevated");
        if (gate === "stop") return finish(a, r, h);

        if (a.psychosis === "outside") {
            psychosisOutside(r, h);
            return finish(a, r, h);
        }

        const sx = picked(a, "manSx");
        const needed = a.moodType === "irritable" ? 4 : 3;
        let result = null;
        if (!a.moodType || !a.energy) r.pending.push("Step 4: mood type and energy.");
        if (!sx.length) r.pending.push("Step 4: which manic symptoms are present.");
        if (!a.duration || !a.severe) r.pending.push("Step 4: duration and severity.");

        if (a.moodType && a.energy && sx.length && a.duration && a.severe) {
            const full = sx.length >= needed && a.energy === "yes";
            r.trail.push(`${sx.length} manic symptoms (${needed} needed${a.moodType === "irritable" ? ", as the mood is only irritable" : ""})` +
                (a.energy === "yes" ? ", with increased energy." : ", but energy isn't increased."));
            const longEnough = a.duration === "1w+" || a.duration === "admitted";
            const psychotic = a.psychosis === "during";
            if (psychotic) r.trail.push("Delusions or hallucinations only during mood episodes.");

            if (full && longEnough && a.severe === "yes") {
                r.trail.push("Lasting a week or more (or admitted), with marked impairment, admission or psychosis: a manic episode.");
                ["bipolar2", "cyclothymic", "other-bipolar"].forEach(h.exclude);
                result = h.suggest("bipolar1", `Bipolar I disorder, current episode manic${psychotic ? ", with psychotic features" : ""} (ICD-11 6A60)`);
            } else if (full && a.duration !== "lt4d" && a.severe === "no") {
                r.trail.push("Lasting 4 days or more, noticeable but without marked impairment, admission or psychosis: a hypomanic episode.");
                h.exclude("bipolar1");
                h.exclude("cyclothymic");
                if (a.previous === "yes") {
                    result = h.suggest("bipolar2", "Bipolar II disorder, current episode hypomanic (ICD-11 6A61)");
                } else if (a.previous === "no") {
                    result = h.suggest("other-bipolar", "Other specified bipolar and related disorder (hypomania without a major depressive episode) (ICD-11 6A6Y)");
                    r.also.push("If a major depressive episode follows, this becomes bipolar II.");
                } else {
                    r.pending.push("Step 4: whether there has ever been a major depressive episode.");
                }
                r.also.push("ICD-11 hypomania needs 'several days' rather than a fixed 4.");
            } else if (full && a.duration === "4-6d" && a.severe === "yes") {
                r.trail.push("Severe features, but under a week and not admitted.");
                result = h.suggest("other-bipolar", "Other specified bipolar and related disorder (ICD-11 6A6Y)");
                h.alt("bipolar1");
                r.also.push("If it continues to a week, or admission is needed, it meets criteria for a manic episode.");
            } else if (full && a.duration === "lt4d") {
                r.trail.push("Full symptoms, but under 4 days.");
                result = h.suggest("other-bipolar", "Other specified bipolar and related disorder (short-duration hypomania) (ICD-11 6A6Y)");
                h.alt("bipolar2");
            } else if (a.chronic === "yes" && a.previous === "no") {
                r.trail.push("2 years or more of hypomanic and depressive symptoms that never reached a full episode.");
                ["bipolar1", "bipolar2"].forEach(h.exclude);
                result = h.suggest("cyclothymic", "Cyclothymic disorder (ICD-11 6A62)");
            } else if (picked(a, "otherFit").length) {
                r.trail.push("Below the threshold for a hypomanic episode, and another condition may fit better.");
                result = h.suggest("other", "Borderline personality disorder or ADHD may explain this better than a mood disorder");
                h.alt("other-bipolar");
            } else {
                r.trail.push("Below the threshold for a hypomanic episode.");
                result = h.suggest("other-bipolar", "Other specified or unspecified bipolar and related disorder (ICD-11 6A6Y)");
            }
            if (a.mixed === "yes" && result) {
                r.also.push("With mixed features (DSM-5-TR). ICD-11 instead has a separate mixed episode type, for prominent manic and depressive symptoms together or alternating rapidly.");
            }
        }

        if (gate === "provisional") {
            if (result && result.cardId) {
                h.alt(result.cardId);
                r.also.push(`If it lasts about a month or more after stopping: ${result.label}.`);
            }
            result = h.suggest("substance-induced", "Substance/medication-induced bipolar disorder (ICD-11 6C4x.70, by substance)", true);
        }
        r.suggestion = result || r.suggestion;
        if (!r.suggestion && (a.feigned === "external" || a.feigned === "internal")) {
            r.suggestion = h.suggest("feigning", a.feigned === "external" ? "Malingering (ICD-11 QC30)" : "Factitious disorder imposed on self (ICD-11 6D50)");
        }
        return finish(a, r, h);
    }

    const flows = {
        depressed: { questions: DEPRESSED_QUESTIONS, evaluate: evaluateDepressed },
        elevated: { questions: ELEVATED_QUESTIONS, evaluate: evaluateElevated }
    };
    root.REASONING_FLOWS = Object.assign(root.REASONING_FLOWS || {}, flows);
    if (typeof module !== "undefined" && module.exports) module.exports = flows;
})(typeof window !== "undefined" ? window : globalThis);
