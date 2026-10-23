/* =========================================================================
 * Shared pieces of the guided differentials (reasoning-flow-mood.js,
 * reasoning-flow-anxiety.js): steps 1-3 (feigned symptoms, substance or
 * medication, medical condition), which every presentation asks in the
 * same order, plus small helpers. Each flow passes its own wording.
 * ========================================================================= */

(function (root) {
    "use strict";

    const YES_NO = [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }];
    const YES_NO_UNSURE = [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "unsure", label: "Unsure" }];
    const picked = (a, id) => (Array.isArray(a[id]) ? a[id].filter(v => v !== "none") : []);

    // Steps 1-3. spec gives the wording for this presentation:
    //   subject      what is being explained ("low mood")
    //   change       what began ("the mood change")
    //   medicalHint  examples and red flags for the medical question
    //   extraTiming  an extra substance-timeline option, or null
    function gateQuestions(spec) {
        const timing = [
            { value: "during", label: "Began during or soon after use, and hasn't outlasted it by about a month" },
            { value: "before", label: "Began before the substance use" },
            { value: "persisted", label: "Has lasted about a month or more after stopping" },
            { value: "early", label: "Too early to tell (still using, or stopped under a month ago)" }
        ];
        if (spec.extraTiming) timing.splice(3, 0, spec.extraTiming);
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
                text: `Was there substance use, withdrawal, or a medication that can cause ${spec.subject}, around the time it began?`,
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
                text: `Has there been a decline in memory or other thinking skills, from before ${spec.change}?`,
                options: YES_NO_UNSURE,
                showIf: a => reachable(a) && a.delirium !== "yes"
            },
            {
                id: "medical", step: "3 · Medical condition", type: "choice",
                text: `Is there a medical condition whose timing and nature could directly cause the ${spec.subject}?`,
                hint: spec.medicalHint,
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
    // question can't be settled yet, otherwise null. spec gives the labels:
    //   induced, medical, dementia   suggestion labels for those causes
    //   disorder                     "mood disorder", "anxiety disorder"
    //   change                       "the mood change"
    function evaluateGates(a, r, h, spec) {
        const labels = spec;

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
                r.also.push(spec.inducedNote || "Reassess about a month after stopping.");
                state = "stop";
            } else if (a.subTiming === "before" || a.subTiming === "persisted") {
                r.trail.push(a.subTiming === "before"
                    ? `Began before the substance use, so an independent ${spec.disorder} is likely.`
                    : `Has lasted about a month or more after stopping, so an independent ${spec.disorder} is likely.`);
                r.ruleOut.substance = "Excluded";
                h.exclude("substance-induced");
            } else if (a.subTiming === "treatment") {
                r.trail.push("Began on an antidepressant or ECT but persists at full strength beyond its effect: this counts as a true episode.");
                r.ruleOut.medication = "Excluded";
                h.exclude("substance-induced");
            } else if (a.subTiming === "early") {
                r.trail.push(`Too early to separate a substance-induced from an independent ${spec.disorder}.`);
                r.ruleOut.substance = "Possible";
                state = "provisional";
            } else {
                r.pending.push("Step 2: the substance timeline.");
            }
        } else {
            r.pending.push("Step 2: substance or medication.");
        }

        if (a.delirium === "yes") {
            r.trail.push(`Disturbed, fluctuating attention and awareness: ${spec.change} belongs to the delirium.`);
            r.ruleOut.delirium = "Possible";
            r.suggestion = h.suggest(null, "Delirium (substance-related or due to a medical condition)");
            return "stop";
        }
        if (a.delirium === "no") r.ruleOut.delirium = "Excluded";
        if (a.delirium === "unsure") r.ruleOut.delirium = "Investigating";
        if (!a.delirium) r.pending.push("Step 3: delirium.");

        if (a.cognitive === "yes") {
            r.trail.push(`Cognitive decline predates ${spec.change}.`);
            r.ruleOut.neuro = "Investigating";
            r.suggestion = h.suggest(null, labels.dementia);
            return "stop";
        }
        if (a.medical === "yes") {
            r.trail.push(`A medical condition directly explains ${spec.change}.`);
            r.suggestion = h.suggest("medical", labels.medical);
            return "stop";
        }
        if (a.medical === "flags") {
            r.trail.push(`Red flags for a medical cause: investigate before settling on a primary ${spec.disorder}.`);
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

    const kit = { YES_NO, YES_NO_UNSURE, picked, gateQuestions, primaryReachable, newResult, helpers, evaluateGates };
    root.REASONING_FLOW_KIT = kit;
    if (typeof module !== "undefined" && module.exports) module.exports = kit;
})(typeof window !== "undefined" ? window : globalThis);
