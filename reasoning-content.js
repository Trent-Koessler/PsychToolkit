/* =========================================================================
 * Clinical reasoning content for the Patient Review Workspace "Reasoning" tab:
 * the differential diagnosis helper and the suicide risk formulation.
 * Rendering lives in reasoning-ui.js.
 *
 * Everything here is written in our own words. DSM-5-TR criteria are
 * summarised, never quoted (the text is copyrighted). ICD-11 codes and names
 * are WHO's. "check" marks a point that could not be verified against the
 * primary source when this was drafted; it is shown to the clinician until
 * the content is reviewed and the check removed.
 * ========================================================================= */

window.REASONING_CONTENT = {
    // Set to true once a clinician has reviewed every entry below.
    reviewed: false,

    differentials: {
        psychosis: {
            name: "Psychosis",
            // Step 1: causes to exclude before calling it a primary psychotic disorder.
            ruleOut: [
                {
                    id: "delirium",
                    name: "Delirium",
                    clues: "Fluctuating attention or consciousness, disorientation, visual hallucinations, abnormal vital signs.",
                    tests: "4AT or CAM, vital signs, confusion screen."
                },
                {
                    id: "substance",
                    name: "Substance intoxication or withdrawal",
                    clues: "Methamphetamine, cannabis (including high-potency and synthetic), hallucinogens; alcohol, benzodiazepine or GHB withdrawal. Get the timeline of use against symptom onset.",
                    tests: "UDS, BAL, collateral on use."
                },
                {
                    id: "medication",
                    name: "Medication-induced",
                    clues: "Corticosteroids, dopamine agonists and levodopa, prescribed stimulants, anticholinergic load.",
                    tests: "Medication review, including recent changes."
                },
                {
                    id: "encephalitis",
                    name: "Autoimmune encephalitis",
                    clues: "Acute or subacute onset, catatonia, seizures, dyskinesias, autonomic instability, fluctuating consciousness, focal signs, hyponatraemia, recent viral-like illness, severe sensitivity to antipsychotics (Pollak et al. 2020).",
                    tests: "With neurology: EEG, MRI, lumbar puncture with CSF antibodies (more sensitive than serum for anti-NMDAR)."
                },
                {
                    id: "epilepsy",
                    name: "Epilepsy (especially temporal lobe)",
                    clues: "Paroxysmal or episodic symptoms, olfactory or visual hallucinations, automatisms, post-ictal confusion.",
                    tests: "EEG."
                },
                {
                    id: "structural",
                    name: "Structural or neurodegenerative brain disease",
                    clues: "Focal neurological signs, headache, head injury, onset in later life, cognitive decline.",
                    tests: "MRI brain (preferred to CT for a first episode)."
                },
                {
                    id: "metabolic",
                    name: "Endocrine, metabolic or nutritional",
                    clues: "Thyroid disease, calcium, glucose or sodium disturbance, B12 or folate deficiency; Wilson's disease (under 40 with liver or neurological signs); porphyria.",
                    tests: "TSH, EUC, calcium, glucose, B12, folate; ceruloplasmin and urinary copper if indicated."
                },
                {
                    id: "infection",
                    name: "Infection",
                    clues: "HIV, syphilis, systemic infection causing delirium.",
                    tests: "HIV and syphilis serology, FBC, CRP."
                },
                {
                    id: "catatonia",
                    name: "Catatonia (check for it)",
                    clues: "Mutism, stupor, posturing, negativism, echophenomena, waxy flexibility. Common, often missed, and treatable.",
                    tests: "Bush-Francis Catatonia Rating Scale; lorazepam challenge."
                }
            ],
            // Step 2: the primary psychiatric differentials.
            differentials: [
                {
                    id: "substance-induced",
                    code: "ICD-11 6C4x.6, by substance",
                    name: "Substance/medication-induced psychotic disorder",
                    dsm: "Substance/medication-induced psychotic disorder",
                    icd: "6C46.6 stimulant-induced (incl. methamphetamine), 6C45.6 cocaine-induced, 6C41.6 cannabis-induced, 6C40.6 alcohol-induced psychotic disorder",
                    supports: "Onset during or soon after intoxication, withdrawal or a new medication; settles with abstinence.",
                    keyQuestion: "Did symptoms start before the substance use, or last about a month or more after stopping? Either points to an independent psychotic disorder.",
                    note: "About a third of people with substance-induced psychosis later convert to schizophrenia or bipolar disorder, most often after cannabis (Starzer et al. 2018). Treat the label as provisional.",
                    check: "Confirm the ICD-11 codes 6C41.6 (cannabis) and 6C40.6 (alcohol). 6C46.6 and 6C45.6 were confirmed."
                },
                {
                    id: "schizophrenia",
                    code: "ICD-11 6A20",
                    name: "Schizophrenia",
                    dsm: "Schizophrenia",
                    icd: "6A20 Schizophrenia",
                    supports: "Two or more of delusions, hallucinations, disorganised speech, disorganised or catatonic behaviour, negative symptoms (at least one of the first three); functional decline; no mood episode that explains it.",
                    keyQuestion: "How long has the illness lasted, including the prodrome?",
                    dsmIcd: "DSM-5-TR needs 6 months of disturbance (at least 1 month active) and functional decline. ICD-11 needs 1 month of symptoms and does not require functional impairment."
                },
                {
                    id: "schizophreniform",
                    code: "DSM-5-TR only",
                    name: "Schizophreniform disorder",
                    dsm: "Schizophreniform disorder",
                    icd: "No ICD-11 equivalent: 6A20 if symptoms have lasted 1 month or more, otherwise consider 6A23",
                    supports: "Schizophrenia-like symptoms for at least 1 month but under 6 months; functional decline not required.",
                    keyQuestion: "Has it been between 1 and 6 months? Reassess as the 6-month mark passes.",
                    dsmIcd: "A DSM-only category, created by DSM's 6-month rule for schizophrenia."
                },
                {
                    id: "brief",
                    code: "ICD-11 6A23",
                    name: "Brief psychotic disorder / acute and transient psychotic disorder",
                    dsm: "Brief psychotic disorder",
                    icd: "6A23 Acute and transient psychotic disorder",
                    supports: "Sudden onset, often after a major stressor or postpartum; symptoms change rapidly; full return to previous functioning.",
                    keyQuestion: "Was onset abrupt, and has the person returned fully to their usual self?",
                    dsmIcd: "DSM-5-TR: at least 1 day and under 1 month. ICD-11: onset within 2 weeks, rapidly changing symptoms, lasting no more than 3 months (usually days to a month)."
                },
                {
                    id: "schizoaffective",
                    code: "ICD-11 6A21",
                    name: "Schizoaffective disorder",
                    dsm: "Schizoaffective disorder",
                    icd: "6A21 Schizoaffective disorder",
                    supports: "Psychotic symptoms and a major mood episode occurring together.",
                    keyQuestion: "Has there been psychosis without mood symptoms, and how much of the illness have mood episodes taken up?",
                    dsmIcd: "DSM-5-TR looks across the whole illness: at least 2 weeks of delusions or hallucinations without a mood episode, and mood episodes present for most of the illness. ICD-11 looks at the current episode: schizophrenia and mood symptoms in the same episode, together or within a few days of each other."
                },
                {
                    id: "delusional",
                    code: "ICD-11 6A24",
                    name: "Delusional disorder",
                    dsm: "Delusional disorder",
                    icd: "6A24 Delusional disorder",
                    supports: "One or more delusions; no prominent hallucinations or disorganisation (perceptions linked to the delusion can occur); functioning largely intact apart from the delusion.",
                    keyQuestion: "Apart from the delusion and its effects, is the person functioning and behaving normally?",
                    dsmIcd: "DSM-5-TR needs 1 month. ICD-11 needs about 3 months, without a concurrent mood episode."
                },
                {
                    id: "bipolar",
                    code: "ICD-11 6A60",
                    name: "Bipolar I disorder with psychotic features",
                    dsm: "Bipolar I disorder, with psychotic features",
                    icd: "6A60 Bipolar type I disorder (current episode with psychotic symptoms)",
                    supports: "Elevated or irritable mood, reduced need for sleep, pressured speech, grandiosity, increased activity; psychosis often mood-congruent.",
                    keyQuestion: "Did the psychotic symptoms occur only during mood episodes?"
                },
                {
                    id: "depression",
                    code: "ICD-11 6A70/6A71",
                    name: "Depressive episode with psychotic features",
                    dsm: "Major depressive disorder, with psychotic features",
                    icd: "6A70 Single episode or 6A71 Recurrent depressive disorder (with psychotic symptoms)",
                    supports: "Low mood, anhedonia, psychomotor change; delusions of guilt, poverty, illness or nihilism.",
                    keyQuestion: "Did the psychotic symptoms occur only during the depressive episode?"
                },
                {
                    id: "medical",
                    code: "ICD-11 6E61",
                    name: "Psychosis due to another medical condition",
                    dsm: "Psychotic disorder due to another medical condition",
                    icd: "6E61 Secondary psychotic syndrome",
                    supports: "A medical cause from step 1 that explains the psychosis in time course and mechanism.",
                    keyQuestion: "Is there a medical condition whose timing fits, and does treating it help?",
                    check: "Confirm the ICD-11 code 6E61."
                },
                {
                    id: "other-specified",
                    code: "ICD-11 6A2Y",
                    name: "Other specified psychotic disorder",
                    dsm: "Other specified (or unspecified) schizophrenia spectrum and other psychotic disorder",
                    icd: "6A2Y Other specified primary psychotic disorder",
                    supports: "Clinically significant psychosis that doesn't meet full criteria for a specific disorder, e.g. persistent hallucinations alone, or delusions with mood episodes that aren't brief.",
                    keyQuestion: "Which criterion is missing, and could more time or information settle it?",
                    check: "Confirm the ICD-11 code 6A2Y."
                },
                {
                    id: "feigning",
                    code: "ICD-11 QC30 / 6D50",
                    name: "Feigned symptoms (malingering or factitious disorder)",
                    dsm: "Malingering (a condition for clinical attention, not a mental disorder) · Factitious disorder imposed on self",
                    icd: "QC30 Malingering · 6D50 Factitious disorder imposed on self",
                    supports: "Symptoms that look textbook or stereotyped, change with who is watching, or don't match observed behaviour; an external incentive (malingering) or none obvious (factitious).",
                    keyQuestion: "Is there an external gain, and do the reported symptoms match what is observed over time?",
                    note: "Feigning can sit alongside genuine illness. Record the observations behind the concern, not just the label."
                },
                {
                    id: "schizotypal",
                    code: "ICD-11 6A22",
                    name: "Schizotypal disorder",
                    dsm: "Schizotypal personality disorder",
                    icd: "6A22 Schizotypal disorder",
                    supports: "Long-standing eccentricity, odd beliefs, unusual perceptions and social anxiety, without sustained psychosis.",
                    keyQuestion: "Is this a lifelong pattern rather than a new episode?",
                    dsmIcd: "DSM-5-TR lists it as a personality disorder (and in the schizophrenia spectrum chapter). ICD-11 classes it as a primary psychotic disorder."
                },
                {
                    id: "other",
                    name: "Other conditions that can look like psychosis",
                    dsm: "e.g. OCD or body dysmorphic disorder with absent insight; PTSD; borderline personality disorder; autism spectrum disorder",
                    icd: "",
                    supports: "Beliefs held with absent insight within OCD or BDD; trauma-related re-experiencing; brief stress-related paranoia or dissociation; literal or idiosyncratic thinking in autism.",
                    keyQuestion: "Does the experience fit better within the person's other diagnosis?",
                    dsmIcd: "With autism, DSM-5-TR adds schizophrenia only if prominent delusions or hallucinations have lasted at least 1 month."
                }
            ]
        }
    },

    suicide: {
        // Shown with the formulation. Mirrors NICE NG225 and the vault note.
        intro: "A formulation to guide care, not a low/medium/high rating. Rating scales and risk tiers predict poorly and should not decide who gets treatment or discharge (NICE NG225, 2022).",
        acute: [
            { id: "intent-means", label: "Ongoing intent with access to means, or an interrupted attempt" },
            { id: "intoxicated", label: "Intoxicated: reassess when sober" },
            { id: "psychotic", label: "Command hallucinations, nihilistic delusions or agitated psychotic depression" },
            { id: "recent-discharge", label: "Recently discharged from a psychiatric unit" },
            { id: "cannot-engage", label: "Risk driven by treatable illness and the person cannot engage voluntarily (consider the Mental Health Act)" }
        ],
        // Why this person: risk compared with others (Pisani et al.: risk status).
        status: [
            "Previous suicide attempt", "Repeated self-harm", "Family history of suicide", "Male",
            "Childhood abuse or adversity", "Serious mental illness", "Substance use disorder",
            "Chronic physical illness or pain", "Previous psychiatric admission"
        ],
        // Why now: risk compared with their own baseline (risk state).
        // "target" marks drivers that treatment can change.
        state: [
            { label: "Current suicidal ideation" },
            { label: "Planning or preparation" },
            { label: "Suicide attempt this presentation" },
            { label: "Hopelessness", target: true },
            { label: "Depressed mood", target: true },
            { label: "Agitation or severe anxiety", target: true },
            { label: "Insomnia", target: true },
            { label: "Psychotic symptoms", target: true },
            { label: "Intoxication or heavy substance use", target: true },
            { label: "Withdrawal", target: true },
            { label: "Pain", target: true },
            { label: "Recent loss or relationship breakdown" },
            { label: "Shame or humiliation" },
            { label: "Legal or financial crisis" },
            { label: "Family violence" },
            { label: "Social isolation", target: true },
            { label: "Access to lethal means", target: true },
            { label: "Disengaged from care", target: true }
        ],
        baseline: ["Raised", "Similar to usual", "Lower", "Unclear"],
        // What helps (available resources). Held lightly: they can vanish in a crisis.
        resources: [
            "Engaged with treating team", "Family or social support", "Children or dependants",
            "Religious, spiritual or cultural beliefs", "Future plans or goals", "Seeks help when distressed",
            "Effective coping skills", "Restricted access to means"
        ],
        resourcesCaution: "Hold protective factors lightly: they reduce risk across populations but can vanish in an individual crisis. Never use them alone to justify discharge.",
        plan: [
            { id: "treat", label: "Treat the modifiable drivers" },
            { id: "safety-plan", label: "Safety plan completed with the person (Stanley-Brown)" },
            { id: "means", label: "Means safety discussed with the person and family" },
            { id: "collateral", label: "Collateral obtained" },
            { id: "carer", label: "Carer given information and support" },
            { id: "follow-up", label: "Follow-up booked with a named clinician" },
            { id: "gp", label: "GP informed with specifics" },
            { id: "mha", label: "Mental Health Act assessment considered" },
            { id: "admission", label: "Admission considered" }
        ],
        followUpCheck: "Your Safety Planning note gives contact within 24-72 hours of discharge. Confirm the timeframe in NSW Health PD2022_043 and your local procedure before relying on it.",
        sources: [
            "Pisani AR, Murrie DC, Silverman MM. Reformulating suicide risk formulation: from prediction to prevention. Acad Psychiatry 2016;40(4):623-9.",
            "NICE NG225. Self-harm: assessment, management and preventing recurrence. 2022.",
            "Stanley B, Brown GK. Safety Planning Intervention. Cogn Behav Pract 2012;19(2):256-64.",
            "Stanley B, et al. Comparison of the safety planning intervention with follow-up vs usual care of suicidal patients treated in the emergency department. JAMA Psychiatry 2018;75(9):894-900.",
            "NSW Health PD2022_043. Clinical care of people who may be suicidal. 2022."
        ]
    },

    differentialSources: [
        "American Psychiatric Association. DSM-5-TR. 2022 (criteria summarised, not quoted).",
        "World Health Organization. ICD-11 Clinical Descriptions and Diagnostic Requirements for Mental, Behavioural or Neurodevelopmental Disorders. 2024.",
        "Graus F, et al. A clinical approach to diagnosis of autoimmune encephalitis. Lancet Neurol 2016;15(4):391-404.",
        "Pollak TA, et al. Autoimmune psychosis: an international consensus. Lancet Psychiatry 2020;7(1):93-108.",
        "Starzer MSK, Nordentoft M, Hjorthøj C. Rates and predictors of conversion to schizophrenia or bipolar disorder following substance-induced psychosis. Am J Psychiatry 2018;175(4):343-50."
    ]
};

/* Mood presentations. Same shape as the psychosis entry above; card ids are
   local to each presenting problem and match the guided questions in
   reasoning-flow-mood.js. */
Object.assign(window.REASONING_CONTENT.differentials, {
    depressed: {
        name: "Depressed mood",
        ruleOut: [
            {
                id: "substance",
                name: "Substances",
                clues: "Alcohol (the commonest cause in practice), stimulant withdrawal crash, cannabis, opioids, sedatives. Map use and withdrawal against the timeline.",
                tests: "UDS, BAL, LFT/GGT, collateral on use; reassess after about a month of abstinence where safe."
            },
            {
                id: "medication",
                name: "Medications",
                clues: "Interferon-alpha, corticosteroids, efavirenz, levetiracetam, isotretinoin, hormonal contraceptives, finasteride.",
                tests: "Medication review, including recent starts and dose changes."
            },
            {
                id: "endocrine",
                name: "Endocrine",
                clues: "Hypothyroidism, Cushing's syndrome, Addison's disease, hyperparathyroidism.",
                tests: "TSH, calcium, glucose; cortisol if indicated."
            },
            {
                id: "neuro",
                name: "Neurological",
                clues: "Stroke, Parkinson's disease, multiple sclerosis, Huntington's disease, head injury, dementia. Late first onset raises suspicion.",
                tests: "Neurological examination, cognitive screen; neuroimaging if signs or late onset."
            },
            {
                id: "sleep",
                name: "Sleep apnoea",
                clues: "Snoring, witnessed apnoeas, daytime sleepiness, obesity. Treating it can resolve the low mood.",
                tests: "STOP-BANG; sleep study."
            },
            {
                id: "other-medical",
                name: "Other medical causes",
                clues: "B12 or folate deficiency, anaemia, cancer (e.g. pancreatic), HIV, SLE, chronic pain.",
                tests: "FBC, UEC, B12, folate; HIV and syphilis serology if indicated."
            },
            {
                id: "delirium",
                name: "Delirium",
                clues: "Fluctuating attention and awareness; hypoactive delirium is often mistaken for depression.",
                tests: "4AT or CAM."
            },
            {
                id: "bipolarity",
                name: "Past hypomania or mania (check for it)",
                clues: "Periods of reduced need for sleep, high energy, overspending or risk-taking. Often missed: ask family.",
                tests: "Collateral history; mood charting."
            }
        ],
        differentials: [
            {
                id: "substance-induced",
                code: "ICD-11 6C4x.70, by substance",
                name: "Substance/medication-induced depressive disorder",
                dsm: "Substance/medication-induced depressive disorder",
                icd: "Substance-induced mood disorder, e.g. 6C40.70 alcohol-induced mood disorder",
                supports: "Onset during or soon after intoxication, withdrawal or a new medication; improves within weeks of stopping.",
                keyQuestion: "Did the low mood start before the substance use, or last about a month after stopping?",
                note: "Induced does not mean benign: suicide risk is high, especially early in abstinence.",
                check: "Confirm the ICD-11 codes for substances other than alcohol (6C40.70 was confirmed)."
            },
            {
                id: "medical",
                code: "ICD-11 6E62",
                name: "Depressive disorder due to another medical condition",
                dsm: "Depressive disorder due to another medical condition",
                icd: "6E62 Secondary mood syndrome",
                supports: "A medical condition that causes depression directly, with matching timing.",
                keyQuestion: "Is this the direct effect of the illness, or a psychological reaction to it (adjustment disorder)?",
                check: "Confirm the ICD-11 code 6E62."
            },
            {
                id: "mdd",
                code: "ICD-11 6A70/6A71",
                name: "Major depressive disorder",
                dsm: "Major depressive disorder, single episode or recurrent",
                icd: "6A70 Single episode or 6A71 Recurrent depressive disorder",
                supports: "Five or more of nine symptoms (including low mood or loss of interest) for 2 weeks, with impairment; never manic or hypomanic.",
                keyQuestion: "Has there ever been a hypomanic or manic episode? Ask family as well as the patient.",
                dsmIcd: "ICD-11 counts hopelessness among the depressive symptoms; DSM-5-TR does not."
            },
            {
                id: "pdd",
                code: "ICD-11 6A72",
                name: "Persistent depressive disorder (dysthymia)",
                dsm: "Persistent depressive disorder",
                icd: "6A72 Dysthymic disorder",
                supports: "Low mood more days than not for 2 years or more, never well for more than 2 months at a time.",
                keyQuestion: "Have full depressive episode criteria been met during those 2 years?",
                dsmIcd: "DSM-5-TR folds chronic major depression into persistent depressive disorder (and adds major depressive disorder when a full episode occurs). ICD-11 keeps dysthymic disorder for chronic low mood without a full depressive episode in the first 2 years.",
                check: "Confirm the ICD-11 code 6A72."
            },
            {
                id: "bipolar1",
                code: "ICD-11 6A60",
                name: "Bipolar I disorder, current episode depressed",
                dsm: "Bipolar I disorder",
                icd: "6A60 Bipolar type I disorder",
                supports: "At least one manic episode at any time; depressive episodes are common but not required.",
                keyQuestion: "Has there ever been a week of elevated or irritable mood with increased energy, or an admission for it?"
            },
            {
                id: "bipolar2",
                code: "ICD-11 6A61",
                name: "Bipolar II disorder, current episode depressed",
                dsm: "Bipolar II disorder",
                icd: "6A61 Bipolar type II disorder",
                supports: "At least one hypomanic and one major depressive episode, never manic.",
                keyQuestion: "Was there a period of at least 4 days of elevated mood and energy that others noticed?",
                dsmIcd: "DSM-5-TR hypomania lasts at least 4 days; ICD-11 says several days."
            },
            {
                id: "other-bipolar",
                code: "ICD-11 6A6Y",
                name: "Other specified bipolar disorder",
                dsm: "Other specified bipolar and related disorder",
                icd: "6A6Y Other specified bipolar or related disorder",
                supports: "Depressive episodes with hypomanic periods that are too short (2-3 days) or have too few symptoms.",
                keyQuestion: "How long did the high periods last, and how many manic symptoms were there?",
                check: "Confirm the ICD-11 code 6A6Y."
            },
            {
                id: "cyclothymic",
                code: "ICD-11 6A62",
                name: "Cyclothymic disorder",
                dsm: "Cyclothymic disorder",
                icd: "6A62 Cyclothymic disorder",
                supports: "2 years or more of many high and low periods that never meet full episode criteria, never well for more than 2 months.",
                keyQuestion: "Has there ever been a full depressive, hypomanic or manic episode? If so, it isn't cyclothymia.",
                check: "Confirm the ICD-11 code 6A62."
            },
            {
                id: "pmdd",
                code: "ICD-11 GA34.41",
                name: "Premenstrual dysphoric disorder",
                dsm: "Premenstrual dysphoric disorder",
                icd: "GA34.41 Premenstrual dysphoric disorder (genitourinary chapter)",
                supports: "Mood symptoms in the final week before menses that ease within a few days of onset, in most cycles over the past year.",
                keyQuestion: "Is it confirmed by daily ratings over at least two cycles, and is it more than a premenstrual worsening of another disorder?"
            },
            {
                id: "adjustment",
                code: "ICD-11 6B43",
                name: "Adjustment disorder",
                dsm: "Adjustment disorder, with depressed mood",
                icd: "6B43 Adjustment disorder",
                supports: "Distress out of proportion to an identifiable stressor, starting within 3 months, not meeting criteria for another disorder.",
                keyQuestion: "Are full major depressive episode criteria met? If so, that diagnosis takes priority."
            },
            {
                id: "pgd",
                code: "ICD-11 6B42",
                name: "Prolonged grief disorder",
                dsm: "Prolonged grief disorder",
                icd: "6B42 Prolonged grief disorder",
                supports: "Intense yearning for, or preoccupation with, the person who died, most days, beyond cultural norms.",
                keyQuestion: "How long since the death?",
                dsmIcd: "DSM-5-TR needs at least 12 months since the death (6 in children); ICD-11 at least 6 months.",
                note: "Grief does not rule out a major depressive episode: pervasive worthlessness and self-loathing point to depression, while waves of yearning with self-esteem intact point to grief."
            },
            {
                id: "psychotic",
                name: "Schizoaffective or a primary psychotic disorder",
                dsm: "Schizoaffective disorder, schizophrenia and related disorders",
                icd: "6A21 Schizoaffective disorder, 6A20 Schizophrenia",
                supports: "Delusions or hallucinations that also occur outside mood episodes.",
                keyQuestion: "Has there been psychosis without mood symptoms? Use the Psychosis questions to work it through."
            },
            {
                id: "other-depressive",
                code: "ICD-11 6A7Y",
                name: "Other specified depressive disorder",
                dsm: "Other specified (or unspecified) depressive disorder",
                icd: "6A7Y Other specified depressive disorder",
                supports: "Clinically significant depression that doesn't meet full criteria, e.g. too few symptoms or too short.",
                keyQuestion: "Which criterion is missing, and might it be met with time?",
                check: "Confirm the ICD-11 code 6A7Y."
            },
            {
                id: "feigning",
                code: "ICD-11 QC30 / 6D50",
                name: "Feigned symptoms (malingering or factitious disorder)",
                dsm: "Malingering (a condition for clinical attention, not a mental disorder) · Factitious disorder imposed on self",
                icd: "QC30 Malingering · 6D50 Factitious disorder imposed on self",
                supports: "Reported symptoms that don't match observed behaviour, or an external incentive.",
                keyQuestion: "Do the reported symptoms match what is observed over time and by others?"
            }
        ]
    },

    elevated: {
        name: "Elevated or irritable mood",
        ruleOut: [
            {
                id: "substance",
                name: "Substances",
                clues: "Stimulants (amphetamines, cocaine), high-potency cannabis, anabolic steroids; alcohol or sedative withdrawal.",
                tests: "UDS, collateral on use."
            },
            {
                id: "medication",
                name: "Medications",
                clues: "Corticosteroids, antidepressants (venlafaxine and tricyclics more than SSRIs), levodopa and dopamine agonists, thyroxine, isoniazid, efavirenz, baclofen, ketamine.",
                tests: "Medication review, including recent starts and dose increases."
            },
            {
                id: "endocrine",
                name: "Endocrine",
                clues: "Hyperthyroidism, Cushing's syndrome.",
                tests: "TSH; cortisol if indicated."
            },
            {
                id: "neuro",
                name: "Neurological",
                clues: "Right-sided or frontal stroke, head injury, multiple sclerosis, frontotemporal dementia, Huntington's disease, epilepsy, brain tumour. First episode after about 50, neurological signs or cognitive change are red flags.",
                tests: "Neurological examination, cognitive screen; MRI and EEG if late onset or neurological features."
            },
            {
                id: "infection",
                name: "Infection and inflammation",
                clues: "HIV, neurosyphilis, SLE, autoimmune encephalitis.",
                tests: "HIV and syphilis serology; further tests with neurology if red flags."
            },
            {
                id: "metabolic",
                name: "Metabolic",
                clues: "B12 deficiency, uraemia.",
                tests: "B12, UEC."
            },
            {
                id: "delirium",
                name: "Delirium",
                clues: "Fluctuating attention and awareness, disorientation.",
                tests: "4AT or CAM."
            }
        ],
        differentials: [
            {
                id: "substance-induced",
                code: "ICD-11 6C4x.70, by substance",
                name: "Substance/medication-induced bipolar disorder",
                dsm: "Substance/medication-induced bipolar and related disorder",
                icd: "Substance-induced mood disorder (with manic symptoms), e.g. 6C46.70 stimulants",
                supports: "Onset during or soon after intoxication, withdrawal or a new medication; settles once the effect wears off.",
                keyQuestion: "Did it start before the substance, or last about a month after stopping?",
                note: "A full episode that starts on an antidepressant or ECT and persists beyond the treatment's effect counts as true mania or hypomania (bipolar I or II).",
                check: "Confirm the ICD-11 code 6C46.70 (6C40.70 for alcohol was confirmed)."
            },
            {
                id: "medical",
                code: "ICD-11 6E62",
                name: "Bipolar and related disorder due to another medical condition",
                dsm: "Bipolar and related disorder due to another medical condition",
                icd: "6E62 Secondary mood syndrome",
                supports: "A medical cause with matching timing; late first onset, neurological signs or cognitive change.",
                keyQuestion: "Is this the first episode after about age 50, or are there neurological signs?",
                check: "Confirm the ICD-11 code 6E62."
            },
            {
                id: "bipolar1",
                code: "ICD-11 6A60",
                name: "Bipolar I disorder",
                dsm: "Bipolar I disorder, current episode manic",
                icd: "6A60 Bipolar type I disorder",
                supports: "At least 1 week of elevated, expansive or irritable mood with increased energy (any duration if admitted), plus 3 or more manic symptoms (4 if only irritable), with marked impairment, admission or psychosis.",
                keyQuestion: "Has it caused marked impairment, needed admission, or included psychotic symptoms?",
                dsmIcd: "DSM-5-TR uses a 'with mixed features' specifier. ICD-11 has a separate mixed episode type."
            },
            {
                id: "bipolar2",
                code: "ICD-11 6A61",
                name: "Bipolar II disorder",
                dsm: "Bipolar II disorder, current episode hypomanic",
                icd: "6A61 Bipolar type II disorder",
                supports: "At least 4 days of the same symptoms, noticeable to others, without marked impairment, admission or psychosis, plus at least one major depressive episode.",
                keyQuestion: "Has there ever been a major depressive episode?",
                dsmIcd: "DSM-5-TR hypomania lasts at least 4 days; ICD-11 says several days."
            },
            {
                id: "other-bipolar",
                code: "ICD-11 6A6Y",
                name: "Other specified bipolar disorder",
                dsm: "Other specified bipolar and related disorder",
                icd: "6A6Y Other specified bipolar or related disorder",
                supports: "Hypomanic periods that are too short or have too few symptoms, or hypomania without any depressive episode.",
                keyQuestion: "Which criterion is missing: duration, symptom count, or a past depressive episode?",
                check: "Confirm the ICD-11 code 6A6Y."
            },
            {
                id: "cyclothymic",
                code: "ICD-11 6A62",
                name: "Cyclothymic disorder",
                dsm: "Cyclothymic disorder",
                icd: "6A62 Cyclothymic disorder",
                supports: "2 years or more of many high and low periods that never meet full episode criteria, never well for more than 2 months.",
                keyQuestion: "Has there ever been a full depressive, hypomanic or manic episode?",
                check: "Confirm the ICD-11 code 6A62."
            },
            {
                id: "psychotic",
                name: "Schizoaffective or a primary psychotic disorder",
                dsm: "Schizoaffective disorder, schizophrenia and related disorders",
                icd: "6A21 Schizoaffective disorder, 6A20 Schizophrenia",
                supports: "Delusions or hallucinations that also occur outside mood episodes.",
                keyQuestion: "Has there been psychosis without mood symptoms? Use the Psychosis questions to work it through."
            },
            {
                id: "other",
                name: "Borderline personality disorder or ADHD",
                dsm: "Borderline personality disorder · ADHD",
                icd: "6D11.5 Borderline pattern (personality disorder) · 6A05 ADHD",
                supports: "Borderline: mood shifts over hours, triggered by relationships, without sustained increased energy. ADHD: lifelong restlessness and distractibility, not episodic.",
                keyQuestion: "Is this a distinct episode, a change from the person's usual self, lasting days?",
                check: "Confirm the ICD-11 codes 6D11.5 and 6A05."
            },
            {
                id: "feigning",
                code: "ICD-11 QC30 / 6D50",
                name: "Feigned symptoms (malingering or factitious disorder)",
                dsm: "Malingering (a condition for clinical attention, not a mental disorder) · Factitious disorder imposed on self",
                icd: "QC30 Malingering · 6D50 Factitious disorder imposed on self",
                supports: "Reported symptoms that don't match observed behaviour, or an external incentive.",
                keyQuestion: "Do the reported symptoms match what is observed over time and by others?"
            }
        ]
    }
});

/* Anxiety and catatonia presentations. Card ids match the guided questions in
   reasoning-flow-anxiety.js. */
(function () {
    const feigning = {
        id: "feigning",
        code: "ICD-11 QC30 / 6D50",
        name: "Feigned symptoms (malingering or factitious disorder)",
        dsm: "Malingering (a condition for clinical attention, not a mental disorder) · Factitious disorder imposed on self",
        icd: "QC30 Malingering · 6D50 Factitious disorder imposed on self",
        supports: "Reported symptoms that don't match observed behaviour, or an external incentive.",
        keyQuestion: "Do the reported symptoms match what is observed over time and by others?"
    };

    Object.assign(window.REASONING_CONTENT.differentials, {
        anxiety: {
            name: "Anxiety",
            ruleOut: [
                {
                    id: "substance",
                    name: "Substances",
                    clues: "Caffeine (including pre-workout supplements), stimulants (including prescribed dexamfetamine), cannabis. Alcohol used as an anxiolytic causes rebound anxiety the next morning.",
                    tests: "UDS, caffeine and alcohol history."
                },
                {
                    id: "withdrawal",
                    name: "Withdrawal",
                    clues: "Alcohol, benzodiazepines, GHB, opioids. Anxiety with tremor, sweats and tachycardia in a drinker is withdrawal until proven otherwise.",
                    tests: "Withdrawal scale (e.g. CIWA-Ar), timeline of last use."
                },
                {
                    id: "medication",
                    name: "Medications and akathisia",
                    clues: "Salbutamol, corticosteroids, thyroxine. Akathisia after starting or increasing an antipsychotic or antidepressant is often mistaken for anxiety.",
                    tests: "Medication review, including recent changes; Barnes Akathisia Rating Scale."
                },
                {
                    id: "endocrine",
                    name: "Endocrine and metabolic",
                    clues: "Thyrotoxicosis, hypoglycaemia, phaeochromocytoma (rare, but the one that gets missed).",
                    tests: "TSH, BGL; urine or plasma metanephrines if paroxysmal hypertension."
                },
                {
                    id: "cardiorespiratory",
                    name: "Cardiac and respiratory",
                    clues: "Arrhythmia, pulmonary embolism, asthma or COPD, hypoxia. Red flags: first panic attack over 45, syncope, chest pain.",
                    tests: "ECG, oxygen saturation; further work-up only if the history points there."
                },
                {
                    id: "neuro",
                    name: "Neurological",
                    clues: "Seizures (ictal fear), focal neurology, new symptoms in later life.",
                    tests: "Neurological examination; EEG if paroxysmal."
                },
                {
                    id: "delirium",
                    name: "Delirium",
                    clues: "Fluctuating attention and awareness, disorientation.",
                    tests: "4AT or CAM."
                }
            ],
            differentials: [
                {
                    id: "substance-induced",
                    code: "ICD-11 6C4x.71, by substance",
                    name: "Substance/medication-induced anxiety disorder",
                    dsm: "Substance/medication-induced anxiety disorder",
                    icd: "Substance-induced anxiety disorder, by substance",
                    supports: "Anxiety or panic during or soon after intoxication, withdrawal or a new medication; settles once it wears off.",
                    keyQuestion: "Did it start before the substance use, or last about a month after stopping?",
                    check: "Confirm the ICD-11 codes for substance-induced anxiety disorders (6C4x.71)."
                },
                {
                    id: "medical",
                    code: "ICD-11 6E63",
                    name: "Anxiety disorder due to another medical condition",
                    dsm: "Anxiety disorder due to another medical condition",
                    icd: "6E63 Secondary anxiety syndrome",
                    supports: "A medical condition that causes anxiety directly, with matching timing.",
                    keyQuestion: "Is this the direct effect of the illness, or a psychological reaction to it?"
                },
                {
                    id: "akathisia",
                    name: "Medication-induced akathisia",
                    dsm: "Medication-induced acute akathisia",
                    icd: "",
                    supports: "Inner restlessness and an urge to move, soon after starting or increasing an antipsychotic or antidepressant.",
                    keyQuestion: "Did it start after a medication change, and is the restlessness mainly in the legs?",
                    note: "Giving more of the causative drug makes it worse."
                },
                {
                    id: "panic",
                    code: "ICD-11 6B01",
                    name: "Panic disorder",
                    dsm: "Panic disorder",
                    icd: "6B01 Panic disorder",
                    supports: "Recurrent unexpected panic attacks, followed by a month or more of worry about further attacks or changes in behaviour to avoid them.",
                    keyQuestion: "Do some attacks come out of the blue, or only in feared situations?",
                    dsmIcd: "Attacks that only happen in feared situations are recorded as 'with panic attacks' on the other diagnosis, not as panic disorder."
                },
                {
                    id: "agoraphobia",
                    code: "ICD-11 6B02",
                    name: "Agoraphobia",
                    dsm: "Agoraphobia",
                    icd: "6B02 Agoraphobia",
                    supports: "Fear or avoidance of 2 or more situations where escape or help might be hard: public transport, open spaces, enclosed spaces, queues or crowds, being out alone.",
                    keyQuestion: "Is the fear about escape or help being hard if panic-like symptoms start, rather than scrutiny (social) or one specific thing (phobia)?",
                    dsmIcd: "Both systems let agoraphobia and panic disorder be diagnosed separately or together. DSM-5-TR needs 6 months; ICD-11 says several months."
                },
                {
                    id: "social",
                    code: "ICD-11 6B04",
                    name: "Social anxiety disorder",
                    dsm: "Social anxiety disorder",
                    icd: "6B04 Social anxiety disorder",
                    supports: "Fear of scrutiny or embarrassment in social or performance situations, which are avoided or endured with intense fear.",
                    keyQuestion: "Is the fear about being judged by others?",
                    dsmIcd: "DSM-5-TR needs 6 months; ICD-11 says several months."
                },
                {
                    id: "gad",
                    code: "ICD-11 6B00",
                    name: "Generalised anxiety disorder",
                    dsm: "Generalized anxiety disorder",
                    icd: "6B00 Generalised anxiety disorder",
                    supports: "Hard-to-control worry about many everyday matters, most days for 6 months, with physical symptoms such as restlessness, tension and poor sleep.",
                    keyQuestion: "Is the worry spread across many areas of life, rather than one focus?",
                    dsmIcd: "DSM-5-TR needs 6 months of worry. ICD-11 needs several months, and accepts general apprehension (free-floating anxiety) as well as worry."
                },
                {
                    id: "specific",
                    code: "ICD-11 6B03",
                    name: "Specific phobia",
                    dsm: "Specific phobia",
                    icd: "6B03 Specific phobia",
                    supports: "Marked fear of a specific object or situation (animals, heights, blood or injections, flying), avoided or endured with intense fear.",
                    keyQuestion: "Is the fear limited to one object or situation?",
                    dsmIcd: "DSM-5-TR needs 6 months; ICD-11 says several months."
                },
                {
                    id: "separation",
                    code: "ICD-11 6B05",
                    name: "Separation anxiety disorder",
                    dsm: "Separation anxiety disorder",
                    icd: "6B05 Separation anxiety disorder",
                    supports: "Excessive fear of separation from attachment figures (in adults often a partner or child), with worry about harm to them.",
                    keyQuestion: "Is the fear about losing or being apart from specific people?",
                    check: "Confirm the ICD-11 code 6B05."
                },
                {
                    id: "health",
                    code: "ICD-11 6B23",
                    name: "Illness anxiety disorder (health anxiety)",
                    dsm: "Illness anxiety disorder",
                    icd: "6B23 Hypochondriasis",
                    supports: "Preoccupation with having or getting a serious illness, with few or mild bodily symptoms, and checking or avoidance.",
                    keyQuestion: "Are distressing bodily symptoms the focus (somatic symptom disorder), or the fear of illness itself?",
                    dsmIcd: "DSM-5-TR places illness anxiety disorder with the somatic symptom disorders. ICD-11 places hypochondriasis with the obsessive-compulsive related disorders.",
                    check: "Confirm the ICD-11 code 6B23."
                },
                {
                    id: "somatic",
                    code: "ICD-11 6C20",
                    name: "Somatic symptom disorder",
                    dsm: "Somatic symptom disorder",
                    icd: "6C20 Bodily distress disorder",
                    supports: "Distressing bodily symptoms with excessive thoughts, feelings or behaviours about them, for 6 months or more.",
                    keyQuestion: "Are the physical symptoms themselves the main source of distress?",
                    check: "Confirm the ICD-11 code 6C20."
                },
                {
                    id: "ocd",
                    code: "ICD-11 6B20",
                    name: "Obsessive-compulsive disorder",
                    dsm: "Obsessive-compulsive disorder",
                    icd: "6B20 Obsessive-compulsive disorder",
                    supports: "Intrusive unwanted thoughts, urges or images, with repetitive behaviours or mental acts to neutralise them; time-consuming (over an hour a day) or impairing.",
                    keyQuestion: "Are the thoughts unwanted and resisted, with rituals to neutralise them?",
                    dsmIcd: "With absent insight, it stays OCD (with absent insight / delusional beliefs), not delusional disorder.",
                    check: "Confirm the ICD-11 code 6B20."
                },
                {
                    id: "bdd",
                    code: "ICD-11 6B21",
                    name: "Body dysmorphic disorder",
                    dsm: "Body dysmorphic disorder",
                    icd: "6B21 Body dysmorphic disorder",
                    supports: "Preoccupation with perceived flaws in appearance that others don't see or think slight, with checking, comparing or camouflaging.",
                    keyQuestion: "Is the concern about appearance rather than weight or shape (eating disorder)?",
                    check: "Confirm the ICD-11 code 6B21."
                },
                {
                    id: "ptsd",
                    code: "ICD-11 6B40",
                    name: "Post-traumatic stress disorder",
                    dsm: "Posttraumatic stress disorder",
                    icd: "6B40 Post traumatic stress disorder · 6B41 Complex PTSD",
                    supports: "After actual or threatened death, serious injury or sexual violence: intrusions, avoidance, negative changes in mood or beliefs, and heightened arousal, for more than a month.",
                    keyQuestion: "Is the anxiety tied to reminders of a traumatic event?",
                    dsmIcd: "ICD-11 PTSD centres on re-experiencing in the present, avoidance and a sense of current threat. ICD-11 complex PTSD adds lasting problems with emotion regulation, self-worth and relationships.",
                    check: "Confirm the ICD-11 codes 6B40 and 6B41."
                },
                {
                    id: "acute-stress",
                    code: "ICD-11 QE84",
                    name: "Acute stress disorder",
                    dsm: "Acute stress disorder",
                    icd: "QE84 Acute stress reaction (not a mental disorder in ICD-11)",
                    supports: "PTSD-type symptoms from 3 days to 1 month after a traumatic event.",
                    keyQuestion: "Has it been more than a month? If so, consider PTSD.",
                    dsmIcd: "ICD-11 has no acute stress disorder: an acute stress reaction is treated as a normal response, coded outside the mental disorders chapter."
                },
                {
                    id: "adjustment",
                    code: "ICD-11 6B43",
                    name: "Adjustment disorder",
                    dsm: "Adjustment disorder, with anxiety",
                    icd: "6B43 Adjustment disorder",
                    supports: "Distress out of proportion to an identifiable stressor, starting within 3 months, not meeting criteria for another disorder.",
                    keyQuestion: "Are criteria met for a specific anxiety disorder? If so, that takes priority."
                },
                {
                    id: "mood",
                    name: "Depressive or bipolar disorder with anxious distress",
                    dsm: "Major depressive or bipolar disorder, with anxious distress",
                    icd: "6A70/6A71 depressive or 6A60/6A61 bipolar disorder",
                    supports: "Anxiety that occurs only within a mood episode.",
                    keyQuestion: "Does the anxiety exist outside mood episodes? If not, use the mood questions."
                },
                {
                    id: "other-anxiety",
                    code: "ICD-11 6B0Y",
                    name: "Other specified anxiety disorder",
                    dsm: "Other specified (or unspecified) anxiety disorder",
                    icd: "6B0Y Other specified anxiety or fear-related disorder",
                    supports: "Clinically significant anxiety that doesn't meet full criteria for a specific disorder.",
                    keyQuestion: "Which criterion is missing, and might it be met with time?",
                    check: "Confirm the ICD-11 code 6B0Y."
                },
                feigning
            ]
        },

        catatonia: {
            name: "Catatonia",
            ruleOut: [
                {
                    id: "nms",
                    name: "Neuroleptic malignant syndrome or malignant catatonia",
                    clues: "Fever, rigidity, autonomic instability (fast pulse, labile blood pressure, sweating), altered consciousness. Recent antipsychotic or other dopamine blocker.",
                    tests: "Temperature, observations, CK, FBC, UEC, LFT. A medical emergency."
                },
                {
                    id: "serotonin",
                    name: "Serotonin syndrome",
                    clues: "Clonus (inducible or spontaneous), hyperreflexia, tremor, diarrhoea after serotonergic drugs.",
                    tests: "Examination for clonus; Hunter criteria."
                },
                {
                    id: "ncse",
                    name: "Non-convulsive status epilepticus",
                    clues: "Fluctuating responsiveness, subtle twitching, eye deviation, history of seizures.",
                    tests: "EEG (urgent if suspected)."
                },
                {
                    id: "encephalitis",
                    name: "Encephalitis (including autoimmune)",
                    clues: "Rapid onset, seizures, dyskinesias, autonomic instability, fever, headache. Anti-NMDAR encephalitis often presents with catatonia.",
                    tests: "With neurology: MRI, lumbar puncture with CSF antibodies, EEG."
                },
                {
                    id: "metabolic",
                    name: "Metabolic and other medical causes",
                    clues: "Hyponatraemia, hypercalcaemia, diabetic ketoacidosis, hepatic or renal encephalopathy, SLE, stroke, tumour.",
                    tests: "UEC, calcium, glucose, LFT, ammonia if indicated; MRI brain."
                },
                {
                    id: "withdrawal",
                    name: "Withdrawal",
                    clues: "Recent stop of a benzodiazepine, clozapine or other GABA-acting drug.",
                    tests: "Medication history, including recent changes and missed doses."
                },
                {
                    id: "delirium",
                    name: "Delirium",
                    clues: "Fluctuating attention and awareness. Catatonic features only during delirium are part of the delirium.",
                    tests: "4AT or CAM (may be hard to complete if mute)."
                },
                {
                    id: "complications",
                    name: "Complications (check for them)",
                    clues: "Dehydration, poor nutrition, venous thromboembolism, pressure injury, aspiration, contractures.",
                    tests: "Fluid and food intake, UEC, VTE risk assessment, skin checks."
                }
            ],
            differentials: [
                {
                    id: "associated",
                    code: "ICD-11 6A40",
                    name: "Catatonia associated with another mental disorder",
                    dsm: "Catatonia associated with another mental disorder (e.g. bipolar, depressive or psychotic disorder, autism)",
                    icd: "6A40 Catatonia associated with another mental disorder",
                    supports: "3 or more of the 12 catatonic signs, occurring with a mental disorder. Mood disorders (bipolar more than depression) are the commonest cause.",
                    keyQuestion: "Which mental disorder is it occurring with? Collateral history matters, as the person may not speak."
                },
                {
                    id: "induced",
                    code: "ICD-11 6A41",
                    name: "Catatonia induced by substances or medications",
                    dsm: "No separate DSM-5-TR category: recorded with the intoxication, withdrawal or medication effect",
                    icd: "6A41 Catatonia induced by substances or medications",
                    supports: "Onset during or soon after intoxication (e.g. PCP, ketamine, cannabis, cocaine), withdrawal (benzodiazepines, clozapine), or a medication linked to catatonia (e.g. antipsychotics, steroids, disulfiram, ciprofloxacin).",
                    keyQuestion: "What was taken, stopped or started in the days before onset?"
                },
                {
                    id: "medical",
                    code: "ICD-11 6E69",
                    name: "Catatonic disorder due to another medical condition",
                    dsm: "Catatonic disorder due to another medical condition",
                    icd: "6E69 Secondary catatonia syndrome",
                    supports: "A medical condition that causes catatonia directly, such as encephalitis, metabolic disturbance, or a brain lesion.",
                    keyQuestion: "Are there neurological signs, fever, abnormal bloods or an abnormal EEG?"
                },
                {
                    id: "malignant",
                    name: "Malignant catatonia or neuroleptic malignant syndrome",
                    dsm: "Catatonia with autonomic instability · Neuroleptic malignant syndrome (medication-induced movement disorder)",
                    icd: "",
                    supports: "Catatonia with fever and autonomic instability; NMS follows a dopamine blocker, with rigidity and raised CK.",
                    keyQuestion: "Is there fever, autonomic instability or a raised CK?",
                    note: "A medical emergency. Avoid antipsychotics; high-dose lorazepam; early ECT if there's no response within 24-48 hours."
                },
                {
                    id: "drba",
                    name: "Medication-induced movement disorder",
                    dsm: "Antipsychotic-induced parkinsonism · acute dystonia · other medication-induced movement disorder",
                    icd: "",
                    supports: "Rigidity, slowing, tremor or abnormal postures after starting or increasing a dopamine blocker, without the wider catatonic picture.",
                    keyQuestion: "Did it start after a dopamine blocker, and is there tremor or cogwheeling rather than negativism or waxy flexibility?"
                },
                {
                    id: "delirium",
                    name: "Delirium",
                    dsm: "Delirium",
                    icd: "Delirium (6D70)",
                    supports: "Catatonic features occurring only during a delirium are part of the delirium.",
                    keyQuestion: "Does attention and awareness fluctuate?",
                    check: "Confirm the ICD-11 code 6D70."
                },
                {
                    id: "unspecified",
                    code: "ICD-11 6A4Z",
                    name: "Unspecified catatonia",
                    dsm: "Unspecified catatonia",
                    icd: "6A4Z Catatonia, unspecified",
                    supports: "Clinically significant catatonia where the cause isn't yet known, or fewer than 3 signs.",
                    keyQuestion: "What work-up is still outstanding?"
                },
                {
                    id: "mimic",
                    name: "Conditions that can look like catatonia",
                    dsm: "e.g. severe depression with psychomotor slowing; functional neurological disorder; selective mutism or autism; akinetic mutism or locked-in syndrome",
                    icd: "",
                    supports: "Slowing without negativism, posturing or waxy flexibility; signs that vary with attention; communication difficulties; neurological lesions.",
                    keyQuestion: "Are the core catatonic signs (negativism, posturing, waxy flexibility, echophenomena) really present?"
                },
                feigning
            ]
        }
    });
})();
