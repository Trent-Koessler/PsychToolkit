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
