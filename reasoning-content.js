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

/* Cognitive impairment. Card ids match the guided questions in
   reasoning-flow-cognitive.js. */
Object.assign(window.REASONING_CONTENT.differentials, {
    cognitive: {
        name: "Cognitive impairment",
        ruleOut: [
            {
                id: "delirium",
                name: "Delirium",
                clues: "Acute onset, fluctuating attention and awareness. Missed in a third to a half of cases, especially the hypoactive form. Often sits on top of dementia.",
                tests: "4AT or CAM; find the cause."
            },
            {
                id: "wernicke",
                name: "Wernicke encephalopathy",
                clues: "Heavy alcohol use or malnutrition with confusion, ataxia or eye signs. The full triad is the exception: Caine criteria need 2 of dietary deficiency, eye signs, cerebellar signs, altered mental state or mild memory impairment.",
                tests: "Treat on suspicion with parenteral thiamine; check magnesium."
            },
            {
                id: "medication",
                name: "Medications",
                clues: "Anticholinergic burden, benzodiazepines and other sedatives, opioids, antiepileptics, lithium toxicity.",
                tests: "Medication review and anticholinergic burden score; drug levels where relevant."
            },
            {
                id: "depression",
                name: "Depression",
                clues: "Abrupt, datable onset; low mood before the cognitive complaints; 'don't know' answers; complains of memory loss; worse in the morning.",
                tests: "GDS-15, or the Cornell Scale with carer input; retest cognition after treatment."
            },
            {
                id: "metabolic",
                name: "Metabolic and nutritional",
                clues: "Hypothyroidism, B12 or folate deficiency, hyponatraemia, hypercalcaemia, hypo- or hyperglycaemia, liver or kidney disease.",
                tests: "FBC, EUC, LFT, calcium, glucose, TSH, B12, folate, CRP."
            },
            {
                id: "infection",
                name: "Infection",
                clues: "HIV, syphilis; in older adults, any infection can cause delirium.",
                tests: "HIV and syphilis serology where indicated; urine culture only if symptomatic."
            },
            {
                id: "structural",
                name: "Structural brain disease",
                clues: "Stroke, tumour, subdural haematoma (falls, anticoagulation), normal pressure hydrocephalus (gait, incontinence). Young onset or new focal signs need imaging and neurology.",
                tests: "CT or MRI brain; EEG if seizures or encephalopathy suspected."
            },
            {
                id: "sensory",
                name: "Hearing, vision and sleep",
                clues: "Uncorrected hearing or vision loss lowers test scores; sleep apnoea impairs attention and memory.",
                tests: "Check hearing and vision; STOP-BANG."
            },
            {
                id: "safety",
                name: "Safety (check for it)",
                clues: "Elder abuse and neglect, driving, finances, medication management, capacity for current decisions.",
                tests: "Collateral history; capacity assessment for specific decisions."
            }
        ],
        differentials: [
            {
                id: "delirium",
                code: "ICD-11 6D70",
                name: "Delirium",
                dsm: "Delirium",
                icd: "6D70 Delirium",
                supports: "Acute onset, disturbed attention and awareness, fluctuating through the day.",
                keyQuestion: "What was the person like a week ago? Collateral about baseline is the most useful information.",
                note: "A medical emergency with substantial mortality."
            },
            {
                id: "alcohol",
                code: "ICD-11 6D84 / 6D72",
                name: "Alcohol-related brain injury (Wernicke-Korsakoff)",
                dsm: "Substance/medication-induced major or mild neurocognitive disorder (e.g. alcohol, amnestic-confabulatory type)",
                icd: "6D84 Dementia due to use of psychoactive substances · 6D72 Amnestic disorder",
                supports: "Heavy alcohol use; Korsakoff syndrome is mainly an inability to learn new information, often with confabulation.",
                keyQuestion: "Does it persist beyond intoxication and withdrawal, and is memory affected out of proportion to other domains?",
                note: "Cognition can improve over months of abstinence and nutrition: don't finalise placement on a short assessment.",
                check: "Confirm the ICD-11 code 6D84."
            },
            {
                id: "medication",
                name: "Intoxication, withdrawal or medication effect",
                dsm: "Substance intoxication or withdrawal; adverse effect of medication",
                icd: "",
                supports: "Cognitive effects only while the substance or medication is acting, improving when it is stopped.",
                keyQuestion: "Does cognition improve when the drug is reduced or stopped?"
            },
            {
                id: "depression",
                name: "Cognitive impairment due to depression",
                dsm: "Major depressive disorder (cognitive symptoms); 'pseudodementia' is an older term",
                icd: "6A70/6A71 Depressive disorder",
                supports: "Abrupt onset, low mood first, 'don't know' answers, patchy deficits that improve with cues.",
                keyQuestion: "Did low mood come before the cognitive complaints?",
                note: "A risk marker for later dementia, not only a mimic: retest cognition after the depression is treated."
            },
            {
                id: "dissociative",
                name: "Dissociative amnesia or PTSD",
                dsm: "Dissociative amnesia · Posttraumatic stress disorder",
                icd: "6B61 Dissociative amnesia · 6B40 PTSD",
                supports: "Gaps in autobiographical memory, usually around trauma or stress, with learning of new information intact.",
                keyQuestion: "Can the person learn and retain new information normally?",
                check: "Confirm the ICD-11 code 6B61."
            },
            {
                id: "alzheimers",
                code: "ICD-11 6D80",
                name: "Neurocognitive disorder due to Alzheimer's disease",
                dsm: "Major or mild neurocognitive disorder due to Alzheimer's disease (probable or possible)",
                icd: "6D80 Dementia due to Alzheimer disease (6D71 if mild)",
                supports: "Insidious onset, gradual progression, early and prominent episodic memory loss (rapid forgetting, repeated questions).",
                keyQuestion: "Is memory the earliest and most prominent problem, steadily worsening without plateaus?",
                dsmIcd: "DSM-5-TR calls major neurocognitive disorder 'dementia' in ICD-11 (6D8x); mild neurocognitive disorder is 6D71 in both."
            },
            {
                id: "vascular",
                code: "ICD-11 6D81",
                name: "Vascular neurocognitive disorder",
                dsm: "Major or mild vascular neurocognitive disorder",
                icd: "6D81 Dementia due to cerebrovascular disease",
                supports: "Onset linked to strokes or stepwise decline; executive dysfunction and slowing more than memory loss; focal signs; imaging evidence of cerebrovascular disease.",
                keyQuestion: "Is there a temporal link to strokes, or imaging evidence of significant vascular disease?"
            },
            {
                id: "lewy",
                code: "ICD-11 6D82",
                name: "Neurocognitive disorder with Lewy bodies",
                dsm: "Major or mild neurocognitive disorder with Lewy bodies (probable or possible)",
                icd: "6D82 Dementia due to Lewy body disease",
                supports: "Core: fluctuating cognition, recurrent well-formed visual hallucinations, parkinsonism starting after the cognitive decline. Suggestive: REM sleep behaviour disorder, severe sensitivity to antipsychotics.",
                keyQuestion: "Are there fluctuations, visual hallucinations or parkinsonism?",
                dsmIcd: "DSM-5-TR: probable with 2 core features, or 1 core plus 1 suggestive. The 2017 Lewy body consortium criteria count REM sleep behaviour disorder as a core feature.",
                note: "Severe antipsychotic sensitivity: avoid antipsychotics where possible."
            },
            {
                id: "ftd",
                code: "ICD-11 6D83",
                name: "Frontotemporal neurocognitive disorder",
                dsm: "Major or mild frontotemporal neurocognitive disorder (behavioural or language variant)",
                icd: "6D83 Dementia due to frontotemporal lobar degeneration",
                supports: "Early disinhibition, apathy, loss of empathy, compulsive behaviour or dietary change; or early, prominent language decline. Memory relatively spared early. Often young onset.",
                keyQuestion: "Did behaviour or language change before memory?",
                check: "Confirm the ICD-11 code 6D83."
            },
            {
                id: "parkinson",
                code: "ICD-11 6D85",
                name: "Neurocognitive disorder due to Parkinson's disease",
                dsm: "Major or mild neurocognitive disorder due to Parkinson's disease",
                icd: "6D85 Dementia due to diseases classified elsewhere",
                supports: "Established Parkinson's disease, with cognitive decline starting at least a year later.",
                keyQuestion: "Did the parkinsonism start more than a year before the cognitive decline? If not, consider Lewy body disease.",
                check: "Confirm the ICD-11 code 6D85."
            },
            {
                id: "tbi",
                code: "ICD-11 6D85",
                name: "Neurocognitive disorder due to traumatic brain injury",
                dsm: "Major or mild neurocognitive disorder due to traumatic brain injury",
                icd: "6D85 Dementia due to diseases classified elsewhere",
                supports: "Head injury with loss of consciousness, post-traumatic amnesia, disorientation or neurological signs, with decline straight after.",
                keyQuestion: "Did the decline start immediately after the injury (or once consciousness recovered)?",
                check: "Confirm the ICD-11 code 6D85."
            },
            {
                id: "other-medical",
                code: "ICD-11 6D85",
                name: "Neurocognitive disorder due to another medical condition",
                dsm: "Major or mild neurocognitive disorder due to HIV, prion disease, Huntington's disease or another medical condition",
                icd: "6D85 Dementia due to diseases classified elsewhere",
                supports: "e.g. normal pressure hydrocephalus (gait, incontinence), HIV, neurosyphilis, Huntington's disease, prion disease (rapid, with myoclonus), B12 deficiency, hypothyroidism.",
                keyQuestion: "Is there a medical condition whose timing and features explain the decline?",
                check: "Confirm the ICD-11 code 6D85."
            },
            {
                id: "multiple",
                name: "Neurocognitive disorder due to multiple causes",
                dsm: "Major or mild neurocognitive disorder due to multiple etiologies",
                icd: "e.g. 6D80.2 Alzheimer disease, mixed type with cerebrovascular disease",
                supports: "More than one cause contributing, most often Alzheimer's with vascular disease.",
                keyQuestion: "Does each cause add something the others don't explain?"
            },
            {
                id: "unspecified",
                name: "Neurocognitive disorder, cause not yet known",
                dsm: "Major or mild neurocognitive disorder due to unknown etiology",
                icd: "6D8Z Dementia, unknown or unspecified cause",
                supports: "Clear decline, but the cause isn't yet established.",
                keyQuestion: "What work-up is outstanding: imaging, bloods, neuropsychology, specialist review?",
                check: "Confirm the ICD-11 code 6D8Z."
            },
            {
                id: "idd",
                name: "Intellectual developmental disorder",
                dsm: "Intellectual developmental disorder",
                icd: "6A00 Disorders of intellectual development",
                supports: "Lifelong difficulties starting in the developmental period, without decline.",
                keyQuestion: "Has there been a decline from the person's previous level? If so, a neurocognitive disorder can be added.",
                check: "Confirm the ICD-11 code 6A00."
            },
            {
                id: "normal",
                name: "No disorder: normal ageing or subjective decline",
                dsm: "Age-related cognitive decline (a condition for clinical attention)",
                icd: "",
                supports: "Slower processing with normal testing and preserved function.",
                keyQuestion: "Is testing normal for age and education, and is everyday function unchanged?"
            },
            {
                id: "feigning",
                code: "ICD-11 QC30 / 6D50",
                name: "Feigned symptoms (malingering or factitious disorder)",
                dsm: "Malingering (a condition for clinical attention, not a mental disorder) · Factitious disorder imposed on self",
                icd: "QC30 Malingering · 6D50 Factitious disorder imposed on self",
                supports: "Performance worse than in severe dementia on simple tasks, inconsistent with everyday function, or an external incentive (legal, compensation).",
                keyQuestion: "Do performance validity tests and everyday function match the test results?"
            }
        ]
    }
});

/* Problematic substance use, and suicidal, self-harm or aggressive behaviour.
   Card ids match reasoning-flow-substance.js and reasoning-flow-risk.js. */
(function () {
    const feigning = {
        id: "feigning",
        code: "ICD-11 QC30 / 6D50",
        name: "Feigned symptoms (malingering or factitious disorder)",
        dsm: "Malingering (a condition for clinical attention, not a mental disorder) · Factitious disorder imposed on self",
        icd: "QC30 Malingering · 6D50 Factitious disorder imposed on self",
        supports: "Symptoms or behaviour that don't match observation, or an external incentive (drugs, prescriptions, housing, avoiding charges).",
        keyQuestion: "Do the reported symptoms match what is observed over time and by others?"
    };

    Object.assign(window.REASONING_CONTENT.differentials, {
        substance: {
            name: "Problematic substance use",
            ruleOut: [
                {
                    id: "withdrawal",
                    name: "Withdrawal risk (check for it)",
                    clues: "Time of last use, past withdrawal seizures or delirium tremens. Alcohol and sedative withdrawal can be dangerous; opioid withdrawal is rarely dangerous itself.",
                    tests: "CIWA-Ar or AWS (alcohol), COWS (opioids); breathalyser; thiamine before glucose in heavy drinkers."
                },
                {
                    id: "overdose",
                    name: "Overdose risk (check for it)",
                    clues: "Reduced tolerance after detox, prison release or discharge; mixing opioids, benzodiazepines, alcohol or sedating medicines.",
                    tests: "Naloxone and overdose education."
                },
                {
                    id: "medical",
                    name: "Physical health",
                    clues: "Liver disease, blood-borne viruses, injecting complications, nutrition, head injury.",
                    tests: "LFT, GGT, MCV, CDT if available; HIV, hepatitis B and C serology; injection site check."
                },
                {
                    id: "mental",
                    name: "Co-occurring mental health problems",
                    clues: "Depression, anxiety, PTSD, psychosis, ADHD and personality disorders are common alongside substance use.",
                    tests: "Screen both ways (e.g. K10, PHQ-9); map symptom onset against use and abstinence."
                },
                {
                    id: "safety",
                    name: "Safety (check for it)",
                    clues: "Driving, dependent children, pregnancy, domestic violence, suicide risk (higher with intoxication).",
                    tests: "βhCG where relevant; child safety and driving questions."
                },
                {
                    id: "screen",
                    name: "Drug screen",
                    clues: "Confirms recent use, including substances not disclosed.",
                    tests: "UDS where it changes management; confirmatory testing for medicolegal use."
                }
            ],
            differentials: [
                {
                    id: "sud",
                    name: "Substance use disorder",
                    dsm: "[Substance] use disorder, mild (2-3 criteria), moderate (4-5) or severe (6 or more), within 12 months",
                    icd: "6C4x.2 dependence, or 6C4x.1 harmful pattern of use, by substance",
                    supports: "A problematic pattern of use with impaired control, social impairment, risky use, or tolerance and withdrawal.",
                    keyQuestion: "Which of the 11 criteria have been present in the same 12 months?",
                    dsmIcd: "DSM-5-TR has one disorder graded by the number of criteria. ICD-11 separates dependence (impaired control, increasing precedence over other activities, physiological features) from a harmful pattern of use (use that has caused harm, without dependence).",
                    check: "Confirm the ICD-11 dependence threshold (two or more of the three central features) and the substance codes other than alcohol (6C40)."
                },
                {
                    id: "intoxication",
                    name: "Intoxication or withdrawal only",
                    dsm: "Substance intoxication or withdrawal",
                    icd: "6C4x.3 intoxication or 6C4x.4 withdrawal, by substance",
                    supports: "Problems limited to an episode of intoxication or withdrawal, without a pattern of use that meets criteria.",
                    keyQuestion: "Is there a pattern over 12 months, or a single episode?",
                    dsmIcd: "ICD-11 can also code a single 'episode of harmful use' (6C4x.0).",
                    check: "Confirm the ICD-11 intoxication and withdrawal subcodes (.3 and .4)."
                },
                {
                    id: "induced",
                    name: "Substance-induced mental disorder",
                    dsm: "Substance/medication-induced psychotic, mood, anxiety, sleep or neurocognitive disorder",
                    icd: "e.g. 6C46.6 stimulant-induced psychotic disorder, 6C40.70 alcohol-induced mood disorder",
                    supports: "Psychiatric symptoms that predominate and need attention in their own right, during or soon after use.",
                    keyQuestion: "Did the symptoms start before the use, or persist about a month after stopping?"
                },
                {
                    id: "independent",
                    name: "Co-occurring independent mental disorder",
                    dsm: "Any independent mental disorder diagnosed alongside the use disorder",
                    icd: "",
                    supports: "Symptoms that preceded the use, persist through about a month of abstinence, or occur in non-using periods.",
                    keyQuestion: "What were symptoms like during the longest period without use?",
                    note: "Co-occurring problems are the expectation: treat both together, and don't make mental health care conditional on abstinence."
                },
                {
                    id: "gambling",
                    code: "ICD-11 6C50",
                    name: "Gambling disorder",
                    dsm: "Gambling disorder (4 or more of 9 criteria in 12 months)",
                    icd: "6C50 Gambling disorder",
                    supports: "Impaired control over gambling, increasing priority over other activities, and continuing despite harm (e.g. chasing losses, lying, borrowing).",
                    keyQuestion: "Has gambling only happened during manic episodes? If so, it isn't gambling disorder.",
                    note: "Suicide risk is markedly raised, especially with debt and legal problems."
                },
                {
                    id: "no-disorder",
                    name: "Use without a disorder",
                    dsm: "No disorder (hazardous use may still warrant brief intervention)",
                    icd: "QE10 Hazardous alcohol use (a factor influencing health, not a disorder)",
                    supports: "Use without impaired control, harm or distress.",
                    keyQuestion: "Is there any harm, risk or loss of control?",
                    check: "Confirm the ICD-11 code QE10 and its equivalents for other substances."
                },
                feigning
            ]
        },

        risk: {
            name: "Suicidal, self-harm or aggressive behaviour",
            ruleOut: [
                {
                    id: "danger",
                    name: "Immediate danger (check for it)",
                    clues: "Ongoing intent with access to means, an interrupted attempt, a weapon, or active violence.",
                    tests: "Safety first: the person doesn't leave unaccompanied while this is unresolved; call for help early."
                },
                {
                    id: "medical",
                    name: "Medical causes of agitation",
                    clues: "Hypoglycaemia, hypoxia, sepsis, head injury; hyperthermia with agitation (serotonin toxicity, NMS, stimulant toxicity). Pain, urinary retention or constipation in people who can't say.",
                    tests: "BGL in everyone; vital signs and temperature; neurological examination."
                },
                {
                    id: "delirium",
                    name: "Delirium",
                    clues: "Fluctuating attention and awareness, especially in older or medically unwell people, or a first episode of aggression with no psychiatric history.",
                    tests: "4AT or CAM."
                },
                {
                    id: "substance",
                    name: "Intoxication or withdrawal",
                    clues: "Stimulant intoxication (dilated pupils, hypertension, paranoia); alcohol or benzodiazepine withdrawal (tremor, sweats); nicotine withdrawal drives much ward agitation.",
                    tests: "Breathalyser, UDS, timing of last use; offer nicotine replacement."
                },
                {
                    id: "akathisia",
                    name: "Akathisia",
                    clues: "Restlessness and agitation after starting or increasing an antipsychotic or antidepressant.",
                    tests: "Medication review; giving more of the drug makes it worse."
                },
                {
                    id: "overdose",
                    name: "Overdose or self-poisoning",
                    clues: "Any overdose, whatever the person says they took.",
                    tests: "Paracetamol and salicylate levels, EUC, LFT, ECG, drug levels where relevant."
                },
                {
                    id: "safeguarding",
                    name: "Safeguarding (check for it)",
                    clues: "Dependent children, domestic and family violence, named potential victims.",
                    tests: "Collateral history; child protection and duty-to-warn obligations under local policy."
                }
            ],
            differentials: [
                {
                    id: "psychotic",
                    name: "Psychotic disorder",
                    dsm: "e.g. schizophrenia, schizoaffective, or a mood disorder with psychotic features",
                    icd: "6A20-6A2Z primary psychotic disorders",
                    supports: "Behaviour driven by command hallucinations, persecutory or nihilistic delusions.",
                    keyQuestion: "Is the behaviour a response to delusions or hallucinations? Use the Psychosis questions."
                },
                {
                    id: "depression",
                    name: "Depressive disorder",
                    dsm: "Major depressive disorder, persistent depressive disorder, or bipolar depression",
                    icd: "6A70/6A71, 6A72, 6A60/6A61",
                    supports: "Hopelessness, worthlessness, guilt, insomnia and agitation during a depressive episode.",
                    keyQuestion: "Is there a current depressive episode? Use the Depressed mood questions."
                },
                {
                    id: "mania",
                    name: "Manic, hypomanic or mixed episode",
                    dsm: "Bipolar I or II disorder (mixed features carry high suicide risk)",
                    icd: "6A60/6A61",
                    supports: "Irritability, disinhibition and impulsivity during an elevated or mixed episode.",
                    keyQuestion: "Is there an elevated, irritable or mixed episode? Use the Elevated mood questions."
                },
                {
                    id: "substance",
                    name: "Substance use disorder or intoxication",
                    dsm: "Substance intoxication or withdrawal; substance use disorder",
                    icd: "6C40-6C4Z by substance",
                    supports: "Behaviour during intoxication or withdrawal; aggression to obtain drugs or money.",
                    keyQuestion: "Was the person intoxicated or withdrawing? Reassess when sober. Use the Substance use questions."
                },
                {
                    id: "ptsd",
                    code: "ICD-11 6B40",
                    name: "Post-traumatic stress disorder",
                    dsm: "Posttraumatic stress disorder",
                    icd: "6B40 PTSD · 6B41 Complex PTSD",
                    supports: "Reckless or self-destructive behaviour, irritability and outbursts, with re-experiencing and hyperarousal after trauma.",
                    keyQuestion: "Is the behaviour tied to trauma reminders or hyperarousal?",
                    check: "Confirm the ICD-11 codes 6B40 and 6B41."
                },
                {
                    id: "bpd",
                    code: "ICD-11 6D11.5",
                    name: "Borderline personality disorder",
                    dsm: "Borderline personality disorder (5 or more of 9 criteria)",
                    icd: "Personality disorder (6D10, mild, moderate or severe) with borderline pattern (6D11.5)",
                    supports: "Self-harm to relieve distress, emptiness or dissociation; unstable relationships and self-image; intense anger; impulsivity.",
                    keyQuestion: "Is this a long-standing pattern since adolescence or early adulthood, across situations?",
                    dsmIcd: "ICD-11 replaces personality disorder types with a severity rating plus trait domains; 'borderline pattern' is an optional qualifier.",
                    check: "Confirm the ICD-11 codes 6D10 and 6D11.5."
                },
                {
                    id: "aspd",
                    code: "ICD-11 6D11.2",
                    name: "Antisocial personality disorder",
                    dsm: "Antisocial personality disorder (age 18 or over, with conduct disorder before 15)",
                    icd: "Personality disorder (6D10) with prominent dissociality (6D11.2)",
                    supports: "Pervasive disregard for others' rights since adolescence: deceit, impulsivity, aggression, recklessness, lack of remorse.",
                    keyQuestion: "Were there conduct problems before age 15?",
                    dsmIcd: "ICD-11 has no antisocial type: it codes personality disorder severity with a dissociality trait.",
                    check: "Confirm the ICD-11 code 6D11.2."
                },
                {
                    id: "ied",
                    code: "ICD-11 6C73",
                    name: "Intermittent explosive disorder",
                    dsm: "Intermittent explosive disorder",
                    icd: "6C73 Intermittent explosive disorder",
                    supports: "Recurrent impulsive outbursts out of proportion to provocation, not premeditated, with distress or consequences afterwards.",
                    keyQuestion: "Are the outbursts better explained by another disorder (mood, psychosis, personality, substance)?"
                },
                {
                    id: "neurodevelopmental",
                    name: "Neurodevelopmental condition",
                    dsm: "Autism, intellectual developmental disorder, ADHD",
                    icd: "6A02 Autism spectrum disorder · 6A00 Intellectual development · 6A05 ADHD",
                    supports: "Self-injury or aggression when overwhelmed, in pain, or unable to communicate; impulsive aggression in ADHD.",
                    keyQuestion: "What is the behaviour communicating? Look for pain, sensory overload and changes in routine.",
                    check: "Confirm the ICD-11 codes 6A02, 6A00 and 6A05."
                },
                {
                    id: "bfrb",
                    name: "Body-focused repetitive behaviour",
                    dsm: "Trichotillomania · Excoriation (skin-picking) disorder",
                    icd: "6B25.0 Trichotillomania · 6B25.1 Excoriation disorder",
                    supports: "Repeated hair-pulling or skin-picking causing damage, with attempts to stop.",
                    keyQuestion: "Is the aim to relieve tension or an urge, rather than to hurt?",
                    check: "Confirm the ICD-11 codes 6B25.0 and 6B25.1."
                },
                {
                    id: "medical",
                    name: "Delirium or another medical cause",
                    dsm: "Delirium; personality change due to another medical condition; neurocognitive disorder with behavioural disturbance",
                    icd: "6D70 Delirium · 6E68 Secondary personality change",
                    supports: "New aggression or self-harm with fluctuating awareness, head injury, cognitive decline or medical illness.",
                    keyQuestion: "Is this a change from the person's usual self, with a medical explanation?",
                    check: "Confirm the ICD-11 code 6E68."
                },
                {
                    id: "adjustment",
                    code: "ICD-11 6B43",
                    name: "Adjustment disorder",
                    dsm: "Adjustment disorder (with disturbance of conduct, or with mixed features)",
                    icd: "6B43 Adjustment disorder",
                    supports: "A response to a recent identifiable stressor, not meeting criteria for another disorder.",
                    keyQuestion: "Are criteria met for another disorder? If so, that takes priority."
                },
                {
                    id: "none",
                    name: "No mental disorder",
                    dsm: "Adult antisocial behaviour; current suicidal behaviour or non-suicidal self-injury (recorded as conditions for clinical attention)",
                    icd: "",
                    supports: "Planned, instrumental aggression for gain or revenge, or self-harm in a crisis, without a mental disorder.",
                    keyQuestion: "Has a mental disorder been carefully excluded, including with collateral history?"
                },
                feigning
            ]
        }
    });
})();

/* Sleep problems and eating or weight change. ICD-11 places the sleep-wake
 * disorders in their own chapter (7), outside the mental disorders. Codes
 * marked "check" were found on ICD-11 coding sites but not on the WHO
 * browser itself. */
(function () {
    const feigning = {
        id: "feigning",
        code: "ICD-11 QC30 / 6D50",
        name: "Feigned symptoms (malingering or factitious disorder)",
        dsm: "Malingering (a condition for clinical attention, not a mental disorder) · Factitious disorder imposed on self",
        icd: "QC30 Malingering · 6D50 Factitious disorder imposed on self",
        supports: "Reported symptoms that don't match observation or sleep diaries, or an external incentive (hypnotics, stimulants, leave from work).",
        keyQuestion: "Do the reported symptoms match what is observed, by others or on a sleep diary?"
    };

    Object.assign(window.REASONING_CONTENT.differentials, {
        sleep: {
            name: "Sleep problems (insomnia or sleepiness)",
            ruleOut: [
                {
                    id: "driving",
                    name: "Drowsy driving (check for it)",
                    clues: "Falling asleep at the wheel or at work with machinery, or near-misses. Excessive sleepiness is a fitness-to-drive issue.",
                    tests: "Epworth Sleepiness Scale; advise not to drive until assessed (Austroads, Assessing Fitness to Drive)."
                },
                {
                    id: "substance",
                    name: "Substances",
                    clues: "Caffeine, alcohol (sleep worsens later in the night), nicotine, stimulants; withdrawal from alcohol, sedatives or cannabis.",
                    tests: "Use history including caffeine and energy drinks; UDS if indicated."
                },
                {
                    id: "medication",
                    name: "Medications",
                    clues: "Insomnia: SSRIs, SNRIs, bupropion, steroids, beta-blockers, stimulants, levodopa. Sleepiness: sedating antipsychotics, antidepressants, antihistamines, opioids, gabapentinoids. Antidepressants can trigger restless legs and REM sleep behaviour disorder.",
                    tests: "Medication review, including timing of doses."
                },
                {
                    id: "osa",
                    name: "Sleep apnoea",
                    clues: "Snoring, witnessed pauses in breathing, choking awakenings, morning headache, daytime sleepiness, obesity, on opioids or clozapine. Often co-occurs with insomnia.",
                    tests: "STOP-BANG; sleep study (home or lab)."
                },
                {
                    id: "rls",
                    name: "Restless legs",
                    clues: "An urge to move the legs, worse at rest and in the evening, relieved by moving. Linked to iron deficiency, pregnancy, kidney disease and antidepressants.",
                    tests: "Iron studies (ferritin and transferrin saturation), UEC."
                },
                {
                    id: "neuro",
                    name: "Medical conditions",
                    clues: "Pain, nocturia, heart failure, COPD or asthma, reflux, hyperthyroidism, menopause; for sleepiness also hypothyroidism, head injury, Parkinson's disease.",
                    tests: "Examination; FBC, TSH, UEC, glucose as indicated."
                },
                {
                    id: "delirium",
                    name: "Delirium",
                    clues: "A reversed or broken sleep-wake cycle with fluctuating attention is often the first sign.",
                    tests: "4AT or CAM."
                },
                {
                    id: "seizure",
                    name: "Nocturnal seizures",
                    clues: "Brief stereotyped episodes at any time of night, sometimes several a night, with tongue biting, incontinence or injury.",
                    tests: "Video of episodes; EEG and neurology review."
                },
                {
                    id: "mania",
                    name: "Reduced need for sleep (check for it)",
                    clues: "Sleeping much less without feeling tired, with high energy: a sign of mania or hypomania, not insomnia. Ask family.",
                    tests: "Collateral history; mood charting."
                },
                {
                    id: "suicide",
                    name: "Suicide risk (ask about it)",
                    clues: "Insomnia and nightmares are independent risk factors for suicidal thinking and behaviour.",
                    tests: "Ask directly; see the suicide risk formulation."
                }
            ],
            differentials: [
                {
                    id: "insomnia",
                    code: "ICD-11 7A00",
                    name: "Insomnia disorder",
                    dsm: "Insomnia disorder (persistent, episodic or recurrent; with a mental disorder, medical condition or another sleep disorder)",
                    icd: "7A00 Chronic insomnia",
                    supports: "Trouble getting to sleep, staying asleep or waking too early, at least 3 nights a week for 3 months, despite enough opportunity, with daytime impact.",
                    keyQuestion: "Does the insomnia need attention in its own right, beyond any condition it occurs with?",
                    note: "CBT-I is first-line treatment, including when insomnia occurs with depression or another condition."
                },
                {
                    id: "short-insomnia",
                    code: "ICD-11 7A01",
                    name: "Short-term insomnia",
                    dsm: "Other specified insomnia disorder (brief insomnia disorder, or restricted to fewer nights)",
                    icd: "7A01 Short-term insomnia",
                    supports: "Insomnia lasting under 3 months, often after a stressor, or below the frequency threshold.",
                    keyQuestion: "Is there a stressor, and is the sleep worry starting to keep the problem going?"
                },
                {
                    id: "breathing",
                    code: "ICD-11 7A41",
                    name: "Obstructive sleep apnoea",
                    dsm: "Obstructive sleep apnoea hypopnoea (central sleep apnoea and sleep-related hypoventilation are separate)",
                    icd: "7A41 Obstructive sleep apnoea · 7A40 Central sleep apnoeas",
                    supports: "Snoring, witnessed apnoeas, unrefreshing sleep, daytime sleepiness.",
                    keyQuestion: "What does the sleep study show? DSM-5-TR needs 5 or more apnoeas or hypopnoeas an hour with symptoms, or 15 or more regardless."
                },
                {
                    id: "rls",
                    code: "ICD-11 7A80",
                    name: "Restless legs syndrome",
                    dsm: "Restless legs syndrome",
                    icd: "7A80 Restless legs syndrome",
                    supports: "An urge to move the legs, worse at rest and in the evening, relieved by movement, at least 3 times a week for 3 months.",
                    keyQuestion: "Is it explained by akathisia, cramps, positional discomfort or neuropathy instead?",
                    note: "AASM (2024): give iron when ferritin is 75 µg/L or below or transferrin saturation under 20%; avoid dopamine agonists long term (augmentation)."
                },
                {
                    id: "circadian",
                    code: "ICD-11 7A60–7A6Z",
                    name: "Circadian rhythm sleep-wake disorder",
                    dsm: "Circadian rhythm sleep-wake disorder (delayed or advanced sleep phase, irregular, non-24-hour, or shift work type)",
                    icd: "7A60 Delayed · 7A61 Advanced · 7A62 Irregular · 7A63 Non-24-hour · 7A64 Shift work type · 7A65 Jet lag type",
                    supports: "Sleep is normal in length and quality at the preferred times, but those times clash with what is needed.",
                    keyQuestion: "What happens on free days or holidays, when they can sleep when they like? A sleep diary over 2 weeks helps.",
                    note: "DSM-5-TR has no jet lag type; ICD-11 does."
                },
                {
                    id: "narcolepsy",
                    code: "ICD-11 7A20",
                    name: "Narcolepsy",
                    dsm: "Narcolepsy (with or without cataplexy or hypocretin deficiency)",
                    icd: "7A20.0 Narcolepsy type 1 · 7A20.1 Narcolepsy type 2",
                    supports: "Irresistible sleep attacks at least 3 times a week for 3 months, with cataplexy, low CSF hypocretin, or typical sleep study findings.",
                    keyQuestion: "Is there cataplexy (sudden weakness with laughter or strong emotion)? A sleep study with MSLT confirms it.",
                    note: "Sleep-onset hallucinations can be mistaken for psychosis."
                },
                {
                    id: "hypersomnolence",
                    code: "ICD-11 7A21",
                    name: "Hypersomnolence disorder",
                    dsm: "Hypersomnolence disorder",
                    icd: "7A21 Idiopathic hypersomnia (closest category)",
                    supports: "Excessive sleepiness despite 7 hours or more of sleep, with daytime lapses, long unrefreshing sleep, or trouble waking fully; at least 3 times a week for 3 months.",
                    keyQuestion: "Has a sleep study excluded sleep apnoea and narcolepsy?",
                    check: "Confirm how ICD-11 maps DSM-5-TR hypersomnolence disorder (7A21 is the closest match, not an exact one)."
                },
                {
                    id: "insufficient",
                    code: "ICD-11 7A26",
                    name: "Insufficient sleep",
                    dsm: "Not a DSM-5-TR disorder (excluded from hypersomnolence disorder)",
                    icd: "7A26 Insufficient sleep syndrome",
                    supports: "Persistently sleeping less than they need (work, caring, screens), with sleepiness that goes when they catch up.",
                    keyQuestion: "Does the sleepiness resolve with longer sleep on free days?"
                },
                {
                    id: "nrem",
                    code: "ICD-11 7B00",
                    name: "Sleepwalking or sleep terrors",
                    dsm: "Non-rapid eye movement sleep arousal disorder (sleepwalking or sleep terror type)",
                    icd: "7B00 Disorders of arousal from non-REM sleep (7B00.0 confusional arousals · 7B00.1 sleepwalking · 7B00.2 sleep terrors · 7B00.3 sleep-related eating)",
                    supports: "Episodes in the first third of the night, hard to wake, little or no memory of them.",
                    keyQuestion: "Are there triggers: sleep loss, alcohol, z-drugs, sleep apnoea?",
                    check: "Confirm the ICD-11 sub-codes 7B00.0–7B00.3."
                },
                {
                    id: "rbd",
                    code: "ICD-11 7B01.0",
                    name: "REM sleep behaviour disorder",
                    dsm: "Rapid eye movement sleep behaviour disorder",
                    icd: "7B01.0 REM sleep behaviour disorder",
                    supports: "Acting out dreams (shouting, punching, kicking), usually later in the night, waking alert and recalling the dream.",
                    keyQuestion: "Confirmed on a sleep study? Is there an antidepressant trigger?",
                    note: "Most people with it later develop Parkinson's disease, Lewy body dementia or multiple system atrophy: discuss and follow up."
                },
                {
                    id: "nightmare",
                    code: "ICD-11 7B01.2",
                    name: "Nightmare disorder",
                    dsm: "Nightmare disorder",
                    icd: "7B01.2 Nightmare disorder",
                    supports: "Repeated vivid, frightening dreams, waking fully alert and recalling them, with distress or impairment.",
                    keyQuestion: "Are the nightmares part of PTSD? If so, diagnose nightmare disorder too only if they need treatment in their own right."
                },
                {
                    id: "paralysis",
                    code: "ICD-11 7B01.1",
                    name: "Recurrent isolated sleep paralysis",
                    dsm: "Other specified sleep-wake disorder (DSM-5-TR has no separate category)",
                    icd: "7B01.1 Recurrent isolated sleep paralysis",
                    supports: "Being unable to move for seconds to minutes on falling asleep or waking, often with fear or hallucinations.",
                    keyQuestion: "Is there daytime sleepiness or cataplexy suggesting narcolepsy?"
                },
                {
                    id: "mental",
                    name: "Part of another mental disorder",
                    dsm: "The sleep problem as a symptom of depression, mania, an anxiety disorder, PTSD or psychosis",
                    icd: "7A25 Hypersomnia associated with a mental disorder (sleepiness)",
                    supports: "The sleep problem started and changes with the mental disorder, and doesn't need attention on its own.",
                    keyQuestion: "If the mental disorder were treated, would the sleep problem still need treatment?"
                },
                {
                    id: "substance-induced",
                    code: "ICD-11 7A24 (sleepiness)",
                    name: "Substance/medication-induced sleep disorder",
                    dsm: "Substance/medication-induced sleep disorder (insomnia, daytime sleepiness, parasomnia or mixed type)",
                    icd: "7A24 Hypersomnia due to a medication or substance · otherwise record the substance effect",
                    supports: "The sleep problem began with use, withdrawal or a new medication.",
                    keyQuestion: "Does it settle when the substance or medication is stopped or changed?"
                },
                {
                    id: "medical",
                    code: "ICD-11 7A23 (sleepiness)",
                    name: "Sleep problem due to a medical condition",
                    dsm: "Insomnia disorder with medical comorbidity, or hypersomnolence related to a medical condition",
                    icd: "7A23 Hypersomnia due to a medical condition",
                    supports: "Sleep disrupted by pain, breathlessness, nocturia or another condition, improving as it is treated.",
                    keyQuestion: "Does the sleep problem outlast treatment of the condition? If so, treat it in its own right."
                },
                {
                    id: "none",
                    name: "No sleep-wake disorder",
                    dsm: "",
                    icd: "",
                    supports: "A short sleeper without daytime impact, occasional poor nights, or fatigue rather than sleepiness.",
                    keyQuestion: "Is this tiredness (low energy) rather than sleepiness (falling asleep)? Fatigue points to depression, anaemia, thyroid disease or medication."
                },
                feigning
            ]
        },

        eating: {
            name: "Eating or weight change",
            ruleOut: [
                {
                    id: "instability",
                    name: "Medical instability (check first)",
                    clues: "Adults: heart rate under 40 or a rise over 20 on standing; BP under 90/60 or a postural drop over 20; temperature under 35.5 °C; low potassium, phosphate or glucose; QTc over 460 ms or arrhythmia; BMI under 14 or rapid weight loss. Young people have stricter thresholds (e.g. heart rate under 50).",
                    tests: "Lying and standing HR and BP, temperature, ECG, UEC, magnesium, phosphate, glucose, LFT, FBC (RANZCP 2014, archived; NSW paediatric admission guideline)."
                },
                {
                    id: "refeeding",
                    name: "Refeeding syndrome risk",
                    clues: "Very low intake for days, low BMI, rapid weight loss, alcohol misuse, low electrolytes before feeding.",
                    tests: "Phosphate, potassium and magnesium daily for the first 1–2 weeks; thiamine before and during refeeding."
                },
                {
                    id: "substance",
                    name: "Substances",
                    clues: "Stimulants (amphetamines, cocaine) reduce appetite; alcohol replaces food; cannabis increases appetite.",
                    tests: "Use history; UDS if indicated."
                },
                {
                    id: "medication",
                    name: "Medications",
                    clues: "Weight gain: olanzapine, clozapine, quetiapine, mirtazapine, lithium, valproate, steroids. Weight loss: topiramate, stimulants, GLP-1 agonists, metformin. Laxative, diuretic or insulin misuse.",
                    tests: "Medication review, including over-the-counter and online purchases."
                },
                {
                    id: "neuro",
                    name: "Medical causes",
                    clues: "Weight loss: hyperthyroidism, diabetes, coeliac or inflammatory bowel disease, cancer, Addison's disease, HIV, TB. Weight gain: hypothyroidism, Cushing's syndrome, PCOS, hypothalamic lesions. Vomiting: GI obstruction, raised intracranial pressure.",
                    tests: "FBC, UEC, LFT, TSH, glucose or HbA1c, coeliac serology, CRP; further tests by history."
                },
                {
                    id: "delirium",
                    name: "Delirium",
                    clues: "Poor intake with fluctuating attention and awareness.",
                    tests: "4AT or CAM."
                },
                {
                    id: "suicide",
                    name: "Suicide risk (ask about it)",
                    clues: "Anorexia nervosa has the highest mortality of any mental disorder; about half of deaths are suicide. Risk is also raised in bulimia.",
                    tests: "Ask directly; see the suicide risk formulation."
                }
            ],
            differentials: [
                {
                    id: "an",
                    code: "ICD-11 6B80",
                    name: "Anorexia nervosa",
                    dsm: "Anorexia nervosa (restricting or binge-eating/purging type; mild BMI ≥ 17, moderate 16–16.99, severe 15–15.99, extreme < 15)",
                    icd: "6B80.0 With significantly low body weight · 6B80.1 With dangerously low body weight (BMI < 14) · 6B80.2 In recovery with normal body weight",
                    supports: "Restriction leading to significantly low weight, fear of weight gain or behaviour that prevents it, and weight or shape driving self-worth.",
                    keyQuestion: "What do collateral history and the weight trajectory show? Denial of seriousness is part of the illness.",
                    note: "Medical stabilisation and nutrition come first; family-based treatment for young people, CBT-E, MANTRA or SSCM for adults.",
                    check: "Confirm the ICD-11 BMI cut-off of 14 for 'dangerously low' and the restricting / binge-purge pattern sub-codes."
                },
                {
                    id: "bn",
                    code: "ICD-11 6B81",
                    name: "Bulimia nervosa",
                    dsm: "Bulimia nervosa (mild 1–3, moderate 4–7, severe 8–13, extreme 14+ compensatory episodes a week)",
                    icd: "6B81 Bulimia nervosa",
                    supports: "Binges with loss of control and regular compensatory behaviour, at least weekly for 3 months (ICD-11: 1 month), with weight or shape driving self-worth, not at low weight.",
                    keyQuestion: "Is weight low? If so, it is anorexia nervosa, binge-purge type.",
                    note: "Check potassium if vomiting or using laxatives or diuretics."
                },
                {
                    id: "bed",
                    code: "ICD-11 6B82",
                    name: "Binge-eating disorder",
                    dsm: "Binge-eating disorder (mild 1–3, moderate 4–7, severe 8–13, extreme 14+ binges a week)",
                    icd: "6B82 Binge eating disorder",
                    supports: "Binges with loss of control and marked distress, at least weekly for 3 months, without regular compensatory behaviour.",
                    keyQuestion: "Is there regular compensatory behaviour (vomiting, laxatives, fasting, excessive exercise)? If so, consider bulimia.",
                    note: "ICD-11 doesn't require a large amount of food: loss of control is the key feature.",
                    check: "Confirm the ICD-11 duration for binge eating disorder (several months)."
                },
                {
                    id: "osfed",
                    code: "ICD-11 6B8Y",
                    name: "Other specified feeding or eating disorder",
                    dsm: "Other specified feeding or eating disorder (atypical anorexia nervosa; bulimia or binge-eating of low frequency or limited duration; purging disorder; night eating syndrome)",
                    icd: "6B8Y Other specified feeding or eating disorders",
                    supports: "A clinically significant eating disorder that doesn't meet full criteria for another.",
                    keyQuestion: "Which pattern fits best? Record it by name.",
                    note: "Atypical anorexia nervosa can be just as medically unstable as low-weight anorexia: check vital signs and electrolytes."
                },
                {
                    id: "arfid",
                    code: "ICD-11 6B83",
                    name: "Avoidant/restrictive food intake disorder (ARFID)",
                    dsm: "Avoidant/restrictive food intake disorder",
                    icd: "6B83 Avoidant-restrictive food intake disorder",
                    supports: "Avoiding or limiting food because of low interest, sensory features or fear of choking or vomiting, with weight loss, nutritional deficiency, supplement dependence or marked interference with life; no weight or shape concern.",
                    keyQuestion: "Is weight or shape concern really absent? Is it better explained by a medical condition, lack of food or cultural practice?"
                },
                {
                    id: "pica",
                    code: "ICD-11 6B84",
                    name: "Pica",
                    dsm: "Pica",
                    icd: "6B84 Pica",
                    supports: "Eating non-food substances for a month or more, inappropriate for developmental level and not a cultural practice.",
                    keyQuestion: "What is being eaten? Check iron studies, lead and pregnancy; consider bowel obstruction and poisoning risk."
                },
                {
                    id: "rumination",
                    code: "ICD-11 6B85",
                    name: "Rumination disorder",
                    dsm: "Rumination disorder",
                    icd: "6B85 Rumination-regurgitation disorder",
                    supports: "Repeatedly bringing food back up, re-chewing, re-swallowing or spitting it out, for a month or more, without nausea or a GI cause.",
                    keyQuestion: "Has a gastrointestinal cause (reflux, gastroparesis, pyloric stenosis) been excluded?"
                },
                {
                    id: "mood",
                    name: "Depressive or bipolar disorder",
                    dsm: "Major depressive disorder (appetite change; with atypical features if increased appetite and sleep); manic or hypomanic episode",
                    icd: "6A70–6A7Z Depressive disorders · 6A60–6A6Z Bipolar disorders",
                    supports: "Appetite or weight change that began and fluctuates with a mood episode, without weight or shape concern.",
                    keyQuestion: "Did the appetite change start with the mood change, and does food carry any weight or shape meaning?"
                },
                {
                    id: "psychosis",
                    name: "Psychotic disorder",
                    dsm: "Schizophrenia spectrum disorder, delusional disorder, or psychotic depression",
                    icd: "6A20–6A2Z Schizophrenia or other primary psychotic disorders",
                    supports: "Food refused because of delusions (poisoning, contamination, a bodily delusion).",
                    keyQuestion: "Is the belief about food delusional, rather than about weight or shape?"
                },
                {
                    id: "substance-induced",
                    name: "Substance or medication effect",
                    dsm: "Record the substance or medication effect (e.g. stimulant use disorder; antipsychotic-induced weight gain)",
                    icd: "",
                    supports: "Appetite or weight change that began with a substance or medication.",
                    keyQuestion: "Does it change when the substance or medication is stopped or changed?"
                },
                {
                    id: "medical",
                    name: "Medical cause",
                    dsm: "Record the medical condition",
                    icd: "",
                    supports: "Weight or appetite change explained by a medical condition, without weight or shape concern.",
                    keyQuestion: "Has unexplained weight loss been fully investigated?"
                },
                {
                    id: "none",
                    name: "No feeding or eating disorder",
                    dsm: "",
                    icd: "",
                    supports: "Picky eating or weight change without significant medical or psychosocial consequences.",
                    keyQuestion: "Is there a significant health or psychosocial impact?"
                },
                feigning
            ]
        }
    });
})();

/* Physical symptoms or health worry, and depersonalisation or
 * derealisation. Codes marked "check" were found on ICD-11 coding sites but
 * not on the WHO browser itself. */
(function () {
    const feigning = {
        id: "feigning",
        code: "ICD-11 QC30 / 6D50",
        name: "Feigned symptoms (malingering or factitious disorder)",
        dsm: "Malingering (a condition for clinical attention, not a mental disorder) · Factitious disorder imposed on self",
        icd: "QC30 Malingering · 6D50 Factitious disorder imposed on self",
        supports: "Symptoms deliberately produced or exaggerated: findings that change when unobserved, tampering, a history that doesn't add up, or an external incentive (compensation, drugs, legal).",
        keyQuestion: "Is there evidence of deliberate production, rather than symptoms that are involuntary but unexplained?"
    };

    Object.assign(window.REASONING_CONTENT.differentials, {
        somatic: {
            name: "Physical symptoms or health worry",
            ruleOut: [
                {
                    id: "medical",
                    name: "Medical conditions",
                    clues: "Functional and medical illness often co-exist. Red flags: weight loss, fever, night sweats, bleeding, new symptoms after 50, objective neurological signs. Normal tests alone don't make a functional diagnosis.",
                    tests: "Proportionate investigation guided by the history; agree a stop-point with the GP."
                },
                {
                    id: "substance",
                    name: "Substances and medications",
                    clues: "Withdrawal (opioids, benzodiazepines, alcohol), side effects, opioid-induced hyperalgesia, medication overuse headache.",
                    tests: "Medication and substance review, including over-the-counter and online purchases."
                },
                {
                    id: "iatrogenic",
                    name: "Iatrogenic harm (check for it)",
                    clues: "Opioids, benzodiazepines, repeated procedures and unnecessary surgery; conflicting messages between clinicians.",
                    tests: "List all investigations, procedures and prescribers; one coordinating clinician."
                },
                {
                    id: "comorbid",
                    name: "Depression, anxiety and PTSD",
                    clues: "Common alongside somatic and functional disorders, and treatable on their own merits.",
                    tests: "PHQ-9, GAD-7, trauma history when appropriate (asking too early can feel accusatory)."
                },
                {
                    id: "suicide",
                    name: "Suicide risk (ask about it)",
                    clues: "Raised in somatic symptom disorder, chronic pain and body dysmorphic disorder, and often missed because the presentation is framed as physical.",
                    tests: "Ask directly; see the suicide risk formulation."
                }
            ],
            differentials: [
                {
                    id: "ssd",
                    code: "ICD-11 6C20",
                    name: "Somatic symptom disorder",
                    dsm: "Somatic symptom disorder (mild, moderate or severe; with predominant pain; persistent)",
                    icd: "6C20 Bodily distress disorder (6C20.0 mild · 6C20.1 moderate · 6C20.2 severe)",
                    supports: "Distressing physical symptoms with excessive thoughts, worry or time spent on them, for 6 months or more. The symptoms may or may not be medically explained.",
                    keyQuestion: "Is the response to the symptoms out of proportion, whatever their cause?",
                    note: "Explain clearly, set planned rather than crisis-driven reviews, and reduce iatrogenic load. CBT has the best evidence."
                },
                {
                    id: "iad",
                    code: "ICD-11 6B23",
                    name: "Illness anxiety disorder",
                    dsm: "Illness anxiety disorder (care-seeking or care-avoidant type)",
                    icd: "6B23 Hypochondriasis (grouped with the obsessive-compulsive related disorders)",
                    supports: "Preoccupation with having or getting a serious illness for 6 months or more, with few or mild symptoms, high health anxiety, and checking or avoidance.",
                    keyQuestion: "Are physical symptoms absent or mild? If they are prominent, consider somatic symptom disorder instead."
                },
                {
                    id: "fnd",
                    code: "ICD-11 6B60",
                    name: "Functional neurological disorder",
                    dsm: "Functional neurological symptom disorder (conversion disorder), by symptom type; acute or persistent; with or without a psychological stressor",
                    icd: "6B60 Dissociative neurological symptom disorder (e.g. 6B60.4 with non-epileptic seizures · 6B60.8 with movement disturbance)",
                    supports: "Weakness, abnormal movements, seizures or sensory loss with positive signs of incompatibility with neurological disease (Hoover's sign, tremor entrainment, video-EEG).",
                    keyQuestion: "What positive signs were found? It is a diagnosis on positive signs, not of exclusion, and no stressor is needed.",
                    note: "Explain it as a problem of nervous system functioning, not damage. Physiotherapy and CBT have the best evidence (Lehn et al. 2025, Australian consensus)."
                },
                {
                    id: "bdd",
                    code: "ICD-11 6B21",
                    name: "Body dysmorphic disorder",
                    dsm: "Body dysmorphic disorder (with muscle dysmorphia; good or fair, poor, or absent insight)",
                    icd: "6B21 Body dysmorphic disorder",
                    supports: "Preoccupation with flaws in appearance that others don't see or see as slight, with repetitive checking, grooming, comparing or reassurance-seeking.",
                    keyQuestion: "Is the concern only about weight or shape with restricted eating? If so, consider an eating disorder.",
                    note: "Even with absent insight it stays BDD (specifier), not delusional disorder. Cosmetic procedures rarely help."
                },
                {
                    id: "pfac",
                    code: "ICD-11 6E40",
                    name: "Psychological factors affecting a medical condition",
                    dsm: "Psychological factors affecting other medical conditions",
                    icd: "6E40 Psychological or behavioural factors affecting disorders or diseases classified elsewhere",
                    supports: "A diagnosed medical condition made worse by psychological or behavioural factors: stress-triggered flares, non-adherence, denial of symptoms.",
                    keyQuestion: "Are the factors part of another mental disorder? If so, diagnose that instead.",
                    check: "Confirm the ICD-11 code 6E40."
                },
                {
                    id: "osrd",
                    name: "Other specified somatic symptom and related disorder",
                    dsm: "Other specified somatic symptom and related disorder (brief somatic symptom or illness anxiety disorder; pseudocyesis)",
                    icd: "6C2Y Other specified disorders of bodily distress or bodily experience",
                    supports: "Clinically significant, but under 6 months or below full criteria.",
                    keyQuestion: "Is it an understandable reaction to a medical condition (no disorder), or an adjustment disorder?",
                    check: "Confirm the ICD-11 code 6C2Y."
                },
                {
                    id: "mood-anxiety",
                    name: "Part of panic, depression or generalised anxiety",
                    dsm: "Panic disorder · Major depressive disorder · Generalised anxiety disorder",
                    icd: "6B01 Panic disorder · 6A70–6A71 Depressive episode or disorder · 6B00 Generalised anxiety disorder",
                    supports: "Physical symptoms or health worry only during panic attacks, depressive episodes or generalised worry.",
                    keyQuestion: "Do the symptoms occur outside those episodes?"
                },
                {
                    id: "delusional",
                    code: "ICD-11 6A24",
                    name: "Delusional disorder, somatic type",
                    dsm: "Delusional disorder, somatic type (or psychotic depression)",
                    icd: "6A24 Delusional disorder",
                    supports: "Fixed false beliefs about the body (infestation, a bodily smell, an organ not working), unshaken by evidence.",
                    keyQuestion: "Is the belief fixed despite clear evidence? For appearance beliefs, BDD with absent insight is usually the better fit."
                },
                {
                    id: "substance-induced",
                    name: "Substance or medication effect",
                    dsm: "Substance intoxication or withdrawal; adverse effect of medication",
                    icd: "",
                    supports: "Symptoms that began with use, withdrawal or a new medication.",
                    keyQuestion: "Do the symptoms settle when the substance or medication is stopped or changed?"
                },
                {
                    id: "medical",
                    name: "Medical condition, proportionate response",
                    dsm: "No mental disorder (record the medical condition)",
                    icd: "",
                    supports: "Symptoms explained by a medical condition, with worry and behaviour in proportion to it.",
                    keyQuestion: "Has the medical work-up been proportionate, and are red flags addressed?"
                },
                {
                    id: "none",
                    name: "No mental disorder",
                    dsm: "",
                    icd: "",
                    supports: "Physical symptoms without excessive thoughts, feelings or behaviours about them.",
                    keyQuestion: "Is the distress in proportion to the symptoms?"
                },
                feigning
            ]
        },

        depersonalisation: {
            name: "Depersonalisation or derealisation",
            ruleOut: [
                {
                    id: "substance",
                    name: "Substances",
                    clues: "Cannabis (a common trigger of lasting depersonalisation), hallucinogens, ketamine, MDMA; alcohol or benzodiazepine withdrawal.",
                    tests: "Use history and timeline; UDS."
                },
                {
                    id: "medication",
                    name: "Medications",
                    clues: "Starting or stopping antidepressants, anticholinergics, sedatives.",
                    tests: "Medication review."
                },
                {
                    id: "neuro",
                    name: "Neurological causes",
                    clues: "Temporal lobe epilepsy (brief stereotyped episodes, déjà vu, automatisms), migraine, vestibular disorders, head injury. Late onset or neurological signs raise suspicion.",
                    tests: "Neurological examination; EEG if episodic; MRI if indicated."
                },
                {
                    id: "delirium",
                    name: "Delirium",
                    clues: "Fluctuating attention and awareness.",
                    tests: "4AT or CAM."
                },
                {
                    id: "trauma",
                    name: "Trauma (ask about it sensitively)",
                    clues: "Dissociation often follows trauma, including childhood trauma.",
                    tests: "Trauma history when the person is ready; PCL-5 if PTSD suspected."
                }
            ],
            differentials: [
                {
                    id: "dpdr",
                    code: "ICD-11 6B66",
                    name: "Depersonalisation-derealisation disorder",
                    dsm: "Depersonalization/derealization disorder",
                    icd: "6B66 Depersonalization-derealization disorder",
                    supports: "Persistent or recurrent feelings of detachment from one's self or surroundings, knowing they aren't real, with distress or impairment.",
                    keyQuestion: "Is reality testing intact, and is it independent of substances, medical causes and other mental disorders?",
                    note: "Explain it, teach grounding, and treat co-occurring anxiety and depression. No medication has good evidence."
                },
                {
                    id: "ptsd",
                    code: "ICD-11 6B40",
                    name: "PTSD with dissociative symptoms, or acute stress",
                    dsm: "Posttraumatic stress disorder, with dissociative symptoms · Acute stress disorder",
                    icd: "6B40 Post-traumatic stress disorder · QE84 Acute stress reaction",
                    supports: "Depersonalisation or derealisation alongside intrusions, avoidance, negative mood and arousal after trauma.",
                    keyQuestion: "Has it lasted more than a month since the trauma?"
                },
                {
                    id: "amnesia",
                    code: "ICD-11 6B61",
                    name: "Dissociative amnesia",
                    dsm: "Dissociative amnesia (with or without dissociative fugue)",
                    icd: "6B61 Dissociative amnesia",
                    supports: "Inability to recall important personal information, usually of a traumatic or stressful nature, beyond ordinary forgetting.",
                    keyQuestion: "Has a neurological cause (seizures, head injury, transient global amnesia, alcohol) been excluded?",
                    check: "Confirm the ICD-11 code 6B61."
                },
                {
                    id: "did",
                    code: "ICD-11 6B64",
                    name: "Dissociative identity disorder",
                    dsm: "Dissociative identity disorder",
                    icd: "6B64 Dissociative identity disorder · 6B65 Partial dissociative identity disorder",
                    supports: "Two or more distinct identity states with marked discontinuity in sense of self and agency, and recurrent gaps in memory.",
                    keyQuestion: "Are voices experienced as parts of the self, rather than as outside psychotic hallucinations?",
                    check: "Confirm the ICD-11 codes 6B64 and 6B65."
                },
                {
                    id: "psychosis",
                    name: "Psychotic disorder",
                    dsm: "Schizophrenia spectrum disorder, or psychotic depression (e.g. nihilistic delusions)",
                    icd: "6A20–6A2Z Schizophrenia or other primary psychotic disorders",
                    supports: "The person believes the change is real: they are actually dead, the world has been replaced.",
                    keyQuestion: "Is it 'as if' (intact reality testing) or a fixed belief?"
                },
                {
                    id: "panic-mood",
                    name: "Part of panic attacks or depression",
                    dsm: "Panic disorder or panic attacks · Major depressive disorder",
                    icd: "6B01 Panic disorder · 6A70–6A71 Depressive episode or disorder",
                    supports: "Depersonalisation only during panic attacks or depressive episodes.",
                    keyQuestion: "Does it happen outside those episodes?"
                },
                {
                    id: "personality",
                    name: "Borderline or schizotypal personality",
                    dsm: "Borderline personality disorder (transient, stress-related dissociation) · Schizotypal personality disorder",
                    icd: "6D10 Personality disorder, with borderline pattern (6D11.5) · 6A22 Schizotypal disorder",
                    supports: "Brief dissociation under stress, within a long-standing pattern.",
                    keyQuestion: "Is the dissociation only brief and stress-related, within a long-standing pattern?"
                },
                {
                    id: "fnd",
                    code: "ICD-11 6B60",
                    name: "Functional neurological disorder",
                    dsm: "Functional neurological symptom disorder",
                    icd: "6B60 Dissociative neurological symptom disorder",
                    supports: "Weakness, abnormal movements, seizures or sensory loss incompatible with neurological disease.",
                    keyQuestion: "Are there positive signs on examination?"
                },
                {
                    id: "substance-induced",
                    name: "Substance intoxication, withdrawal or medication effect",
                    dsm: "Substance intoxication or withdrawal; adverse effect of medication (DSM-5-TR has no substance-induced dissociative disorder)",
                    icd: "",
                    supports: "Depersonalisation only during intoxication, withdrawal or a medication's effect.",
                    keyQuestion: "Does it persist well beyond the substance? If so, consider depersonalisation-derealisation disorder."
                },
                {
                    id: "medical",
                    code: "ICD-11 6E65",
                    name: "Dissociation due to a medical condition",
                    dsm: "Other specified mental disorder due to another medical condition",
                    icd: "6E65 Secondary dissociative syndrome",
                    supports: "Temporal lobe epilepsy, migraine, vestibular disease or head injury explains the episodes.",
                    keyQuestion: "Are the episodes brief and stereotyped, with déjà vu or automatisms (think epilepsy)?"
                },
                {
                    id: "none",
                    name: "No mental disorder",
                    dsm: "",
                    icd: "",
                    supports: "Brief episodes without distress or impairment, with fatigue, sleep loss, stress or intoxication: common in the general population.",
                    keyQuestion: "Is it persistent or recurrent, and does it cause distress or impairment?"
                },
                feigning
            ]
        }
    });
})();

/* Avoidance, and psychomotor slowing. Avoidance has no substance or medical
 * steps: it is a reaction to a fear or a loss of drive, not a direct effect
 * on the brain. Most of its answers hand over to another presentation. */
Object.assign(window.REASONING_CONTENT.differentials, {
    avoidance: {
        name: "Avoidance",
        ruleOut: [
            {
                id: "driver",
                name: "What drives it (check for it)",
                clues: "Ask what they fear would happen. The feared outcome, not the situation avoided, decides the diagnosis: panic in a crowd (agoraphobia), judgement (social anxiety), contamination (OCD), a plot (psychosis), or no fear at all, just no energy (depression).",
                tests: "Ask 'What would happen if you went?'; collateral history."
            },
            {
                id: "medical",
                name: "Medical conditions that draw attention",
                clues: "Tremor, stuttering, disfigurement, obesity or incontinence can make avoidance understandable. It is a disorder only when the fear is unrelated to the condition or clearly excessive.",
                tests: "History and examination."
            },
            {
                id: "safety",
                name: "Real threat (check for it)",
                clues: "Avoiding a violent partner, a bully or an unsafe place is not a disorder.",
                tests: "Ask about safety at home and in the community."
            }
        ],
        differentials: [
            {
                id: "anxiety",
                name: "An anxiety, obsessive-compulsive or trauma-related disorder",
                dsm: "Agoraphobia · Social anxiety disorder · Specific phobia · Separation anxiety disorder · OCD · PTSD or acute stress disorder · Illness anxiety disorder · Body dysmorphic disorder",
                icd: "6B02 · 6B04 · 6B03 · 6B05 · 6B20 · 6B40 · 6B23 · 6B21",
                supports: "Avoidance driven by a specific fear: of panic where escape is hard, of judgement, of an object, of separation, of triggering obsessions, of trauma reminders, of illness.",
                keyQuestion: "What do they fear would happen? Work it through with the Anxiety questions."
            },
            {
                id: "avpd",
                name: "Avoidant personality disorder",
                dsm: "Avoidant personality disorder",
                icd: "6D10 Personality disorder (trait domains: negative affectivity, detachment); ICD-11 has no avoidant type",
                supports: "A pervasive pattern since early adulthood of social inhibition, feeling inadequate and sensitivity to criticism, across most of life.",
                keyQuestion: "Has it been present since adolescence or early adulthood, across most situations?",
                note: "Often co-occurs with social anxiety disorder: both can be diagnosed."
            },
            {
                id: "depression",
                name: "Depression or negative symptoms",
                dsm: "Major depressive disorder · Negative symptoms of schizophrenia",
                icd: "6A70–6A71 Depressive episode or disorder · 6A20 Schizophrenia",
                supports: "Avoidance from lack of energy, interest or motivation, without fear.",
                keyQuestion: "If they had the energy, would they want to go?"
            },
            {
                id: "psychosis",
                name: "Delusional fear",
                dsm: "Schizophrenia spectrum disorder or delusional disorder",
                icd: "6A20–6A2Z Schizophrenia or other primary psychotic disorders",
                supports: "Avoidance driven by a delusional threat (a plot, being poisoned or watched).",
                keyQuestion: "Is the feared threat a fixed false belief?"
            },
            {
                id: "eating",
                name: "Eating disorder or ARFID",
                dsm: "Anorexia nervosa · Avoidant/restrictive food intake disorder",
                icd: "6B80 Anorexia nervosa · 6B83 ARFID",
                supports: "Avoiding foods, with weight loss: with fear of weight gain (anorexia) or without it (ARFID).",
                keyQuestion: "Is there fear of weight gain or a disturbed body image?"
            },
            {
                id: "sexual",
                name: "Sexual dysfunction",
                dsm: "Sexual dysfunctions (e.g. erectile disorder, genito-pelvic pain/penetration disorder)",
                icd: "Chapter 17, conditions related to sexual health (HA00–HA8Z)",
                supports: "Avoiding intimacy because of worry about sexual performance or pain.",
                keyQuestion: "Is there a sexual dysfunction, and a medical or medication cause for it?"
            },
            {
                id: "adjustment",
                code: "ICD-11 6B43",
                name: "Adjustment disorder",
                dsm: "Adjustment disorder",
                icd: "6B43 Adjustment disorder",
                supports: "Avoidance in response to a recent identifiable stressor, not meeting criteria for another disorder.",
                keyQuestion: "Did it start within 3 months of the stressor?"
            },
            {
                id: "other-anxiety",
                code: "ICD-11 6B0Y",
                name: "Other specified anxiety disorder",
                dsm: "Other specified anxiety disorder",
                icd: "6B0Y Other specified anxiety or fear-related disorder",
                supports: "Clinically significant avoidance that doesn't fit another disorder.",
                keyQuestion: "Which disorder does it come closest to?"
            },
            {
                id: "none",
                name: "No mental disorder",
                dsm: "",
                icd: "",
                supports: "Avoidance in proportion to a real threat or a medical condition, or without distress or impairment.",
                keyQuestion: "Is it causing distress or getting in the way of life?"
            }
        ]
    },

    slowing: {
        name: "Psychomotor slowing",
        ruleOut: [
            {
                id: "nms",
                name: "Neuroleptic malignant syndrome",
                clues: "Rigidity, fever, autonomic instability and confusion, usually days after starting or increasing an antipsychotic. Raised CK. A medical emergency.",
                tests: "Temperature, pulse, BP, CK, UEC, FBC; stop the antipsychotic; urgent medical review."
            },
            {
                id: "parkinsonism",
                name: "Medication-induced parkinsonism",
                clues: "Rigidity, tremor, shuffling gait and reduced facial expression after starting or increasing an antipsychotic, metoclopramide or another dopamine blocker. Often mistaken for depression or negative symptoms.",
                tests: "Examine tone, gait and tremor; medication review."
            },
            {
                id: "substance",
                name: "Substances and medications",
                clues: "Opioids, benzodiazepines, alcohol and other sedatives; inhalants; stimulant withdrawal ('crash'); sedating antipsychotics, antidepressants and antiepileptics.",
                tests: "Use history; UDS; medication review."
            },
            {
                id: "delirium",
                name: "Hypoactive delirium",
                clues: "Quiet, slowed and drowsy with fluctuating attention. Often mistaken for depression, especially in older adults.",
                tests: "4AT or CAM; find the cause."
            },
            {
                id: "neuro",
                name: "Medical and neurological causes",
                clues: "Hypothyroidism, Parkinson's disease, stroke, subdural haematoma, normal pressure hydrocephalus, hypoglycaemia, hepatic or uraemic encephalopathy, hypercalcaemia.",
                tests: "Neurological examination; TSH, UEC, calcium, glucose, LFT; CT or MRI brain if new neurological signs."
            },
            {
                id: "intake",
                name: "Food and fluid intake (check for it)",
                clues: "Severe slowing can mean poor intake, dehydration, pressure injury and VTE risk.",
                tests: "Fluid balance, weight, UEC; VTE risk assessment."
            }
        ],
        differentials: [
            {
                id: "depression",
                name: "Depressive episode",
                dsm: "Major depressive disorder, bipolar depression or schizoaffective disorder (with melancholic features if marked)",
                icd: "6A70–6A71 Depressive episode or disorder · 6A60–6A61 Bipolar disorder · 6A21 Schizoaffective disorder",
                supports: "Slowing with low mood or loss of interest for 2 weeks or more.",
                keyQuestion: "Is there low mood or loss of interest? Marked slowing points to melancholic features.",
                note: "Severe retardation with poor intake: consider ECT."
            },
            {
                id: "catatonia",
                name: "Catatonia",
                dsm: "Catatonia associated with another mental disorder, or due to another medical condition",
                icd: "6A40 Catatonia associated with another mental disorder · 6A41 Catatonia induced by substances or medications · 6E69 Secondary catatonia syndrome",
                supports: "Slowing with mutism, posturing, waxy flexibility, negativism or staring.",
                keyQuestion: "Are there 3 or more catatonic signs? A lorazepam challenge can help."
            },
            {
                id: "psychosis",
                name: "Psychotic disorder",
                dsm: "Schizophrenia (negative symptoms or catatonic features) or another psychotic disorder",
                icd: "6A20 Schizophrenia",
                supports: "Slowing with delusions or hallucinations, or as part of negative symptoms.",
                keyQuestion: "Is it negative symptoms, depression, or medication-induced parkinsonism? All three look alike."
            },
            {
                id: "medication",
                name: "Medication-induced movement disorder",
                dsm: "Medication-induced parkinsonism · Neuroleptic malignant syndrome (medication-induced movement disorders)",
                icd: "Chapter 8 (diseases of the nervous system)",
                supports: "Slowing with rigidity or tremor after a dopamine blocker; NMS adds fever, autonomic instability and confusion.",
                keyQuestion: "Did it start after a dopamine blocker was started or increased?"
            },
            {
                id: "substance-induced",
                name: "Substance or medication effect",
                dsm: "Substance intoxication or withdrawal; substance/medication-induced depressive disorder",
                icd: "",
                supports: "Slowing with intoxication (opioids, sedatives, inhalants) or stimulant withdrawal.",
                keyQuestion: "Does it clear as the substance wears off or withdrawal ends?"
            },
            {
                id: "medical",
                code: "ICD-11 6E62",
                name: "Due to a medical condition",
                dsm: "Depressive disorder due to another medical condition, or a symptom of the medical condition (no mental disorder)",
                icd: "6E62 Secondary mood syndrome",
                supports: "Slowing explained by hypothyroidism, Parkinson's disease, stroke or another condition.",
                keyQuestion: "Are there depressive symptoms too, or only physical slowing?"
            },
            {
                id: "other",
                name: "Other specified depressive disorder or unspecified catatonia",
                dsm: "Other specified depressive disorder · Unspecified catatonia",
                icd: "6A7Y Other specified depressive disorders · 6A4Z Catatonia, unspecified",
                supports: "Clinically significant slowing not explained above.",
                keyQuestion: "Keep looking for a cause: medical work-up and collateral history.",
                check: "Confirm the ICD-11 code 6A7Y."
            }
        ]
    }
});
