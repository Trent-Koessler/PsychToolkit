/* =========================================================================
 * Guided differentials for distractibility (adults and children), behaviour
 * problems and school difficulties in children and adolescents, and speech
 * disturbance. Same stepwise order as the other flows. Rules are written
 * from the DSM-5-TR criteria in our own words, with ICD-11 differences
 * noted. They suggest; the clinician decides.
 *
 * Behaviour and school problems often have more than one cause, so those
 * flows collect every match: the first is the suggestion, the rest go in
 * "additional".
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

    // Steps 1-3 without the feigning question, for presentations where it
    // doesn't apply (behaviour, speech).
    function gatesWithoutFeigning(spec) {
        return K.gateQuestions(spec).filter(q => q.id !== "feigned");
    }
    function evaluateGatesWithoutFeigning(a, r, h, spec) {
        const gate = K.evaluateGates(Object.assign({}, a, { feigned: "no" }), r, h, spec);
        r.trail = r.trail.filter(t => t !== "No evidence of feigning.");
        r.excluded = r.excluded.filter(id => id !== "feigning");
        return gate;
    }

    // Collects matches in order; the first becomes the suggestion and hands
    // over to its flow.
    function settle(r, h, found, flowNames) {
        if (!found.length) return;
        const first = found[0];
        r.suggestion = h.suggest(first.card, first.label, !!first.provisional);
        r.additional = [...new Set(found.slice(1).map(f => f.card).filter(c => c && c !== first.card))];
        if (found.length > 1) r.also.unshift("Also consider: " + found.slice(1).map(f => f.label).join("; ") + ".");
        const next = found.find(f => f.flow);
        if (next) {
            r.switchTo = next.flow;
            r.also.push(next === first
                ? `Work this through with the ${flowNames[next.flow]} questions.`
                : `Work out ${next.label.replace(/ \(ICD-11.*$/, "")} with the ${flowNames[next.flow]} questions.`);
            if (next.carry) r.carry = next.carry;
        }
    }
    const FLOW_NAMES = {
        attention: "Distractibility", elevated: "Elevated mood", depressed: "Depressed mood", psychosis: "Psychosis",
        anxiety: "Anxiety", catatonia: "Catatonia", behaviour: "Behaviour problems", substance: "Substance use", slowing: "Psychomotor slowing"
    };

    /* ---------------------------------------------------------- attention */

    const ATTENTION_SPEC = {
        subject: "the inattention",
        change: "the attention problems",
        disorder: "attention disorder",
        medicalHint: "For example hearing or vision problems, thyroid disease, iron deficiency, sleep apnoea, absence seizures, head injury.",
        extraTiming: null,
        induced: "Substance intoxication or withdrawal, or a medication effect",
        medical: "Attention problems due to a medical condition (e.g. head injury, thyroid disease, seizures)",
        dementia: "Major or mild neurocognitive disorder",
        inducedNote: "Reassess after a period of abstinence: stimulants, cannabis and alcohol all impair attention."
    };
    const attentionGates = K.gateQuestions(ATTENTION_SPEC);
    attentionGates[0] = Object.assign({}, attentionGates[0], {
        hint: "Clues: requests for stimulants, symptoms that don't fit observed function or collateral history, an academic or legal context. Feigning can sit alongside genuine ADHD."
    });

    const attentionStep4 = [
        ["mania", a => a.mania === "no"],
        ["depression", a => a.depression === "no"],
        ["psychotic", a => a.psychotic === "no"],
        ["trauma", a => a.trauma === "no"],
        ["worry", a => a.worry === "no"]
    ];
    const attentionAfter = id => a => {
        if (!K.primaryReachable(a)) return false;
        for (const [qid, ok] of attentionStep4) {
            if (qid === id) return true;
            if (!ok(a)) return false;
        }
        return true;
    };
    const adhdAsked = attentionAfter("criteria");
    const COUNT = [
        { value: "few", label: "Fewer than 5" },
        { value: "5", label: "5" },
        { value: "6", label: "6 or more" }
    ];

    const ATTENTION_QUESTIONS = [
        {
            id: "explained", step: "0 · Is it a problem?", type: "choice",
            text: "Which fits best?",
            options: [
                { value: "clinical", label: "Persistent difficulty concentrating or easily distracted, causing problems" },
                { value: "normal", label: "Within the normal range for age and situation" }
            ]
        }
    ].concat(attentionGates, [
        {
            id: "mania", step: "4 · Part of another disorder?", type: "choice",
            text: "Distinct episodes of elevated or irritable mood with increased energy?",
            hint: "ADHD is lifelong and steady; mania is episodic, a change from the person's usual self.",
            options: YES_NO,
            showIf: attentionAfter("mania")
        },
        {
            id: "depression", step: "4 · Part of another disorder?", type: "choice",
            text: "Concentration problems only during depressive episodes?",
            options: YES_NO,
            showIf: attentionAfter("depression")
        },
        {
            id: "psychotic", step: "4 · Part of another disorder?", type: "choice",
            text: "With delusions or hallucinations?",
            options: YES_NO,
            showIf: attentionAfter("psychotic")
        },
        {
            id: "trauma", step: "4 · Part of another disorder?", type: "choice",
            text: "Began after a traumatic event, with intrusions, avoidance and arousal?",
            options: [
                { value: "long", label: "Yes, for more than a month" },
                { value: "short", label: "Yes, from 3 days to a month after" },
                { value: "no", label: "No" }
            ],
            showIf: attentionAfter("trauma")
        },
        {
            id: "worry", step: "4 · Part of another disorder?", type: "choice",
            text: "Mostly because of excessive worry about many things, for 6 months or more?",
            options: YES_NO,
            showIf: attentionAfter("worry")
        },
        {
            id: "sleepPoor", step: "5 · ADHD?", type: "choice",
            text: "Is sleep short or poor (shift work, insomnia, snoring or witnessed apnoeas)?",
            options: YES_NO,
            showIf: adhdAsked
        },
        {
            id: "age17", step: "5 · ADHD?", type: "choice",
            text: "Aged 17 or older? (Adults need 5 symptoms in a domain; children 6.)",
            options: YES_NO,
            showIf: adhdAsked
        },
        {
            id: "inattention", step: "5 · ADHD?", type: "choice",
            text: "Inattention symptoms: careless mistakes, trouble sustaining attention, doesn't seem to listen, doesn't finish tasks, disorganised, avoids sustained mental effort, loses things, easily distracted, forgetful. How many?",
            options: COUNT,
            showIf: adhdAsked
        },
        {
            id: "hyperactivity", step: "5 · ADHD?", type: "choice",
            text: "Hyperactivity-impulsivity: fidgets, leaves seat, runs or climbs (restless in adults), can't do leisure quietly, 'on the go', talks a lot, blurts out, can't wait turn, interrupts. How many?",
            options: COUNT,
            showIf: adhdAsked
        },
        {
            id: "before12", step: "5 · ADHD?", type: "choice",
            text: "Several symptoms before age 12?",
            options: [
                { value: "yes", label: "Yes, with collateral (school reports, a parent)" },
                { value: "self", label: "Self-report only, no collateral yet" },
                { value: "no", label: "No: it began later" }
            ],
            showIf: adhdAsked
        },
        {
            id: "settings", step: "5 · ADHD?", type: "choice",
            text: "In 2 or more settings (home, work or school, social)?",
            options: YES_NO,
            showIf: adhdAsked
        },
        {
            id: "impairment", step: "5 · ADHD?", type: "choice",
            text: "Clear interference with work, study, relationships or daily life, for 6 months or more?",
            options: YES_NO,
            showIf: adhdAsked
        },
        {
            id: "autismFeatures", step: "5 · ADHD?", type: "choice",
            text: "Also social communication difficulties with restricted or repetitive behaviours?",
            options: YES_NO,
            showIf: adhdAsked
        }
    ]);

    const PRESENTATION = {
        combined: "ADHD, combined presentation (ICD-11 6A05.2)",
        inattentive: "ADHD, predominantly inattentive presentation (ICD-11 6A05.0)",
        hyperactive: "ADHD, predominantly hyperactive/impulsive presentation (ICD-11 6A05.1)"
    };

    function evaluateAttention(answers) {
        const a = answers || {};
        const r = newResult();
        r.additional = [];
        const h = helpers(r);

        if (!a.explained) { r.pending.push("Start with step 0: is it a problem?"); return r; }
        if (a.explained === "normal") {
            r.trail.push("Within the normal range for age and situation.");
            r.suggestion = h.suggest("none", "No mental disorder: normal distractibility");
            return r;
        }
        r.trail.push("Persistent, impairing difficulty with attention.");

        const gate = K.evaluateGates(a, r, h, ATTENTION_SPEC);
        if (gate === "stop") return finish(r);

        const route = (cond, card, label, flow, trail) => {
            if (!cond) return false;
            r.trail.push(trail);
            r.suggestion = h.suggest(card, label);
            if (flow) { r.switchTo = flow; r.also.push(`Work this through with the ${FLOW_NAMES[flow]} questions.`); }
            return true;
        };
        if (route(a.mania === "yes", "mood", "Distractibility within manic or hypomanic episodes", "elevated", "Distractibility with episodes of elevated or irritable mood.")) return provisional(a, r, h, gate);
        if (a.mania === "no") r.ruleOut.mood = "Excluded";
        if (route(a.depression === "yes", "mood", "Poor concentration within depressive episodes", "depressed", "Concentration problems only during depressive episodes.")) return provisional(a, r, h, gate);
        if (route(a.psychotic === "yes", "psychosis", "Attention problems within a psychotic disorder", "psychosis", "With delusions or hallucinations.")) return provisional(a, r, h, gate);
        if (route(a.trauma === "long" || a.trauma === "short", "trauma", a.trauma === "long" ? "PTSD (ICD-11 6B40)" : "Acute stress disorder (ICD-11: acute stress reaction, QE84)", "anxiety", "Began after a traumatic event, with intrusions, avoidance and arousal.")) return provisional(a, r, h, gate);
        if (route(a.worry === "yes", "anxiety", "Generalised anxiety disorder (ICD-11 6B00)", "anxiety", "Concentration problems driven by excessive worry.")) {
            r.carry = { focus: ["worry"] };
            return provisional(a, r, h, gate);
        }
        for (const [qid, ok] of attentionStep4) {
            if (!ok(a)) { r.pending.push("Step 4: other mental disorders."); return finish(r); }
        }
        ["mood", "psychosis", "trauma", "anxiety"].forEach(h.exclude);

        // Step 5. ADHD.
        if (a.sleepPoor === "yes") {
            h.alt("sleep");
            r.also.push("Poor or short sleep impairs attention: treat it and reassess before diagnosing ADHD.");
        } else if (a.sleepPoor === "no") {
            h.exclude("sleep");
        }
        const need = ["age17", "inattention", "hyperactivity", "before12", "settings", "impairment"];
        if (need.some(id => !a[id])) { r.pending.push("Step 5: the ADHD criteria."); return provisional(a, r, h, gate); }
        if (a.impairment === "no") {
            r.trail.push("No clear impairment.");
            r.suggestion = h.suggest("none", "No mental disorder: attention difficulties without clear impairment");
            return provisional(a, r, h, gate);
        }
        if (a.before12 === "no") {
            r.trail.push("Symptoms began after age 12.");
            r.suggestion = h.suggest("medical", "Not ADHD: onset in adulthood points to another cause (substances, sleep, mood, trauma, brain injury)", true);
            h.exclude("adhd");
            r.also.push("Childhood onset is required. Look again at substances, sleep, mood, anxiety, trauma and acquired brain injury.");
            return provisional(a, r, h, gate);
        }
        const threshold = a.age17 === "yes" ? 5 : 6;
        const enough = v => (v === "6" ? 6 : v === "5" ? 5 : 0) >= threshold;
        const inatt = enough(a.inattention), hyper = enough(a.hyperactivity);
        if ((inatt || hyper) && a.settings === "yes") {
            const kind = inatt && hyper ? "combined" : inatt ? "inattentive" : "hyperactive";
            r.trail.push(`${threshold} or more symptoms in ${kind === "combined" ? "both domains" : "one domain"}, before 12, in 2 or more settings, with impairment.`);
            r.suggestion = h.suggest("adhd", PRESENTATION[kind], a.before12 === "self" || a.sleepPoor === "yes");
            h.exclude("other-adhd");
            if (a.before12 === "self") r.also.push("Provisional until childhood onset is supported by collateral: school reports, a parent or sibling.");
            if (a.age17 === "yes") r.also.push("In adults, hyperactivity often shows as inner restlessness. Emotional dysregulation is common.");
            r.also.push("First-line: methylphenidate, dexamfetamine or lisdexamfetamine, with psychoeducation and CBT for adults (AADPA 2022). Check BP and pulse; an ECG is not routinely needed.");
            if (a.substance === "yes" || a.substance === "unsure") {
                r.also.push("With substance use, treat that first and start stimulants once use has stopped or stabilised (AADPA 2022). Prefer long-acting formulations with structured supply.");
            }
        } else {
            r.trail.push("Impairing symptoms below the full ADHD criteria.");
            r.suggestion = h.suggest("other-adhd", "Other specified ADHD (ICD-11 6A05.Y)", true);
            h.alt("adhd");
        }
        if (a.autismFeatures === "yes") {
            r.additional.push("autism");
            r.also.push("Autism often co-occurs with ADHD: assess for it and diagnose both if criteria are met.");
        } else if (a.autismFeatures === "no") {
            h.exclude("autism");
        }
        return provisional(a, r, h, gate);
    }

    function provisional(a, r, h, gate) {
        if (gate === "provisional" && r.suggestion) {
            if (r.suggestion.cardId) h.alt(r.suggestion.cardId);
            r.also.push(`If it persists after a period of abstinence: ${r.suggestion.label}.`);
            r.suggestion = h.suggest("substance-induced", ATTENTION_SPEC.induced, true);
            r.switchTo = null;
            r.additional = [];
        }
        if (!r.suggestion && (a.feigned === "external" || a.feigned === "internal")) {
            r.suggestion = h.suggest(null, a.feigned === "external" ? "Malingering (ICD-11 QC30)" : "Factitious disorder imposed on self (ICD-11 6D50)");
        }
        return finish(r);
    }

    /* ---------------------------------------------------------- behaviour */

    const BEHAVIOUR_SPEC = {
        subject: "the behaviour",
        change: "the behaviour change",
        disorder: "behavioural disorder",
        medicalHint: "For example head injury, epilepsy (including after seizures), a change in personality after illness, thyroid disease, medication effects.",
        extraTiming: null,
        induced: "Substance intoxication, withdrawal or medication effect, or behaviour to obtain drugs (substance use disorder)",
        medical: "Behaviour change due to a medical condition (e.g. personality change after head injury, ICD-11 6E68)",
        dementia: "Neurocognitive disorder with behavioural disturbance",
        inducedNote: "Work out the substance use with the Substance use questions."
    };
    const behaviourGates = gatesWithoutFeigning(BEHAVIOUR_SPEC);
    const behaviourOn = a => K.primaryReachable(a);
    const B_YES_NO = (id, text, extra) => Object.assign({ id, step: "4 · What fits?", type: "choice", text, options: YES_NO, showIf: behaviourOn }, extra || {});

    const BEHAVIOUR_QUESTIONS = [
        {
            id: "explained", step: "0 · Is it a problem?", type: "choice",
            text: "Which fits best?",
            hint: "Ask about safety at home and school, and speak with the young person alone.",
            options: [
                { value: "clinical", label: "Behaviour outside the normal range for age, development and culture, causing problems" },
                { value: "normative", label: "Within the normal range for age, development and culture" }
            ]
        }
    ].concat(behaviourGates, [
        B_YES_NO("mania", "Distinct episodes of elevated or irritable mood with increased energy, a change from usual?"),
        B_YES_NO("depression", "Depressed or irritable mood for 2 weeks or more (or most days for a year), with other depressive symptoms?"),
        B_YES_NO("psychotic", "Delusions or hallucinations?"),
        B_YES_NO("outbursts", "Severe temper outbursts 3 or more times a week, with irritable or angry mood most of the day between them, for 12 months, starting before 10?", {
            showIf: a => behaviourOn(a) && a.mania !== "yes"
        }),
        B_YES_NO("adhdSx", "Persistent inattention, hyperactivity or impulsivity, in 2 or more settings, with several symptoms before 12?"),
        B_YES_NO("oppositional", "Angry or irritable mood, arguing and defiance, or vindictiveness (4 or more symptoms for 6 months), beyond what's typical for age?", {
            showIf: a => behaviourOn(a) && a.outbursts !== "yes"
        }),
        B_YES_NO("conduct", "A repeated pattern of violating others' rights or major rules (aggression to people or animals, destroying property, lying or theft, serious rule-breaking) over 12 months?"),
        {
            id: "conductOnset", step: "4 · What fits?", type: "choice",
            text: "Conduct problems: when did they start?",
            options: [
                { value: "child", label: "At least one before age 10" },
                { value: "adolescent", label: "None before age 10" },
                { value: "unknown", label: "Not known" }
            ],
            showIf: a => behaviourOn(a) && a.conduct === "yes"
        },
        B_YES_NO("prosocial", "Conduct problems: limited remorse, empathy or concern about performance, with shallow emotions (callous-unemotional traits)?", {
            showIf: a => behaviourOn(a) && a.conduct === "yes"
        }),
        B_YES_NO("intellectual", "Deficits in intellectual and adaptive functioning since early development?"),
        {
            id: "stereotyped", step: "4 · What fits?", type: "choice",
            text: "Repetitive, driven, purposeless movements (rocking, hand-flapping, head-banging)?",
            options: [
                { value: "autism", label: "Yes, with social communication difficulties and restricted interests" },
                { value: "isolated", label: "Yes, without those" },
                { value: "no", label: "No" }
            ],
            showIf: behaviourOn
        },
        {
            id: "impulse", step: "4 · What fits?", type: "choice",
            text: "Deliberate fire-setting or stealing, with rising tension before and pleasure or relief after, not for gain or anger?",
            options: [
                { value: "fire", label: "Fire-setting" },
                { value: "steal", label: "Stealing things not needed" },
                { value: "no", label: "No" }
            ],
            showIf: a => behaviourOn(a) && a.conduct !== "yes"
        },
        {
            id: "stressor", step: "4 · What fits?", type: "choice",
            text: "Did it begin after a trauma or stressor?",
            options: [
                { value: "trauma", label: "After a trauma, with re-experiencing, avoidance and arousal" },
                { value: "stressor", label: "After a stressor, out of proportion to it" },
                { value: "no", label: "No" }
            ],
            showIf: behaviourOn
        },
        {
            id: "residual", step: "5 · If nothing else fits", type: "choice",
            text: "Which fits best?",
            options: [
                { value: "dysfunction", label: "Clinically significant, but not fitting the patterns above" },
                { value: "gain", label: "Antisocial acts for gain or revenge, without a mental disorder" }
            ],
            showIf: a => behaviourOn(a) && ["mania", "depression", "psychotic", "adhdSx", "conduct", "intellectual"].every(id => a[id] === "no") &&
                a.stereotyped === "no" && a.stressor === "no" && a.outbursts !== "yes" && a.oppositional === "no" && a.impulse === "no"
        }
    ]);

    function evaluateBehaviour(answers) {
        const a = answers || {};
        const r = newResult();
        r.additional = [];
        const h = helpers(r);

        if (!a.explained) { r.pending.push("Start with step 0: is it a problem?"); return r; }
        if (a.explained === "normative") {
            r.trail.push("Within the normal range for age, development and culture.");
            r.suggestion = h.suggest("none", "No mental disorder: behaviour within the normal range");
            return r;
        }
        r.trail.push("Problem behaviour outside the normal range.");

        const gate = evaluateGatesWithoutFeigning(a, r, h, BEHAVIOUR_SPEC);
        if (gate === "stop") {
            if (r.suggestion && r.suggestion.cardId === "substance-induced") r.switchTo = "substance";
            return finish(r);
        }

        const asked = ["mania", "depression", "psychotic", "adhdSx", "conduct", "intellectual", "stereotyped", "stressor"];
        if (asked.some(id => !a[id]) || (a.mania !== "yes" && !a.outbursts) || (a.outbursts !== "yes" && !a.oppositional) || (a.conduct !== "yes" && !a.impulse)) {
            r.pending.push("Step 4: answer each pattern (yes or no).");
        }

        const found = [];
        const add = (card, label, extra) => found.push(Object.assign({ card, label }, extra || {}));
        if (a.mania === "yes") {
            r.trail.push("Episodes of elevated or irritable mood with increased energy.");
            add("mood", "Bipolar disorder (manic or hypomanic episodes)", { flow: "elevated" });
            h.exclude("dmdd");
            r.also.push("DMDD isn't diagnosed when there are distinct manic or hypomanic episodes.");
        }
        if (a.psychotic === "yes") {
            r.trail.push("With delusions or hallucinations.");
            add("psychosis", "A psychotic disorder", { flow: "psychosis" });
        }
        if (a.outbursts === "yes" && a.mania !== "yes") {
            r.trail.push("Severe outbursts with persistent irritability, starting before 10.");
            add("dmdd", "Disruptive mood dysregulation disorder (ICD-11: oppositional defiant disorder with chronic irritability-anger, 6C90.0)");
            h.exclude("odd");
            r.also.push("If ODD criteria are also met, only DMDD is diagnosed. Diagnose DMDD only from age 6 to 18.");
        }
        if (a.adhdSx === "yes") {
            r.trail.push("Inattention, hyperactivity or impulsivity in 2 or more settings, from before 12.");
            add("adhd", "ADHD (ICD-11 6A05)", { flow: "attention", provisional: true, carry: { explained: "clinical", before12: "yes", settings: "yes" } });
        }
        if (a.oppositional === "yes" && a.outbursts !== "yes") {
            r.trail.push("Angry, defiant or vindictive pattern for 6 months.");
            add("odd", "Oppositional defiant disorder (ICD-11 6C90)");
        }
        if (a.conduct === "yes") {
            const onset = { child: ", childhood-onset type (ICD-11 6C91.0)", adolescent: ", adolescent-onset type (ICD-11 6C91.1)", unknown: ", unspecified onset (ICD-11 6C91)" }[a.conductOnset] || " (ICD-11 6C91)";
            const pro = a.prosocial === "yes" ? ", with limited prosocial emotions" : "";
            r.trail.push("A repeated pattern of violating others' rights or major rules.");
            add("cd", `Conduct disorder${pro}${onset}`);
            if (!a.conductOnset || !a.prosocial) r.pending.push("Step 4: conduct disorder onset and prosocial emotions.");
            r.also.push("DSM-5-TR allows conduct disorder and ODD to be diagnosed together.");
        }
        if (a.intellectual === "yes") {
            r.trail.push("Intellectual and adaptive deficits since early development.");
            add("idd", "Intellectual developmental disorder (ICD-11 6A00)", { provisional: true });
            r.also.push("Confirm with standardised intellectual and adaptive testing. Behaviour may be communication: look for pain, sensory needs and environmental triggers.");
        }
        if (a.stereotyped === "autism") {
            r.trail.push("Stereotyped movements with social communication difficulties and restricted interests.");
            add("autism", "Autism spectrum disorder (ICD-11 6A02)", { provisional: true });
        } else if (a.stereotyped === "isolated") {
            r.trail.push("Driven, purposeless repetitive movements without autism.");
            add("stereotypic", "Stereotypic movement disorder (ICD-11 6A06)");
        }
        if (a.impulse === "fire" || a.impulse === "steal") {
            r.trail.push(a.impulse === "fire" ? "Fire-setting driven by tension and relief." : "Stealing driven by tension and relief.");
            add("impulse", a.impulse === "fire" ? "Pyromania (ICD-11 6C70)" : "Kleptomania (ICD-11 6C71)");
        }
        if (a.depression === "yes") {
            r.trail.push("With depressed or irritable mood and other depressive symptoms.");
            add("mood", "A depressive disorder (irritable mood can replace low mood in young people)", { flow: "depressed" });
        }
        if (a.stressor === "trauma") {
            r.trail.push("Began after a trauma, with re-experiencing, avoidance and arousal.");
            add("trauma", "PTSD or acute stress disorder", { flow: "anxiety", carry: { focus: ["trauma"] } });
        } else if (a.stressor === "stressor" && !found.length) {
            r.trail.push("Began after a stressor, out of proportion to it.");
            add("trauma", "Adjustment disorder, with disturbance of conduct (ICD-11 6B43)");
        }

        if (!found.length) {
            if (a.residual === "dysfunction") {
                r.suggestion = h.suggest("other-disruptive", "Other specified disruptive, impulse-control or conduct disorder (ICD-11 6C9Y)", true);
            } else if (a.residual === "gain") {
                r.suggestion = h.suggest("other-disruptive", "Child or adolescent antisocial behaviour (not a mental disorder)");
            }
            return finish(r);
        }
        settle(r, h, found, FLOW_NAMES);
        ["dmdd", "adhd", "odd", "cd", "idd", "autism", "stereotypic", "impulse", "mood", "psychosis", "trauma", "other-disruptive", "none"].forEach(id => {
            if (!found.some(f => f.card === id) && !r.excluded.includes(id) && !r.alternatives.includes(id)) h.exclude(id);
        });
        if (gate === "provisional") {
            h.alt(r.suggestion.cardId);
            r.also.push("Too early to separate the effects of substance use: reassess after a period of abstinence.");
            r.suggestion.provisional = true;
        }
        return finish(r);
    }

    /* ------------------------------------------------------------- school */

    const S_YES_NO = (id, text, extra) => Object.assign({ id, step: "1 · What fits?", type: "choice", text, options: YES_NO, showIf: a => a.explained === "clinical" }, extra || {});
    const SCHOOL_QUESTIONS = [
        {
            id: "explained", step: "0 · Is it a problem?", type: "choice",
            text: "Which fits best?",
            hint: "Check hearing, vision, attendance and safety first.",
            options: [
                { value: "clinical", label: "Persistent school difficulties, well below what's expected for age" },
                { value: "environmental", label: "Explained by the environment (missed school, poor teaching, second language, poor work habits)" }
            ]
        },
        S_YES_NO("intellectual", "Deficits in intellectual and adaptive functioning since early development?"),
        {
            id: "iddSeverity", step: "1 · What fits?", type: "choice",
            text: "Severity, by adaptive functioning:",
            options: [
                { value: "mild", label: "Mild" }, { value: "moderate", label: "Moderate" },
                { value: "severe", label: "Severe" }, { value: "profound", label: "Profound" }
            ],
            showIf: a => a.explained === "clinical" && a.intellectual === "yes"
        },
        {
            id: "social", step: "1 · What fits?", type: "choice",
            text: "Difficulty with the social use of language and non-verbal communication?",
            options: [
                { value: "autism", label: "Yes, with restricted or repetitive behaviours or interests" },
                { value: "pragmatic", label: "Yes, without restricted or repetitive behaviours" },
                { value: "no", label: "No" }
            ],
            showIf: a => a.explained === "clinical"
        },
        {
            id: "learning", step: "1 · What fits?", type: "multi",
            text: "Specific academic skills well below age for 6 months or more, despite targeted help? (Tick all.)",
            options: [
                { value: "reading", label: "Reading (accuracy, fluency or comprehension)" },
                { value: "writing", label: "Written expression (spelling, grammar, organisation)" },
                { value: "maths", label: "Mathematics (number sense, calculation, reasoning)" },
                { value: "none", label: "None of these" }
            ],
            showIf: a => a.explained === "clinical"
        },
        S_YES_NO("language", "Persistent difficulty understanding or producing spoken language, well below age?"),
        S_YES_NO("mutism", "Consistently doesn't speak at school for a month or more (not just the first month), but speaks normally at home?"),
        S_YES_NO("adhdSx", "Persistent inattention, hyperactivity or impulsivity in 2 or more settings, with several symptoms before 12?"),
        S_YES_NO("disruptive", "Severe outbursts, defiance or rule-breaking getting in the way of school?"),
        S_YES_NO("substanceUse", "Problem substance use?"),
        S_YES_NO("separation", "School refusal from fear of separation from parents or carers, beyond what's typical for age?"),
        {
            id: "otherDisorder", step: "1 · What fits?", type: "choice",
            text: "Another mental disorder getting in the way of school?",
            options: [
                { value: "anxiety", label: "Anxiety (worry, social anxiety)" },
                { value: "depression", label: "Depression" },
                { value: "psychosis", label: "Psychotic symptoms" },
                { value: "no", label: "No" }
            ],
            showIf: a => a.explained === "clinical"
        },
        S_YES_NO("stressor", "Began after an identifiable stressor, out of proportion to it?")
    ];
    const SCHOOL_IDS = ["intellectual", "social", "learning", "language", "mutism", "adhdSx", "disruptive", "substanceUse", "separation", "otherDisorder", "stressor"];
    const LEARNING = { reading: "reading", writing: "written expression", maths: "mathematics" };

    function evaluateSchool(answers) {
        const a = answers || {};
        const r = newResult();
        r.additional = [];
        const h = helpers(r);

        if (!a.explained) { r.pending.push("Start with step 0: is it a problem?"); return r; }
        if (a.explained === "environmental") {
            r.trail.push("School difficulties explained by the environment.");
            r.suggestion = h.suggest("none", "No mental disorder: educational problems from environmental factors");
            r.ruleOut.environment = "Possible";
            return r;
        }
        r.trail.push("Persistent school difficulties well below what's expected.");
        if (SCHOOL_IDS.some(id => id === "learning" ? !Array.isArray(a.learning) || !a.learning.length : !a[id])) {
            r.pending.push("Step 1: answer each pattern.");
        }

        const found = [];
        const add = (card, label, extra) => found.push(Object.assign({ card, label }, extra || {}));
        if (a.intellectual === "yes") {
            const sev = a.iddSeverity ? `, ${a.iddSeverity}` : "";
            r.trail.push("Intellectual and adaptive deficits since early development.");
            add("idd", `Intellectual developmental disorder${sev} (ICD-11 6A00)`, { provisional: true });
            r.also.push("Confirm with standardised intellectual and adaptive testing; severity is set by adaptive functioning, not IQ alone.");
        }
        if (a.social === "autism") { r.trail.push("Social communication difficulties with restricted or repetitive behaviours."); add("autism", "Autism spectrum disorder (ICD-11 6A02)", { provisional: true }); }
        if (a.social === "pragmatic") { r.trail.push("Social communication difficulties without restricted or repetitive behaviours."); add("pragmatic", "Social (pragmatic) communication disorder (ICD-11 6A01.22)"); }
        const skills = picked(a, "learning").filter(s => LEARNING[s]);
        if (skills.length) {
            r.trail.push("Specific academic skills well below age despite targeted help.");
            add("sld", `Specific learning disorder, with impairment in ${skills.map(s => LEARNING[s]).join(", ")} (ICD-11 6A03)`, { provisional: true });
            r.also.push("Specific learning disorder needs standardised achievement testing and is not diagnosed when intellectual disability, sensory problems or poor teaching explain it.");
        }
        if (a.language === "yes") { r.trail.push("Language well below age."); add("language", "Language disorder (ICD-11 6A01.2)", { provisional: true }); }
        if (a.mutism === "yes") { r.trail.push("Doesn't speak at school but speaks at home."); add("mutism", "Selective mutism (ICD-11 6B06)"); }
        if (a.adhdSx === "yes") {
            r.trail.push("Inattention, hyperactivity or impulsivity in 2 or more settings, from before 12.");
            add("adhd", "ADHD (ICD-11 6A05)", { flow: "attention", provisional: true, carry: { explained: "clinical", before12: "yes", settings: "yes" } });
        }
        if (a.disruptive === "yes") { r.trail.push("Disruptive behaviour getting in the way of school."); add("disruptive", "A disruptive behaviour disorder (DMDD, ODD or conduct disorder)", { flow: "behaviour", carry: { explained: "clinical" } }); }
        if (a.substanceUse === "yes") { r.trail.push("Problem substance use."); add("substance-use", "Substance use disorder", { flow: "substance" }); }
        if (a.separation === "yes") { r.trail.push("School refusal from fear of separation."); add("separation", "Separation anxiety disorder (ICD-11 6B05)", { flow: "anxiety", carry: { explained: "clinical", focus: ["separation"] } }); }
        if (a.otherDisorder === "anxiety") add("anxiety", "An anxiety disorder", { flow: "anxiety" });
        if (a.otherDisorder === "depression") add("mood", "A depressive disorder", { flow: "depressed" });
        if (a.otherDisorder === "psychosis") add("psychosis", "A psychotic disorder", { flow: "psychosis" });
        if (a.stressor === "yes" && !found.length) { r.trail.push("Began after a stressor, out of proportion to it."); add("trauma", "Adjustment disorder (ICD-11 6B43)"); }

        if (!found.length) {
            if (!r.pending.length) {
                r.trail.push("No specific disorder identified.");
                r.suggestion = h.suggest("none", "No mental disorder identified: consider educational and environmental factors", true);
            }
            return finish(r);
        }
        settle(r, h, found, FLOW_NAMES);
        r.also.push("Check hearing and vision, attendance, and safety at home and school.");
        return finish(r);
    }

    /* ------------------------------------------------------------- speech */

    const SPEECH_SPEC = {
        subject: "the speech change",
        change: "the speech change",
        disorder: "speech disorder",
        medicalHint: "For example stroke or another focal lesion (aphasia, dysarthria), frontotemporal dementia, head injury, Parkinson's disease, hearing loss.",
        extraTiming: null,
        induced: "Substance intoxication or withdrawal, or a medication effect",
        medical: "Aphasia or dysarthria from a neurological condition (not a mental disorder)",
        dementia: "Major or mild neurocognitive disorder (e.g. primary progressive aphasia)",
        inducedNote: "Reassess once the substance has worn off."
    };
    const SPEECH_QUESTIONS = [
        {
            id: "explained", step: "0 · Is it a problem?", type: "choice",
            text: "Which fits best?",
            options: [
                { value: "clinical", label: "A clinically significant change or difficulty in speech" },
                { value: "normal", label: "Normal variation (accent, dialect, shyness, talkativeness)" }
            ]
        }
    ].concat(gatesWithoutFeigning(SPEECH_SPEC), [
        {
            id: "speechType", step: "4 · What kind of speech?", type: "choice",
            text: "Which best describes it?",
            options: [
                { value: "pressured", label: "Rapid and pressured, hard to interrupt, with racing thoughts" },
                { value: "slowed", label: "Slowed, quiet, long pauses, few words" },
                { value: "echolalia", label: "Repeating the examiner's words (echolalia), or mute" },
                { value: "disorganised", label: "Disorganised: derailing, tangential, incoherent" },
                { value: "developmental", label: "Speech or language difficulties since early childhood" },
                { value: "social", label: "Odd social use of language (literal, one-sided, poor turn-taking)" },
                { value: "tics", label: "Sudden repeated sounds or words (vocal tics)" }
            ],
            showIf: a => K.primaryReachable(a)
        },
        {
            id: "devType", step: "4 · What kind of speech?", type: "choice",
            text: "Developmental: which?",
            options: [
                { value: "language", label: "Understanding or producing language" },
                { value: "sound", label: "Producing speech sounds clearly" },
                { value: "fluency", label: "Stuttering (repetitions, prolongations, blocks)" }
            ],
            showIf: a => K.primaryReachable(a) && a.speechType === "developmental"
        },
        {
            id: "repetitive", step: "4 · What kind of speech?", type: "choice",
            text: "With restricted or repetitive behaviours or interests?",
            options: YES_NO,
            showIf: a => K.primaryReachable(a) && a.speechType === "social"
        },
        {
            id: "motorTics", step: "4 · What kind of speech?", type: "choice",
            text: "Tics: which pattern?",
            options: [
                { value: "tourette", label: "Motor and vocal tics, for more than a year, starting before 18" },
                { value: "persistent", label: "Vocal tics only, for more than a year" },
                { value: "provisional", label: "Less than a year" }
            ],
            showIf: a => K.primaryReachable(a) && a.speechType === "tics"
        }
    ]);

    function evaluateSpeech(answers) {
        const a = answers || {};
        const r = newResult();
        const h = helpers(r);

        if (!a.explained) { r.pending.push("Start with step 0: is it a problem?"); return r; }
        if (a.explained === "normal") {
            r.trail.push("Normal variation in speech.");
            r.suggestion = h.suggest("none", "No mental disorder: normal variation in speech");
            return r;
        }
        r.trail.push("A clinically significant speech change or difficulty.");
        const gate = evaluateGatesWithoutFeigning(a, r, h, SPEECH_SPEC);
        if (gate === "stop") return finish(r);

        const t = a.speechType;
        const go = (card, label, flow, trail, extra) => {
            r.trail.push(trail);
            r.suggestion = h.suggest(card, label, !!(extra && extra.provisional));
            if (flow) { r.switchTo = flow; r.also.push(`Work this through with the ${FLOW_NAMES[flow]} questions.`); }
        };
        if (t === "pressured") go("mood", "Pressured speech of a manic or hypomanic episode", "elevated", "Rapid, pressured speech with racing thoughts.");
        else if (t === "slowed") go("mood", "Slowed speech within a depressive episode", "depressed", "Slowed, sparse speech.");
        else if (t === "echolalia") go("catatonia", "Catatonia (echolalia or mutism)", "catatonia", "Echolalia or mutism.");
        else if (t === "disorganised") go("psychosis", "Disorganised speech of a psychotic disorder", "psychosis", "Disorganised speech.");
        else if (t === "developmental") {
            const dev = {
                language: "Language disorder (ICD-11 6A01.2)",
                sound: "Speech sound disorder (ICD-11 6A01.0)",
                fluency: "Childhood-onset fluency disorder (stuttering) (ICD-11 6A01.1)"
            }[a.devType];
            if (!dev) { r.pending.push("Step 4: the type of developmental difficulty."); return finish(r); }
            go("developmental", dev, null, "Speech or language difficulties since early childhood.");
            r.also.push("Refer for speech pathology assessment; check hearing.");
        } else if (t === "social") {
            if (!a.repetitive) { r.pending.push("Step 4: restricted or repetitive behaviours."); return finish(r); }
            if (a.repetitive === "yes") go("autism", "Autism spectrum disorder (ICD-11 6A02)", null, "Social communication difficulties with restricted or repetitive behaviours.", { provisional: true });
            else go("pragmatic", "Social (pragmatic) communication disorder (ICD-11 6A01.22)", null, "Social communication difficulties without restricted or repetitive behaviours.");
        } else if (t === "tics") {
            const tic = {
                tourette: "Tourette's disorder (ICD-11 8A05.00 Tourette syndrome)",
                persistent: "Persistent (chronic) vocal tic disorder (ICD-11 8A05.0)",
                provisional: "Provisional tic disorder (ICD-11 8A05.0)"
            }[a.motorTics];
            if (!tic) { r.pending.push("Step 4: the tic pattern."); return finish(r); }
            go("tics", tic, null, "Sudden, repeated, non-rhythmic vocal tics.");
            r.also.push("Screen for ADHD and OCD, which commonly co-occur with tics.");
        } else {
            r.pending.push("Step 4: the kind of speech disturbance.");
            return finish(r);
        }
        if (gate === "provisional" && r.suggestion) {
            if (r.suggestion.cardId) h.alt(r.suggestion.cardId);
            r.also.push(`If it persists once the substance has worn off: ${r.suggestion.label}.`);
            r.suggestion = h.suggest("substance-induced", SPEECH_SPEC.induced, true);
            r.switchTo = null;
        }
        return finish(r);
    }

    const flows = {
        attention: { questions: ATTENTION_QUESTIONS, evaluate: evaluateAttention },
        behaviour: { questions: BEHAVIOUR_QUESTIONS, evaluate: evaluateBehaviour },
        school: { questions: SCHOOL_QUESTIONS, evaluate: evaluateSchool },
        speech: { questions: SPEECH_QUESTIONS, evaluate: evaluateSpeech }
    };
    root.REASONING_FLOWS = Object.assign(root.REASONING_FLOWS || {}, flows);
    if (typeof module !== "undefined" && module.exports) module.exports = flows;
})(typeof window !== "undefined" ? window : globalThis);
