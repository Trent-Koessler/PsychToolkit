/* =========================================================================
 * Guided differentials for physical symptoms or health worry, and for
 * depersonalisation or derealisation. Same stepwise order as the other
 * flows. Rules are written from the DSM-5-TR criteria in our own words, with
 * ICD-11 differences noted. They suggest; the clinician decides.
 *
 * The somatic flow doesn't use the kit's medical step: somatic symptom
 * disorder can be diagnosed whether or not a medical condition explains the
 * symptoms, so it asks instead whether the response is in proportion.
 * ========================================================================= */

(function (root) {
    "use strict";

    const K = root.REASONING_FLOW_KIT || require("./reasoning-flow-kit.js");
    const { YES_NO, newResult, helpers } = K;

    function finish(r) {
        if (r.suggestion && r.suggestion.cardId) {
            const keep = id => id !== r.suggestion.cardId && !(r.additional || []).includes(id);
            r.alternatives = r.alternatives.filter(keep);
            r.excluded = r.excluded.filter(keep);
        }
        return r;
    }

    const asClinical = a => Object.assign({}, a, { explained: "clinical" });

    /* ------------------------------------------------------------ somatic */

    const SOMATIC_SPEC = {
        subject: "the physical symptoms",
        change: "the symptoms",
        disorder: "somatic disorder",
        medicalHint: "",
        extraTiming: null
    };

    // Feigning and substances come first (steps 1-2), for symptoms rather
    // than appearance or a known condition.
    const bodily = a => ["symptoms", "neuro", "illness"].includes(a.focus);
    const somaticGates = K.gateQuestions(SOMATIC_SPEC)
        .filter(q => ["feigned", "substance", "subTiming"].includes(q.id))
        .map(q => {
            const show = q.showIf;
            return Object.assign({}, q, { showIf: a => bodily(a) && show(asClinical(a)) });
        });
    somaticGates[0] = Object.assign({}, somaticGates[0], {
        hint: "Clues: findings that change when unobserved, tampering, a history that doesn't add up, or an external incentive (compensation, drugs, legal). Unexplained is not the same as deliberate."
    });

    const pastGates = a => {
        if (!bodily(a)) return true;
        if (a.feigned === "external" || a.feigned === "internal") return false;
        return !(a.substance === "yes" && a.subTiming === "during");
    };
    // Steps 3 and 4 wait for the step before them.
    const medicalDone = a => bodily(a) && pastGates(a) && a.medicalDx && a.medicalDx !== "explains";
    const notDelusional = a => a.focus === "neuro" || a.delusional === "no" || (a.focus === "appearance" && a.delusional === "yes");
    const notWithinOther = a => a.focus === "neuro" || ((a.panicOnly === "no" || a.focus === "appearance") && (a.moodOnly === "no" || a.focus === "appearance"));
    const step5 = a => (medicalDone(a) || a.focus === "appearance") && notDelusional(a) && notWithinOther(a) && (a.focus !== "appearance" || a.weightOnly === "no");

    const SOMATIC_QUESTIONS = [
        {
            id: "focus", step: "0 · What is the concern?", type: "choice",
            text: "Which fits best?",
            options: [
                { value: "symptoms", label: "Distressing physical symptoms (pain, fatigue, gut, heart or others)" },
                { value: "neuro", label: "Neurological symptoms: weakness, abnormal movements, seizures, sensory or speech loss" },
                { value: "illness", label: "Worry about having or getting a serious illness, with few or no symptoms" },
                { value: "appearance", label: "Worry about flaws in appearance" },
                { value: "condition", label: "A known medical condition made worse by psychological or behavioural factors" }
            ]
        }
    ].concat(somaticGates, [
        {
            id: "medicalDx", step: "3 · Medical condition", type: "choice",
            text: "Is there a medical condition that could explain the symptoms?",
            hint: "Somatic symptom disorder can be diagnosed with or without one: what matters is whether the response is in proportion.",
            options: [
                { value: "explains", label: "Yes, and the worry and behaviour are in proportion to it" },
                { value: "excessive", label: "Yes, but the worry, or time spent on it, is excessive" },
                { value: "investigating", label: "Not yet investigated, or red flags" },
                { value: "no", label: "No medical condition found" }
            ],
            showIf: a => bodily(a) && pastGates(a)
        },
        {
            id: "delusional", step: "4 · Part of another disorder?", type: "choice",
            text: "Are the beliefs held with delusional conviction (fixed despite clear evidence)?",
            options: YES_NO,
            showIf: a => (medicalDone(a) && a.focus !== "neuro") || a.focus === "appearance"
        },
        {
            id: "weightOnly", step: "4 · Part of another disorder?", type: "choice",
            text: "Is the concern only about body weight or shape, with restricted eating?",
            options: YES_NO,
            showIf: a => a.focus === "appearance"
        },
        {
            id: "panicOnly", step: "4 · Part of another disorder?", type: "choice",
            text: "Do the symptoms or worry occur only during panic attacks?",
            options: YES_NO,
            showIf: a => medicalDone(a) && a.focus !== "neuro" && a.delusional === "no"
        },
        {
            id: "moodOnly", step: "4 · Part of another disorder?", type: "choice",
            text: "Do they occur only during a depressive episode, or as part of wider generalised worry?",
            options: [
                { value: "depression", label: "Only during a depressive episode" },
                { value: "gad", label: "Part of generalised worry about many things" },
                { value: "no", label: "No" }
            ],
            showIf: a => medicalDone(a) && a.focus !== "neuro" && a.delusional === "no" && a.panicOnly === "no"
        },
        {
            id: "sxB", step: "5 · Which disorder?", type: "choice",
            text: "Thoughts about the seriousness out of proportion, persistently high health anxiety, or excessive time and energy spent on the symptoms. How many?",
            options: [
                { value: "none", label: "None of these" },
                { value: "one", label: "One" },
                { value: "two", label: "Two or more" },
                { value: "severe", label: "Two or more, with several symptoms or one very severe" }
            ],
            showIf: a => step5(a) && a.focus === "symptoms"
        },
        {
            id: "pain", step: "5 · Which disorder?", type: "choice",
            text: "Is pain the main symptom?",
            options: YES_NO,
            showIf: a => step5(a) && a.focus === "symptoms" && a.sxB && a.sxB !== "none"
        },
        {
            id: "illnessSx", step: "5 · Which disorder?", type: "choice",
            text: "Are physical symptoms absent, or only mild?",
            options: YES_NO,
            showIf: a => step5(a) && a.focus === "illness"
        },
        {
            id: "illnessBehaviour", step: "5 · Which disorder?", type: "choice",
            text: "What do they do about the worry?",
            options: [
                { value: "seeking", label: "Checks their body, searches, seeks tests or reassurance (care-seeking)" },
                { value: "avoidant", label: "Avoids doctors and hospitals (care-avoidant)" },
                { value: "neither", label: "Neither" }
            ],
            showIf: a => step5(a) && a.focus === "illness" && a.illnessSx === "yes"
        },
        {
            id: "months6", step: "5 · Which disorder?", type: "choice",
            text: "Present for 6 months or more (the particular symptom or illness feared may change)?",
            options: YES_NO,
            showIf: a => step5(a) && ((a.focus === "symptoms" && a.sxB && a.sxB !== "none") || (a.focus === "illness" && a.illnessSx === "yes"))
        },
        {
            id: "positiveSigns", step: "5 · Which disorder?", type: "choice",
            text: "Does examination show clear incompatibility with neurological disease (e.g. Hoover's sign, tremor entrainment, typical features on video-EEG)?",
            options: [
                { value: "yes", label: "Yes, positive signs" },
                { value: "unclear", label: "Not yet examined, or unclear" },
                { value: "no", label: "No: findings fit neurological disease" }
            ],
            showIf: a => step5(a) && a.focus === "neuro"
        },
        {
            id: "fndType", step: "5 · Which disorder?", type: "choice",
            text: "Main symptom type:",
            options: [
                { value: "weakness", label: "Weakness or paralysis" },
                { value: "movement", label: "Abnormal movement (tremor, dystonia, jerks, gait)" },
                { value: "seizures", label: "Attacks or seizures" },
                { value: "speech", label: "Speech or swallowing" },
                { value: "sensory", label: "Sensory loss, or vision or hearing loss" },
                { value: "mixed", label: "Mixed" }
            ],
            showIf: a => step5(a) && a.focus === "neuro" && a.positiveSigns === "yes"
        },
        {
            id: "repetitive", step: "5 · Which disorder?", type: "choice",
            text: "Repetitive behaviours (mirror checking, grooming, skin picking, reassurance-seeking) or mental acts (comparing) in response?",
            options: YES_NO,
            showIf: a => step5(a) && a.focus === "appearance"
        },
        {
            id: "insight", step: "5 · Which disorder?", type: "choice",
            text: "Insight into the appearance beliefs:",
            options: [
                { value: "good", label: "Good or fair" },
                { value: "poor", label: "Poor" },
                { value: "absent", label: "Absent (fully convinced)" }
            ],
            showIf: a => step5(a) && a.focus === "appearance" && a.repetitive === "yes"
        },
        {
            id: "muscle", step: "5 · Which disorder?", type: "choice",
            text: "Preoccupied with their build being too small or not muscular enough?",
            options: YES_NO,
            showIf: a => step5(a) && a.focus === "appearance" && a.repetitive === "yes"
        },
        {
            id: "pfacOther", step: "4 · Part of another disorder?", type: "choice",
            text: "Are the factors part of another mental disorder (e.g. depression causing missed treatment, an eating disorder omitting insulin)?",
            options: YES_NO,
            showIf: a => a.focus === "condition"
        },
        {
            id: "pfacEffect", step: "5 · Which disorder?", type: "choice",
            text: "Do the factors affect the course, interfere with treatment, add health risks, or trigger or worsen symptoms?",
            options: YES_NO,
            showIf: a => a.focus === "condition" && a.pfacOther === "no"
        }
    ]);

    const SSD_SEVERITY = {
        one: ["mild", "6C20.0 mild"],
        two: ["moderate", "6C20.1 moderate"],
        severe: ["severe", "6C20.2 severe"]
    };
    const FND_TYPE = {
        weakness: "with weakness or paralysis",
        movement: "with abnormal movement",
        seizures: "with attacks or seizures",
        speech: "with speech or swallowing symptoms",
        sensory: "with sensory loss or special sensory symptoms",
        mixed: "with mixed symptoms"
    };

    function evaluateSomatic(answers) {
        const a = answers || {};
        const r = newResult();
        const h = helpers(r);

        if (!a.focus) {
            r.pending.push("Start with step 0: what the concern is.");
            return r;
        }

        if (bodily(a)) {
            // Steps 1-2: feigning, then substances.
            if (a.feigned === "external" || a.feigned === "internal") {
                r.trail.push(a.feigned === "external"
                    ? "Symptoms deliberately produced or exaggerated for an external gain."
                    : "Symptoms deliberately produced or exaggerated without an obvious external gain.");
                r.suggestion = h.suggest("feigning", a.feigned === "external"
                    ? "Malingering (ICD-11 QC30)"
                    : "Factitious disorder imposed on self (ICD-11 6D50)");
                r.also.push("Feigning can co-exist with genuine illness. Unexplained symptoms are not evidence of feigning: functional symptoms are involuntary.");
                return finish(r);
            }
            if (a.feigned === "unclear") { r.trail.push("Feigning not excluded."); h.alt("feigning"); }
            else if (a.feigned === "no") { r.trail.push("No evidence of feigning."); h.exclude("feigning"); }
            else { r.pending.push("Step 1: feigned symptoms."); return r; }

            if (a.substance === "yes" && a.subTiming === "during") {
                r.trail.push("Symptoms began with substance use, withdrawal or a medication.");
                r.ruleOut.substance = "Possible";
                r.suggestion = h.suggest("substance-induced", "Substance intoxication, withdrawal or medication effect");
                r.also.push("Reassess once the substance or medication has been stopped or changed. Consider opioid-induced hyperalgesia and medication overuse headache.");
                return finish(r);
            }
            if (a.substance === "no" || (a.substance === "yes" && ["before", "persisted"].includes(a.subTiming))) {
                r.ruleOut.substance = "Excluded";
                h.exclude("substance-induced");
            } else if (a.substance === "unsure" || a.subTiming === "early") {
                r.ruleOut.substance = "Investigating";
                h.alt("substance-induced");
            } else {
                r.pending.push("Step 2: substances or medication.");
                return r;
            }

            // Step 3: the medical condition, and whether the response fits it.
            if (a.medicalDx === "explains") {
                r.trail.push("A medical condition explains the symptoms, and the response is in proportion.");
                r.ruleOut.medical = "Possible";
                r.suggestion = h.suggest("medical", "No mental disorder: a medical condition with a proportionate response");
                r.also.push("If distress is significant but proportionate to a recent diagnosis, consider adjustment disorder.");
                return finish(r);
            }
            if (a.medicalDx === "excessive") {
                r.trail.push("A medical condition is present, but the response to it is excessive.");
                r.ruleOut.medical = "Possible";
            } else if (a.medicalDx === "investigating") {
                r.trail.push("Medical causes not yet investigated, or red flags.");
                r.ruleOut.medical = "Investigating";
                h.alt("medical");
            } else if (a.medicalDx === "no") {
                r.trail.push("No medical condition found.");
                r.ruleOut.medical = "Excluded";
                h.exclude("medical");
            } else {
                r.pending.push("Step 3: medical conditions.");
                return r;
            }
        }

        if (a.focus === "condition") return finish(evaluateCondition(a, r, h));
        if (a.focus === "neuro") return finish(evaluateNeuro(a, r, h));

        // Step 4. Part of another disorder?
        if (a.delusional === "yes") {
            if (a.focus === "appearance") {
                r.trail.push("Appearance beliefs held with delusional conviction.");
                r.also.push("Absent insight is a BDD specifier, not delusional disorder.");
            } else {
                r.trail.push("Beliefs about the body or illness held with delusional conviction.");
                r.suggestion = h.suggest("delusional", "Delusional disorder, somatic type (ICD-11 6A24), or psychotic depression");
                r.also.push("Work this through with the Psychosis questions.");
                r.switchTo = "psychosis";
                return finish(r);
            }
        } else if (a.delusional === "no") {
            h.exclude("delusional");
        } else {
            r.pending.push("Step 4: delusional conviction.");
            return finish(r);
        }

        if (a.focus === "appearance") return finish(evaluateAppearance(a, r, h));

        if (a.panicOnly === "yes") {
            r.trail.push("Symptoms or worry only during panic attacks.");
            r.suggestion = h.suggest("mood-anxiety", "Physical symptoms of panic attacks (not a somatic disorder)");
            r.also.push("Work this through with the Anxiety questions.");
            r.switchTo = "anxiety";
            return finish(r);
        }
        if (a.moodOnly === "depression" || a.moodOnly === "gad") {
            r.trail.push(a.moodOnly === "depression"
                ? "Symptoms or worry only during a depressive episode."
                : "Health worry is one part of generalised worry about many things.");
            r.suggestion = h.suggest("mood-anxiety", a.moodOnly === "depression"
                ? "Physical symptoms or health worry within a depressive episode"
                : "Health worry within generalised anxiety disorder");
            r.also.push(`Work this through with the ${a.moodOnly === "depression" ? "Depressed mood" : "Anxiety"} questions.`);
            r.switchTo = a.moodOnly === "depression" ? "depressed" : "anxiety";
            return finish(r);
        }
        if (a.panicOnly !== "no" || a.moodOnly !== "no") {
            r.pending.push("Step 4: panic, depression or generalised worry.");
            return finish(r);
        }
        h.exclude("mood-anxiety");

        if (a.focus === "symptoms") evaluateSymptoms(a, r, h);
        else evaluateIllness(a, r, h);
        if (r.suggestion && ["ssd", "iad", "osrd"].includes(r.suggestion.cardId)) {
            r.also.push("Set planned rather than crisis-driven reviews with one coordinating clinician, agree an investigation stop-point, and ask about suicide (risk is raised and often missed).");
            if (a.medicalDx === "investigating") {
                r.suggestion.provisional = true;
                r.also.push("Provisional until red flags are addressed. Don't make the diagnosis on normal tests alone.");
            }
        }
        return finish(r);
    }

    function evaluateSymptoms(a, r, h) {
        if (!a.sxB) { r.pending.push("Step 5: thoughts, feelings and behaviours about the symptoms."); return; }
        if (a.sxB === "none") {
            r.trail.push("No excessive thoughts, feelings or behaviours about the symptoms.");
            r.suggestion = a.medicalDx === "investigating"
                ? h.suggest("medical", "No somatic disorder: continue the medical work-up", true)
                : h.suggest("none", "No mental disorder: physical symptoms without an excessive response");
            h.exclude("ssd");
            return;
        }
        if (!a.months6) { r.pending.push("Step 5: duration."); return; }
        const [severity, icd] = SSD_SEVERITY[a.sxB];
        const pain = a.pain === "yes" ? ", with predominant pain" : "";
        if (a.months6 === "yes") {
            r.trail.push("Distressing symptoms with an excessive response, for 6 months or more.");
            r.suggestion = h.suggest("ssd", `Somatic symptom disorder, ${severity}${pain} (ICD-11 ${icd.replace(/ .*/, "")} Bodily distress disorder, ${icd.replace(/^\S+ /, "")})`);
            h.exclude("osrd");
            r.also.push("ICD-11 bodily distress disorder centres on excessive attention to the symptoms, and asks for 'at least several months'.");
        } else {
            r.trail.push("Distressing symptoms with an excessive response, for under 6 months.");
            r.suggestion = h.suggest("osrd", "Other specified somatic symptom and related disorder (brief somatic symptom disorder)");
            h.alt("ssd");
        }
        h.alt("iad");
    }

    function evaluateIllness(a, r, h) {
        if (!a.illnessSx) { r.pending.push("Step 5: how prominent the physical symptoms are."); return; }
        if (a.illnessSx === "no") {
            r.trail.push("Health worry with prominent physical symptoms.");
            r.suggestion = h.suggest("ssd", "Somatic symptom disorder is the better fit when symptoms are prominent", true);
            r.also.push("Answer step 0 as 'Distressing physical symptoms' to work it through.");
            h.alt("iad");
            return;
        }
        if (!a.months6) { r.pending.push("Step 5: duration."); return; }
        const type = { seeking: ", care-seeking type", avoidant: ", care-avoidant type" }[a.illnessBehaviour] || "";
        if (a.months6 === "yes") {
            r.trail.push("Preoccupation with serious illness, with few or mild symptoms, for 6 months or more.");
            r.suggestion = h.suggest("iad", `Illness anxiety disorder${type} (ICD-11 6B23 Hypochondriasis)`);
            h.exclude("osrd");
            r.also.push("ICD-11 groups hypochondriasis with the obsessive-compulsive related disorders and adds an insight specifier.");
        } else {
            r.trail.push("Preoccupation with serious illness for under 6 months.");
            r.suggestion = h.suggest("osrd", "Other specified somatic symptom and related disorder (brief illness anxiety disorder)");
            h.alt("iad");
        }
        if (!a.illnessBehaviour) r.pending.push("Step 5: care-seeking or care-avoidant.");
        h.alt("ssd");
    }

    function evaluateNeuro(a, r, h) {
        if (a.positiveSigns === "no") {
            r.trail.push("Examination findings fit neurological disease.");
            r.suggestion = h.suggest("medical", "Neurological disease: refer to neurology", true);
            h.alt("fnd");
            r.also.push("Functional and neurological disease often co-exist (for example epilepsy with functional seizures).");
            return r;
        }
        if (a.positiveSigns === "unclear") {
            r.trail.push("Positive signs not yet established.");
            r.suggestion = h.suggest("fnd", "Possible functional neurological disorder: needs a neurological examination for positive signs", true);
            if (!r.excluded.includes("medical")) h.alt("medical");
            r.also.push("FND is diagnosed on positive signs, not on normal tests or the presence of stress.");
            return r;
        }
        if (a.positiveSigns !== "yes") { r.pending.push("Step 5: positive signs on examination."); return r; }
        r.trail.push("Positive signs of incompatibility with neurological disease.");
        const type = FND_TYPE[a.fndType] ? ` ${FND_TYPE[a.fndType]}` : "";
        if (!a.fndType) r.pending.push("Step 5: the main symptom type.");
        const code = { seizures: "6B60.4", movement: "6B60.8" }[a.fndType] || "6B60";
        r.suggestion = h.suggest("fnd", `Functional neurological symptom disorder${type} (ICD-11 ${code} Dissociative neurological symptom disorder)`, a.medicalDx === "investigating");
        r.also.push("Specify acute (under 6 months) or persistent, and with or without a psychological stressor (not required for the diagnosis).");
        r.also.push("Name the diagnosis and show the positive signs; explain it as a problem of nervous system functioning. Refer for specialist physiotherapy and CBT; treat co-occurring depression, anxiety and PTSD.");
        if (a.medicalDx === "excessive") {
            r.also.push("Functional and neurological disease often co-exist: diagnose both.");
        }
        if (a.fndType === "seizures") {
            r.also.push("Confirm with video-EEG where possible. Avoid emergency benzodiazepines and intubation for typical functional attacks once the diagnosis is secure.");
        }
        return r;
    }

    function evaluateAppearance(a, r, h) {
        if (a.weightOnly === "yes") {
            r.trail.push("Concern limited to weight or shape, with restricted eating.");
            r.suggestion = h.suggest(null, "An eating disorder rather than body dysmorphic disorder");
            r.also.push("Work this through with the Eating or weight change questions.");
            r.switchTo = "eating";
            h.alt("bdd");
            return r;
        }
        if (a.weightOnly !== "no") { r.pending.push("Step 4: weight or shape only."); return r; }
        if (a.repetitive === "no") {
            r.trail.push("Appearance preoccupation without repetitive behaviours.");
            r.suggestion = h.suggest("bdd", "Other specified obsessive-compulsive related disorder (body dysmorphic-like disorder without repetitive behaviours)", true);
            return r;
        }
        if (a.repetitive !== "yes") { r.pending.push("Step 5: repetitive behaviours."); return r; }
        r.trail.push("Preoccupation with perceived flaws, with repetitive behaviours or mental acts.");
        const spec = [];
        if (a.muscle === "yes") spec.push("with muscle dysmorphia");
        if (a.insight) spec.push({ good: "with good or fair insight", poor: "with poor insight", absent: "with absent insight/delusional beliefs" }[a.insight]);
        else r.pending.push("Step 5: insight.");
        r.suggestion = h.suggest("bdd", `Body dysmorphic disorder${spec.length ? ", " + spec.join(", ") : ""} (ICD-11 6B21)`);
        r.also.push("CBT with exposure and response prevention, and SSRIs (often at higher doses), are first-line. Cosmetic procedures rarely help. Ask about suicide: risk is high.");
        h.exclude("delusional");
        return r;
    }

    function evaluateCondition(a, r, h) {
        if (a.pfacOther === "yes") {
            r.trail.push("The factors are part of another mental disorder.");
            r.suggestion = h.suggest(null, "Diagnose the other mental disorder (e.g. depression, an eating disorder) instead");
            h.exclude("pfac");
            return r;
        }
        if (a.pfacOther !== "no") { r.pending.push("Step 4: whether another mental disorder explains the factors."); return r; }
        if (a.pfacEffect === "yes") {
            r.trail.push("Psychological or behavioural factors adversely affect a diagnosed medical condition.");
            r.suggestion = h.suggest("pfac", "Psychological factors affecting other medical conditions (ICD-11 6E40)");
        } else if (a.pfacEffect === "no") {
            r.trail.push("No clear effect on the medical condition.");
            r.suggestion = h.suggest("none", "No mental disorder");
        } else {
            r.pending.push("Step 5: the effect on the medical condition.");
        }
        return r;
    }

    /* -------------------------------------------------- depersonalisation */

    const DP_SPEC = {
        subject: "depersonalisation or derealisation",
        change: "the depersonalisation",
        disorder: "dissociative disorder",
        medicalHint: "For example temporal lobe epilepsy (brief stereotyped episodes, déjà vu, automatisms), migraine, vestibular disorders, head injury.",
        extraTiming: null,
        induced: "Substance intoxication, withdrawal or medication effect (DSM-5-TR has no substance-induced dissociative disorder)",
        medical: "Dissociation due to a medical condition (ICD-11 6E65 Secondary dissociative syndrome; DSM-5-TR other specified mental disorder due to another medical condition)",
        dementia: "Major or mild neurocognitive disorder",
        inducedNote: "If it lasts well beyond stopping (cannabis is a common trigger), consider depersonalisation-derealisation disorder."
    };

    const dpReachable = a => K.primaryReachable(a);
    const dpStep4 = [
        ["reality", a => a.reality === "yes"],
        ["only", a => a.only === "no"],
        ["trauma", a => a.trauma === "no"],
        ["amnesia", a => a.amnesia === "no"],
        ["functional", a => a.functional === "no"],
        ["personality", a => a.personality === "no"]
    ];
    // Each step-4 question shows once the ones before it are answered
    // without explaining the picture.
    const dpAfter = id => a => {
        if (!dpReachable(a)) return false;
        for (const [qid, ok] of dpStep4) {
            if (qid === id) return true;
            if (!ok(a)) return false;
        }
        return true;
    };

    const DP_QUESTIONS = [
        {
            id: "explained", step: "0 · Is it a disorder?", type: "choice",
            text: "Which fits best?",
            options: [
                { value: "clinical", label: "Persistent or recurrent episodes, with distress or impairment" },
                { value: "transient", label: "Brief, occasional episodes without distress or impairment" }
            ]
        }
    ].concat(K.gateQuestions(DP_SPEC), [
        {
            id: "reality", step: "4 · Part of another disorder?", type: "choice",
            text: "Do they know the experience isn't real ('as if' in a dream, 'as if' I'm a robot)?",
            hint: "Believing they are actually dead, or the world has really been replaced, is a delusion.",
            options: YES_NO,
            showIf: dpAfter("reality")
        },
        {
            id: "only", step: "4 · Part of another disorder?", type: "choice",
            text: "Does it happen only during another episode?",
            options: [
                { value: "panic", label: "Only during panic attacks" },
                { value: "depression", label: "Only during depressive episodes" },
                { value: "no", label: "No, it happens outside them too" }
            ],
            showIf: dpAfter("only")
        },
        {
            id: "trauma", step: "4 · Part of another disorder?", type: "choice",
            text: "After a traumatic event, with intrusions, avoidance, negative changes in mood or beliefs, and arousal?",
            options: [
                { value: "long", label: "Yes, for more than a month" },
                { value: "short", label: "Yes, from 3 days to a month after" },
                { value: "no", label: "No" }
            ],
            showIf: dpAfter("trauma")
        },
        {
            id: "amnesia", step: "4 · Part of another disorder?", type: "choice",
            text: "Gaps in memory for important personal information or everyday events, beyond ordinary forgetting?",
            options: YES_NO,
            showIf: dpAfter("amnesia")
        },
        {
            id: "identity", step: "4 · Part of another disorder?", type: "choice",
            text: "Which fits the memory gaps best?",
            options: [
                { value: "did", label: "Two or more distinct identity states, with a marked break in sense of self and agency" },
                { value: "partial", label: "One main identity, with intrusions from other states" },
                { value: "fugue", label: "Purposeful travel or bewildered wandering they can't recall" },
                { value: "amnesia", label: "None of these: memory loss only" }
            ],
            showIf: a => dpAfter("amnesia")(a) && a.amnesia === "yes"
        },
        {
            id: "functional", step: "4 · Part of another disorder?", type: "choice",
            text: "Weakness, abnormal movements, attacks or sensory loss that don't fit neurological disease?",
            options: YES_NO,
            showIf: dpAfter("functional")
        },
        {
            id: "personality", step: "4 · Part of another disorder?", type: "choice",
            text: "Is it only brief and under stress, within a long-standing pattern?",
            options: [
                { value: "bpd", label: "Yes: unstable relationships, self-image and emotions, with impulsivity" },
                { value: "schizotypal", label: "Yes: social difficulties with odd beliefs and perceptual distortions" },
                { value: "no", label: "No" }
            ],
            showIf: dpAfter("personality")
        },
        {
            id: "dpType", step: "5 · Depersonalisation-derealisation disorder", type: "choice",
            text: "Which is it?",
            options: [
                { value: "dp", label: "Depersonalisation: detached from own thoughts, feelings or body" },
                { value: "dr", label: "Derealisation: surroundings feel unreal, dreamlike or foggy" },
                { value: "both", label: "Both" }
            ],
            showIf: a => dpAfter("personality")(a) && a.personality === "no"
        }
    ]);

    function evaluateDepersonalisation(answers) {
        const a = answers || {};
        const r = newResult();
        const h = helpers(r);

        if (!a.explained) {
            r.pending.push("Start with step 0: is it a disorder?");
            return r;
        }
        if (a.explained === "transient") {
            r.trail.push("Brief, occasional episodes without distress or impairment.");
            r.suggestion = h.suggest("none", "No mental disorder: brief depersonalisation or derealisation is common (fatigue, sleep loss, stress, intoxication)");
            return r;
        }
        r.trail.push("Persistent or recurrent depersonalisation or derealisation, with distress or impairment.");

        const gate = K.evaluateGates(a, r, h, DP_SPEC);
        if (gate === "stop") {
            if (a.medical === "flags" || a.medical === "yes") r.also.push("Get an EEG if episodes are brief and stereotyped.");
            return finish(r);
        }
        if (a.medical === "flags") r.also.push("Get an EEG if episodes are brief and stereotyped.");

        const result = step4(a, r, h);
        if (gate === "provisional") {
            if (r.suggestion && r.suggestion.cardId) {
                h.alt(r.suggestion.cardId);
                r.also.push(`If it persists once the substance is stopped: ${r.suggestion.label}.`);
            }
            r.suggestion = h.suggest("substance-induced", DP_SPEC.induced, true);
        }
        if (!r.suggestion && (a.feigned === "external" || a.feigned === "internal")) {
            r.suggestion = h.suggest("feigning", a.feigned === "external" ? "Malingering (ICD-11 QC30)" : "Factitious disorder imposed on self (ICD-11 6D50)");
        }
        return finish(result);
    }

    function step4(a, r, h) {
        if (!dpReachable(a)) return r;
        if (a.reality === "no") {
            r.trail.push("Reality testing lost: the person believes the change is real.");
            r.suggestion = h.suggest("psychosis", "Psychotic symptoms (e.g. nihilistic delusions), not depersonalisation disorder");
            r.also.push("Work this through with the Psychosis questions.");
            r.switchTo = "psychosis";
            return r;
        }
        if (a.reality !== "yes") { r.pending.push("Step 4: reality testing."); return r; }
        r.trail.push("Reality testing intact.");
        h.exclude("psychosis");

        if (a.only === "panic" || a.only === "depression") {
            r.trail.push(a.only === "panic" ? "Only during panic attacks." : "Only during depressive episodes.");
            r.suggestion = h.suggest("panic-mood", a.only === "panic"
                ? "Depersonalisation within panic attacks (not a separate diagnosis)"
                : "Depersonalisation within a depressive episode");
            r.also.push(`Work this through with the ${a.only === "panic" ? "Anxiety" : "Depressed mood"} questions.`);
            r.switchTo = a.only === "panic" ? "anxiety" : "depressed";
            return r;
        }
        if (a.only !== "no") { r.pending.push("Step 4: panic or depression."); return r; }
        h.exclude("panic-mood");

        if (a.trauma === "long" || a.trauma === "short") {
            r.trail.push(a.trauma === "long"
                ? "Trauma-related symptoms for more than a month, with dissociation."
                : "Trauma-related symptoms within the first month, with dissociation.");
            r.suggestion = h.suggest("ptsd", a.trauma === "long"
                ? "PTSD, with dissociative symptoms (ICD-11 6B40)"
                : "Acute stress disorder (ICD-11: acute stress reaction, QE84)");
            r.also.push("Work this through with the Anxiety questions. Phase-based, trauma-focused therapy; grounding skills first.");
            r.switchTo = "anxiety";
            return r;
        }
        if (a.trauma !== "no") { r.pending.push("Step 4: trauma."); return r; }
        r.ruleOut.trauma = "Excluded";

        if (a.amnesia === "yes") {
            const id = a.identity;
            if (!id) { r.pending.push("Step 4: the type of memory gaps."); return r; }
            r.trail.push("Dissociative gaps in memory.");
            if (id === "did" || id === "partial") {
                r.suggestion = h.suggest("did", id === "did"
                    ? "Dissociative identity disorder (ICD-11 6B64)"
                    : "Partial dissociative identity disorder (ICD-11 6B65; DSM-5-TR other specified dissociative disorder)");
                r.also.push("Voices in DID are usually experienced as parts of the self; check carefully against psychosis. Phase-oriented trauma therapy: safety and stabilisation first.");
            } else {
                r.suggestion = h.suggest("amnesia", id === "fugue"
                    ? "Dissociative amnesia, with dissociative fugue (ICD-11 6B61)"
                    : "Dissociative amnesia (ICD-11 6B61)");
                r.also.push("Exclude neurological causes first: seizures, head injury, transient global amnesia, alcohol blackouts.");
            }
            r.also.push("Depersonalisation-derealisation disorder isn't diagnosed separately when it occurs only within another dissociative disorder.");
            h.alt("dpdr");
            return r;
        }
        if (a.amnesia !== "no") { r.pending.push("Step 4: dissociative memory gaps."); return r; }
        ["amnesia", "did"].forEach(h.exclude);

        if (a.functional === "yes") {
            r.trail.push("Functional neurological symptoms as well.");
            r.suggestion = h.suggest("fnd", "Functional neurological disorder (ICD-11 6B60)", true);
            r.also.push("Work this through with the Physical symptoms questions. Diagnose depersonalisation-derealisation disorder as well if it is persistent in its own right.");
            r.switchTo = "somatic";
            h.alt("dpdr");
            return r;
        }
        if (a.functional !== "no") { r.pending.push("Step 4: functional neurological symptoms."); return r; }
        h.exclude("fnd");

        if (a.personality === "bpd" || a.personality === "schizotypal") {
            r.trail.push("Brief, stress-related dissociation within a long-standing pattern.");
            r.suggestion = h.suggest("personality", a.personality === "bpd"
                ? "Transient stress-related dissociation in borderline personality disorder (ICD-11 6D10 with borderline pattern)"
                : "Perceptual distortions in schizotypal personality disorder (ICD-11 6A22 Schizotypal disorder)");
            h.alt("dpdr");
            return r;
        }
        if (a.personality !== "no") { r.pending.push("Step 4: personality."); return r; }
        h.exclude("personality");

        const flags = a.medical === "flags";
        r.trail.push(flags
            ? "Not explained by substances or another mental disorder; medical causes still being checked."
            : "Not explained by substances, medical causes or another mental disorder.");
        const type = { dp: ", depersonalisation", dr: ", derealisation", both: ", with both depersonalisation and derealisation" }[a.dpType] || "";
        r.suggestion = h.suggest("dpdr", `Depersonalisation-derealisation disorder${type} (ICD-11 6B66)`, flags);
        r.also.push("Explain it and teach grounding; CBT for depersonalisation. Treat co-occurring anxiety and depression. No medication has good evidence.");
        h.exclude("none");
        return r;
    }

    const flows = {
        somatic: { questions: SOMATIC_QUESTIONS, evaluate: evaluateSomatic },
        depersonalisation: { questions: DP_QUESTIONS, evaluate: evaluateDepersonalisation }
    };
    root.REASONING_FLOWS = Object.assign(root.REASONING_FLOWS || {}, flows);
    if (typeof module !== "undefined" && module.exports) module.exports = flows;
})(typeof window !== "undefined" ? window : globalThis);
