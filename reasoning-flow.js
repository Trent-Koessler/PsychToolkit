/* =========================================================================
 * Guided differential for psychosis: the questions, and the rules that turn
 * the answers into a suggested diagnosis. Rendering lives in reasoning-ui.js.
 *
 * The order follows the usual stepwise approach to differential diagnosis:
 *   0. Is it psychosis at all?   1. Feigned?   2. Substance or medication?
 *   3. Medical condition?        4. Building blocks (symptoms, mood, time)
 *   5. Primary psychotic disorder   6. Other conditions that fit better
 * The rules are written from the DSM-5-TR criteria in our own words, with
 * ICD-11 differences noted. They suggest; the clinician decides.
 *
 * evaluate() is a pure function so it can be tested without a browser.
 * ========================================================================= */

(function (root) {
    "use strict";

    const YES_NO_UNSURE = [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        { value: "unsure", label: "Unsure" }
    ];
    const CORE = ["delusions", "hallucinations", "speech"];
    const has = (a, id) => Array.isArray(a[id]) && a[id].length > 0;
    const moodPresent = a => a.mood === "depressive" || a.mood === "manic";
    const delusionsAsked = a => Array.isArray(a.symptoms) && a.symptoms.includes("delusions");

    const QUESTIONS = [
        {
            id: "explained", step: "0 · Is it psychosis?", type: "choice",
            text: "Is the experience better explained by any of these?",
            options: [
                { value: "none", label: "None: this is a psychotic experience" },
                { value: "cultural", label: "A belief or experience shared within their culture or religion" },
                { value: "sleep", label: "Only when falling asleep or waking" },
                { value: "insight-substance", label: "They know it isn't real, and it happens with intoxication or withdrawal" },
                { value: "insight-other", label: "They know it isn't real (other situations)" }
            ]
        },
        {
            id: "feigned", step: "1 · Feigned symptoms", type: "choice",
            text: "Is there evidence the symptoms are deliberately produced or exaggerated?",
            hint: "Clues: symptoms that look textbook or stereotyped, change with who is watching, or don't match observed behaviour; a legal, housing, disability or drug-seeking context. Feigning can sit alongside genuine illness.",
            options: [
                { value: "no", label: "No" },
                { value: "unclear", label: "Unclear" },
                { value: "external", label: "Yes, for an external gain" },
                { value: "internal", label: "Yes, without an obvious external gain" }
            ],
            showIf: a => a.explained === "none"
        },
        {
            id: "substance", step: "2 · Substance or medication", type: "choice",
            text: "Was there substance use, withdrawal, or a medication that can cause psychosis around the time symptoms began?",
            options: YES_NO_UNSURE,
            showIf: a => a.explained === "none"
        },
        {
            id: "subTiming", step: "2 · Substance or medication", type: "choice",
            text: "Which best fits the timeline?",
            options: [
                { value: "during", label: "Began during or soon after use, and hasn't outlasted it by about a month" },
                { value: "before", label: "Began before the substance use" },
                { value: "persisted", label: "Has lasted about a month or more after stopping" },
                { value: "early", label: "Too early to tell (still using, or stopped under a month ago)" }
            ],
            showIf: a => a.explained === "none" && a.substance === "yes"
        },
        {
            id: "delirium", step: "3 · Medical condition", type: "choice",
            text: "Is attention and awareness disturbed, and does it fluctuate (delirium)?",
            options: YES_NO_UNSURE,
            showIf: a => a.explained === "none"
        },
        {
            id: "cognitive", step: "3 · Medical condition", type: "choice",
            text: "Has there been a decline in memory or other thinking skills, from before the psychosis?",
            options: YES_NO_UNSURE,
            showIf: a => a.explained === "none" && a.delirium !== "yes"
        },
        {
            id: "medical", step: "3 · Medical condition", type: "choice",
            text: "Is there a medical condition whose timing and nature could explain the psychosis?",
            hint: "For example epilepsy, encephalitis, thyroid disease, a brain lesion, or steroid excess. Red flags include rapid onset, seizures, abnormal movements, autonomic instability or fluctuating consciousness.",
            options: [
                { value: "yes", label: "Yes" },
                { value: "flags", label: "Red flags, not yet confirmed" },
                { value: "no", label: "No" }
            ],
            showIf: a => a.explained === "none" && a.delirium !== "yes" && a.cognitive !== "yes"
        },
        {
            id: "symptoms", step: "4 · Symptoms, mood and time", type: "multi",
            text: "Which are present? (Tick all that apply.)",
            options: [
                { value: "delusions", label: "Delusions" },
                { value: "hallucinations", label: "Hallucinations" },
                { value: "speech", label: "Disorganised speech" },
                { value: "behaviour", label: "Grossly disorganised or catatonic behaviour" },
                { value: "negative", label: "Negative symptoms" }
            ],
            showIf: a => primaryReachable(a)
        },
        {
            id: "halMinor", step: "4 · Symptoms, mood and time", type: "choice",
            text: "Are the hallucinations minor, and do they fit the delusional theme?",
            options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No, they're prominent" }],
            showIf: a => primaryReachable(a) && delusionsAsked(a) && a.symptoms.includes("hallucinations")
        },
        {
            id: "ocdBdd", step: "4 · Symptoms, mood and time", type: "choice",
            text: "Are the fixed beliefs only about obsessions and compulsions (OCD), or a perceived flaw in appearance (BDD)?",
            options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }],
            showIf: a => primaryReachable(a) && delusionsAsked(a)
        },
        {
            id: "duration", step: "4 · Symptoms, mood and time", type: "choice",
            text: "How long has the illness lasted in total, including early warning signs and leftover symptoms?",
            options: [
                { value: "lt1d", label: "Under 1 day" },
                { value: "1d-1m", label: "1 day to under 1 month" },
                { value: "1-3m", label: "1 to under 3 months" },
                { value: "3-6m", label: "3 to under 6 months" },
                { value: "6m+", label: "6 months or more" }
            ],
            showIf: a => primaryReachable(a)
        },
        {
            id: "returned", step: "4 · Symptoms, mood and time", type: "choice",
            text: "Has the person fully returned to their usual self?",
            options: [{ value: "yes", label: "Yes" }, { value: "not-yet", label: "Not yet" }],
            showIf: a => primaryReachable(a) && a.duration === "1d-1m"
        },
        {
            id: "function", step: "4 · Symptoms, mood and time", type: "choice",
            text: "Is functioning markedly impaired (work, relationships, self-care)?",
            options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }],
            showIf: a => primaryReachable(a)
        },
        {
            id: "mood", step: "4 · Symptoms, mood and time", type: "choice",
            text: "Have there been manic or major depressive episodes during this illness?",
            options: [
                { value: "none", label: "None" },
                { value: "depressive", label: "Depressive episodes only" },
                { value: "manic", label: "Manic (with or without depressive)" }
            ],
            showIf: a => primaryReachable(a)
        },
        {
            id: "moodOnly", step: "4 · Symptoms, mood and time", type: "choice",
            text: "Have the psychotic symptoms happened only during mood episodes?",
            options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }],
            showIf: a => primaryReachable(a) && moodPresent(a)
        },
        {
            id: "psychWithoutMood", step: "4 · Symptoms, mood and time", type: "choice",
            text: "Have delusions or hallucinations lasted 2 weeks or more without a mood episode?",
            options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }],
            showIf: a => primaryReachable(a) && moodPresent(a) && a.moodOnly === "no"
        },
        {
            id: "moodShare", step: "4 · Symptoms, mood and time", type: "choice",
            text: "Have mood episodes been present for half or more of the whole illness (active and leftover phases)?",
            options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }],
            showIf: a => primaryReachable(a) && moodPresent(a) && a.moodOnly === "no"
        },
        {
            id: "moodOutside", step: "4 · Symptoms, mood and time", type: "choice",
            text: "Has any mood episode happened outside the psychotic illness?",
            options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }],
            showIf: a => primaryReachable(a) && moodPresent(a) && a.moodOnly === "no" &&
                (a.moodShare === "no" || a.psychWithoutMood === "no")
        },
        {
            id: "catatonia", step: "4 · Symptoms, mood and time", type: "multi",
            text: "Catatonic signs present (tick all that apply)",
            options: [
                { value: "none", label: "None" },
                { value: "stupor", label: "Stupor" }, { value: "catalepsy", label: "Catalepsy" },
                { value: "waxy", label: "Waxy flexibility" }, { value: "mutism", label: "Mutism" },
                { value: "negativism", label: "Negativism" }, { value: "posturing", label: "Posturing" },
                { value: "mannerism", label: "Mannerisms" }, { value: "stereotypy", label: "Stereotypy" },
                { value: "agitation", label: "Agitation (not from outside stimuli)" }, { value: "grimacing", label: "Grimacing" },
                { value: "echolalia", label: "Echolalia" }, { value: "echopraxia", label: "Echopraxia" }
            ],
            showIf: a => a.explained === "none"
        },
        {
            id: "otherFit", step: "6 · Something else fits better?", type: "multi",
            text: "Could the experiences fit better within any of these? (Tick any that apply.)",
            options: [
                { value: "ptsd", label: "Trauma re-experiencing (PTSD)" },
                { value: "autism", label: "Autism" },
                { value: "bpd", label: "Brief stress-related paranoia or dissociation (borderline personality disorder)" },
                { value: "lifelong", label: "Lifelong odd beliefs or suspiciousness without sustained psychosis" }
            ],
            showIf: a => a.explained === "none"
        }
    ];

    // The primary-disorder questions only matter once substance, medical and
    // delirium causes have not already explained the picture.
    function primaryReachable(a) {
        if (a.explained !== "none") return false;
        if (a.delirium === "yes" || a.cognitive === "yes" || a.medical === "yes") return false;
        if (a.substance === "yes" && a.subTiming === "during") return false;
        return true;
    }

    const LABELS = {
        "substance-induced": "Substance/medication-induced psychotic disorder (ICD-11 6C4x.6, by substance)",
        schizophrenia: "Schizophrenia (ICD-11 6A20)",
        schizophreniform: "Schizophreniform disorder (DSM-5-TR only; ICD-11 6A20 if 1 month or more)",
        brief: "Brief psychotic disorder (ICD-11 6A23 Acute and transient psychotic disorder)",
        schizoaffective: "Schizoaffective disorder (ICD-11 6A21)",
        delusional: "Delusional disorder (ICD-11 6A24)",
        bipolar: "Bipolar I disorder with psychotic features (ICD-11 6A60)",
        depression: "Major depressive disorder with psychotic features (ICD-11 6A70/6A71)",
        medical: "Psychosis due to another medical condition (ICD-11 6E61)",
        schizotypal: "Schizotypal disorder (ICD-11 6A22)",
        feigning: "Feigned symptoms",
        "other-specified": "Other specified schizophrenia spectrum and other psychotic disorder (ICD-11 6A2Y)",
        other: "Another condition that fits better"
    };

    function suggest(cardId, label, provisional) {
        return { cardId, label: label || LABELS[cardId], provisional: !!provisional };
    }

    function evaluate(answers) {
        const a = answers || {};
        const r = { suggestion: null, also: [], alternatives: [], excluded: [], ruleOut: {}, trail: [], pending: [] };
        const alt = id => { if (!r.alternatives.includes(id)) r.alternatives.push(id); };
        const exclude = id => { if (!r.excluded.includes(id)) r.excluded.push(id); };

        // Step 0. Is it psychosis?
        if (!a.explained) {
            r.pending.push("Start with step 0: is it psychosis?");
            return r;
        }
        if (a.explained !== "none") {
            if (a.explained === "cultural") {
                r.suggestion = suggest(null, "No mental disorder: a belief or experience shared within their culture or religion");
                r.trail.push("The experience is shared within the person's culture or religion.");
            } else if (a.explained === "sleep") {
                r.suggestion = suggest(null, "No mental disorder: hypnagogic or hypnopompic experiences");
                r.trail.push("The experiences happen only when falling asleep or waking.");
            } else if (a.explained === "insight-substance") {
                r.suggestion = suggest(null, "Substance intoxication or withdrawal, with perceptual disturbances (not a psychotic disorder)");
                r.trail.push("Insight is retained, and the experiences happen with intoxication or withdrawal.");
                r.ruleOut.substance = "Possible";
            } else {
                r.suggestion = suggest("other", "Not psychotic (insight retained): consider PTSD, dissociation, grief, or borderline personality disorder");
                r.trail.push("Insight is retained, so this is not psychosis.");
            }
            ["substance-induced", "schizophrenia", "schizophreniform", "brief", "schizoaffective", "delusional"].forEach(exclude);
            return r;
        }
        r.trail.push("Psychotic experience, not explained by culture, sleep transitions or retained insight.");

        // Step 1. Feigned symptoms. Recorded, but the assessment carries on,
        // because feigning and genuine illness can co-exist.
        if (a.feigned === "external") {
            r.also.push("Feigning for external gain suggests malingering (DSM-5-TR: a condition for clinical attention, not a mental disorder; ICD-11 QC30). It can co-exist with genuine illness.");
            r.trail.push("Evidence of feigning for external gain.");
            alt("feigning");
        } else if (a.feigned === "internal") {
            r.also.push("Feigning without obvious external gain suggests factitious disorder imposed on self (ICD-11 6D50).");
            r.trail.push("Evidence of feigning without obvious external gain.");
            alt("feigning");
        } else if (a.feigned === "unclear") {
            r.trail.push("Feigning not excluded.");
            alt("feigning");
        } else if (a.feigned === "no") {
            r.trail.push("No evidence of feigning.");
            exclude("feigning");
        } else {
            r.pending.push("Step 1: feigned symptoms.");
        }

        // Step 2. Substance or medication.
        let substanceProvisional = false;
        if (a.substance === "no") {
            r.trail.push("No relevant substance or medication.");
            r.ruleOut.substance = "Excluded";
            r.ruleOut.medication = "Excluded";
            exclude("substance-induced");
        } else if (a.substance === "unsure") {
            r.trail.push("Substance or medication role unknown.");
            r.ruleOut.substance = "Investigating";
            alt("substance-induced");
        } else if (a.substance === "yes") {
            if (a.subTiming === "during") {
                r.trail.push("Began during or soon after substance use and has not outlasted it.");
                r.ruleOut.substance = "Possible";
                r.suggestion = suggest("substance-induced");
                r.also.push("About a third later convert to schizophrenia or bipolar disorder, most often after cannabis. Reassess after about a month of abstinence.");
            } else if (a.subTiming === "before" || a.subTiming === "persisted") {
                r.trail.push(a.subTiming === "before"
                    ? "Symptoms began before the substance use, so an independent disorder is likely."
                    : "Symptoms have lasted about a month or more after stopping, so an independent disorder is likely.");
                r.ruleOut.substance = "Excluded";
                exclude("substance-induced");
            } else if (a.subTiming === "early") {
                r.trail.push("Too early to separate a substance-induced from an independent psychosis.");
                r.ruleOut.substance = "Possible";
                substanceProvisional = true;
            } else {
                r.pending.push("Step 2: the substance timeline.");
            }
        } else {
            r.pending.push("Step 2: substance or medication.");
        }

        // Step 3. Medical. Delirium, dementia and medical causes come before
        // any primary psychotic disorder.
        if (a.delirium === "yes") {
            r.trail.push("Disturbed, fluctuating attention and awareness: psychotic symptoms within delirium belong to the delirium.");
            r.ruleOut.delirium = "Possible";
            r.suggestion = suggest(null, "Delirium (substance-related or due to a medical condition), with psychotic symptoms as part of it");
            return finish(a, r);
        }
        if (a.delirium === "no") r.ruleOut.delirium = "Excluded";
        if (a.delirium === "unsure") r.ruleOut.delirium = "Investigating";
        if (!a.delirium) r.pending.push("Step 3: delirium.");

        if (a.cognitive === "yes") {
            r.trail.push("Cognitive decline predates the psychosis.");
            r.ruleOut.structural = "Investigating";
            r.suggestion = suggest(null, "Major or mild neurocognitive disorder with psychotic disturbance (ICD-11 dementia code plus 6D86.0 Psychotic symptoms in dementia)");
            return finish(a, r);
        }
        if (a.medical === "yes") {
            r.trail.push("A medical condition explains the psychosis in timing and nature.");
            r.suggestion = suggest("medical");
            return finish(a, r);
        }
        if (a.medical === "flags") {
            r.trail.push("Red flags for a medical cause: investigate before settling on a primary diagnosis.");
            r.ruleOut.encephalitis = "Investigating";
            alt("medical");
        } else if (a.medical === "no") {
            r.trail.push("No medical cause identified.");
            exclude("medical");
        } else if (a.cognitive !== "yes") {
            r.pending.push("Step 3: a medical cause.");
        }

        if (r.suggestion && !substanceProvisional) return finish(a, r);

        // Steps 4 and 5. Primary psychotic disorders.
        const primary = resolvePrimary(a, r, alt, exclude);
        if (substanceProvisional) {
            r.suggestion = suggest("substance-induced", null, true);
            if (primary && primary.cardId) {
                alt(primary.cardId);
                r.also.push(`If symptoms last about a month or more after stopping: ${primary.label}.`);
            }
        } else if (primary) {
            r.suggestion = primary;
        }
        if (!r.suggestion && (a.feigned === "external" || a.feigned === "internal")) {
            r.suggestion = suggest("feigning", a.feigned === "external" ? "Malingering (ICD-11 QC30)" : "Factitious disorder imposed on self (ICD-11 6D50)");
        }
        return finish(a, r);
    }

    function resolvePrimary(a, r, alt, exclude) {
        const sx = Array.isArray(a.symptoms) ? a.symptoms : [];
        if (!sx.length) {
            r.pending.push("Step 4: which symptoms are present.");
            return null;
        }
        if (sx.includes("delusions") && a.ocdBdd === "yes") {
            r.trail.push("The fixed beliefs are confined to OCD or BDD content.");
            exclude("delusional");
            return suggest("other", "OCD or body dysmorphic disorder, with absent insight / delusional beliefs");
        }
        // Minor hallucinations that fit a delusion don't count towards schizophrenia.
        const effective = (sx.includes("delusions") && a.halMinor === "yes") ? sx.filter(s => s !== "hallucinations") : sx;
        const core = effective.filter(s => CORE.includes(s));
        const criterionA = effective.length >= 2 && core.length >= 1;
        r.trail.push(`Symptoms: ${effective.map(s => SYMPTOM_WORDS[s]).join(", ")}.`);

        if (!core.length) {
            r.trail.push("No delusions, hallucinations or disorganised speech, so a psychotic disorder is not established.");
            return suggest("other", "Psychotic disorder not established: consider negative symptoms of depression, autism, schizotypal traits, or catatonia");
        }

        if (!a.mood) r.pending.push("Step 4: mood episodes.");
        if (!a.duration) {
            r.pending.push("Step 4: total duration.");
            return null;
        }

        // Psychosis only within mood episodes: a mood disorder with psychotic features.
        if (a.mood === "depressive" || a.mood === "manic") {
            if (!a.moodOnly) {
                r.pending.push("Step 4: whether psychosis happens only during mood episodes.");
                return null;
            }
            if (a.moodOnly === "yes") {
                r.trail.push("Psychotic symptoms happen only during mood episodes.");
                ["schizoaffective", "schizophrenia", "schizophreniform", "delusional", "brief"].forEach(exclude);
                return suggest(a.mood === "manic" ? "bipolar" : "depression");
            }
            if (criterionA && a.psychWithoutMood === "yes" && a.moodShare === "yes") {
                r.trail.push("At least 2 weeks of psychosis without mood symptoms, and mood episodes for most of the illness.");
                ["bipolar", "depression", "schizophrenia", "schizophreniform"].forEach(exclude);
                r.also.push("DSM-5-TR judges this across the whole illness; ICD-11 looks at the current episode (both sets of symptoms together, or within a few days).");
                return suggest("schizoaffective", `Schizoaffective disorder, ${a.mood === "manic" ? "bipolar" : "depressive"} type (ICD-11 6A21)`);
            }
            if (!a.psychWithoutMood || !a.moodShare) {
                r.pending.push("Step 4: how mood episodes and psychosis overlap.");
                return null;
            }
            exclude("schizoaffective");
            if (a.psychWithoutMood === "no") {
                r.trail.push("Psychosis has never lasted 2 weeks without a mood episode.");
                alt(a.mood === "manic" ? "bipolar" : "depression");
            } else {
                r.trail.push("Mood episodes have taken up less than half of the illness.");
            }
        }

        if (a.mood === "none") ["bipolar", "depression", "schizoaffective"].forEach(exclude);

        let result = null;
        const dur = a.duration;
        if (criterionA) {
            exclude("delusional");
            if (dur === "6m+") {
                r.trail.push("Two or more core symptoms, and the illness has lasted 6 months or more.");
                exclude("schizophreniform");
                exclude("brief");
                result = suggest("schizophrenia");
                if (a.function === "no") r.also.push("DSM-5-TR schizophrenia needs a decline in functioning; ICD-11 does not.");
            } else if (dur === "1-3m" || dur === "3-6m") {
                r.trail.push("Two or more core symptoms, lasting 1 to under 6 months.");
                exclude("brief");
                alt("schizophrenia");
                result = suggest("schizophreniform");
                r.also.push("ICD-11 would code schizophrenia (6A20) once symptoms have lasted 1 month." +
                    (dur === "1-3m" ? " If onset was abrupt with rapidly changing symptoms, ICD-11 6A23 (up to 3 months) also fits." : ""));
            } else if (dur === "1d-1m") {
                r.trail.push("Two or more core symptoms, lasting under 1 month.");
                exclude("schizophrenia");
                result = briefResult(a, r, alt);
            } else {
                r.trail.push("Symptoms lasting under a day.");
                result = suggest("other-specified");
            }
        } else if (effective.length === 1 && effective[0] === "delusions") {
            if (dur === "1d-1m") {
                r.trail.push("Delusions only, lasting under 1 month.");
                result = briefResult(a, r, alt);
            } else if (dur === "lt1d") {
                result = suggest("other-specified");
            } else if (a.function === "yes") {
                r.trail.push("Delusions only, but functioning is markedly impaired, which doesn't fit delusional disorder.");
                result = suggest("other-specified");
            } else if (!a.function) {
                r.pending.push("Step 4: whether functioning is markedly impaired.");
            } else if ((a.mood === "depressive" || a.mood === "manic") && a.moodShare === "yes") {
                r.trail.push("Mood episodes have not been brief compared with the delusional periods.");
                result = suggest("other-specified");
            } else {
                r.trail.push("Delusions only, lasting 1 month or more, with functioning largely intact.");
                result = suggest("delusional");
                if (dur === "1-3m") r.also.push("ICD-11 delusional disorder needs about 3 months; reassess then.");
            }
        } else {
            // A single positive symptom other than delusions.
            if (dur === "1d-1m") {
                r.trail.push("A single psychotic symptom, lasting under 1 month.");
                result = briefResult(a, r, alt);
            } else {
                r.trail.push("A single psychotic symptom, without the other features of a specific disorder.");
                result = suggest("other-specified");
            }
        }

        // Mood episodes alongside schizophrenia or delusional disorder that
        // don't amount to schizoaffective disorder get their own diagnosis.
        if (result && ["schizophrenia", "schizophreniform", "delusional"].includes(result.cardId) &&
            (a.mood === "depressive" || a.mood === "manic")) {
            if (a.moodOutside === "yes") {
                r.also.push("A mood episode happened outside the psychotic illness: add the full mood diagnosis (bipolar I or II, or major depressive disorder).");
            } else if (a.moodOutside === "no") {
                r.also.push("Mood episodes happened only within the psychotic illness: add other specified (or unspecified) bipolar or depressive disorder.");
            } else {
                r.pending.push("Step 4: whether any mood episode happened outside the psychotic illness.");
            }
        }
        return result;
    }

    function briefResult(a, r, alt) {
        if (a.returned === "yes") {
            r.trail.push("Full return to their usual self.");
            return suggest("brief");
        }
        if (a.returned === "not-yet") {
            alt("schizophreniform");
            r.also.push("Not yet recovered: brief psychotic disorder is provisional. If symptoms pass 1 month, reconsider schizophreniform disorder.");
            return suggest("brief", null, true);
        }
        r.pending.push("Step 4: whether they have returned to their usual self.");
        return null;
    }

    function finish(a, r) {
        const signs = Array.isArray(a.catatonia) ? a.catatonia.filter(s => s !== "none") : [];
        if (signs.length >= 3) {
            r.ruleOut.catatonia = "Possible";
            r.trail.push(`Catatonia: ${signs.length} of 12 signs.`);
            r.also.push("Catatonia (3 or more signs): code catatonia associated with the main diagnosis (ICD-11 6A40). Exclude neuroleptic malignant syndrome and medical causes; consider a lorazepam challenge.");
            if (!r.suggestion) r.suggestion = suggest(null, "Catatonia, cause not yet identified: look for an underlying psychiatric or medical condition");
        } else if (signs.length > 0) {
            r.ruleOut.catatonia = "Possible";
            r.also.push("1 to 2 catatonic signs is below the threshold of 3. Check for medication-induced movement disorders (neuroleptic malignant syndrome, acute dystonia, parkinsonism).");
        } else if (Array.isArray(a.catatonia) && a.catatonia.includes("none")) {
            r.ruleOut.catatonia = "Excluded";
        }

        const other = Array.isArray(a.otherFit) ? a.otherFit : [];
        const otherWords = { ptsd: "PTSD", autism: "autism", bpd: "borderline personality disorder" };
        const named = other.filter(o => otherWords[o]).map(o => otherWords[o]);
        if (named.length) {
            r.also.push(`Consider whether ${named.join(", ")} explains the experiences better.`);
            if (!r.alternatives.includes("other")) r.alternatives.push("other");
        }
        if (other.includes("lifelong")) {
            r.also.push("A lifelong pattern without sustained psychosis points to schizotypal (or paranoid) personality traits.");
            if (!r.alternatives.includes("schizotypal")) r.alternatives.push("schizotypal");
        }
        if (r.suggestion && r.suggestion.cardId) {
            r.alternatives = r.alternatives.filter(id => id !== r.suggestion.cardId);
            r.excluded = r.excluded.filter(id => id !== r.suggestion.cardId);
        }
        return r;
    }

    const SYMPTOM_WORDS = {
        delusions: "delusions", hallucinations: "hallucinations", speech: "disorganised speech",
        behaviour: "disorganised or catatonic behaviour", negative: "negative symptoms"
    };

    const api = { questions: QUESTIONS, evaluate, labels: LABELS };
    root.PSYCHOSIS_FLOW = api;
    root.REASONING_FLOWS = Object.assign(root.REASONING_FLOWS || {}, { psychosis: api });
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
