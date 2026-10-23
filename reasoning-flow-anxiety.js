/* =========================================================================
 * Guided differentials for anxiety and for catatonia. Same stepwise order as
 * the other flows; steps 1-3 for anxiety come from reasoning-flow-kit.js.
 * Rules are written from the DSM-5-TR criteria in our own words, with ICD-11
 * differences noted. They suggest; the clinician decides.
 *
 * Anxiety disorders often co-occur, so the anxiety flow can return more than
 * one diagnosis: the first is the suggestion, the rest go in "additional".
 * ========================================================================= */

(function (root) {
    "use strict";

    const K = root.REASONING_FLOW_KIT || require("./reasoning-flow-kit.js");
    const { YES_NO, YES_NO_UNSURE, picked, newResult, helpers } = K;

    /* ------------------------------------------------------------ anxiety */

    const ANXIETY_SPEC = {
        subject: "anxiety",
        change: "the anxiety",
        disorder: "anxiety disorder",
        medicalHint: "For example thyrotoxicosis, arrhythmia, pulmonary embolism, hypoglycaemia, asthma or COPD, phaeochromocytoma. Red flags: first panic attack over 45, syncope, chest pain, focal neurology.",
        extraTiming: null,
        induced: "Substance/medication-induced anxiety disorder (ICD-11 6C4x.71, by substance)",
        medical: "Anxiety disorder due to another medical condition (ICD-11 6E63)",
        dementia: "Major or mild neurocognitive disorder with anxiety",
        inducedNote: "Reassess about a month after stopping. Check caffeine, and alcohol used to calm nerves (it causes rebound anxiety the next morning)."
    };

    const reachable = a => a.explained === "clinical";
    // Whether the specific-disorder questions still matter.
    function anxietyReachable(a) {
        return K.primaryReachable(a) && a.akathisia !== "yes" && a.withinMood !== "yes" && a.withinPsychosis !== "yes";
    }
    const about = (a, focus) => anxietyReachable(a) && picked(a, "focus").includes(focus);
    const aboutAny = (a, list) => anxietyReachable(a) && picked(a, "focus").some(f => list.includes(f));

    const gates = K.gateQuestions(ANXIETY_SPEC);
    // Akathisia sits with the substance questions: it is a medication effect
    // that is often mistaken for anxiety.
    gates.splice(gates.findIndex(q => q.id === "delirium"), 0, {
        id: "akathisia", step: "2 · Substance or medication", type: "choice",
        text: "Inner restlessness with an urge to keep moving, after starting or increasing an antipsychotic or antidepressant?",
        options: YES_NO,
        showIf: reachable
    });

    const ANXIETY_QUESTIONS = [
        {
            id: "explained", step: "0 · Is it an anxiety disorder?", type: "choice",
            text: "Which fits best?",
            options: [
                { value: "clinical", label: "Clinically significant anxiety, fear or avoidance" },
                { value: "proportionate", label: "Anxiety in proportion to a real threat, without significant impairment" }
            ]
        }
    ].concat(gates, [
        {
            id: "withinMood", step: "4 · Part of another disorder?", type: "choice",
            text: "Does the anxiety occur only during a depressive, manic or hypomanic episode?",
            options: YES_NO,
            showIf: a => K.primaryReachable(a) && a.akathisia !== "yes"
        },
        {
            id: "withinPsychosis", step: "4 · Part of another disorder?", type: "choice",
            text: "Is the anxiety driven by delusions or hallucinations?",
            options: YES_NO,
            showIf: a => K.primaryReachable(a) && a.akathisia !== "yes" && a.withinMood !== "yes"
        },
        {
            id: "focus", step: "5 · What is the anxiety about?", type: "multi",
            text: "Tick everything that applies. Anxiety disorders often co-occur.",
            options: [
                { value: "panic", label: "Sudden attacks of intense fear that peak within minutes" },
                { value: "agoraphobia", label: "Places where escape or help would be hard (transport, crowds, being out alone)" },
                { value: "social", label: "Being judged or embarrassed in social or performance situations" },
                { value: "specific", label: "A specific object or situation (animals, heights, blood or injections, flying)" },
                { value: "worry", label: "Many everyday matters, hard to control" },
                { value: "separation", label: "Separation from people they're attached to" },
                { value: "health", label: "Having or getting a serious illness" },
                { value: "appearance", label: "Perceived flaws in appearance" },
                { value: "obsessions", label: "Intrusive unwanted thoughts, with rituals to neutralise them" },
                { value: "trauma", label: "Reminders of a traumatic event" },
                { value: "stressor", label: "A recent stressor, out of proportion" }
            ],
            showIf: anxietyReachable
        },
        {
            id: "impair", step: "5 · What is the anxiety about?", type: "choice",
            text: "Does it cause clinically significant distress or impairment?",
            options: YES_NO,
            showIf: anxietyReachable
        },
        {
            id: "panicUnexpected", step: "5 · What is the anxiety about?", type: "choice",
            text: "Panic: do at least some attacks come out of the blue (unexpected)?",
            options: YES_NO,
            showIf: a => about(a, "panic")
        },
        {
            id: "panicMonth", step: "5 · What is the anxiety about?", type: "choice",
            text: "Panic: followed by a month or more of worry about more attacks, or changes in behaviour to avoid them?",
            options: YES_NO,
            showIf: a => about(a, "panic") && a.panicUnexpected === "yes"
        },
        {
            id: "agoraTwo", step: "5 · What is the anxiety about?", type: "choice",
            text: "Agoraphobia: fear or avoidance in 2 or more of public transport, open spaces, enclosed spaces, queues or crowds, being out alone?",
            options: YES_NO,
            showIf: a => about(a, "agoraphobia")
        },
        {
            id: "worrySx", step: "5 · What is the anxiety about?", type: "choice",
            text: "Worry: with 3 or more of restlessness, tiring easily, poor concentration, irritability, muscle tension, poor sleep?",
            options: YES_NO,
            showIf: a => about(a, "worry")
        },
        {
            id: "performanceOnly", step: "5 · What is the anxiety about?", type: "choice",
            text: "Social: only when speaking or performing in public?",
            options: YES_NO,
            showIf: a => about(a, "social")
        },
        {
            id: "healthSomatic", step: "5 · What is the anxiety about?", type: "choice",
            text: "Health: are distressing physical symptoms the main focus, rather than the fear of illness itself?",
            options: YES_NO,
            showIf: a => about(a, "health")
        },
        {
            id: "months6", step: "5 · What is the anxiety about?", type: "choice",
            text: "Has it lasted 6 months or more?",
            options: YES_NO,
            showIf: a => aboutAny(a, ["agoraphobia", "social", "specific", "worry", "separation", "health"])
        },
        {
            id: "ocdTime", step: "5 · What is the anxiety about?", type: "choice",
            text: "Obsessions: do they (with any rituals) take more than an hour a day, or cause marked distress or impairment?",
            options: YES_NO,
            showIf: a => about(a, "obsessions")
        },
        {
            id: "insight", step: "5 · What is the anxiety about?", type: "choice",
            text: "Insight into the obsessional or appearance beliefs:",
            options: [
                { value: "good", label: "Good or fair" },
                { value: "poor", label: "Poor" },
                { value: "absent", label: "Absent (fully convinced)" }
            ],
            showIf: a => aboutAny(a, ["obsessions", "appearance"])
        },
        {
            id: "traumaTime", step: "5 · What is the anxiety about?", type: "choice",
            text: "Trauma: time since the event (actual or threatened death, serious injury or sexual violence)?",
            options: [
                { value: "short", label: "3 days to 1 month" },
                { value: "long", label: "More than 1 month" }
            ],
            showIf: a => about(a, "trauma")
        },
        {
            id: "traumaSx", step: "5 · What is the anxiety about?", type: "choice",
            text: "Trauma: intrusive memories or nightmares, avoidance of reminders, negative changes in mood or beliefs, and heightened arousal?",
            options: YES_NO,
            showIf: a => about(a, "trauma")
        },
        {
            id: "complex", step: "5 · What is the anxiety about?", type: "choice",
            text: "Trauma: also lasting problems with emotion control, self-worth and relationships (often after prolonged or repeated trauma)?",
            options: YES_NO,
            showIf: a => about(a, "trauma") && a.traumaTime === "long" && a.traumaSx === "yes"
        },
        {
            id: "stressorRecent", step: "5 · What is the anxiety about?", type: "choice",
            text: "Stressor: did it start within 3 months of the stressor?",
            options: YES_NO,
            showIf: a => about(a, "stressor")
        }
    ]);

    const LABELS = {
        ptsd: "Post-traumatic stress disorder (ICD-11 6B40)",
        "acute-stress": "Acute stress disorder (ICD-11: acute stress reaction, QE84, not a mental disorder)",
        ocd: "Obsessive-compulsive disorder (ICD-11 6B20)",
        bdd: "Body dysmorphic disorder (ICD-11 6B21)",
        panic: "Panic disorder (ICD-11 6B01)",
        agoraphobia: "Agoraphobia (ICD-11 6B02)",
        social: "Social anxiety disorder (ICD-11 6B04)",
        gad: "Generalised anxiety disorder (ICD-11 6B00)",
        specific: "Specific phobia (ICD-11 6B03)",
        separation: "Separation anxiety disorder (ICD-11 6B05)",
        health: "Illness anxiety disorder (ICD-11 6B23 Hypochondriasis)",
        somatic: "Somatic symptom disorder (ICD-11 6C20 Bodily distress disorder)",
        adjustment: "Adjustment disorder, with anxiety (ICD-11 6B43)",
        "other-anxiety": "Other specified anxiety disorder (ICD-11 6B0Y)"
    };

    function evaluateAnxiety(answers) {
        const a = answers || {};
        const r = newResult();
        r.additional = [];
        const h = helpers(r);

        if (!a.explained) {
            r.pending.push("Start with step 0: is it an anxiety disorder?");
            return r;
        }
        if (a.explained === "proportionate") {
            r.trail.push("Anxiety in proportion to a real threat, without significant impairment.");
            r.suggestion = h.suggest(null, "No mental disorder: understandable anxiety");
            return r;
        }
        r.trail.push("Clinically significant anxiety, fear or avoidance.");

        if (a.akathisia === "yes") {
            r.trail.push("Restlessness after starting or increasing an antipsychotic or antidepressant.");
            r.ruleOut.medication = "Possible";
            r.suggestion = h.suggest("akathisia", "Medication-induced acute akathisia (not an anxiety disorder)");
            r.also.push("Reduce or change the causative drug; giving more of it makes akathisia worse.");
            return finish(r);
        }
        if (a.akathisia === "no") h.exclude("akathisia");

        const gate = K.evaluateGates(a, r, h, ANXIETY_SPEC);
        if (gate === "stop") return finish(r);

        if (a.withinMood === "yes") {
            r.trail.push("The anxiety occurs only within mood episodes.");
            r.suggestion = h.suggest("mood", "Depressive or bipolar disorder, with anxious distress");
            r.also.push("Work this through with the mood questions.");
            r.switchTo = "depressed";
            return finish(r);
        }
        if (a.withinPsychosis === "yes") {
            r.trail.push("The anxiety is driven by delusions or hallucinations.");
            r.suggestion = h.suggest(null, "Anxiety secondary to psychotic symptoms");
            r.also.push("Work this through with the Psychosis questions.");
            r.switchTo = "psychosis";
            return finish(r);
        }

        const focus = picked(a, "focus");
        if (!focus.length) {
            r.pending.push("Step 5: what the anxiety is about.");
            return finish(r);
        }
        if (a.impair === "no") {
            r.trail.push("No clinically significant distress or impairment.");
            r.suggestion = h.suggest(null, "No mental disorder: anxiety without significant distress or impairment");
            return finish(r);
        }
        if (!a.impair) r.pending.push("Step 5: distress or impairment.");

        const met = [];
        let belowThreshold = false;
        const meet = (id, label) => met.push(h.suggest(id, label || LABELS[id]));
        const need = (id, text) => r.pending.push(`Step 5: ${text}.`);
        const months = a.months6;

        if (focus.includes("trauma")) {
            if (a.traumaSx === "yes" && a.traumaTime === "long") {
                r.trail.push("Trauma-related intrusions, avoidance, negative changes and arousal for more than a month.");
                meet("ptsd");
                h.exclude("acute-stress");
                r.also.push("ICD-11 PTSD centres on re-experiencing in the present, avoidance and a sense of current threat." +
                    (a.complex === "yes" ? " With lasting problems in emotion control, self-worth and relationships, ICD-11 complex PTSD (6B41) fits." : ""));
            } else if (a.traumaSx === "yes" && a.traumaTime === "short") {
                r.trail.push("Trauma-related symptoms within the first month.");
                meet("acute-stress");
                h.alt("ptsd");
                r.also.push("If symptoms last beyond a month, reconsider PTSD.");
            } else if (a.traumaSx === "no") {
                r.trail.push("Trauma-related symptoms below the threshold for PTSD.");
                belowThreshold = true;
                h.alt("adjustment");
            } else {
                need("ptsd", "the trauma questions");
            }
        }
        if (focus.includes("obsessions")) {
            if (a.ocdTime === "yes") {
                r.trail.push("Obsessions with rituals, time-consuming or impairing.");
                meet("ocd");
            } else if (a.ocdTime === "no") {
                belowThreshold = true;
            } else {
                need("ocd", "how much time the obsessions take");
            }
        }
        if (focus.includes("appearance")) {
            r.trail.push("Preoccupation with perceived flaws in appearance.");
            meet("bdd");
        }
        if ((focus.includes("obsessions") || focus.includes("appearance")) && a.insight === "absent") {
            r.also.push("Absent insight is recorded as a specifier ('with absent insight / delusional beliefs'), not as delusional disorder.");
        }
        if (focus.includes("panic")) {
            if (a.panicUnexpected === "no") {
                r.also.push("Panic attacks only in feared situations: add 'with panic attacks' to the main diagnosis rather than diagnosing panic disorder.");
                h.exclude("panic");
            } else if (a.panicUnexpected === "yes" && a.panicMonth === "yes") {
                r.trail.push("Recurrent unexpected panic attacks, with a month or more of worry or avoidance.");
                meet("panic");
            } else if (a.panicUnexpected === "yes" && a.panicMonth === "no") {
                r.trail.push("Unexpected panic attacks, but not yet a month of worry or behaviour change.");
                belowThreshold = true;
                h.alt("panic");
            } else {
                need("panic", "the panic questions");
            }
        }
        const timed = (id, condition, label, ok) => {
            if (!focus.includes(id)) return;
            if (months === "no" || condition === "no") {
                belowThreshold = true;
                h.alt(ok);
            } else if (months === "yes" && condition !== undefined) {
                meet(ok, label);
                r.trail.push(`${(label || LABELS[ok]).replace(/ \(ICD-11.*$/, "")}: criteria met, for 6 months or more.`);
            } else {
                need(ok, "the duration and details");
            }
        };
        timed("agoraphobia", a.agoraTwo, null, "agoraphobia");
        if (focus.includes("social")) {
            timed("social", "yes", a.performanceOnly === "yes" ? "Social anxiety disorder, performance only (ICD-11 6B04)" : null, "social");
        }
        timed("worry", a.worrySx, null, "gad");
        if (focus.includes("specific")) timed("specific", "yes", null, "specific");
        if (focus.includes("separation")) timed("separation", "yes", null, "separation");
        if (focus.includes("health")) {
            const id = a.healthSomatic === "yes" ? "somatic" : "health";
            if (a.healthSomatic === undefined) need("health", "whether bodily symptoms are the focus");
            else timed("health", "yes", null, id);
            if (a.healthSomatic !== undefined) {
                r.also.push("DSM-5-TR places illness anxiety and somatic symptom disorders together; ICD-11 places hypochondriasis (6B23) with the obsessive-compulsive related disorders.");
            }
        }

        if (met.length) {
            ["adjustment", "other-anxiety"].forEach(h.exclude);
            if (focus.some(f => ["agoraphobia", "social", "specific", "worry"].includes(f)) && months === "yes") {
                r.also.push("ICD-11 asks for 'several months' rather than a fixed 6 for these diagnoses.");
            }
            if (focus.includes("worry") && met.some(m => m.cardId === "gad")) {
                r.also.push("ICD-11 also accepts general apprehension (free-floating anxiety), not only worry.");
            }
            r.suggestion = met[0];
            r.additional = met.slice(1).map(m => m.cardId);
            if (met.length > 1) {
                r.also.unshift("Also meets criteria for: " + met.slice(1).map(m => m.label).join("; ") + ". Co-occurring anxiety disorders are each diagnosed.");
            }
        } else if (focus.includes("stressor") && a.stressorRecent === "yes") {
            r.trail.push("A response to a recent stressor, below the threshold for a specific anxiety disorder.");
            r.suggestion = h.suggest("adjustment", LABELS.adjustment);
        } else if (belowThreshold || (focus.includes("stressor") && a.stressorRecent === "no")) {
            r.trail.push("Clinically significant, but below the threshold for a specific anxiety disorder.");
            r.suggestion = h.suggest("other-anxiety", LABELS["other-anxiety"]);
        } else if (focus.includes("stressor")) {
            need("adjustment", "when it started relative to the stressor");
        }

        if (gate === "provisional") {
            if (r.suggestion && r.suggestion.cardId) {
                h.alt(r.suggestion.cardId);
                r.also.push(`If it lasts about a month or more after stopping: ${r.suggestion.label}.`);
            }
            r.suggestion = h.suggest("substance-induced", ANXIETY_SPEC.induced, true);
            r.additional = [];
        }
        if (!r.suggestion && (a.feigned === "external" || a.feigned === "internal")) {
            r.suggestion = h.suggest("feigning", a.feigned === "external" ? "Malingering (ICD-11 QC30)" : "Factitious disorder imposed on self (ICD-11 6D50)");
        }
        return finish(r);
    }

    /* ----------------------------------------------------------- catatonia */

    const SIGNS = [
        { value: "stupor", label: "Stupor (no response to surroundings)" },
        { value: "catalepsy", label: "Catalepsy (holds a posture placed by the examiner)" },
        { value: "waxy", label: "Waxy flexibility" },
        { value: "mutism", label: "Mutism" },
        { value: "negativism", label: "Negativism (opposes or doesn't respond to instructions)" },
        { value: "posturing", label: "Posturing" },
        { value: "mannerism", label: "Mannerisms" },
        { value: "stereotypy", label: "Stereotypy" },
        { value: "agitation", label: "Agitation, not from outside stimuli" },
        { value: "grimacing", label: "Grimacing" },
        { value: "echolalia", label: "Echolalia" },
        { value: "echopraxia", label: "Echopraxia" }
    ];

    const hasSigns = a => picked(a, "signs").length > 0;

    const CATATONIA_QUESTIONS = [
        {
            id: "signs", step: "0 · Is it catatonia?", type: "multi",
            text: "Which of the 12 catatonic signs are present? (Tick all that apply.)",
            hint: "Examine using the Bush-Francis Catatonia Rating Scale. Its extra signs (mitgehen, gegenhalten, ambitendency, automatic obedience, verbigeration) support catatonia but aren't in the DSM-5-TR count of 3.",
            options: SIGNS
        },
        {
            id: "danger", step: "1 · Emergency first", type: "choice",
            text: "Fever, autonomic instability (fast pulse, labile blood pressure, sweating), or rigidity with a raised CK?",
            options: YES_NO_UNSURE,
            showIf: hasSigns
        },
        {
            id: "drba", step: "1 · Emergency first", type: "choice",
            text: "Antipsychotic or other dopamine blocker started, increased, or given by injection recently?",
            options: YES_NO,
            showIf: hasSigns
        },
        {
            id: "feigned", step: "1 · Emergency first", type: "choice",
            text: "Is there evidence the signs are deliberately produced?",
            hint: "Feigned catatonia is rare. Signs that vary with attention may also point to a functional neurological disorder (see step 6).",
            options: [
                { value: "no", label: "No" }, { value: "unclear", label: "Unclear" },
                { value: "external", label: "Yes, for an external gain" },
                { value: "internal", label: "Yes, without an obvious external gain" }
            ],
            showIf: hasSigns
        },
        {
            id: "intox", step: "2 · Substance or medication", type: "choice",
            text: "Intoxication (e.g. PCP, ketamine, cannabis, hallucinogens, cocaine), or a medication linked to catatonia (e.g. steroids, disulfiram, ciprofloxacin)?",
            options: YES_NO_UNSURE,
            showIf: hasSigns
        },
        {
            id: "withdrawal", step: "2 · Substance or medication", type: "choice",
            text: "Recent stop of a benzodiazepine, clozapine or other GABA-acting drug?",
            options: YES_NO_UNSURE,
            showIf: hasSigns
        },
        {
            id: "delirium", step: "3 · Medical condition", type: "choice",
            text: "Is attention and awareness disturbed, and does it fluctuate (delirium)?",
            options: YES_NO_UNSURE,
            showIf: hasSigns
        },
        {
            id: "seizures", step: "3 · Medical condition", type: "choice",
            text: "Fluctuating responsiveness, subtle twitching, eye deviation, or a history of seizures (possible non-convulsive status epilepticus)?",
            options: YES_NO_UNSURE,
            showIf: hasSigns
        },
        {
            id: "medical", step: "3 · Medical condition", type: "choice",
            text: "A medical condition that could cause it (e.g. encephalitis including anti-NMDAR, hyponatraemia, hypercalcaemia, DKA, hepatic encephalopathy, stroke, tumour, SLE)?",
            options: [
                { value: "yes", label: "Yes" },
                { value: "flags", label: "Red flags, not yet confirmed" },
                { value: "no", label: "No" }
            ],
            showIf: hasSigns
        },
        {
            id: "context", step: "4 · Which disorder is it occurring with?", type: "choice",
            text: "Is it occurring with a mental disorder? (Collateral history helps if the person can't speak.)",
            options: [
                { value: "bipolar", label: "Bipolar disorder (mania, mixed or depression)" },
                { value: "depression", label: "Depression" },
                { value: "psychotic", label: "A psychotic disorder" },
                { value: "autism", label: "Autism" },
                { value: "other", label: "Another mental disorder" },
                { value: "none", label: "None known yet" }
            ],
            showIf: hasSigns
        },
        {
            id: "lorazepam", step: "5 · Response to treatment", type: "choice",
            text: "Lorazepam challenge:",
            options: [
                { value: "not-done", label: "Not done yet" },
                { value: "improved", label: "Clear improvement" },
                { value: "no-change", label: "No clear change" }
            ],
            showIf: hasSigns
        },
        {
            id: "mimic", step: "6 · Something else fits better?", type: "multi",
            text: "Could it fit better within any of these? (Tick any that apply.)",
            options: [
                { value: "slowing", label: "Severe depression with slowing only (no negativism, posturing or waxy flexibility)" },
                { value: "functional", label: "Signs vary with attention (functional neurological disorder)" },
                { value: "communication", label: "Selective mutism or autism communication difficulties" },
                { value: "neuro", label: "Akinetic mutism or locked-in syndrome (neurological)" }
            ],
            showIf: hasSigns
        }
    ];

    const CONTEXT = {
        bipolar: { label: "Catatonia associated with bipolar disorder (ICD-11 6A40)", switchTo: "elevated", flow: "mood" },
        depression: { label: "Catatonia associated with a depressive disorder (ICD-11 6A40)", switchTo: "depressed", flow: "mood" },
        psychotic: { label: "Catatonia associated with a psychotic disorder (ICD-11 6A40)", switchTo: "psychosis", flow: "Psychosis" },
        autism: { label: "Catatonia associated with autism (ICD-11 6A40)" },
        other: { label: "Catatonia associated with another mental disorder (ICD-11 6A40)" }
    };

    function evaluateCatatonia(answers) {
        const a = answers || {};
        const r = newResult();
        const h = helpers(r);
        const signs = picked(a, "signs");
        if (!signs.length) {
            r.pending.push("Start with step 0: which catatonic signs are present?");
            return r;
        }
        const full = signs.length >= 3;
        r.trail.push(`${signs.length} of 12 catatonic signs${full ? "" : " (3 are needed)"}.`);

        // Step 1. Emergencies come first, whatever the cause turns out to be.
        if (a.danger === "yes") {
            r.urgent = a.drba === "yes"
                ? "Fever, autonomic instability or rigidity after a dopamine blocker: treat as neuroleptic malignant syndrome or malignant catatonia, a medical emergency. Stop antipsychotics, get medical review now, check CK."
                : "Fever, autonomic instability or rigidity: possible malignant catatonia, a medical emergency. Avoid antipsychotics, get medical review now, check CK; high-dose lorazepam, and early ECT if there's no response within 24-48 hours.";
            r.ruleOut.nms = "Possible";
            r.trail.push("Fever, autonomic instability or rigidity.");
            h.alt("malignant");
        } else if (a.danger === "no") {
            r.ruleOut.nms = "Excluded";
            h.exclude("malignant");
        } else if (a.danger === "unsure") {
            r.ruleOut.nms = "Investigating";
            h.alt("malignant");
        } else {
            r.pending.push("Step 1: fever or autonomic instability.");
        }
        if (a.drba === "yes" && a.danger !== "yes") {
            r.also.push("A dopamine blocker can worsen catatonia and raises the risk of neuroleptic malignant syndrome: review it.");
            h.alt("drba");
        }
        if (a.feigned === "external" || a.feigned === "internal" || a.feigned === "unclear") h.alt("feigning");
        if (a.feigned === "no") h.exclude("feigning");

        if (!full) {
            r.trail.push("Below the threshold for catatonia.");
            if (a.drba === "yes") {
                r.suggestion = h.suggest("drba", "Medication-induced movement disorder (e.g. antipsychotic-induced parkinsonism or dystonia)");
            } else if (picked(a, "mimic").length) {
                r.suggestion = h.suggest("mimic", "Another condition may explain this better than catatonia");
            } else {
                r.suggestion = h.suggest("unspecified", "Unspecified catatonia, if clinically significant (ICD-11 6A4Z)");
                r.also.push("Fewer than 3 signs: re-examine, and repeat the Bush-Francis scale.");
            }
            return finishCatatonia(a, r, h);
        }

        // Steps 2-3. Delirium, medical and substance causes.
        if (a.delirium === "yes") {
            r.trail.push("Catatonic features during delirium are part of the delirium.");
            r.ruleOut.delirium = "Possible";
            r.suggestion = h.suggest("delirium", "Delirium, with catatonic features");
            return finishCatatonia(a, r, h);
        }
        if (a.delirium === "no") { r.ruleOut.delirium = "Excluded"; h.exclude("delirium"); }
        if (a.delirium === "unsure") r.ruleOut.delirium = "Investigating";

        if (a.seizures === "yes" || a.seizures === "unsure") {
            r.ruleOut.ncse = "Investigating";
            r.also.push("Get an EEG to exclude non-convulsive status epilepticus.");
            h.alt("medical");
        } else if (a.seizures === "no") {
            r.ruleOut.ncse = "Excluded";
        }

        if (a.medical === "yes") {
            r.trail.push("A medical condition directly explains the catatonia.");
            r.suggestion = h.suggest("medical", "Catatonic disorder due to another medical condition (ICD-11 6E69)");
            return finishCatatonia(a, r, h);
        }
        if (a.medical === "flags") {
            r.trail.push("Red flags for a medical cause: investigate before settling on a psychiatric cause.");
            r.ruleOut.encephalitis = "Investigating";
            h.alt("medical");
        } else if (a.medical === "no" && a.seizures !== "yes" && a.seizures !== "unsure") {
            h.exclude("medical");
        }

        if (a.intox === "yes" || a.withdrawal === "yes") {
            r.trail.push(a.withdrawal === "yes"
                ? "Onset after stopping a benzodiazepine, clozapine or other GABA-acting drug."
                : "Onset with intoxication or a medication linked to catatonia.");
            if (a.withdrawal === "yes") r.ruleOut.withdrawal = "Possible";
            r.suggestion = h.suggest("induced", "Catatonia induced by substances or medications (ICD-11 6A41)");
            r.also.push("DSM-5-TR has no separate category: record the intoxication, withdrawal or medication effect, with catatonia.");
            return finishCatatonia(a, r, h);
        }
        if (a.intox === "no" && a.withdrawal === "no") {
            h.exclude("induced");
            r.ruleOut.withdrawal = "Excluded";
        }

        // Step 4. Which mental disorder it occurs with.
        const ctx = CONTEXT[a.context];
        if (ctx) {
            r.trail.push("Occurring with a mental disorder.");
            r.suggestion = h.suggest("associated", ctx.label);
            r.also.push("DSM-5-TR records this as 'catatonia associated with' the disorder, coded alongside it.");
            if (ctx.switchTo) {
                r.switchTo = ctx.switchTo;
                r.also.push(`Work out the associated disorder with the ${ctx.flow} questions.`);
            }
            h.exclude("unspecified");
        } else if (a.context === "none") {
            r.trail.push("No associated mental disorder found yet.");
            r.suggestion = h.suggest("unspecified", "Unspecified catatonia: cause not yet found (ICD-11 6A4Z)");
            r.also.push("Keep looking for a cause: medical work-up (EEG, MRI, bloods, CSF if indicated) and collateral history. Mood disorders are the commonest cause.");
            h.alt("medical");
        } else {
            r.pending.push("Step 4: which disorder it is occurring with.");
        }
        return finishCatatonia(a, r, h);
    }

    function finishCatatonia(a, r, h) {
        if (a.lorazepam === "improved") {
            r.trail.push("Clear improvement with lorazepam supports catatonia.");
        } else if (a.lorazepam === "no-change") {
            r.also.push("No clear change with lorazepam doesn't rule catatonia out.");
        }
        const mimic = picked(a, "mimic");
        const words = {
            slowing: "severe depression with slowing", functional: "a functional neurological disorder",
            communication: "selective mutism or autism communication difficulties", neuro: "akinetic mutism or locked-in syndrome"
        };
        if (mimic.length) {
            r.also.push(`Consider whether ${mimic.map(m => words[m]).join(", ")} explains it better.`);
            h.alt("mimic");
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

    const flows = {
        anxiety: { questions: ANXIETY_QUESTIONS, evaluate: evaluateAnxiety },
        catatonia: { questions: CATATONIA_QUESTIONS, evaluate: evaluateCatatonia }
    };
    root.REASONING_FLOWS = Object.assign(root.REASONING_FLOWS || {}, flows);
    if (typeof module !== "undefined" && module.exports) module.exports = flows;
})(typeof window !== "undefined" ? window : globalThis);
