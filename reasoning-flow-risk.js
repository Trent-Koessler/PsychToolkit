/* =========================================================================
 * Guided differential for suicidal, self-harm or aggressive behaviour: what
 * is driving it, not how likely it is to happen again (that is the job of
 * the suicide risk formulation, which never rates risk). Order:
 *   0. What behaviour?   1. Immediate safety, feigning
 *   2. Intoxication or withdrawal   3. Delirium or medical cause
 *   4. Drivers (often more than one)   5. Function and recording
 * Rules are written from the DSM-5-TR criteria in our own words, with ICD-11
 * differences noted. They suggest; the clinician decides.
 * ========================================================================= */

(function (root) {
    "use strict";

    const K = root.REASONING_FLOW_KIT || require("./reasoning-flow-kit.js");
    const { YES_NO, YES_NO_UNSURE, picked, newResult, helpers } = K;

    const hasBehaviour = a => picked(a, "behaviour").length > 0;
    const did = (a, b) => picked(a, "behaviour").includes(b);
    function driversReachable(a) {
        return hasBehaviour(a) && a.delirium !== "yes" && a.medical !== "yes";
    }

    const QUESTIONS = [
        {
            id: "behaviour", step: "0 · What behaviour?", type: "multi",
            text: "Which apply? (Tick all that apply.)",
            options: [
                { value: "suicidal", label: "Suicidal thoughts or behaviour (some intent to die)" },
                { value: "nssi", label: "Self-injury without intent to die" },
                { value: "aggression", label: "Aggression or violence towards others" }
            ]
        },
        {
            id: "danger", step: "1 · Immediate safety", type: "choice",
            text: "Immediate danger: ongoing intent with access to means, an interrupted attempt, a weapon, or active violence?",
            options: YES_NO,
            showIf: hasBehaviour
        },
        {
            id: "feigned", step: "1 · Immediate safety", type: "choice",
            text: "Is there evidence the behaviour or symptoms are deliberately produced for a gain (e.g. housing, avoiding charges, drugs)?",
            hint: "Even then, take self-harm seriously: feigning and genuine risk can co-exist.",
            options: [
                { value: "no", label: "No" }, { value: "unclear", label: "Unclear" },
                { value: "external", label: "Yes, for an external gain" },
                { value: "internal", label: "Yes, without an obvious external gain" }
            ],
            showIf: hasBehaviour
        },
        {
            id: "intoxicated", step: "2 · Intoxication or withdrawal", type: "choice",
            text: "Intoxicated or withdrawing at the time?",
            options: YES_NO_UNSURE,
            showIf: hasBehaviour
        },
        {
            id: "sud", step: "2 · Intoxication or withdrawal", type: "choice",
            text: "Is there a pattern of problem substance use?",
            options: YES_NO_UNSURE,
            showIf: hasBehaviour
        },
        {
            id: "delirium", step: "3 · Delirium or medical cause", type: "choice",
            text: "Fluctuating attention and awareness (delirium)?",
            options: YES_NO_UNSURE,
            showIf: hasBehaviour
        },
        {
            id: "medical", step: "3 · Delirium or medical cause", type: "choice",
            text: "A medical cause: hypoglycaemia, hypoxia, sepsis, head injury, hyperthermia with agitation, pain, or a change from usual personality after brain injury or cognitive decline?",
            hint: "Check a BGL in everyone. A first episode of aggression with no psychiatric history is medical until proven otherwise.",
            options: [
                { value: "yes", label: "Yes" },
                { value: "flags", label: "Red flags, not yet confirmed" },
                { value: "no", label: "No" }
            ],
            showIf: a => hasBehaviour(a) && a.delirium !== "yes"
        },
        {
            id: "akathisia", step: "3 · Delirium or medical cause", type: "choice",
            text: "Restlessness after starting or increasing an antipsychotic or antidepressant (akathisia)?",
            options: YES_NO,
            showIf: driversReachable
        },
        {
            id: "drivers", step: "4 · What is driving it?", type: "multi",
            text: "Tick everything that contributes. More than one is common.",
            options: [
                { value: "psychotic", label: "Command hallucinations, or persecutory or nihilistic delusions" },
                { value: "depression", label: "A depressive episode (hopelessness, guilt, insomnia)" },
                { value: "mania", label: "A manic, hypomanic or mixed episode" },
                { value: "ptsd", label: "Trauma: re-experiencing, hyperarousal, reckless behaviour" },
                { value: "bpd", label: "Long-standing unstable relationships, self-image and emotions, with impulsivity" },
                { value: "aspd", label: "Long-standing disregard for others' rights, with conduct problems before 15" },
                { value: "ied", label: "Recurrent impulsive outbursts out of proportion to provocation" },
                { value: "neurodevelopmental", label: "Autism, intellectual disability or ADHD (e.g. when overwhelmed or unable to communicate)" },
                { value: "bfrb", label: "Hair-pulling or skin-picking" },
                { value: "stressor", label: "A response to a recent stressor" },
                { value: "instrumental", label: "Planned, instrumental aggression for gain or revenge, without a mental disorder" }
            ],
            showIf: driversReachable
        },
        {
            id: "functions", step: "5 · Function and recording", type: "multi",
            text: "Self-harm: what does it do for the person? (Tick any that apply.)",
            options: [
                { value: "relief", label: "Relief from overwhelming feelings" },
                { value: "punish", label: "Self-punishment" },
                { value: "communicate", label: "Communicating distress" },
                { value: "dissociation", label: "Ending numbness or dissociation" }
            ],
            showIf: a => driversReachable(a) && did(a, "nssi")
        }
    ];

    const DRIVER_LABELS = {
        psychotic: "Psychotic symptoms driving the behaviour",
        depression: "Depressive episode",
        mania: "Manic, hypomanic or mixed episode",
        ptsd: "Post-traumatic stress disorder (ICD-11 6B40)",
        bpd: "Borderline personality disorder (ICD-11: personality disorder with borderline pattern, 6D11.5)",
        aspd: "Antisocial personality disorder (ICD-11: personality disorder with dissociality, 6D11.2)",
        ied: "Intermittent explosive disorder (ICD-11 6C73)",
        neurodevelopmental: "Neurodevelopmental condition (autism, intellectual disability or ADHD)",
        bfrb: "Body-focused repetitive behaviour (trichotillomania or skin-picking)",
        stressor: "Adjustment disorder (ICD-11 6B43)"
    };
    const DRIVER_CARD = { stressor: "adjustment" };
    // Presentations with their own guided questions.
    const DRIVER_FLOW = { psychotic: "psychosis", depression: "depressed", mania: "elevated" };
    const FUNCTION_WORDS = {
        relief: "relief from overwhelming feelings", punish: "self-punishment",
        communicate: "communicating distress", dissociation: "ending numbness or dissociation"
    };

    function evaluate(answers) {
        const a = answers || {};
        const r = newResult();
        r.additional = [];
        const h = helpers(r);
        const behaviour = picked(a, "behaviour");
        if (!behaviour.length) {
            r.pending.push("Start with step 0: which behaviour?");
            return r;
        }
        const words = { suicidal: "suicidal thoughts or behaviour", nssi: "self-injury without intent to die", aggression: "aggression towards others" };
        r.trail.push(`Behaviour: ${behaviour.map(b => words[b]).join("; ")}.`);
        if (behaviour.includes("suicidal") || behaviour.includes("nssi")) {
            r.also.push("Complete the Suicide risk formulation below as well: it describes why this person, why now and what helps, without a risk rating.");
        }

        // Step 1. Safety.
        if (a.danger === "yes") {
            r.urgent = behaviour.includes("aggression")
                ? "Immediate danger: safety first. Call for help early, keep an exit, remove weapons; de-escalate, then consider medication by the local protocol. Check a BGL."
                : "Immediate danger: the person doesn't leave unaccompanied while this is unresolved. Remove access to means; consider the Mental Health Act if risk is driven by treatable illness and they can't engage voluntarily.";
            r.ruleOut.danger = "Possible";
        } else if (a.danger === "no") {
            r.ruleOut.danger = "Excluded";
        }
        if (a.feigned === "external" || a.feigned === "internal" || a.feigned === "unclear") h.alt("feigning");
        if (a.feigned === "no") h.exclude("feigning");

        // Step 2. Substances: a contributor and a reason to reassess, rarely the
        // whole story.
        if (a.intoxicated === "yes") {
            r.trail.push("Intoxicated or withdrawing at the time.");
            r.ruleOut.substance = "Possible";
            r.also.push("Intoxication turns ideation into action and adds lethality: reassess when sober. Intoxicated statements are neither dismissible nor definitive.");
        } else if (a.intoxicated === "no") {
            r.ruleOut.substance = "Excluded";
        }
        const substanceDriver = a.intoxicated === "yes" || a.sud === "yes";
        if (a.sud === "yes") r.trail.push("A pattern of problem substance use.");

        // Step 3. Delirium and medical causes come first.
        if (a.delirium === "yes") {
            r.trail.push("Fluctuating attention and awareness.");
            r.ruleOut.delirium = "Possible";
            r.suggestion = h.suggest("medical", "Delirium (ICD-11 6D70): find and treat the cause");
            return finish(r);
        }
        if (a.delirium === "no") r.ruleOut.delirium = "Excluded";
        if (a.medical === "yes") {
            r.trail.push("A medical cause explains the behaviour.");
            r.ruleOut.medical = "Possible";
            r.suggestion = h.suggest("medical", "Behaviour due to a medical condition (e.g. personality change after brain injury, hypoglycaemia, toxicity)");
            return finish(r);
        }
        if (a.medical === "flags") {
            r.ruleOut.medical = "Investigating";
            h.alt("medical");
        } else if (a.medical === "no") {
            r.ruleOut.medical = "Excluded";
            h.exclude("medical");
        }
        if (a.akathisia === "yes") {
            r.trail.push("Restlessness after an antipsychotic or antidepressant change.");
            r.ruleOut.akathisia = "Possible";
            r.also.push("Akathisia drives agitation and is linked to suicidal and aggressive behaviour: reduce or change the causative drug.");
        } else if (a.akathisia === "no") {
            r.ruleOut.akathisia = "Excluded";
        }

        // Step 4. Drivers.
        const drivers = picked(a, "drivers");
        let cards = [];
        drivers.filter(d => DRIVER_LABELS[d]).forEach(d => cards.push(h.suggest(DRIVER_CARD[d] || d, DRIVER_LABELS[d])));
        if (substanceDriver) cards.push(h.suggest("substance", a.sud === "yes" ? "Substance use disorder" : "Intoxication or withdrawal"));
        // Adjustment disorder only applies when no other disorder explains it.
        if (cards.length > 1 && cards.some(c => c.cardId === "adjustment")) {
            cards = cards.filter(c => c.cardId !== "adjustment");
            h.exclude("adjustment");
            r.also.push("Adjustment disorder only applies if no other disorder explains the behaviour; the stressor is still part of the formulation.");
        }

        if (drivers.includes("instrumental") && !cards.length) {
            r.trail.push("Planned, instrumental aggression without a mental disorder.");
            r.suggestion = h.suggest("none", "No mental disorder: adult antisocial behaviour");
            r.also.push("Make sure a mental disorder has been excluded with collateral history, especially antisocial personality disorder.");
        } else if (cards.length) {
            r.trail.push(`Driven by: ${cards.map(c => c.label.replace(/ \(ICD-11.*\)$/, "")).join("; ")}.`);
            r.suggestion = cards[0];
            r.additional = cards.slice(1).map(c => c.cardId);
            if (cards.length > 1) r.also.unshift("Also contributing: " + cards.slice(1).map(c => c.label).join("; ") + ".");
            const next = drivers.find(d => DRIVER_FLOW[d]) || (substanceDriver ? "substance" : null);
            if (next) {
                r.switchTo = DRIVER_FLOW[next] || "substance";
            }
            if (drivers.includes("bpd") || drivers.includes("aspd")) {
                r.also.push("ICD-11 codes personality disorder by severity (mild, moderate, severe) with trait qualifiers, not by type.");
            }
        } else if (Array.isArray(a.drivers)) {
            r.trail.push("No driver identified yet.");
            r.suggestion = h.suggest("none", "No mental disorder identified yet");
            r.also.push("Get collateral history, and reassess when any intoxication has cleared.");
        } else {
            r.pending.push("Step 4: what is driving the behaviour.");
        }

        // Step 5. Function and recording.
        const functions = picked(a, "functions");
        if (functions.length) {
            r.trail.push(`Self-harm function: ${functions.map(f => FUNCTION_WORDS[f]).join(", ")}.`);
            r.also.push("Different functions need different responses: record the function, not only the act.");
        }
        const record = [];
        if (behaviour.includes("suicidal")) record.push("current suicidal behaviour");
        if (behaviour.includes("nssi")) record.push("current non-suicidal self-injury");
        if (record.length) r.also.push(`DSM-5-TR also records ${record.join(" and ")} as ${record.length > 1 ? "conditions" : "a condition"} for clinical attention, alongside the diagnoses.`);

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

    const flows = { risk: { questions: QUESTIONS, evaluate } };
    root.REASONING_FLOWS = Object.assign(root.REASONING_FLOWS || {}, flows);
    if (typeof module !== "undefined" && module.exports) module.exports = flows;
})(typeof window !== "undefined" ? window : globalThis);
