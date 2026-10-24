/* =========================================================================
 * Guided differentials for sleep problems and for eating or weight change.
 * Same stepwise order as the other flows; steps 1-3 come from
 * reasoning-flow-kit.js. Rules are written from the DSM-5-TR criteria in our
 * own words, with ICD-11 differences noted. They suggest; the clinician
 * decides.
 * ========================================================================= */

(function (root) {
    "use strict";

    const K = root.REASONING_FLOW_KIT || require("./reasoning-flow-kit.js");
    const { YES_NO, YES_NO_UNSURE, picked, newResult, helpers } = K;

    function finish(r) {
        if (r.suggestion && r.suggestion.cardId) {
            const keep = id => id !== r.suggestion.cardId && !(r.additional || []).includes(id);
            r.alternatives = r.alternatives.filter(keep);
            r.excluded = r.excluded.filter(keep);
        }
        return r;
    }

    /* -------------------------------------------------------------- sleep */

    const SLEEP_BASE = {
        subject: "the sleep problem",
        change: "the sleep problem",
        disorder: "sleep disorder",
        medicalHint: "For example pain, nocturia, heart failure, COPD or asthma, reflux, hyperthyroidism, menopause; for sleepiness also hypothyroidism, head injury, Parkinson's disease.",
        extraTiming: null,
        medical: "Sleep problem due to a medical condition: treat the cause, and treat the sleep problem too if it persists",
        dementia: "Sleep disturbance with a major or mild neurocognitive disorder (often an irregular sleep-wake rhythm, ICD-11 7A62)",
        inducedNote: "Reassess once the substance or medication has been stopped or changed. Check caffeine, alcohol and the timing of doses."
    };
    const SLEEP_INDUCED = {
        insomnia: "Substance/medication-induced sleep disorder, insomnia type",
        sleepiness: "Substance/medication-induced sleep disorder, daytime sleepiness type (ICD-11 7A24)",
        episodes: "Substance/medication-induced sleep disorder, parasomnia type"
    };
    const sleepSpec = a => Object.assign({}, SLEEP_BASE, { induced: SLEEP_INDUCED[a.complaint] || SLEEP_INDUCED.insomnia });

    const sleepClinical = a => ["insomnia", "sleepiness", "episodes"].includes(a.complaint);
    const is = kind => a => a.complaint === kind;
    // Whether the questions after steps 1-3 still matter.
    const sleepReachable = a => sleepClinical(a) && K.primaryReachable(Object.assign({}, a, { explained: "clinical" }));

    // The kit's gates ask "explained === 'clinical'"; here step 0 is the
    // complaint, so each gate's showIf is re-pointed at it.
    const sleepGates = K.gateQuestions(SLEEP_BASE).map(q => {
        const show = q.showIf;
        return Object.assign({}, q, { showIf: a => sleepClinical(a) && show(Object.assign({}, a, { explained: "clinical" })) });
    });
    sleepGates[0] = Object.assign({}, sleepGates[0], {
        hint: "Clues: reports that don't match a sleep diary or what others see; requests for hypnotics or stimulants; a work, legal or disability context."
    });

    const insomniaOn = a => sleepReachable(a) && a.complaint === "insomnia";
    const sleepyOn = a => sleepReachable(a) && a.complaint === "sleepiness";
    const episodesOn = a => sleepReachable(a) && a.complaint === "episodes";
    // Insomnia and sleepiness go on to the other sleep disorders, then the
    // mental disorders, then the disorder's own criteria. Each step waits
    // until the one before has not explained the problem.
    const insomniaPast = {
        opportunity: a => insomniaOn(a) && a.opportunity === "yes",
        rls: a => insomniaOn(a) && a.opportunity === "yes" && a.rls === "no"
    };
    const sleepyPast = {
        short: a => sleepyOn(a) && a.shortSleep === "no",
        osa: a => sleepyOn(a) && a.shortSleep === "no" && a.osa !== "yes"
    };
    const otherSleepAsked = a => insomniaPast.rls(a) || sleepyPast.osa(a);
    const circadianPast = a => otherSleepAsked(a) && a.circadian === "no";
    const narcolepsyPast = a => a.complaint !== "sleepiness" || a.cataplexy === "no" || a.cataplexy === "attacks";
    const mentalAsked = a => circadianPast(a) && narcolepsyPast(a) && (a.complaint !== "insomnia" || a.mania === "no");
    const episodeImpairAsked = a => episodesOn(a) && a.episode && a.episode !== "seizure" && !(a.episode === "nightmares" && a.trauma !== "no");
    const criteriaAsked = a => mentalAsked(a) && (a.mental === "none" || (a.mental && a.mental !== "none" && a.predominant === "yes"));

    const SLEEP_QUESTIONS = [
        {
            id: "complaint", step: "0 · What is the problem?", type: "choice",
            text: "What is the main complaint?",
            options: [
                { value: "insomnia", label: "Trouble getting to sleep, staying asleep, or waking too early" },
                { value: "sleepiness", label: "Too sleepy in the day, or sleeping too long" },
                { value: "episodes", label: "Unusual behaviour or experiences during sleep" }
            ]
        },
        {
            id: "drowsy", step: "0 · What is the problem?", type: "choice",
            text: "Have they fallen asleep, or nearly, while driving or using machinery?",
            options: YES_NO,
            showIf: a => a.complaint === "insomnia" || a.complaint === "sleepiness"
        },
        {
            id: "injury", step: "0 · What is the problem?", type: "choice",
            text: "Has anyone been hurt, or nearly, during the episodes (themselves or a bed partner)?",
            options: YES_NO,
            showIf: is("episodes")
        }
    ].concat(sleepGates, [
        {
            id: "episode", step: "4 · What happens in the episodes?", type: "choice",
            text: "Which fits best?",
            options: [
                { value: "rbd", label: "Acts out dreams (shouts, punches, kicks), later in the night, wakes alert and recalls the dream" },
                { value: "nrem", label: "Sleepwalking, confused arousals or night terrors, early in the night, little memory of it" },
                { value: "nightmares", label: "Repeated frightening dreams, wakes fully alert and remembers them" },
                { value: "paralysis", label: "Can't move on falling asleep or waking, sometimes with hallucinations" },
                { value: "eating", label: "Eats while partly asleep, with little memory of it" },
                { value: "seizure", label: "Brief stereotyped episodes at any time of night, maybe several a night, tongue biting or incontinence" }
            ],
            showIf: episodesOn
        },
        {
            id: "trauma", step: "4 · What happens in the episodes?", type: "choice",
            text: "Are the nightmares about, or did they start after, a traumatic event?",
            options: YES_NO,
            showIf: a => episodesOn(a) && a.episode === "nightmares"
        },
        {
            id: "opportunity", step: "4 · Another sleep disorder?", type: "choice",
            text: "Do they have enough time, and a suitable place, to sleep?",
            hint: "Noise, an unsafe home, caring duties at night or a crowded ward mean poor sleep without insomnia disorder.",
            options: YES_NO,
            showIf: insomniaOn
        },
        {
            id: "shortSleep", step: "4 · Another sleep disorder?", type: "choice",
            text: "Are they sleeping less than they need most nights (work, caring, screens), and does the sleepiness go when they catch up?",
            options: YES_NO,
            showIf: sleepyOn
        },
        {
            id: "osa", step: "4 · Another sleep disorder?", type: "choice",
            text: "Loud snoring, witnessed pauses in breathing, choking awakenings, or morning headaches?",
            options: YES_NO_UNSURE,
            showIf: a => insomniaPast.opportunity(a) || (sleepyOn(a) && a.shortSleep === "no")
        },
        {
            id: "rls", step: "4 · Another sleep disorder?", type: "choice",
            text: "An urge to move the legs, with unpleasant feelings, worse at rest and in the evening, eased by moving?",
            options: YES_NO,
            showIf: a => insomniaPast.opportunity(a) && a.osa !== undefined
        },
        {
            id: "circadian", step: "4 · Another sleep disorder?", type: "choice",
            text: "Is sleep normal when they can sleep at the times they prefer, but those times don't fit what they need?",
            options: [
                { value: "late", label: "Yes: falls asleep and wakes much later than needed" },
                { value: "early", label: "Yes: falls asleep and wakes much earlier than needed" },
                { value: "irregular", label: "No regular pattern: sleep broken up across the 24 hours" },
                { value: "shift", label: "Yes: because of shift work" },
                { value: "no", label: "No" }
            ],
            showIf: otherSleepAsked
        },
        {
            id: "cataplexy", step: "4 · Another sleep disorder?", type: "choice",
            text: "Irresistible sleep attacks? And sudden brief weakness (knees buckling, jaw dropping) triggered by laughing or strong emotion?",
            options: [
                { value: "cataplexy", label: "Sleep attacks with that weakness (cataplexy)" },
                { value: "attacks", label: "Sleep attacks only" },
                { value: "no", label: "Neither" }
            ],
            showIf: a => sleepyOn(a) && circadianPast(a)
        },
        {
            id: "mania", step: "5 · Part of a mental disorder?", type: "choice",
            text: "Sleeping much less without feeling tired, with high energy (reduced need for sleep)?",
            options: YES_NO,
            showIf: a => insomniaOn(a) && circadianPast(a)
        },
        {
            id: "mental", step: "5 · Part of a mental disorder?", type: "choice",
            text: "Is it happening with another mental disorder?",
            options: [
                { value: "depression", label: "Depression" },
                { value: "bipolar", label: "Bipolar disorder (in a depressive phase)" },
                { value: "anxiety", label: "An anxiety disorder or PTSD" },
                { value: "psychosis", label: "A psychotic disorder" },
                { value: "none", label: "None" }
            ],
            showIf: mentalAsked
        },
        {
            id: "predominant", step: "5 · Part of a mental disorder?", type: "choice",
            text: "Is the sleep problem severe enough to need attention in its own right (a main complaint, or still there when the disorder is treated)?",
            options: YES_NO,
            showIf: a => mentalAsked(a) && a.mental && a.mental !== "none"
        },
        {
            id: "hyperSx", step: "6 · Is it a sleep disorder?", type: "choice",
            text: "Despite 7 hours or more of sleep: lapses into sleep in the day, a long (over 9 hours) unrefreshing main sleep, or trouble being fully awake after waking?",
            hint: "Sleepiness means falling asleep. Tiredness or low energy without dozing is fatigue: think of depression, anaemia, thyroid disease or medication.",
            options: YES_NO,
            showIf: a => sleepyOn(a) && criteriaAsked(a)
        },
        {
            id: "freq", step: "6 · Is it a sleep disorder?", type: "choice",
            text: "At least 3 nights (or days) a week?",
            options: YES_NO,
            showIf: a => criteriaAsked(a) && (a.complaint === "insomnia" || a.hyperSx === "yes")
        },
        {
            id: "duration", step: "6 · Is it a sleep disorder?", type: "choice",
            text: "How long has it been going on?",
            options: [
                { value: "under1", label: "Under 1 month" },
                { value: "1to3", label: "1 to 3 months" },
                { value: "3plus", label: "3 months or more" }
            ],
            showIf: a => criteriaAsked(a) && (a.complaint === "insomnia" || a.hyperSx === "yes")
        },
        {
            id: "impair", step: "6 · Is it a sleep disorder?", type: "choice",
            text: "Does it cause distress or daytime problems (fatigue, mood, concentration, work, safety)?",
            options: YES_NO,
            showIf: a => (criteriaAsked(a) && (a.complaint === "insomnia" || a.hyperSx === "yes")) || episodeImpairAsked(a)
        }
    ]);

    const MENTAL = {
        depression: { label: "depression", flow: "depressed", sleepy: "Hypersomnia associated with depression (ICD-11 7A25); consider atypical features" },
        bipolar: { label: "bipolar depression", flow: "depressed", sleepy: "Hypersomnia associated with bipolar depression (ICD-11 7A25)" },
        anxiety: { label: "the anxiety disorder or PTSD", flow: "anxiety", sleepy: "Sleepiness associated with an anxiety disorder (ICD-11 7A25)" },
        psychosis: { label: "the psychotic disorder", flow: "psychosis", sleepy: "Sleepiness associated with a psychotic disorder (ICD-11 7A25); check antipsychotic sedation" }
    };
    const CIRCADIAN = {
        late: "Circadian rhythm sleep-wake disorder, delayed sleep phase type (ICD-11 7A60)",
        early: "Circadian rhythm sleep-wake disorder, advanced sleep phase type (ICD-11 7A61)",
        irregular: "Circadian rhythm sleep-wake disorder, irregular sleep-wake type (ICD-11 7A62)",
        shift: "Circadian rhythm sleep-wake disorder, shift work type (ICD-11 7A64)"
    };
    const EPISODES = {
        rbd: ["rbd", "REM sleep behaviour disorder (ICD-11 7B01.0)"],
        nrem: ["nrem", "Non-REM sleep arousal disorder: sleepwalking or sleep terror type (ICD-11 7B00)"],
        nightmares: ["nightmare", "Nightmare disorder (ICD-11 7B01.2)"],
        paralysis: ["paralysis", "Recurrent isolated sleep paralysis (ICD-11 7B01.1; DSM-5-TR other specified sleep-wake disorder)"],
        eating: ["nrem", "Non-REM sleep arousal disorder, sleepwalking type with sleep-related eating (ICD-11 7B00.3)"]
    };

    function evaluateSleep(answers) {
        const a = answers || {};
        const r = newResult();
        r.additional = [];
        const h = helpers(r);

        if (!sleepClinical(a)) {
            r.pending.push("Start with step 0: the main complaint.");
            return r;
        }
        const urgent = [];
        if (a.drowsy === "yes") {
            r.ruleOut.driving = "Possible";
            urgent.push("Falling asleep while driving or using machinery: advise not to drive until assessed and treated (Austroads, Assessing Fitness to Drive), and document the advice.");
        } else if (a.drowsy === "no") {
            r.ruleOut.driving = "Excluded";
        }
        if (a.injury === "yes") {
            urgent.push("Injury risk during sleep: make the bedroom safe (clear the floor, pad sharp edges, lock doors and windows, bed partner sleeps apart) while it is assessed.");
        }
        if (urgent.length) r.urgent = urgent.join(" ");

        const spec = sleepSpec(a);
        const gate = K.evaluateGates(Object.assign({}, a, { explained: "clinical" }), r, h, spec);
        if (gate === "stop") return finish(r);

        let result;
        if (a.complaint === "episodes") result = evaluateEpisodes(a, r, h);
        else result = evaluateInsomniaOrSleepiness(a, r, h);

        if (gate === "provisional") {
            if (r.suggestion && r.suggestion.cardId) {
                h.alt(r.suggestion.cardId);
                r.also.push(`Once the substance or medication is stopped or changed, if it persists: ${r.suggestion.label}.`);
            }
            r.suggestion = h.suggest("substance-induced", spec.induced, true);
            r.additional = [];
        }
        if (!r.suggestion && (a.feigned === "external" || a.feigned === "internal")) {
            r.suggestion = h.suggest("feigning", a.feigned === "external" ? "Malingering (ICD-11 QC30)" : "Factitious disorder imposed on self (ICD-11 6D50)");
        }
        return finish(result);
    }

    function evaluateEpisodes(a, r, h) {
        const ep = a.episode;
        if (!ep) {
            r.pending.push("Step 4: what happens in the episodes.");
            return r;
        }
        if (ep === "seizure") {
            r.trail.push("Brief stereotyped episodes at any time of night.");
            r.ruleOut.seizure = "Investigating";
            r.suggestion = h.suggest(null, "Possible nocturnal epilepsy: get video of the episodes, an EEG and a neurology review");
            return r;
        }
        r.ruleOut.seizure = "Excluded";
        const [cardId, label] = EPISODES[ep];
        if (ep === "nightmares" && a.trauma === "yes") {
            r.trail.push("Nightmares linked to a traumatic event.");
            r.suggestion = h.suggest(null, "Nightmares as part of PTSD or another trauma-related disorder");
            h.alt("nightmare");
            r.also.push("Work out the trauma-related disorder with the Anxiety questions. Diagnose nightmare disorder too only if the nightmares need treatment in their own right.");
            r.switchTo = "anxiety";
            return r;
        }
        if (ep === "nightmares" && !a.trauma) r.pending.push("Step 4: whether the nightmares are trauma-related.");
        if (a.impair === "no") {
            r.trail.push("Episodes without significant distress, impairment or risk.");
            r.suggestion = h.suggest("none", "No sleep-wake disorder: occasional episodes without distress or impairment (common, especially in childhood)");
            h.alt(cardId);
            return r;
        }
        if (!a.impair) r.pending.push("Step 6: distress or impairment.");
        r.trail.push({
            rbd: "Dream enactment later in the night, waking alert.",
            nrem: "Arousals early in the night with little memory of them.",
            nightmares: "Recurrent frightening dreams, waking fully alert.",
            paralysis: "Recurrent inability to move at sleep onset or on waking.",
            eating: "Eating while partly asleep, with little memory."
        }[ep]);
        r.suggestion = h.suggest(cardId, label);
        if (ep === "rbd") {
            r.also.push("Confirm with a sleep study. Check for an antidepressant trigger. Most people with idiopathic REM sleep behaviour disorder later develop Parkinson's disease, Lewy body dementia or multiple system atrophy: discuss and arrange follow-up.");
            h.alt("nrem");
        } else if (ep === "nrem" || ep === "eating") {
            r.also.push("Look for triggers: sleep loss, alcohol, z-drugs, sleep apnoea." +
                (ep === "eating" ? " Night eating syndrome is different: the person is fully awake and remembers it (an other specified eating disorder)." : ""));
            h.alt("rbd");
        } else if (ep === "paralysis") {
            r.also.push("Ask about daytime sleepiness and cataplexy: sleep paralysis with hallucinations is common in narcolepsy.");
            h.alt("narcolepsy");
        } else if (ep === "nightmares") {
            r.also.push("Imagery rehearsal therapy is the main treatment. Nightmares raise suicide risk: ask about it.");
        }
        return r;
    }

    function evaluateInsomniaOrSleepiness(a, r, h) {
        const insomnia = a.complaint === "insomnia";

        // Step 4. Opportunity, then the other sleep disorders.
        if (insomnia) {
            if (a.opportunity === "no") {
                r.trail.push("Not enough time or a suitable place to sleep.");
                r.suggestion = h.suggest("none", "Not insomnia disorder: poor sleep from inadequate opportunity or environment (address the cause)");
                return r;
            }
            if (!a.opportunity) { r.pending.push("Step 4: opportunity to sleep."); return r; }
            r.trail.push("Enough opportunity to sleep.");
        } else {
            if (a.shortSleep === "yes") {
                r.trail.push("Sleeping less than needed, with sleepiness that goes on catching up.");
                r.suggestion = h.suggest("insufficient", "Insufficient sleep (ICD-11 7A26 Insufficient sleep syndrome; not a DSM-5-TR disorder)");
                h.exclude("hypersomnolence");
                return r;
            }
            if (!a.shortSleep) { r.pending.push("Step 4: whether they are getting enough sleep."); return r; }
            h.exclude("insufficient");
        }

        if (a.osa === "yes" || a.osa === "unsure") {
            r.ruleOut.osa = "Investigating";
            if (!insomnia && a.osa === "yes") {
                r.trail.push("Snoring, witnessed apnoeas or choking awakenings with daytime sleepiness.");
                r.suggestion = h.suggest("breathing", "Suspected obstructive sleep apnoea (ICD-11 7A41): confirm with a sleep study", true);
                r.also.push("Arrange a sleep study (STOP-BANG to triage). Treating the apnoea may resolve the sleepiness and low mood; reassess sleepiness after treatment.");
                return r;
            }
            h.alt("breathing");
            r.also.push(insomnia
                ? "Possible sleep apnoea: arrange a sleep study. Insomnia and sleep apnoea often co-occur (COMISA); diagnose both if the insomnia needs attention in its own right."
                : "Possible sleep apnoea: arrange a sleep study.");
        } else if (a.osa === "no") {
            r.ruleOut.osa = "Excluded";
            h.exclude("breathing");
        } else {
            r.pending.push("Step 4: sleep apnoea.");
            return r;
        }

        if (insomnia) {
            if (a.rls === "yes") {
                r.trail.push("Urge to move the legs, worse at rest and in the evening, eased by moving.");
                r.ruleOut.rls = "Possible";
                r.suggestion = h.suggest("rls", "Restless legs syndrome (ICD-11 7A80)");
                r.also.push("Check iron studies: AASM (2024) advises iron when ferritin is 75 µg/L or below or transferrin saturation under 20%. Review antidepressants, antipsychotics and antihistamines. Rule out akathisia, cramps and neuropathy.");
                h.alt("insomnia");
                return r;
            }
            if (!a.rls) { r.pending.push("Step 4: restless legs."); return r; }
            r.ruleOut.rls = "Excluded";
            h.exclude("rls");
        }

        if (CIRCADIAN[a.circadian]) {
            r.trail.push("Sleep is normal at the preferred times, but those times don't fit what is needed.");
            r.suggestion = h.suggest("circadian", CIRCADIAN[a.circadian]);
            r.also.push("Confirm with a 2-week sleep diary or actigraphy. Timed light and melatonin shift the body clock.");
            return r;
        }
        if (!a.circadian) { r.pending.push("Step 4: the timing of sleep."); return r; }
        h.exclude("circadian");

        if (!insomnia) {
            if (a.cataplexy === "cataplexy") {
                r.trail.push("Sleep attacks with cataplexy.");
                r.suggestion = h.suggest("narcolepsy", "Narcolepsy, probably type 1 (with cataplexy; ICD-11 7A20.0): confirm with a sleep study and MSLT", true);
                r.also.push("Refer to a sleep physician. Sleep-onset hallucinations can be mistaken for psychosis. Fitness to drive applies.");
                h.exclude("hypersomnolence");
                return r;
            }
            if (a.cataplexy === "attacks") {
                r.trail.push("Sleep attacks without cataplexy.");
                h.alt("narcolepsy");
                r.also.push("Sleep study and MSLT are needed to separate narcolepsy type 2 from hypersomnolence disorder.");
            } else if (a.cataplexy === "no") {
                h.exclude("narcolepsy");
            } else {
                r.pending.push("Step 4: sleep attacks and cataplexy.");
                return r;
            }
        }

        // Step 5. Part of a mental disorder?
        if (insomnia) {
            if (a.mania === "yes") {
                r.trail.push("Reduced need for sleep with high energy.");
                r.ruleOut.mania = "Possible";
                r.suggestion = h.suggest("mental", "Reduced need for sleep within a manic or hypomanic episode (not insomnia)");
                r.also.push("Work this through with the Elevated mood questions.");
                r.switchTo = "elevated";
                return r;
            }
            if (!a.mania) { r.pending.push("Step 5: reduced need for sleep."); return r; }
            r.ruleOut.mania = "Excluded";
        }
        const mental = MENTAL[a.mental];
        if (mental) {
            if (a.predominant === "no") {
                r.trail.push(`The sleep problem is part of ${mental.label} and doesn't need attention on its own.`);
                r.suggestion = h.suggest("mental", insomnia ? `Insomnia as a symptom of ${mental.label}` : mental.sleepy);
                r.also.push(`Treat ${mental.label}, and review sleep: if it persists, consider insomnia disorder and CBT-I. Work out the disorder with the ${{ depressed: "Depressed mood", anxiety: "Anxiety", psychosis: "Psychosis" }[mental.flow]} questions.`);
                r.switchTo = mental.flow;
                h.alt(insomnia ? "insomnia" : "hypersomnolence");
                return r;
            }
            if (a.predominant === "yes") {
                r.trail.push(`Occurs with ${mental.label}, but needs attention in its own right.`);
                r.additional.push("mental");
            } else {
                r.pending.push("Step 5: whether the sleep problem needs attention in its own right.");
                return r;
            }
        } else if (a.mental === "none") {
            h.exclude("mental");
        } else {
            r.pending.push("Step 5: other mental disorders.");
            return r;
        }

        // Step 6. The disorder's own criteria.
        if (!insomnia) {
            if (a.hyperSx === "no") {
                r.trail.push("No true excessive sleepiness despite enough sleep.");
                r.suggestion = h.suggest("none", "No sleep-wake disorder identified: consider fatigue rather than sleepiness");
                r.also.push("Fatigue points to depression, anaemia, thyroid disease, medication, or deconditioning.");
                return r;
            }
            if (!a.hyperSx) { r.pending.push("Step 6: sleepiness despite enough sleep."); return r; }
        }
        if (a.impair === "no") {
            r.trail.push("No significant distress or daytime impairment.");
            r.suggestion = h.suggest("none", insomnia
                ? "No sleep-wake disorder: short or broken sleep without daytime impact"
                : "No sleep-wake disorder: long sleep without daytime impact");
            r.additional = [];
            return r;
        }
        if (!a.freq || !a.duration || !a.impair) {
            r.pending.push("Step 6: frequency, duration and impact.");
            return r;
        }
        const full = a.freq === "yes" && a.duration === "3plus";
        if (insomnia) {
            if (full) {
                r.trail.push("Insomnia at least 3 nights a week for 3 months or more, with daytime impact.");
                r.suggestion = h.suggest("insomnia", "Insomnia disorder, persistent (ICD-11 7A00 Chronic insomnia)");
                h.exclude("short-insomnia");
            } else {
                r.trail.push(a.duration === "3plus"
                    ? "Insomnia for 3 months or more, but on fewer than 3 nights a week."
                    : "Insomnia for under 3 months, with daytime impact.");
                r.suggestion = h.suggest("short-insomnia", a.duration === "3plus"
                    ? "Other specified insomnia disorder, restricted to fewer nights (ICD-11 7A00 asks for several times a week: check)"
                    : "Short-term insomnia (ICD-11 7A01; DSM-5-TR other specified insomnia disorder, brief)");
                h.alt("insomnia");
                if (a.duration !== "3plus") r.also.push("Often follows a stressor and settles. Treat early with CBT-I principles to stop it becoming chronic.");
            }
            r.also.push("CBT-I is first-line, including when insomnia occurs with depression or another condition. Ask about suicidal thoughts: insomnia is an independent risk factor.");
        } else {
            if (full) {
                r.trail.push("Excessive sleepiness despite enough sleep, at least 3 times a week for 3 months or more.");
                r.suggestion = h.suggest("hypersomnolence", "Hypersomnolence disorder (ICD-11: idiopathic hypersomnia 7A21 is the closest category)",
                    a.osa === "unsure" || a.cataplexy === "attacks");
            } else {
                r.trail.push("Excessive sleepiness, below the frequency or duration threshold.");
                r.suggestion = h.suggest("hypersomnolence", "Other specified hypersomnolence disorder (below the frequency or duration threshold)", true);
            }
            r.also.push("A sleep study is needed to exclude sleep apnoea and narcolepsy before settling on this.");
        }
        if (r.additional.length) {
            r.also.unshift(`Also diagnose ${MENTAL[a.mental].label}: both are recorded when the sleep problem needs attention in its own right.`);
        }
        return r;
    }

    /* ------------------------------------------------------------- eating */

    const EATING_SPEC = {
        subject: "the change in eating or weight",
        change: "the eating change",
        disorder: "eating disorder",
        medicalHint: "Weight loss: hyperthyroidism, diabetes, coeliac or inflammatory bowel disease, cancer, Addison's disease, HIV. Weight gain: hypothyroidism, Cushing's syndrome. Red flags: weight loss without wanting it, no concern about weight or shape, GI bleeding, dysphagia.",
        extraTiming: null,
        induced: "Appetite or weight change due to a substance or medication (record the substance or medication effect)",
        medical: "Appetite or weight change due to a medical condition (not an eating disorder)",
        dementia: "Eating change with a major or mild neurocognitive disorder (e.g. frontotemporal dementia, or forgetting to eat)",
        inducedNote: "Review whether the medication can be changed; for antipsychotic weight gain, consider metformin and lifestyle support."
    };

    const eatingClinical = a => !!a.problem;
    const gateable = a => a.problem && a.problem !== "nonfood" && a.problem !== "regurg";
    const eatingReachable = a => gateable(a) && K.primaryReachable(Object.assign({}, a, { explained: "clinical" }));
    const eatingGates = K.gateQuestions(EATING_SPEC).map(q => {
        const show = q.showIf;
        return Object.assign({}, q, { showIf: a => gateable(a) && show(Object.assign({}, a, { explained: "clinical" })) });
    });

    const pr = list => a => eatingReachable(a) && list.includes(a.problem) && a.psychosisFood !== "yes";
    const weightAsked = pr(["restrict", "binge", "purge"]);
    const anAsked = a => weightAsked(a) && (a.lowWeight === "yes" || a.problem === "restrict");
    const bingeAsked = a => weightAsked(a) && a.problem === "binge" && a.lowWeight === "no";

    const INSTABILITY = [
        { value: "hr", label: "Heart rate under 40, or a rise over 20 on standing" },
        { value: "bp", label: "BP under 90/60, or a postural drop over 20" },
        { value: "temp", label: "Temperature under 35.5 °C" },
        { value: "bloods", label: "Low potassium, phosphate, sodium or glucose" },
        { value: "ecg", label: "QTc over 460 ms, or arrhythmia" },
        { value: "bmi", label: "BMI under 14, or rapid weight loss" },
        { value: "none", label: "None of these" }
    ];

    const EATING_QUESTIONS = [
        {
            id: "problem", step: "0 · What is the problem?", type: "choice",
            text: "Which fits best?",
            options: [
                { value: "restrict", label: "Restricting food, with low weight or weight loss" },
                { value: "binge", label: "Episodes of eating with loss of control (binges)" },
                { value: "purge", label: "Vomiting, laxatives or other purging, without binges" },
                { value: "avoid", label: "Avoiding or limiting foods for reasons other than weight or shape" },
                { value: "nonfood", label: "Eating non-food substances" },
                { value: "regurg", label: "Repeatedly bringing food back up and re-chewing it" },
                { value: "loss", label: "Weight loss or poor appetite, without trying to lose weight" },
                { value: "gain", label: "Weight gain or increased appetite, without binges" }
            ]
        },
        {
            id: "unstable", step: "1 · Medical safety first", type: "multi",
            text: "Any signs of medical instability? (Adult thresholds; tick all that apply.)",
            hint: "Young people have stricter thresholds (e.g. heart rate under 50, BP under 80/40). Check lying and standing observations, ECG and electrolytes.",
            options: INSTABILITY,
            showIf: a => ["restrict", "binge", "purge", "avoid", "loss"].includes(a.problem)
        }
    ].concat(eatingGates, [
        {
            id: "psychosisFood", step: "4 · Part of another disorder?", type: "choice",
            text: "Is food avoided because of delusions (e.g. that it is poisoned or contaminated)?",
            options: YES_NO,
            showIf: a => eatingReachable(a) && ["restrict", "avoid", "loss"].includes(a.problem)
        },
        {
            id: "mood", step: "4 · Part of another disorder?", type: "choice",
            text: "Is the appetite change part of a mood episode?",
            options: [
                { value: "depression", label: "Yes: depression (low mood or loss of interest for 2 weeks or more)" },
                { value: "mania", label: "Yes: mania or hypomania (too busy or energetic to eat)" },
                { value: "no", label: "No" }
            ],
            showIf: a => eatingReachable(a) && ((a.problem === "loss" && a.psychosisFood === "no") || a.problem === "gain")
        },
        {
            id: "nightEating", step: "5 · Which eating pattern?", type: "choice",
            text: "Much of the eating happens late in the evening or after waking at night, fully awake and remembered?",
            options: YES_NO,
            showIf: a => eatingReachable(a) && a.problem === "gain" && a.mood === "no"
        },
        {
            id: "lowWeight", step: "5 · Which eating pattern?", type: "choice",
            text: "Is weight significantly low (adult BMI under 18.5, or below the expected range for age in young people)?",
            options: YES_NO,
            showIf: weightAsked
        },
        {
            id: "bmi", step: "5 · Which eating pattern?", type: "choice",
            text: "Current adult BMI?",
            options: [
                { value: "17", label: "17 or more" },
                { value: "16", label: "16 to 16.99" },
                { value: "15", label: "15 to 15.99" },
                { value: "14", label: "14 to 14.99" },
                { value: "under14", label: "Under 14" }
            ],
            showIf: a => weightAsked(a) && a.lowWeight === "yes"
        },
        {
            id: "fear", step: "5 · Which eating pattern?", type: "choice",
            text: "Intense fear of gaining weight, or persistent behaviour that stops weight gain?",
            options: YES_NO,
            showIf: anAsked
        },
        {
            id: "image", step: "5 · Which eating pattern?", type: "choice",
            text: "Weight or shape drives their self-worth, or they don't recognise how serious the low weight is?",
            options: YES_NO,
            showIf: anAsked
        },
        {
            id: "bingePurge", step: "5 · Which eating pattern?", type: "choice",
            text: "In the last 3 months, recurrent binge eating or purging?",
            options: YES_NO,
            showIf: a => anAsked(a) && a.lowWeight === "yes" && a.problem === "restrict"
        },
        {
            id: "compensate", step: "5 · Which eating pattern?", type: "choice",
            text: "Regular compensatory behaviour after binges (vomiting, laxatives, diuretics, fasting, excessive exercise)?",
            options: YES_NO,
            showIf: bingeAsked
        },
        {
            id: "shapeWeight", step: "5 · Which eating pattern?", type: "choice",
            text: "Is self-worth unduly influenced by body shape or weight?",
            options: YES_NO,
            showIf: a => (bingeAsked(a) && a.compensate === "yes") || (weightAsked(a) && a.problem === "purge" && a.lowWeight === "no")
        },
        {
            id: "bedFeatures", step: "5 · Which eating pattern?", type: "choice",
            text: "Binges with marked distress, and 3 or more of: eating fast, until uncomfortably full, when not hungry, alone from embarrassment, disgusted, low or guilty after?",
            options: YES_NO,
            showIf: a => bingeAsked(a) && a.compensate === "no"
        },
        {
            id: "weekly", step: "5 · Which eating pattern?", type: "choice",
            text: "How often, on average?",
            options: [
                { value: "under1", label: "Less than once a week" },
                { value: "1to3", label: "1 to 3 times a week" },
                { value: "4to7", label: "4 to 7 times a week" },
                { value: "8to13", label: "8 to 13 times a week" },
                { value: "14plus", label: "14 or more times a week" }
            ],
            showIf: a => bingeAsked(a) && a.compensate !== undefined
        },
        {
            id: "months", step: "5 · Which eating pattern?", type: "choice",
            text: "For how long?",
            options: [
                { value: "under1", label: "Under 1 month" },
                { value: "1to3", label: "1 to 3 months" },
                { value: "3plus", label: "3 months or more" }
            ],
            showIf: a => bingeAsked(a) && a.compensate !== undefined
        },
        {
            id: "avoidImpact", step: "5 · Which eating pattern?", type: "choice",
            text: "Has it led to weight loss or faltering growth, a nutritional deficiency, dependence on supplements or tube feeds, or marked interference with daily life?",
            options: YES_NO,
            showIf: a => eatingReachable(a) && a.problem === "avoid" && a.psychosisFood === "no"
        },
        {
            id: "avoidShape", step: "5 · Which eating pattern?", type: "choice",
            text: "Is any of it driven by concern about body weight or shape?",
            options: YES_NO,
            showIf: a => eatingReachable(a) && a.problem === "avoid" && a.psychosisFood === "no"
        },
        {
            id: "picaCriteria", step: "5 · Which eating pattern?", type: "choice",
            text: "For a month or more, inappropriate for developmental level (usually over age 2), and not a cultural or religious practice?",
            options: YES_NO,
            showIf: a => a.problem === "nonfood"
        },
        {
            id: "rumCriteria", step: "5 · Which eating pattern?", type: "choice",
            text: "For a month or more, and not explained by a gastrointestinal condition (reflux, gastroparesis, pyloric stenosis)?",
            options: YES_NO,
            showIf: a => a.problem === "regurg"
        }
    ]);

    const SEVERITY = {
        "1to3": "mild (1–3 a week)", "4to7": "moderate (4–7 a week)", "8to13": "severe (8–13 a week)", "14plus": "extreme (14 or more a week)"
    };
    const BMI_SEVERITY = { "17": "mild", "16": "moderate", "15": "severe", "14": "extreme", under14: "extreme" };

    function evaluateEating(answers) {
        const a = answers || {};
        const r = newResult();
        r.additional = [];
        const h = helpers(r);

        if (!eatingClinical(a)) {
            r.pending.push("Start with step 0: what the problem is.");
            return r;
        }

        const unstable = picked(a, "unstable");
        if (unstable.length) {
            r.ruleOut.instability = "Possible";
            r.urgent = "Signs of medical instability: arrange urgent medical assessment and admission (RANZCP 2014, archived). Refeed cautiously with thiamine and phosphate, and check phosphate, potassium and magnesium daily for the first 1–2 weeks (refeeding syndrome). If they refuse and lack capacity, the Mental Health Act or guardianship may apply.";
        } else if (Array.isArray(a.unstable) && a.unstable.includes("none")) {
            r.ruleOut.instability = "Excluded";
        } else if (["restrict", "binge", "purge", "avoid", "loss"].includes(a.problem)) {
            r.pending.push("Step 1: medical instability.");
        }

        if (a.problem === "nonfood") return finish(evaluatePica(a, r, h));
        if (a.problem === "regurg") return finish(evaluateRumination(a, r, h));

        const gate = K.evaluateGates(Object.assign({}, a, { explained: "clinical" }), r, h, EATING_SPEC);
        if (gate === "stop") return finish(r);

        if (a.psychosisFood === "yes") {
            r.trail.push("Food is avoided because of delusions.");
            r.suggestion = h.suggest("psychosis", "Food refusal driven by delusions (not an eating disorder)");
            r.also.push("Work this through with the Psychosis questions.");
            r.switchTo = "psychosis";
            return finish(r);
        }
        if (a.psychosisFood === "no") h.exclude("psychosis");

        if (a.problem === "loss" || a.problem === "gain") evaluateLossOrGain(a, r, h);
        else if (a.problem === "avoid") evaluateAvoid(a, r, h);
        else evaluateWeightShape(a, r, h);

        if (gate === "provisional") {
            if (r.suggestion && r.suggestion.cardId) {
                h.alt(r.suggestion.cardId);
                r.also.push(`If it persists once the substance or medication is stopped or changed: ${r.suggestion.label}.`);
            }
            r.suggestion = h.suggest("substance-induced", EATING_SPEC.induced, true);
        }
        if (!r.suggestion && (a.feigned === "external" || a.feigned === "internal")) {
            r.suggestion = h.suggest("feigning", a.feigned === "external" ? "Malingering (ICD-11 QC30)" : "Factitious disorder imposed on self (ICD-11 6D50)");
        }
        return finish(r);
    }

    function evaluateLossOrGain(a, r, h) {
        const loss = a.problem === "loss";
        if (loss && !a.psychosisFood) { r.pending.push("Step 4: delusions about food."); return; }
        if (a.mood === "depression") {
            r.trail.push(`${loss ? "Poor appetite" : "Increased appetite"} within a depressive episode.`);
            r.suggestion = h.suggest("mood", loss
                ? "Appetite and weight loss within a depressive episode"
                : "Increased appetite and weight within a depressive episode (consider 'with atypical features')");
            r.also.push("Work this through with the Depressed mood questions.");
            r.switchTo = "depressed";
            return;
        }
        if (a.mood === "mania") {
            r.trail.push("Not eating because of the energy and activity of mania or hypomania.");
            r.suggestion = h.suggest("mood", "Reduced eating within a manic or hypomanic episode");
            r.also.push("Work this through with the Elevated mood questions.");
            r.switchTo = "elevated";
            return;
        }
        if (!a.mood) { r.pending.push("Step 4: mood episodes."); return; }
        h.exclude("mood");
        if (loss) {
            r.trail.push("Weight loss without a psychiatric explanation.");
            r.suggestion = h.suggest("medical", "Unexplained weight loss: keep investigating for a medical cause");
            r.ruleOut.neuro = "Investigating";
            r.also.push("Without weight or shape concern, an eating disorder is unlikely. Check collateral history: some people hide restriction.");
            h.alt("an");
            return;
        }
        if (a.nightEating === "yes") {
            r.trail.push("Much of the eating is late in the evening or at night, fully awake and remembered.");
            r.suggestion = h.suggest("osfed", "Night eating syndrome (other specified feeding or eating disorder, ICD-11 6B8Y)");
            r.also.push("If they are only partly awake with little memory, consider sleep-related eating (a parasomnia) instead.");
            return;
        }
        if (!a.nightEating) { r.pending.push("Step 5: night eating."); return; }
        r.trail.push("Weight gain without binges or a mental disorder explaining it.");
        r.suggestion = h.suggest("none", "No feeding or eating disorder: weight gain not explained by a mental disorder (review medications and medical causes)");
    }

    function evaluateAvoid(a, r, h) {
        if (!a.psychosisFood) { r.pending.push("Step 4: delusions about food."); return; }
        if (a.avoidShape === "yes") {
            r.trail.push("Food avoidance driven by weight or shape concern.");
            r.suggestion = h.suggest("an", "Not ARFID: weight or shape concern points to anorexia nervosa or another eating disorder", true);
            r.also.push("Answer step 0 as 'Restricting food' to work through anorexia nervosa.");
            h.exclude("arfid");
            return;
        }
        if (a.avoidImpact === "no" && a.avoidShape === "no") {
            r.trail.push("Selective or limited eating without significant consequences.");
            r.suggestion = h.suggest("none", "No feeding or eating disorder: selective eating without significant consequences");
            return;
        }
        if (a.avoidImpact === "yes" && a.avoidShape === "no") {
            r.trail.push("Avoidant or restrictive eating with significant consequences, without weight or shape concern.");
            r.suggestion = h.suggest("arfid", "Avoidant/restrictive food intake disorder (ICD-11 6B83)");
            r.also.push("Record the driver: low interest in food, sensory features, or fear of choking or vomiting. With autism, anxiety or a medical condition, diagnose ARFID only if the eating problem needs attention in its own right.");
            h.exclude("an");
            return;
        }
        r.pending.push("Step 5: the impact, and any weight or shape concern.");
    }

    function evaluateWeightShape(a, r, h) {
        if (!a.lowWeight) { r.pending.push("Step 5: whether weight is significantly low."); return; }
        const low = a.lowWeight === "yes";

        if (low || a.problem === "restrict") {
            if (!a.fear || !a.image) { r.pending.push("Step 5: fear of weight gain and body image."); return; }
            const both = a.fear === "yes" && a.image === "yes";
            const either = a.fear === "yes" || a.image === "yes";
            if (low && either) {
                const bp = a.problem !== "restrict" || a.bingePurge === "yes";
                if (a.problem === "restrict" && !a.bingePurge) r.pending.push("Step 5: binge eating or purging in the last 3 months.");
                if (!a.bmi) r.pending.push("Step 5: current BMI.");
                const icd = a.bmi === "under14" ? "6B80.1 dangerously low body weight" : "6B80.0 significantly low body weight";
                const severity = a.bmi ? `, ${BMI_SEVERITY[a.bmi]}` : "";
                const type = bp ? "binge-eating/purging type" : "restricting type";
                r.trail.push("Significantly low weight, with " + (both
                    ? "fear of weight gain and weight or shape driving self-worth."
                    : "one of fear of weight gain or a disturbed experience of weight or shape."));
                r.suggestion = h.suggest("an", `Anorexia nervosa, ${type}${severity} (ICD-11 ${icd})`, !both);
                if (!both) r.also.push("DSM-5-TR needs both fear of weight gain (or behaviour that prevents gain) and a disturbed experience of weight or shape. Ask again with collateral history: denial is common. ICD-11 treats fear of weight gain as typical rather than required.");
                ["bn", "bed", "arfid"].forEach(h.exclude);
                r.also.push("Check refeeding risk before increasing intake. Ask about suicide: about half of deaths in anorexia nervosa are suicide.");
                return;
            }
            if (low && !either) {
                r.trail.push("Low weight without fear of weight gain or weight or shape concern.");
                r.suggestion = h.suggest("arfid", "Possible avoidant/restrictive food intake disorder (ICD-11 6B83), or a medical cause", true);
                r.also.push("Ask why they restrict: low interest, sensory features or fear of choking or vomiting point to ARFID. Otherwise investigate a medical cause.");
                if (!r.excluded.includes("medical")) h.alt("medical");
                h.alt("an");
                return;
            }
            if (!low && either && a.problem === "restrict") {
                r.trail.push("Restriction with weight or shape concern, but weight not significantly low.");
                r.suggestion = h.suggest("osfed", "Atypical anorexia nervosa (other specified feeding or eating disorder, ICD-11 6B8Y)");
                r.also.push("Atypical anorexia nervosa can be just as medically unstable: check vital signs and electrolytes.");
                h.alt("an");
                return;
            }
            if (!low && a.problem === "restrict") {
                r.trail.push("Restriction without low weight or weight or shape concern.");
                r.suggestion = h.suggest("arfid", "Possible avoidant/restrictive food intake disorder (ICD-11 6B83)", true);
                r.also.push("Check the impact on nutrition and daily life, and the reason for restricting.");
                return;
            }
        }

        if (a.problem === "purge") {
            if (!a.shapeWeight) { r.pending.push("Step 5: weight and shape concern."); return; }
            r.trail.push("Purging without binges, at a normal weight.");
            r.suggestion = h.suggest("osfed", a.shapeWeight === "yes"
                ? "Purging disorder (other specified feeding or eating disorder, ICD-11 6B8Y)"
                : "Purging without weight or shape concern: consider rumination, a GI cause or another reason", a.shapeWeight !== "yes");
            r.also.push("Check potassium, and ask about laxative and diuretic misuse.");
            return;
        }

        // Binge eating at a normal weight.
        if (!a.compensate || !a.weekly || !a.months) { r.pending.push("Step 5: compensatory behaviour, frequency and duration."); return; }
        const weekly = a.weekly !== "under1";
        const months3 = a.months === "3plus";
        const sev = SEVERITY[a.weekly] ? `, ${SEVERITY[a.weekly]}` : "";
        if (a.compensate === "yes") {
            if (!a.shapeWeight) { r.pending.push("Step 5: weight and shape concern."); return; }
            h.exclude("bed");
            if (weekly && months3 && a.shapeWeight === "yes") {
                r.trail.push("Binges and compensatory behaviour at least weekly for 3 months, with weight or shape driving self-worth.");
                r.suggestion = h.suggest("bn", `Bulimia nervosa${sev} (ICD-11 6B81)`);
            } else if (weekly && a.months === "1to3" && a.shapeWeight === "yes") {
                r.trail.push("Binges and compensatory behaviour at least weekly for 1 to 3 months.");
                r.suggestion = h.suggest("osfed", "Bulimia nervosa of limited duration (DSM-5-TR other specified feeding or eating disorder)");
                r.also.push("This meets ICD-11 bulimia nervosa (6B81), which asks for at least 1 month.");
                h.alt("bn");
            } else {
                r.trail.push("Binges and compensatory behaviour, below the threshold for bulimia nervosa.");
                r.suggestion = h.suggest("osfed", "Other specified feeding or eating disorder (bulimia nervosa of low frequency or limited duration)");
                h.alt("bn");
            }
            r.also.push("Check potassium if vomiting or using laxatives or diuretics. Ask about suicide and self-harm.");
            return;
        }
        h.exclude("bn");
        if (!a.bedFeatures) { r.pending.push("Step 5: features of the binges."); return; }
        if (a.bedFeatures === "yes" && weekly && months3) {
            r.trail.push("Distressing binges with loss of control, at least weekly for 3 months, without regular compensatory behaviour.");
            r.suggestion = h.suggest("bed", `Binge-eating disorder${sev} (ICD-11 6B82)`);
            r.also.push("CBT-E or guided self-help CBT is first-line. Screen for depression and metabolic complications.");
        } else if (a.bedFeatures === "yes") {
            r.trail.push("Distressing binges, below the frequency or duration threshold.");
            r.suggestion = h.suggest("osfed", "Other specified feeding or eating disorder (binge-eating disorder of low frequency or limited duration)");
            h.alt("bed");
        } else {
            r.trail.push("Overeating episodes without the distress or features of binge-eating disorder.");
            r.suggestion = h.suggest("none", "No feeding or eating disorder: overeating without the features of binge-eating disorder");
            h.alt("bed");
        }
    }

    function evaluatePica(a, r, h) {
        if (!a.picaCriteria) { r.pending.push("Step 5: duration and context."); return r; }
        if (a.picaCriteria === "yes") {
            r.trail.push("Eating non-food substances for a month or more, inappropriate for age and not a cultural practice.");
            r.suggestion = h.suggest("pica", "Pica (ICD-11 6B84)");
            r.also.push("Check iron studies, lead and pregnancy; consider bowel obstruction and poisoning. With intellectual disability, autism or psychosis, diagnose pica only if it needs attention in its own right.");
        } else {
            r.trail.push("Below the threshold for pica (brief, developmentally normal or culturally sanctioned).");
            r.suggestion = h.suggest("none", "No feeding or eating disorder");
        }
        return r;
    }

    function evaluateRumination(a, r, h) {
        if (!a.rumCriteria) { r.pending.push("Step 5: duration and GI causes."); return r; }
        if (a.rumCriteria === "yes") {
            r.trail.push("Repeated regurgitation for a month or more, without a GI cause.");
            r.suggestion = h.suggest("rumination", "Rumination disorder (ICD-11 6B85 Rumination-regurgitation disorder)");
            r.also.push("Diaphragmatic breathing (behavioural treatment) is first-line. If it happens only during anorexia, bulimia, binge-eating disorder or ARFID, it isn't diagnosed separately.");
        } else {
            r.trail.push("Regurgitation that is brief or explained by a GI condition.");
            r.suggestion = h.suggest("medical", "Regurgitation due to a gastrointestinal condition (refer to gastroenterology)", true);
        }
        return r;
    }

    const flows = {
        sleep: { questions: SLEEP_QUESTIONS, evaluate: evaluateSleep },
        eating: { questions: EATING_QUESTIONS, evaluate: evaluateEating }
    };
    root.REASONING_FLOWS = Object.assign(root.REASONING_FLOWS || {}, flows);
    if (typeof module !== "undefined" && module.exports) module.exports = flows;
})(typeof window !== "undefined" ? window : globalThis);
