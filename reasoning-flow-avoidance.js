/* =========================================================================
 * Guided differentials for avoidance and for psychomotor slowing. Same
 * stepwise order as the other flows. Rules are written from the DSM-5-TR
 * criteria in our own words, with ICD-11 differences noted. They suggest;
 * the clinician decides.
 *
 * Avoidance mostly works out what drives it, then hands over to the
 * presentation that covers that driver, passing its answers on (carry).
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

    /* ---------------------------------------------------------- avoidance */

    // Each driver: the card it points to, its label, the presentation that
    // works it through, and the Anxiety focus it carries over. Listed in
    // priority order: delusions and loss of drive come before fear.
    const DRIVERS = {
        delusion: { card: "psychosis", label: "Avoidance driven by delusional fear", flow: "psychosis" },
        energy: { card: "depression", label: "Avoidance from loss of energy or interest", flow: "depressed" },
        trauma: { card: "anxiety", focus: "trauma" },
        obsession: { card: "anxiety", focus: "obsessions", label: "Obsessive-compulsive disorder (ICD-11 6B20)" },
        food: { card: "eating", flow: "eating" },
        agoraphobia: { card: "anxiety", focus: "agoraphobia", label: "Agoraphobia (ICD-11 6B02)" },
        social: { card: "anxiety", focus: "social", label: "Social anxiety disorder (ICD-11 6B04)" },
        specific: { card: "anxiety", focus: "specific", label: "Specific phobia (ICD-11 6B03)" },
        separation: { card: "anxiety", focus: "separation", label: "Separation anxiety disorder (ICD-11 6B05)" },
        health: { card: "anxiety", focus: "health", label: "Illness anxiety disorder (ICD-11 6B23 Hypochondriasis)" },
        appearance: { card: "anxiety", focus: "appearance", label: "Body dysmorphic disorder (ICD-11 6B21)" },
        intimacy: { card: "sexual", label: "Sexual dysfunction (ICD-11 chapter 17)" },
        stressor: { card: "adjustment", label: "Adjustment disorder (ICD-11 6B43)" }
    };
    const ORDER = Object.keys(DRIVERS);
    const drivers = a => picked(a, "avoided").filter(d => DRIVERS[d]);
    const has = (a, d) => drivers(a).includes(d) && a.impair === "yes";

    const AVOIDANCE_QUESTIONS = [
        {
            id: "avoided", step: "0 · What is avoided, and why?", type: "multi",
            text: "Tick everything that applies. Ask what they fear would happen.",
            options: [
                { value: "agoraphobia", label: "Places where escape or help would be hard if panic-like symptoms struck (transport, crowds, out alone)" },
                { value: "social", label: "Social or performance situations, fearing scrutiny or embarrassment" },
                { value: "specific", label: "A specific object or situation (animals, heights, injections, flying)" },
                { value: "separation", label: "Being apart from people they're attached to" },
                { value: "trauma", label: "Reminders of a traumatic event" },
                { value: "obsession", label: "Things that trigger obsessions (contamination, sharp objects)" },
                { value: "health", label: "Things that might threaten their health (hospitals, sick people)" },
                { value: "appearance", label: "Being seen, because of perceived flaws in appearance" },
                { value: "delusion", label: "A delusional threat (a plot, being poisoned or watched)" },
                { value: "energy", label: "No fear: no energy, interest or motivation" },
                { value: "intimacy", label: "Sexual or intimate situations, from worry about performance or pain" },
                { value: "food", label: "Foods or eating" },
                { value: "stressor", label: "Things linked to a recent stressor" }
            ]
        },
        {
            id: "threat", step: "1 · Is it a disorder?", type: "choice",
            text: "Is the avoidance a proportionate response to a real threat (a violent partner, bullying, an unsafe place)?",
            options: YES_NO,
            showIf: a => drivers(a).length > 0
        },
        {
            id: "impair", step: "1 · Is it a disorder?", type: "choice",
            text: "Does it cause clinically significant distress or get in the way of life?",
            options: YES_NO,
            showIf: a => drivers(a).length > 0 && a.threat === "no"
        },
        {
            id: "traumaTime", step: "2 · Details", type: "choice",
            text: "Trauma: time since the event?",
            options: [
                { value: "short", label: "3 days to 1 month" },
                { value: "long", label: "More than 1 month" }
            ],
            showIf: a => has(a, "trauma")
        },
        {
            id: "socialMedical", step: "2 · Details", type: "choice",
            text: "Social: is there a medical condition that could draw attention (tremor, stuttering, disfigurement, obesity)?",
            options: [
                { value: "none", label: "No" },
                { value: "excessive", label: "Yes, but the fear is unrelated to it or clearly excessive" },
                { value: "proportionate", label: "Yes, and the worry is in proportion to it" }
            ],
            showIf: a => has(a, "social")
        },
        {
            id: "pervasive", step: "2 · Details", type: "choice",
            text: "Social: a pervasive pattern since adolescence or early adulthood, across most of life, of feeling inadequate and very sensitive to criticism?",
            options: YES_NO,
            showIf: a => has(a, "social") && a.socialMedical !== "proportionate"
        },
        {
            id: "energyContext", step: "2 · Details", type: "choice",
            text: "Loss of drive: in which context?",
            options: [
                { value: "depression", label: "Low mood or loss of interest for 2 weeks or more" },
                { value: "negative", label: "Negative symptoms of a psychotic disorder" },
                { value: "neither", label: "Neither" }
            ],
            showIf: a => has(a, "energy")
        },
        {
            id: "foodWeight", step: "2 · Details", type: "choice",
            text: "Food: is there fear of gaining weight, or a disturbed body image?",
            options: YES_NO,
            showIf: a => has(a, "food")
        },
        {
            id: "stressorRecent", step: "2 · Details", type: "choice",
            text: "Stressor: did it start within 3 months of the stressor?",
            options: YES_NO,
            showIf: a => has(a, "stressor")
        }
    ];

    function evaluateAvoidance(answers) {
        const a = answers || {};
        const r = newResult();
        r.additional = [];
        const h = helpers(r);

        const list = drivers(a);
        if (!list.length) {
            r.pending.push("Start with step 0: what is avoided, and why.");
            return r;
        }
        if (a.threat === "yes") {
            r.trail.push("Avoidance in proportion to a real threat.");
            r.ruleOut.safety = "Possible";
            r.suggestion = h.suggest("none", "No mental disorder: avoidance of a real threat");
            r.also.push("Address safety: domestic violence, bullying or an unsafe home.");
            return r;
        }
        if (a.threat !== "no") { r.pending.push("Step 1: a real threat."); return r; }
        r.ruleOut.safety = "Excluded";
        if (a.impair === "no") {
            r.trail.push("No significant distress or impairment.");
            r.suggestion = h.suggest("none", "No mental disorder: avoidance without significant distress or impairment");
            return r;
        }
        if (a.impair !== "yes") { r.pending.push("Step 1: distress or impairment."); return r; }
        r.trail.push("Clinically significant avoidance.");
        r.ruleOut.driver = "Possible";

        const found = [];
        const add = (card, label, flow) => {
            if (!found.some(f => f.card === card && f.label === label)) found.push({ card, label, flow });
        };
        const anxietyFocus = [];
        ORDER.filter(d => list.includes(d)).forEach(d => {
            const D = DRIVERS[d];
            if (d === "trauma") {
                if (!a.traumaTime) { r.pending.push("Step 2: time since the trauma."); return; }
                r.trail.push("Avoids reminders of a traumatic event.");
                add("anxiety", a.traumaTime === "long" ? "PTSD (ICD-11 6B40), if the other trauma symptoms are present" : "Acute stress disorder (ICD-11: acute stress reaction, QE84), if the other trauma symptoms are present", "anxiety");
                anxietyFocus.push("trauma");
                return;
            }
            if (d === "social") {
                if (!a.socialMedical) { r.pending.push("Step 2: medical conditions that draw attention."); return; }
                if (a.socialMedical === "proportionate") {
                    r.trail.push("Social avoidance in proportion to a medical condition.");
                    r.ruleOut.medical = "Possible";
                    return;
                }
                r.trail.push("Avoids social situations, fearing scrutiny.");
                add("anxiety", D.label, "anxiety");
                anxietyFocus.push("social");
                if (a.pervasive === "yes") {
                    r.trail.push("Pervasive since early adulthood, with feelings of inadequacy and sensitivity to criticism.");
                    add("avpd", "Avoidant personality disorder (ICD-11 6D10 personality disorder, with negative affectivity and detachment traits)");
                } else if (!a.pervasive) {
                    r.pending.push("Step 2: a pervasive lifelong pattern.");
                } else {
                    h.exclude("avpd");
                }
                return;
            }
            if (d === "energy") {
                if (!a.energyContext) { r.pending.push("Step 2: the context of the loss of drive."); return; }
                r.trail.push("Avoidance from loss of energy, interest or motivation, without fear.");
                if (a.energyContext === "depression") add("depression", "Avoidance within a depressive episode", "depressed");
                else if (a.energyContext === "negative") add("depression", "Avoidance from negative symptoms of a psychotic disorder", "psychosis");
                else add("depression", "Loss of drive without depression or psychosis: check for a medical cause, apathy or medication effects");
                return;
            }
            if (d === "food") {
                if (!a.foodWeight) { r.pending.push("Step 2: fear of weight gain."); return; }
                r.trail.push(a.foodWeight === "yes" ? "Food avoidance with fear of weight gain." : "Food avoidance without weight or shape concern.");
                add("eating", a.foodWeight === "yes" ? "Anorexia nervosa or another eating disorder" : "Avoidant/restrictive food intake disorder (ICD-11 6B83)", "eating");
                r.carry = Object.assign(r.carry || {}, { problem: a.foodWeight === "yes" ? "restrict" : "avoid" });
                return;
            }
            if (d === "stressor") {
                if (!a.stressorRecent) { r.pending.push("Step 2: timing of the stressor."); return; }
                if (a.stressorRecent === "yes") {
                    r.trail.push("Avoidance began within 3 months of a stressor.");
                    add("adjustment", D.label);
                } else {
                    add("other-anxiety", "Other specified anxiety disorder (ICD-11 6B0Y)");
                }
                return;
            }
            if (d === "delusion") r.trail.push("Avoidance driven by a delusional threat.");
            else if (d === "intimacy") r.trail.push("Avoids intimacy from worry about sexual performance or pain.");
            else r.trail.push(`Avoidance driven by fear: ${{
                obsession: "triggers of obsessions",
                agoraphobia: "panic-like symptoms where escape is hard",
                specific: "a specific object or situation",
                separation: "separation from attachment figures",
                health: "threats to health",
                appearance: "being seen, because of perceived flaws in appearance"
            }[d]}.`);
            add(D.card, D.label, D.flow || (D.focus ? "anxiety" : null));
            if (D.focus) anxietyFocus.push(D.focus);
        });

        if (!found.length) {
            if (!r.pending.length) {
                r.suggestion = h.suggest("none", "No mental disorder: avoidance in proportion to a medical condition");
            }
            return finish(r);
        }

        // An adjustment disorder only stands when nothing else explains it.
        const main = found.filter(f => f.card !== "adjustment" && f.card !== "other-anxiety");
        const results = main.length ? main : found;
        if (main.length) ["adjustment", "other-anxiety"].forEach(h.exclude);

        const first = results[0];
        r.suggestion = h.suggest(first.card, first.label, !!first.flow);
        const others = results.slice(1);
        r.additional = [...new Set(others.map(f => f.card).filter(c => c !== first.card))];
        if (others.length) {
            r.also.unshift("Also consider: " + others.map(f => f.label).join("; ") + ".");
        }
        ["anxiety", "avpd", "depression", "psychosis", "eating", "sexual"].forEach(id => {
            if (!results.some(f => f.card === id) && !r.excluded.includes(id)) h.exclude(id);
        });

        if (first.flow) {
            r.switchTo = first.flow;
            const name = { anxiety: "Anxiety", psychosis: "Psychosis", depressed: "Depressed mood", eating: "Eating or weight change" }[first.flow];
            r.also.push(`Confirm with the ${name} questions${first.flow === "anxiety" && anxietyFocus.length ? "; what they fear is passed on" : ""}.`);
            if (first.flow === "anxiety") {
                r.carry = { focus: [...new Set(anxietyFocus)], impair: "yes" };
            }
        }
        if (results.some(f => f.card === "avpd") && results.some(f => f.label === DRIVERS.social.label)) {
            r.also.push("Avoidant personality disorder and social anxiety disorder often co-occur: both can be diagnosed.");
        }
        if (results.some(f => f.card === "sexual")) {
            r.also.push("Check for a medical or medication cause of the sexual problem (SSRIs, antipsychotics, diabetes, vascular disease).");
        }
        return finish(r);
    }

    /* ------------------------------------------------------------ slowing */

    const SLOWING_SPEC = {
        subject: "the slowing",
        change: "the slowing",
        disorder: "mental disorder",
        medicalHint: "For example hypothyroidism, Parkinson's disease, stroke, subdural haematoma, normal pressure hydrocephalus, hypoglycaemia, hepatic or uraemic encephalopathy, hypercalcaemia.",
        extraTiming: null,
        induced: "Substance intoxication or withdrawal (opioids, sedatives, inhalants, stimulant crash), or substance/medication-induced depressive disorder",
        medical: "Slowing due to a medical condition (with depressive symptoms: depressive disorder due to another medical condition, ICD-11 6E62)",
        dementia: "Major or mild neurocognitive disorder (slowing is common in subcortical and vascular dementia)",
        inducedNote: "Recheck once intoxication or withdrawal has passed; if low mood persists about a month after stopping, consider an independent depressive disorder."
    };

    const slowingClinical = a => a.explained === "clinical";
    const nmsPast = a => a.nms === "no" || a.nms === "unsure";
    const notMedication = a => nmsPast(a) && a.parkinsonism === "no";
    const slowingGates = K.gateQuestions(SLOWING_SPEC).map(q => {
        const show = q.showIf;
        return Object.assign({}, q, { showIf: a => notMedication(a) && show(a) });
    });
    const step4 = a => notMedication(a) && K.primaryReachable(a);

    const SLOWING_QUESTIONS = [
        {
            id: "explained", step: "0 · Is it psychomotor slowing?", type: "choice",
            text: "Which fits best?",
            options: [
                { value: "clinical", label: "Slowing seen on examination: movement, speech, response time" },
                { value: "reported", label: "Only reported tiredness or low energy, nothing observed" }
            ]
        },
        {
            id: "nms", step: "1 · Emergency first", type: "choice",
            text: "Rigidity with fever, fast pulse, unstable blood pressure, sweating or confusion, on an antipsychotic or other dopamine blocker?",
            options: K.YES_NO_UNSURE,
            showIf: slowingClinical
        },
        {
            id: "parkinsonism", step: "1 · Emergency first", type: "choice",
            text: "Rigidity, tremor, shuffling gait or a fixed facial expression, after starting or increasing an antipsychotic, metoclopramide or another dopamine blocker?",
            options: YES_NO,
            showIf: a => slowingClinical(a) && nmsPast(a)
        }
    ].concat(slowingGates, [
        {
            id: "catatonic", step: "4 · Part of a mental disorder?", type: "choice",
            text: "Other catatonic signs: mutism, posturing, waxy flexibility, negativism, staring?",
            options: YES_NO,
            showIf: step4
        },
        {
            id: "depressed", step: "4 · Part of a mental disorder?", type: "choice",
            text: "Low mood or loss of interest for 2 weeks or more?",
            options: YES_NO,
            showIf: a => step4(a) && a.catatonic === "no"
        },
        {
            id: "psychotic", step: "4 · Part of a mental disorder?", type: "choice",
            text: "Psychotic symptoms?",
            options: [
                { value: "positive", label: "Delusions or hallucinations" },
                { value: "negative", label: "Negative symptoms of a known psychotic disorder (avolition, poverty of speech, flat affect)" },
                { value: "no", label: "No" }
            ],
            showIf: a => step4(a) && a.catatonic === "no" && a.depressed === "no"
        }
    ]);

    function evaluateSlowing(answers) {
        const a = answers || {};
        const r = newResult();
        const h = helpers(r);

        if (!a.explained) {
            r.pending.push("Start with step 0: is it psychomotor slowing?");
            return r;
        }
        if (a.explained === "reported") {
            r.trail.push("Reported tiredness without observed slowing.");
            r.suggestion = h.suggest(null, "Fatigue rather than psychomotor slowing: see the Sleep problems or Depressed mood questions");
            return r;
        }
        r.trail.push("Psychomotor slowing seen on examination.");

        if (a.nms === "yes" || a.nms === "unsure") {
            r.ruleOut.nms = a.nms === "yes" ? "Possible" : "Investigating";
            r.urgent = "Possible neuroleptic malignant syndrome: stop the antipsychotic, check temperature, pulse, BP, CK, UEC and FBC, and arrange urgent medical review.";
            if (a.nms === "yes") {
                r.trail.push("Rigidity with fever, autonomic instability or confusion on a dopamine blocker.");
                r.suggestion = h.suggest("medication", "Neuroleptic malignant syndrome (a medical emergency)");
                h.alt("catatonia");
                r.also.push("Catatonia and NMS overlap; malignant catatonia looks the same. Treat as an emergency either way.");
                return finish(r);
            }
        } else if (a.nms === "no") {
            r.ruleOut.nms = "Excluded";
        } else {
            r.pending.push("Step 1: neuroleptic malignant syndrome.");
            return r;
        }
        if (a.parkinsonism === "yes") {
            r.trail.push("Parkinsonian signs after a dopamine blocker.");
            r.ruleOut.parkinsonism = "Possible";
            r.suggestion = h.suggest("medication", "Medication-induced parkinsonism (not a mental disorder)");
            r.also.push("Reduce the dose or switch to a lower-risk antipsychotic; an anticholinergic can help short term. It is often mistaken for depression or negative symptoms.");
            return finish(r);
        }
        if (a.parkinsonism === "no") {
            r.ruleOut.parkinsonism = "Excluded";
            h.exclude("medication");
        } else {
            r.pending.push("Step 1: medication-induced parkinsonism.");
            return r;
        }

        const gate = K.evaluateGates(a, r, h, SLOWING_SPEC);
        if (a.delirium === "yes") {
            r.suggestion = h.suggest(null, "Hypoactive delirium (substance-related or due to a medical condition)");
            r.also.push("Hypoactive delirium is often mistaken for depression. Find and treat the cause.");
        }
        if (gate === "stop") return finish(r);

        if (a.catatonic === "yes") {
            r.trail.push("With other catatonic signs.");
            r.suggestion = h.suggest("catatonia", "Catatonia");
            r.also.push("Work this through with the Catatonia questions.");
            r.switchTo = "catatonia";
            return finish(r);
        }
        if (a.catatonic === "no") h.exclude("catatonia");
        else { r.pending.push("Step 4: catatonic signs."); return finish(r); }

        if (a.depressed === "yes") {
            r.trail.push("With low mood or loss of interest for 2 weeks or more.");
            r.suggestion = h.suggest("depression", "Psychomotor retardation within a depressive episode (MDD, bipolar depression or schizoaffective disorder)");
            r.also.push("Marked slowing suggests melancholic features. Check food and fluid intake; consider ECT if severe. Work this through with the Depressed mood questions.");
            r.switchTo = "depressed";
        } else if (a.depressed !== "no") {
            r.pending.push("Step 4: low mood or loss of interest.");
            return finish(r);
        } else {
            h.exclude("depression");
            if (a.psychotic === "positive" || a.psychotic === "negative") {
                r.trail.push(a.psychotic === "positive" ? "With delusions or hallucinations." : "As part of negative symptoms.");
                r.suggestion = h.suggest("psychosis", a.psychotic === "positive"
                    ? "Slowing within a psychotic disorder"
                    : "Negative symptoms of a psychotic disorder");
                r.also.push("Negative symptoms, depression and medication-induced parkinsonism look alike: check each. Work this through with the Psychosis questions.");
                r.switchTo = "psychosis";
            } else if (a.psychotic === "no") {
                h.exclude("psychosis");
                r.trail.push("Not explained by medication, substances, medical causes or another mental disorder found so far.");
                r.suggestion = h.suggest("other", "Other specified depressive disorder or unspecified catatonia: keep looking for a cause");
                if (!r.excluded.includes("medical")) h.alt("medical");
            } else {
                r.pending.push("Step 4: psychotic symptoms.");
            }
        }

        if (gate === "provisional" && r.suggestion) {
            if (r.suggestion.cardId) h.alt(r.suggestion.cardId);
            r.also.push(`If it persists once the substance is stopped: ${r.suggestion.label}.`);
            r.suggestion = h.suggest("substance-induced", SLOWING_SPEC.induced, true);
            r.switchTo = null;
        }
        if (!r.suggestion && (a.feigned === "external" || a.feigned === "internal")) {
            r.suggestion = h.suggest(null, a.feigned === "external" ? "Malingering (ICD-11 QC30)" : "Factitious disorder imposed on self (ICD-11 6D50)");
        }
        return finish(r);
    }

    const flows = {
        avoidance: { questions: AVOIDANCE_QUESTIONS, evaluate: evaluateAvoidance },
        slowing: { questions: SLOWING_QUESTIONS, evaluate: evaluateSlowing }
    };
    root.REASONING_FLOWS = Object.assign(root.REASONING_FLOWS || {}, flows);
    if (typeof module !== "undefined" && module.exports) module.exports = flows;
})(typeof window !== "undefined" ? window : globalThis);
