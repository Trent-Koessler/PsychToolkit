/* =========================================================================
 * Mental Health Act 2007 (NSW) — point-of-care decision support
 * =========================================================================
 *
 * Statutory text is NOT written by hand in this file. Every quote is pulled
 * from mha-data.js, which is generated from the consolidated Act published by
 * NSW Parliamentary Counsel. This file holds only the clinical scaffolding
 * around that text: plain-English glosses, the decision graph, the flowchart
 * layouts and the rendering.
 *
 * Sources, and how each is used:
 *   - Mental Health Act 2007 (NSW), consolidated XML, in force 28 March 2026
 *     (last consolidated amendment Act No 61 of 2025) — all quoted section text.
 *   - NSW Mental Health Act (2007) Guide Book, 9th edition (HETI, November 2022)
 *     — practical procedure (Schedule 1 / Form 1 usage, examination sequence).
 *   - Cheng K, Wand A, Ryan C, Callaghan S. "An algorithm for managing adults
 *     who refuse medical treatment in New South Wales." Australas Psychiatry
 *     2018; 26(5): 464-468 — the treatment-refusal pathway, and the reading of
 *     the Guardianship Act 1987 (NSW) provisions cited there.
 *
 * Guardianship Act 1987 (NSW) provisions are PARAPHRASED from Cheng et al.,
 * not quoted, because that Act's text was not available to verify against.
 * Every such item is marked `unverified: true` and rendered with a warning.
 * ========================================================================= */

(function () {
    "use strict";

    var ACT = window.MHA_ACT || { meta: {}, sections: [] };
    var SECTION_INDEX = {};
    ACT.sections.forEach(function (s) { SECTION_INDEX[s.n] = s; });

    var LEGISLATION_URL = "https://legislation.nsw.gov.au/view/html/inforce/current/act-2007-008";
    var GUIDEBOOK_URL = "https://www.health.nsw.gov.au/mentalhealth/resources/Pages/mhact-guidebook-2007.aspx";
    var FORMS_URL = "https://www.health.nsw.gov.au/mentalhealth/legislation/Pages/legislation.aspx";
    var MHRT_URL = "https://www.mhrt.nsw.gov.au/";
    var NCAT_URL = "https://ncat.nsw.gov.au/case-types/guardianship.html";

    /* ---------------------------------------------------------------------
     * Plain-English glosses. These are the app's own words; the quoted text
     * beneath each one in the UI is the Act's.
     * ------------------------------------------------------------------ */
    var GLOSS = {
        "3": "The objects of the Act — care, treatment and recovery, least restrictive setting, civil rights.",
        "4": "The Act's dictionary. 'Authorised medical officer', 'mental illness', 'involuntary patient' and 'declared mental health facility' are all defined here.",
        "5": "Voluntary admission on the person's own request.",
        "8": "A voluntary patient must be discharged when they ask, unless steps are taken to detain them.",
        "9": "Periodic review of voluntary patients.",
        "10": "A voluntary patient can be detained, but only by going through the Part 2 detention process — being an inpatient is not itself authority.",
        "12": "The safety net that governs every detention decision: the person must be mentally ill or mentally disordered AND no less restrictive care may be appropriate and reasonably available. If that is not so, the officer must refuse to detain, and must not continue detaining.",
        "13": "Detention and compulsory treatment are only available if the person satisfies the criteria in this Part — nothing else will do.",
        "14": "The 'mentally ill person' test: mental illness, plus reasonable grounds to believe care, treatment or control is necessary for protection from serious harm. The continuing condition and likely deterioration are taken into account.",
        "15": "The 'mentally disordered person' test: behaviour so irrational as to justify a conclusion that temporary care, treatment or control is necessary for protection from serious PHYSICAL harm. Mental illness is not required.",
        "16": "The exclusions. Political, religious or philosophical belief, sexuality, immorality, drug or alcohol taking, and antisocial behaviour do not by themselves make a person mentally ill or mentally disordered.",
        "17": "Defines 'assessable person' — a detained person for whom a mental health inquiry must be held.",
        "18": "The complete list of lawful routes into detention in a declared mental health facility.",
        "19": "The Schedule 1 — a mental health certificate by a medical practitioner or accredited person who has personally examined or observed the person. Note the disqualification in (2)(d) and the expiry rules in (4).",
        "19A": "A Schedule 1 examination may be done by audio visual link where the practitioner is satisfied it can be done with sufficient skill and care.",
        "20": "An ambulance officer may take a person to a declared mental health facility on reasonable grounds, without a certificate.",
        "21": "Police must respond to a police assistance endorsement or an ambulance officer's request, and may enter premises without a warrant.",
        "22": "Police apprehension. Requires the offence / self-harm / serious physical harm limb AND that dealing with the person under this Act is better for their welfare.",
        "23": "Where a person is physically inaccessible, a Magistrate or authorised officer may order that they be visited and examined; premises may be entered by force.",
        "24": "Detention on a court order under the forensic provisions Act.",
        "25": "Transfer from another health facility. The person is then treated as detained under s 19 — but document the reasons and the grounds.",
        "26": "Detention on the written request of a designated carer, principal care provider, relative or friend — only where distance and urgency make a certificate impracticable.",
        "27": "The examination sequence that authorises ongoing detention: first examination within 12 hours, a second examination, and a third where the second does not agree. Also sets out when the Tribunal must be notified.",
        "27A": "Who may perform the s 27 examinations when an authorised medical officer cannot do so in person — including by audio visual link, and the duty to seek psychiatric advice.",
        "28": "Examiners may rely on their own observations and other reliable evidence — and the practitioner who scheduled the person must NOT perform the s 27 examinations.",
        "29": "Medication given to a detained person must be the minimum consistent with proper care, so the person can communicate at their mental health inquiry.",
        "30": "An assessable person may be reclassified as a voluntary patient at any time before the inquiry.",
        "31": "The limits on detaining a mentally disordered person. Note the wording carefully: the maximum is 3 days NOT INCLUDING weekends and public holidays — which is not the same as 72 hours, and over a long weekend is considerably longer. Examination at least every 24 hours, release as soon as the criteria are not met, and no more than 3 such admissions in a calendar month.",
        "33": "Steps under s 27 and the inquiry may be delayed while the person is too physically unwell to be the subject of them. Section 12 still applies.",
        "34": "The Tribunal must hold a mental health inquiry, and the authorised medical officer must get the person and the evidence there.",
        "35": "What the Tribunal decides at the inquiry and the orders it can make — including an involuntary patient order for up to 3 months.",
        "36": "The Tribunal may adjourn an inquiry for up to 14 days; the person continues to be detained.",
        "37": "The review timetable for involuntary patients: at the end of the initial period, then at least 3-monthly for 12 months, then at least 6-monthly.",
        "38": "What the Tribunal decides on review, and its power to discharge, discharge into a carer's care, or make a community treatment order.",
        "40": "An involuntary patient may be reclassified as voluntary at any time by an authorised medical officer or the Tribunal.",
        "41": "Discharge follows the making of a community treatment order.",
        "42": "A detained person may apply to the authorised medical officer to be discharged.",
        "43": "A designated carer or principal care provider may apply for the person's discharge.",
        "44": "The appeal right: to the Tribunal if the officer refuses, or fails to determine the application within 3 working days.",
        "47": "Leave of absence on compassionate, medical or other grounds.",
        "48": "Apprehension of a person who is absent from a facility without permission.",
        "51": "Who may apply for a community treatment order and when one may be made.",
        "52": "Notice of a community treatment order application to the person, their carers and the treating facility.",
        "53": "The criteria the Tribunal applies to a community treatment order — including the requirement of a previous history of refusing appropriate treatment where the person has been previously diagnosed.",
        "54": "What the treatment plan under a community treatment order must contain.",
        "56": "Form and duration — a community treatment order runs for the specified period, or 12 months if none is specified.",
        "58": "The breach procedure: reasonable steps first, then a breach notice, then a breach order.",
        "59": "Police assistance in taking a person to a facility under a breach order.",
        "60": "What happens at the facility after a breach notice or breach order.",
        "61": "Review of the person at the facility after a breach order, and the decision whether to detain.",
        "61A": "Medical examination of a person detained after a breach order.",
        "62": "Discharge and detention of a person brought in under a breach order.",
        "63": "Tribunal review of a person detained after a breach order.",
        "65": "The Tribunal's power to vary or revoke orders.",
        "66": "The director of community treatment may revoke a community treatment order.",
        "66A": "Who must be notified when a community treatment order is varied or revoked.",
        "68": "The principles for care and treatment. Least restrictive environment, timely and high quality care, minimum interference with liberty and dignity, cultural and developmental needs, and involving the person and monitoring their capacity to consent.",
        "69": "It is an offence to ill-treat a patient.",
        "69A": "Spit hoods must not be used.",
        "70": "Interpreters must be used where the person cannot communicate adequately in English.",
        "71": "Who the designated carer is — the guardian, a parent of a child, a nominated person, or otherwise a spouse, primary carer, or close friend or relative. Includes extended family and kin for Aboriginal and Torres Strait Islander patients.",
        "72": "How a patient nominates (or revokes the nomination of) a designated carer.",
        "72A": "Who the principal care provider is, and when the officer need not give effect to the requirement.",
        "72B": "Information from carers, relatives, friends and treating clinicians must be considered when making detention or discharge decisions.",
        "73": "Information about medication must be given to the patient.",
        "74": "The statement of legal rights — oral explanation and written statement, as soon as practicable; repeated within 24 hours of the inquiry if the person could not understand it at first.",
        "75": "Carers and the principal care provider must be notified of the detention within 24 hours.",
        "76": "Notice of the mental health inquiry to the person and to carers.",
        "77": "New involuntary patients must be told of their appeal rights.",
        "78": "The event-notification duties to designated carers and principal care providers — including proposed and performed surgery, ECT applications, transfer, discharge and Tribunal matters.",
        "79": "Discharge planning must involve the person, their carers and the services involved.",
        "80": "Transfer of patients between facilities.",
        "81": "Who may transport a person, and the powers that come with it — reasonable force, restraint, sedation for safe transport, and searches.",
        "82": "For the treatment Part, 'involuntary patient' is extended to include a forensic patient, a correctional patient AND a person detained in a mental health facility. This is what brings assessable persons within s 84.",
        "83": "Prohibited treatments — deep sleep therapy, insulin coma therapy and psychosurgery.",
        "84": "The authorised medical officer may give, or authorise, any treatment the officer thinks fit to an involuntary patient or assessable person detained in the facility. Read with s 82, s 83, s 85 and s 68 — and see the treatment-refusal pathway before relying on it against a competent refusal of non-psychiatric treatment.",
        "85": "Excessive or inappropriate dosage is an offence.",
        "87": "Defines the two kinds of ECT inquiry the Tribunal holds — an ECT consent inquiry and an ECT administration inquiry.",
        "88": "The offences around administering ECT, including the requirement for two medical practitioners to be present.",
        "89": "ECT may only be given with informed consent and certification, or after a Tribunal determination for an involuntary patient or a person under 16.",
        "92": "A person impaired by medication to the point of being unable to give informed consent is treated as incapable of consenting to ECT.",
        "91": "What informed consent to ECT requires — a fair explanation, full description of discomforts, risks and benefits, alternatives, and the freedom to withdraw.",
        "93": "ECT for a person who is not an involuntary patient and is 16 or over: informed consent plus certificates from two medical practitioners, at least one a psychiatrist. If capacity is unclear, apply for an ECT consent inquiry.",
        "94": "ECT for an involuntary patient or a person under 16: only on a Tribunal determination at an ECT administration inquiry, supported by two certificates.",
        "98": "The definitions for the surgery Part — note that 'surgical operation' includes the administration of an anaesthetic for the purpose of medical investigation, and that 'special medical treatment' means treatment likely to render the person permanently infertile.",
        "99": "Emergency surgery. An authorised medical officer or the Secretary may consent where the patient cannot consent, refuses, or neither gives nor refuses consent, and the operation is urgently needed to save life, prevent serious damage to health, or prevent significant pain or distress. Consent must be written and signed; the Tribunal must be notified afterwards.",
        "100": "Non-emergency surgery where a designated carer agrees in writing and the patient is incapable of consenting — the authorised medical officer applies to the Secretary.",
        "101": "Non-emergency surgery where no designated carer agrees — the authorised medical officer applies to the Tribunal. This is also the route where a patient capable of consenting refuses.",
        "102": "Special medical treatment may only be carried out in an emergency to save life or prevent serious damage to health, or with the Tribunal's consent.",
        "103": "The Tribunal's power to consent to special medical treatment.",
        "104": "A consent given under this Part has the same effect as the patient's own consent.",
        "190": "The Act does not limit other powers: police powers under other laws are unaffected, and an authorised medical officer may take action the officer thinks fit to protect a person from serious physical harm. Read the second limb narrowly — see the treatment-refusal pathway.",
        "191": "Protection from liability for people exercising functions in good faith under the Act."
    };

    /* ---------------------------------------------------------------------
     * Forms. Form NUMBERS are prescribed by regulation and change: the
     * Mental Health Regulation 2025 replaced the 2019 Regulation. Each entry
     * therefore names its statutory source, which does not change, and points
     * at the NSW Health forms page for the current printed form.
     * ------------------------------------------------------------------ */
    var FORMS = [
        {
            name: "Schedule 1 — Mental health certificate",
            source: "Mental Health Act 2007 (NSW), Schedule 1 Part 1 (see s 19)",
            who: "A medical practitioner or accredited person who has personally examined or observed the person. Must not be a designated carer, the principal care provider or a near relative.",
            when: "Before the person is taken to a declared mental health facility.",
            clock: "Cannot be used to admit or detain more than 5 days after it is given (mentally ill person) or more than 1 day (mentally disordered person) — s 19(4).",
            sections: ["19", "19A"]
        },
        {
            name: "Police assistance endorsement",
            source: "Mental Health Act 2007 (NSW), Schedule 1 Part 2 (see s 19(3))",
            who: "The practitioner giving the Schedule 1, where there are serious concerns for safety without police assistance.",
            when: "Completed on the Schedule 1 itself.",
            clock: "Follows the Schedule 1.",
            sections: ["19", "21", "81"]
        },
        {
            name: "Form 1 — Clinical Report as to Mental State of a Detained Person",
            source: "Prescribed by regulation under s 27(2) of the Act",
            who: "Each examiner in the s 27 sequence. The practitioner who scheduled the person must not be one of them (s 28(2)).",
            when: "At each of the first, second and (if needed) third examinations.",
            clock: "First examination as soon as practicable and no later than 12 hours after arrival — s 27(1)(a).",
            sections: ["27", "27A", "28"]
        },
        {
            name: "Statement of legal rights and entitlements",
            source: "Mental Health Act 2007 (NSW), Schedule 3 (see s 74(3))",
            who: "The authorised medical officer — oral explanation AND written statement.",
            when: "As soon as practicable after the person is taken to the facility.",
            clock: "If the person could not understand it, it must be given again no later than 24 hours before the mental health inquiry — s 74(4).",
            sections: ["74", "70"]
        },
        {
            name: "Notification to designated carer / principal care provider of detention",
            source: "Mental Health Act 2007 (NSW), s 75",
            who: "The authorised medical officer.",
            when: "After the person is detained.",
            clock: "Not later than 24 hours after detention, unless the person is discharged or made voluntary within that period.",
            sections: ["75", "71", "72A"]
        },
        {
            name: "Notice of mental health inquiry",
            source: "Mental Health Act 2007 (NSW), s 76",
            who: "The authorised medical officer, to the person and to carers.",
            when: "When the officer becomes aware the person is an assessable person.",
            clock: "All reasonably practicable steps, before the inquiry.",
            sections: ["76", "34"]
        },
        {
            name: "Notice to designated carer of proposed surgical operation",
            source: "Mental Health Act 2007 (NSW), s 78(1)(g)",
            who: "The authorised medical officer.",
            when: "Before applying to the Secretary or the Tribunal for consent.",
            clock: "The application must not be made earlier than 14 days after this notice, unless urgent or the person notified does not object — ss 100(5), 101(5).",
            sections: ["78", "100", "101"]
        },
        {
            name: "Application to the Secretary for consent to a surgical operation",
            source: "Mental Health Act 2007 (NSW), s 100",
            who: "The authorised medical officer, where a designated carer agrees in writing.",
            when: "Non-emergency surgery on an involuntary patient incapable of consenting.",
            clock: "14-day notice rule (above). Consent must be in writing and signed — s 100(6).",
            sections: ["100", "78"]
        },
        {
            name: "Application to the Tribunal for consent to a surgical operation",
            source: "Mental Health Act 2007 (NSW), s 101",
            who: "The authorised medical officer, where no designated carer agrees in writing.",
            when: "Non-emergency surgery, including where a patient capable of consenting refuses.",
            clock: "14-day notice rule (above).",
            sections: ["101", "78"]
        },
        {
            name: "Notification to the Tribunal of emergency surgery",
            source: "Mental Health Act 2007 (NSW), s 99(4)",
            who: "The authorised medical officer of the facility in which the patient is detained.",
            when: "After an emergency operation consented to under s 99.",
            clock: "As soon as practicable after the operation. Carers are notified under s 78(1)(f).",
            sections: ["99", "78"]
        },
        {
            name: "Application for an ECT inquiry",
            source: "Mental Health Act 2007 (NSW), ss 93(3), 94",
            who: "The authorised medical officer, supported by certificates from two medical practitioners, at least one a psychiatrist.",
            when: "Before ECT for an involuntary patient or a person under 16, or where capacity to consent is unclear.",
            clock: "Carers must be notified of the proposed application — s 78(1)(e).",
            sections: ["93", "94", "88", "78"]
        },
        {
            name: "Application for a community treatment order",
            source: "Mental Health Act 2007 (NSW), s 51",
            who: "An authorised medical officer, a medical practitioner familiar with the person's clinical history, or a prescribed person.",
            when: "At an inquiry, on review, or on a free-standing application.",
            clock: "An order runs for the period specified, or 12 months if none is specified — s 56(2).",
            sections: ["51", "53", "54", "56"]
        }
    ];

    /* ---------------------------------------------------------------------
     * Statutory clocks, gathered in one place.
     * ------------------------------------------------------------------ */
    var TIMEFRAMES = [
        { clock: "12 hours", what: "First examination by an authorised medical officer after the person arrives at the facility (or after a voluntary patient is detained).", ref: "s 27(1)(a)", sections: ["27", "27A"] },
        { clock: "As soon as possible", what: "Second examination. Must be by a psychiatrist unless the first examiner was one.", ref: "s 27(1)(b)", sections: ["27"] },
        { clock: "As soon as practicable", what: "Third examination by a psychiatrist, where the second examiner does not find the person mentally ill or mentally disordered.", ref: "s 27(1)(c)", sections: ["27"] },
        { clock: "5 days / 1 day", what: "Expiry of a Schedule 1 — 5 days where the person is certified mentally ill, 1 day where certified mentally disordered.", ref: "s 19(4)", sections: ["19"] },
        { clock: "3 days", what: "Maximum continuous detention of a mentally disordered person, NOT counting weekends and public holidays. Often taught as '72 hours' — the Act does not say that, and over a long weekend the lawful period is materially longer than 72 clock hours.", ref: "s 31(1)-(2)", sections: ["31"] },
        { clock: "Every 24 hours", what: "Minimum examination frequency for a detained mentally disordered person — the recertification step. Detention must end at any such examination where the person is no longer mentally disordered or mentally ill, or less restrictive care becomes available (s 31(4)).", ref: "s 31(3)-(4)", sections: ["31"] },
        { clock: "3 per calendar month", what: "Maximum number of admissions as a mentally disordered person in any one calendar month.", ref: "s 31(5)", sections: ["31"] },
        { clock: "24 hours", what: "Notification to designated carers and the principal care provider that the person has been detained.", ref: "s 75(1)", sections: ["75"] },
        { clock: "24 hours before the inquiry", what: "Repeat of the statement of rights where the person could not understand it when first given.", ref: "s 74(4)", sections: ["74"] },
        { clock: "As soon as practicable", what: "Bringing an assessable person before the Tribunal for a mental health inquiry after admission.", ref: "s 27(1)(d), s 34", sections: ["27", "34"] },
        { clock: "Up to 14 days", what: "Adjournment of a mental health inquiry.", ref: "s 36(1)", sections: ["36"] },
        { clock: "Up to 3 months", what: "Initial involuntary patient order made at a mental health inquiry.", ref: "s 35(5)(c)", sections: ["35"] },
        { clock: "3 months / 6 months", what: "Tribunal review of an involuntary patient — at least 3-monthly for the first 12 months, then at least 6-monthly.", ref: "s 37(1)", sections: ["37"] },
        { clock: "3 working days", what: "If the authorised medical officer has not determined a discharge application within this time, the person may appeal to the Tribunal.", ref: "s 44(1)(b)", sections: ["44", "42"] },
        { clock: "Up to 14 days", what: "Deferral of the operation of a discharge order where the Tribunal thinks it in the person's best interests.", ref: "ss 35(4), 38(6)", sections: ["35", "38"] },
        { clock: "14 days after notice", what: "Earliest an application for consent to surgery or special medical treatment may be made after notice to carers — sooner if urgent or the person notified does not object.", ref: "ss 100(5), 101(5), 103(5)", sections: ["100", "101", "103", "78"] },
        { clock: "As soon as practicable", what: "Notification to the Tribunal after emergency surgery performed under s 99.", ref: "s 99(4)", sections: ["99"] },
        { clock: "12 months", what: "Maximum duration of a community treatment order.", ref: "s 56(2)", sections: ["56", "53"] }
    ];

    /* ---------------------------------------------------------------------
     * Escalation contacts. Only numbers already verified elsewhere in this
     * app are given as numbers; everything else links to the official site
     * rather than risk a wrong number at 3am.
     * ------------------------------------------------------------------ */
    var CONTACTS = [
        { name: "NSW Mental Health Line", detail: "24/7 triage and clinical advice", tel: "1800011511", display: "1800 011 511" },
        { name: "Mental Health Review Tribunal", detail: "Inquiries, reviews, consent to surgery and ECT determinations", url: MHRT_URL },
        { name: "NCAT Guardianship Division", detail: "Guardianship orders and consent to medical/dental treatment", url: NCAT_URL },
        { name: "Local Public Health Unit", detail: "24/7, routes to your local unit by where you are calling from. The way to reach the Authorised Medical Practitioner for a public health order, and the notification line for notifiable conditions", tel: "1300066055", display: "1300 066 055" },
        { name: "NSW Health mental health legislation and forms", detail: "Current prescribed forms and policy directives", url: FORMS_URL },
        { name: "Your local health district legal / after-hours executive", detail: "For any decision to treat over a competent refusal, or where the law is unclear", local: true }
    ];

    /* =====================================================================
     * THE DECISION GRAPH
     * ================================================================== */

    var ROLES = [
        { id: "ed", label: "Emergency department", start: "ed_start", blurb: "Which of the three Acts applies — after Huber et al." },
        { id: "reg", label: "Psychiatry registrar / MH clinician", start: "start", blurb: "All pathways." },
        { id: "cl", label: "Consultation-liaison (medical ward)", start: "r_age", blurb: "Straight to the treatment-refusal algorithm." },
        { id: "comm", label: "Community / after-hours", start: "d_criteria", blurb: "Getting someone safely to a facility." },
        { id: "any", label: "Not sure — show me everything", start: "start", blurb: "Start from the top." }
    ];

    var NODES = {

        start: {
            kind: "question",
            title: "What do you need to decide right now?",
            options: [
                { label: "I'm in ED and not sure which Act applies", hint: "Works through the Mental Health Act, the Guardianship Act and the Public Health Act together, after Huber et al. (2021).", next: "ed_start" },
                { label: "Whether this person can be detained under the Act", next: "d_criteria" },
                { label: "The person is already detained — what happens next?", next: "e_stage" },
                { label: "Whether treatment or medication can be given without consent", next: "t_start" },
                { label: "The person is refusing medical or surgical treatment", next: "r_age" },
                { label: "The person wants to leave, or is asking to be discharged", next: "x_status" },
                { label: "Electroconvulsive therapy", next: "ect_status" },
                { label: "Community treatment order, including a breach", next: "cto_start" }
            ]
        },

        /* ---------------- ED triage across all three Acts (Huber et al. 2021) ----------------
         * Follows the published ED algorithm, which routes between the Mental Health Act,
         * the Guardianship Act and the Public Health Act. Guardianship Act and Public Health
         * Act content is paraphrased from the paper, not quoted, and is flagged as such. */

        ed_start: {
            kind: "question",
            title: "Is the patient declining testing or treatment?",
            help: "The entry question of the ED algorithm. It decides whether you are dealing with a refusal (Guardianship Act / Public Health Act territory) or with a person who needs a mental health assessment.",
            source: "huber",
            options: [
                { label: "Yes — declining testing or treatment", next: "ed_pha_q1" },
                { label: "No", next: "ed_mha_q1" }
            ]
        },

        ed_pha_q1: {
            kind: "question",
            title: "Is the illness a Category 4 or 5 illness under the Public Health Act?",
            help: "The Public Health Act 2010 (NSW) divides illnesses into categories in its Schedule 1, with different rules for each. COVID-19 was classified across Categories 2-4. Check the current Schedule for the illness in front of you.",
            source: "huber",
            unverified: true,
            options: [
                { label: "Yes", next: "ed_pha_q2" },
                { label: "No, or not a notifiable illness", next: "ed_negotiate" }
            ]
        },

        ed_pha_q2: {
            kind: "question",
            title: "Is the patient behaving in a way that may, as a consequence of their decision, be a risk to public health?",
            source: "huber",
            unverified: true,
            options: [
                { label: "Yes — a possible risk to the public", next: "out_pha_amp" },
                { label: "No", next: "ed_ga_q1" }
            ]
        },

        out_pha_amp: {
            kind: "outcome",
            tone: "caution",
            title: "Notify the Authorised Medical Practitioner under the Public Health Act",
            summary: "A medical practitioner or hospital may inform an Authorised Medical Practitioner (AMP) via the local Public Health Unit, who may then make a public health order. Until that order is made and served, you have no power under this Act.",
            actions: [
                "Contact the AMP through your local Public Health Unit and discuss a collaborative clinical approach.",
                "You do NOT have the power to detain or treat the patient under the Public Health Act until an order is enacted by the AMP.",
                "A public health order must be served in writing on the patient before it comes into effect.",
                "An order may require the person to refrain from specified conduct, undergo a specified medical examination, be detained at a specified place for the duration of the order, or undergo treatment (Public Health Act s 62).",
                "Drafting an order takes time. The patient may be allowed to leave before it is made, unless they independently meet the criteria under the Mental Health Act or the Guardianship Act.",
                "A notifiable diagnosis should be recorded in the notes; the laboratory notifies the Public Health Unit (Public Health Act s 54).",
                "An order usually works only where there is a clinical structure to scaffold it — plan the supports alongside the order."
            ],
            source: "huber",
            unverified: true,
            authority: "Public Health Act 2010 (NSW) ss 54, 62 and Schedule 1, as described in Huber et al. (2021)",
            next: [
                { label: "They may also need a mental health assessment", node: "ed_mha_q1" },
                { label: "They may also lack capacity for the refused treatment", node: "ed_ga_q1" }
            ]
        },

        ed_negotiate: {
            kind: "question",
            title: "Attempt to negotiate a mutually agreed decision. Is the patient still objecting?",
            help: "The algorithm puts negotiation before any use of legislation. A narrower, staged or deferred intervention is often acceptable where the original proposal is not.",
            source: "huber",
            options: [
                { label: "Yes — still objecting", next: "ed_ga_q1" },
                { label: "No — agreement reached", next: "out_ed_agreed" }
            ]
        },

        out_ed_agreed: {
            kind: "outcome",
            tone: "go",
            title: "Proceed with consent",
            summary: "Agreement has been reached, so no coercive framework is engaged.",
            actions: [
                "Document the discussion, what was agreed and the consent obtained.",
                "Re-assess if the patient withdraws consent or their condition changes."
            ],
            source: "huber"
        },

        ed_mha_q1: {
            kind: "question",
            title: "Does the patient have symptoms that require a mental health assessment or mental health treatment?",
            source: "huber",
            options: [
                { label: "Yes", next: "ed_mha_detained" },
                { label: "No", next: "out_ed_no_mha" }
            ]
        },

        ed_mha_detained: {
            kind: "question",
            title: "Is the patient currently detained under the Mental Health Act?",
            source: "huber",
            sections: ["18", "19", "20", "22"],
            options: [
                { label: "Yes — already detained", next: "out_ed_amo_review" },
                { label: "No", next: "ed_mha_symptoms" }
            ]
        },

        ed_mha_symptoms: {
            kind: "question",
            title: "Is the patient suffering from hallucinations, delusions, serious disorder of thought form, severe disturbance of mood, or sustained or repeated irrational behaviour indicating any of those?",
            help: "This is the s 4 definition of mental illness. If none of these are present, the person may still be a mentally disordered person under s 15 — that limb does not require mental illness.",
            source: "huber",
            sections: ["4", "14", "15", "16"],
            options: [
                { label: "Yes", next: "ed_mi_risk" },
                { label: "No", next: "ed_md_risk" }
            ]
        },

        ed_mi_risk: {
            kind: "question",
            title: "Are there reasonable grounds to believe that care, treatment or control is necessary to protect the patient or others from serious harm?",
            help: "The s 14 'mentally ill person' limb. Note it is serious harm, not only serious physical harm.",
            source: "huber",
            sections: ["14"],
            options: [
                { label: "Yes", next: "ed_less_restrictive", set: { limb: "mentally ill person (s 14)" } },
                { label: "No", next: "out_ed_no_mha" }
            ]
        },

        ed_md_risk: {
            kind: "question",
            title: "Is their behaviour so irrational as to justify, on reasonable grounds, care, treatment or control for the protection of the patient or others from serious PHYSICAL harm?",
            help: "The s 15 'mentally disordered person' limb. Mental illness is not required, the harm must be physical, and the detention that follows is tightly time-limited.",
            source: "huber",
            sections: ["15"],
            options: [
                { label: "Yes", next: "ed_less_restrictive", set: { limb: "mentally disordered person (s 15)" } },
                { label: "No", next: "out_ed_no_mha" }
            ]
        },

        ed_less_restrictive: {
            kind: "question",
            title: "Other than the use of the Mental Health Act, is there another less restrictive avenue that is consistent with safe and effective care, and is appropriate and reasonably available?",
            source: "huber",
            sections: ["12", "68"],
            options: [
                { label: "No", next: "out_ed_schedule1" },
                { label: "Yes", next: "out_ed_no_mha" }
            ]
        },

        out_ed_schedule1: {
            kind: "outcome",
            tone: "go",
            title: "Write a Schedule 1 (Mental Health Act s 19)",
            summary: "The criteria are met and no less restrictive option is available, so the certificate route is open.",
            actions: [
                "Complete the Schedule 1 — the certificate in the form set out in Part 1 of Schedule 1 to the Act.",
                "You must have personally examined or observed the person immediately before or shortly before completing it.",
                "You must not be a designated carer, the principal care provider or a near relative of the person (s 19(2)(d)).",
                "Refer for review by an Authorised Medical Officer."
            ],
            forms: ["Schedule 1 — Mental health certificate"],
            sections: ["19", "12", "18"],
            source: "huber",
            next: [{ label: "Referred — what does the AMO review involve?", node: "out_ed_amo_review" }]
        },

        out_ed_amo_review: {
            kind: "outcome",
            tone: "go",
            title: "Refer for review by an Authorised Medical Officer — within 12 hours",
            summary: "The patient should be detained until the review occurs, which must be within 12 hours. Psychiatric treatment may be given, including sedation if necessary, despite refusal.",
            actions: [
                "The first examination must occur as soon as practicable and no later than 12 hours after arrival (s 27(1)(a)).",
                "Most hospitals have numerous Authorised Medical Officers, each declared by the doctor designated as the Clinical Superintendent for the Act.",
                "Detention under the Act authorises psychiatric treatment without consent (s 84, read with s 82).",
                "It does NOT authorise other medical treatment. For a non-psychiatric procedure the patient is refusing, use the Guardianship Act pathway.",
                "Give the statement of rights (s 74) and notify carers within 24 hours (s 75)."
            ],
            timeframes: ["First examination within 12 hours of arrival (s 27(1)(a))."],
            forms: ["Form 1 — Clinical Report as to Mental State of a Detained Person", "Statement of legal rights and entitlements"],
            sections: ["27", "84", "82", "74", "75", "12"],
            source: "huber",
            cautions: [
                "Detention under the Mental Health Act authorises psychiatric treatment without consent, but does not authorise other medical treatment (Huber et al. 2021). Do not treat a physical condition over a refusal on the strength of a schedule."
            ],
            next: [
                { label: "They are also refusing medical treatment", node: "ed_ga_q1" },
                { label: "Continue the detention pathway", node: "e_stage" }
            ]
        },

        out_ed_no_mha: {
            kind: "outcome",
            tone: "stop",
            title: "Do not utilise the Mental Health Act",
            summary: "The criteria for detention are not made out, or a less restrictive avenue is available.",
            actions: [
                "Do not schedule the patient.",
                "If they are refusing medical treatment and may lack decision-making capacity, the Guardianship Act pathway is the relevant one — not the Mental Health Act.",
                "If there is a public health risk, consider the Public Health Act pathway.",
                "Document what you considered and why the Act was not used."
            ],
            sections: ["12", "16"],
            source: "huber",
            next: [
                { label: "They are refusing medical treatment", node: "ed_ga_q1" },
                { label: "There may be a public health risk", node: "ed_pha_q1" }
            ]
        },

        ed_ga_q1: {
            kind: "question",
            title: "Does the patient have decision-making capacity regarding this treatment?",
            help: "The Mental Health Act is not the tool for a refusal of non-psychiatric treatment. This is the Guardianship Act branch of the ED algorithm.",
            source: "huber",
            capacityAid: true,
            options: [
                { label: "Yes — has capacity", next: "out_ed_dmc_refusal" },
                { label: "No — lacks capacity", next: "ed_acd" },
                { label: "Suspected to lack capacity, but not confirmed", next: "out_ed_suspected" }
            ]
        },

        out_ed_dmc_refusal: {
            kind: "outcome",
            tone: "stop",
            title: "A patient with capacity can refuse — even lifesaving treatment",
            summary: "A person who has decision-making capacity regarding a particular treatment can refuse that treatment, even if it is lifesaving.",
            actions: [
                "Document the capacity assessment against the specific decision, and the refusal.",
                "Patients who retain decision-making capacity cannot be treated against their objection, except in the extremely limited circumstances set out in the Mental Health Act or the Public Health Act.",
                "Do not record this as being 'unable to treat under duty of care' — duty of care is not the relevant concept.",
                "Continue to offer care the patient will accept, and re-assess if their condition changes."
            ],
            source: "huber",
            authority: "Huber et al. (2021); Hunter and New England Area Health Service v A [2009] NSWSC 761",
            next: [
                { label: "They may need a mental health assessment", node: "ed_mha_q1" },
                { label: "There may be a public health risk", node: "ed_pha_q1" }
            ]
        },

        out_ed_suspected: {
            kind: "outcome",
            tone: "caution",
            title: "Capacity suspected to be absent but not confirmed",
            summary: "There is a basis at common law to restrain a patient when incapacity is suspected but uncertain and restraint is required for the protection of the patient.",
            actions: [
                "Restraint should be employed only for as long as the necessity prevails, or until other means of consent can be resorted to, and until capacity can be more confidently assessed.",
                "Weigh the potential harm of restraint against the potential harm of decisions made by a patient who may lack capacity. The judgement is subjective and hard in time-critical situations — document your reasoning.",
                "Document why you suspect capacity is lacking and describe the potential harms.",
                "Re-assess as soon as practicable, and treat reversible contributors first.",
                "If the patient's mental state is likely to improve in the very near future, waiting and reassessing is usually the right answer."
            ],
            source: "huber",
            unverified: true,
            next: [
                { label: "Capacity now assessed as absent", node: "ed_acd" },
                { label: "Capacity now assessed as present", node: "out_ed_dmc_refusal" }
            ]
        },

        ed_acd: {
            kind: "question",
            title: "Is there an advance care directive that was likely made when the patient had capacity, is clear and unambiguous, and extends to the situation at hand?",
            source: "huber",
            options: [
                { label: "Yes — all three", next: "out_ed_acd" },
                { label: "No, or unsure", next: "ed_urgent" }
            ]
        },

        out_ed_acd: {
            kind: "outcome",
            tone: "stop",
            title: "Respect the advance care directive",
            summary: "A valid advance care directive made with capacity, clear and unambiguous, and applicable to the situation at hand, governs.",
            actions: [
                "Follow the directive.",
                "Document which directive you relied on, and why it applies to this situation.",
                "If any of the three conditions is genuinely in doubt, treat it as 'unsure' and continue down the urgency pathway instead."
            ],
            source: "huber"
        },

        ed_urgent: {
            kind: "question",
            title: "Is the procedure urgent and necessary to save the person's life, prevent serious damage to their health, or prevent significant pain or distress?",
            source: "huber",
            options: [
                { label: "Yes — urgent on that test", next: "out_ed_ga37" },
                { label: "No", next: "ed_improve" }
            ]
        },

        out_ed_ga37: {
            kind: "outcome",
            tone: "go",
            title: "Treat the urgent issue under Guardianship Act s 37 — then apply to NCAT",
            summary: "Where a patient aged 16 or over lacks decision-making capacity, treatment is necessary to prevent death or serious injury and the situation is urgent, the Guardianship Act authorises treatment without consent.",
            actions: [
                "Treat the urgent issue, and apply to NCAT as soon as possible for a decision about ongoing treatment.",
                "Document that the patient is being detained and treated under s 37 of the Guardianship Act — NOT 'under duty of care'. 'Duty of care' means the expectation of reasonable care to a competent professional standard; it is not a power to treat, and using it that way is a documented and criticised error.",
                "Record the capacity finding in the terms of the test: the patient cannot understand or retain the information relevant to the decision, or cannot use and weigh it to come to a decision.",
                "Record the potential harms — life-threatening, serious damage to health, or significant pain and distress — and that they outweigh the harms of restraint.",
                "Unlike the Mental Health Act, detention under the Guardianship Act has no form. Security staff may be unfamiliar with it; be explicit in the notes and in your handover about the legal basis.",
                "Note the age threshold in this pathway is 16, not 18."
            ],
            source: "huber",
            unverified: true,
            authority: "Guardianship Act 1987 (NSW) s 37, as described in Huber et al. (2021) and Cheng et al. (2018)",
            contacts: ["NCAT Guardianship Division"]
        },

        ed_improve: {
            kind: "question",
            title: "Is the patient's mental state likely to improve in the very near future — for example, intoxication?",
            source: "huber",
            options: [
                { label: "Yes — likely to clear soon", next: "out_ed_wait" },
                { label: "No", next: "ed_guardian" }
            ]
        },

        out_ed_wait: {
            kind: "outcome",
            tone: "caution",
            title: "Wait and reassess capacity",
            summary: "Where the sensorium is likely to clear, the right answer is usually to defer the decision and reassess, rather than to reach for a coercive framework.",
            actions: [
                "Re-assess decision-making capacity once the reversible cause has resolved.",
                "In the meantime, provide supportive care and monitoring appropriate to the cause.",
                "Where incapacity is suspected but uncertain and the patient needs protection, common-law restraint may be used only while the necessity prevails.",
                "Document the plan, the reason for deferring, and when you will reassess."
            ],
            source: "huber",
            next: [{ label: "Reassessed — continue", node: "ed_ga_q1" }]
        },

        ed_guardian: {
            kind: "question",
            title: "Is there a guardian appointed by NCAT?",
            source: "huber",
            options: [
                { label: "Yes", next: "ed_guardian_powers" },
                { label: "No", next: "ed_minimal" }
            ]
        },

        ed_guardian_powers: {
            kind: "question",
            title: "Does the guardian have the healthcare function and explicit power to override the patient's objections?",
            help: "A guardianship order does not automatically carry the power to override an objection — it has to have been granted explicitly. Read the order.",
            source: "huber",
            options: [
                { label: "Yes — explicitly authorised to override objections", next: "out_ed_guardian_consent" },
                { label: "No, or the order does not say", next: "ed_minimal" }
            ]
        },

        out_ed_guardian_consent: {
            kind: "outcome",
            tone: "go",
            title: "The guardian can consent",
            summary: "A guardian appointed by NCAT with the healthcare function, explicitly authorised to override objections, may consent to treatment over the patient's objection.",
            actions: [
                "Read the guardianship order and confirm the scope of the function before relying on it.",
                "Obtain and document the guardian's consent.",
                "Keep a copy of the relevant part of the order in the record."
            ],
            source: "huber",
            unverified: true,
            authority: "Guardianship Act 1987 (NSW), as described in Huber et al. (2021)"
        },

        ed_minimal: {
            kind: "question",
            title: "Does the patient have no or minimal understanding of what the treatment entails, AND will the treatment cause no lasting distress?",
            help: "This is the narrow gateway that lets a person responsible consent despite an objection. If the treatment will cause distress, that distress must be no more than reasonably tolerable and only transitory.",
            source: "huber",
            options: [
                { label: "Yes — both limbs are satisfied", next: "out_ed_person_responsible" },
                { label: "No", next: "out_ed_ncat" }
            ]
        },

        out_ed_person_responsible: {
            kind: "outcome",
            tone: "go",
            title: "The objection may be disregarded — the person responsible can consent",
            summary: "Where the patient has minimal or no understanding of what the treatment entails and it will cause no lasting distress, the objection may be disregarded (Guardianship Act s 46(4)) and the person responsible may consent (s 36).",
            actions: [
                "Identify the person responsible and obtain their consent.",
                "If there is no person responsible, some 'minor' treatments may nonetheless be given.",
                "'Minor treatments' in the published algorithm: sedation for management of a fracture or dislocation; sedation for endoscopy NOT through skin or mucous membrane; catheterisation; analgesia; antipyretics; anti-Parkinsonian medication; anticonvulsants; antiemetics; antihistamines; and blood tests EXCEPT HIV.",
                "Document the understanding assessment and the distress assessment separately — both limbs have to be satisfied.",
                "In every other case, a person responsible cannot override a refusal, even one made without capacity. That requires NCAT."
            ],
            source: "huber",
            unverified: true,
            authority: "Guardianship Act 1987 (NSW) ss 36, 46(4), as described in Huber et al. (2021) and Cheng et al. (2018)"
        },

        out_ed_ncat: {
            kind: "outcome",
            tone: "go",
            title: "An application to NCAT must be made",
            summary: "Where the patient objects and the narrow minimal-understanding exception does not apply, consent must be obtained from the NSW Civil and Administrative Tribunal.",
            actions: [
                "Apply to the Guardianship Division of NCAT for consent, or for a guardianship order authorising a guardian to override the objection.",
                "A person responsible cannot override the patient's refusal, even where the objection is made without capacity.",
                "If part of the treatment becomes urgent while the application is pending, the emergency pathway (Guardianship Act s 37) covers only the urgent element.",
                "Document the objection, the capacity finding and the application made."
            ],
            source: "huber",
            unverified: true,
            authority: "Guardianship Act 1987 (NSW), as described in Huber et al. (2021)",
            contacts: ["NCAT Guardianship Division"]
        },

        /* ---------------- Detention pathway ---------------- */

        d_criteria: {
            kind: "question",
            title: "Which limb of the Act does the person meet?",
            help: "Both tests are about risk and necessity, not diagnosis alone. Section 16 rules out a long list of things that cannot by themselves make a person mentally ill or mentally disordered.",
            sections: ["14", "15", "16", "13"],
            options: [
                { label: "Mentally ill person (s 14)", hint: "Mental illness, plus reasonable grounds that care, treatment or control is necessary for protection from serious harm.", next: "d_less", set: { limb: "mentally ill person (s 14)" } },
                { label: "Mentally disordered person (s 15)", hint: "Behaviour so irrational as to justify temporary care, treatment or control for protection from serious PHYSICAL harm. Mental illness not required.", next: "d_less", set: { limb: "mentally disordered person (s 15)" } },
                { label: "Neither, or not established", next: "out_no_detain" }
            ]
        },

        d_less: {
            kind: "question",
            title: "Is other care of a less restrictive kind, consistent with safe and effective care, appropriate and reasonably available?",
            help: "This is the second half of s 12(1) and it is not a formality. It has to be answered on the care that is actually available to this person now.",
            sections: ["12", "68"],
            options: [
                { label: "No — involuntary detention is necessary", next: "d_where" },
                { label: "Yes — a less restrictive option is available", next: "out_less_restrictive" }
            ]
        },

        out_no_detain: {
            kind: "outcome",
            tone: "stop",
            title: "Detention under the Act is not available",
            summary: "Section 12(1)(a) is not satisfied, so the person must not be involuntarily admitted or detained.",
            actions: [
                "Consider voluntary admission (s 5) if the person agrees and would benefit.",
                "Consider community management, carer involvement and follow-up; document what you considered.",
                "Re-examine if the presentation changes — the criteria are assessed at the time.",
                "Remember s 16: belief, sexuality, drug or alcohol taking and antisocial behaviour do not by themselves establish either limb."
            ],
            sections: ["12", "16", "5", "190"],
            cautions: ["Section 190(1) preserves police powers under other laws, and s 190(2) permits action to protect a person from serious physical harm — neither converts into a general power to detain for assessment."]
        },

        out_less_restrictive: {
            kind: "outcome",
            tone: "stop",
            title: "Must not detain — less restrictive care is available",
            summary: "Section 12(1)(b) is not satisfied. The authorised medical officer must refuse to detain, and must not continue to detain.",
            actions: [
                "Put the less restrictive option in place and document what it is.",
                "Consider voluntary admission (s 5) or a community treatment order pathway if compulsory community treatment is what is actually needed.",
                "Involve the designated carer and principal care provider in the plan (ss 72B, 79)."
            ],
            sections: ["12", "68", "5", "51", "79"]
        },

        d_where: {
            kind: "question",
            title: "How will the person get to a declared mental health facility?",
            help: "Section 18 lists every lawful route. Pick the one that matches your situation.",
            sections: ["18"],
            options: [
                { label: "I am a medical practitioner or accredited person who has examined them", next: "out_sched1" },
                { label: "They need ambulance transport", next: "out_s20" },
                { label: "Police are involved or have apprehended them", next: "out_s22" },
                { label: "They are physically inaccessible and cannot be examined", next: "out_s23" },
                { label: "They are already an inpatient in another health facility", next: "out_s25" },
                { label: "Remote area, no practitioner able to attend — carer or relative requesting", next: "out_s26" },
                { label: "They are already in a declared mental health facility", next: "e_stage" }
            ]
        },

        out_sched1: {
            kind: "outcome",
            tone: "go",
            title: "Complete a Schedule 1 (mental health certificate) — s 19",
            summary: "A person may be taken to and detained in a declared mental health facility on a certificate in the form set out in Part 1 of Schedule 1.",
            actions: [
                "You must have personally examined or observed the person immediately before or shortly before completing the certificate.",
                "You must be of the opinion that they are a mentally ill person or a mentally disordered person.",
                "You must be satisfied no other appropriate means is reasonably available and that involuntary admission and detention are necessary.",
                "Check you are not disqualified: a designated carer, the principal care provider or a near relative must not give the certificate (s 19(2)(d)).",
                "Add a police assistance endorsement (Schedule 1 Part 2) if there are serious safety concerns without police.",
                "Arrange transport under s 81 — reasonable force, restraint, sedation for safe transport and searches are authorised there, not implied."
            ],
            forms: ["Schedule 1 — Mental health certificate", "Police assistance endorsement"],
            timeframes: ["The certificate expires: 5 days if the person is certified as a mentally ill person, 1 day if certified as a mentally disordered person (s 19(4))."],
            sections: ["19", "19A", "21", "81", "18", "12"],
            next: [{ label: "The person has arrived at the facility — what next?", node: "e_stage" }]
        },

        out_s20: {
            kind: "outcome",
            tone: "go",
            title: "Ambulance officer may take the person — s 20",
            summary: "An ambulance officer may take a person to a declared mental health facility on reasonable grounds that they appear to be mentally ill or mentally disturbed and that it would be beneficial to their welfare to be dealt with under the Act.",
            actions: [
                "No certificate is required for this route, but the s 27 examinations still follow on arrival.",
                "The ambulance officer may request police assistance where there are serious safety concerns (s 20(2)); police must respond if practicable (s 21).",
                "Transport powers come from s 81."
            ],
            sections: ["20", "21", "81", "18"],
            next: [{ label: "The person has arrived at the facility — what next?", node: "e_stage" }]
        },

        out_s22: {
            kind: "outcome",
            tone: "go",
            title: "Police apprehension — s 22",
            summary: "Police may apprehend a person who appears to be mentally ill or mentally disturbed and take them to a declared mental health facility, without a warrant.",
            actions: [
                "Both limbs of s 22(1) must be satisfied: the offence / recent or probable attempt at self-harm or serious physical harm limb, AND that dealing with the person under this Act is better for their welfare.",
                "Police may exercise the s 81 transport powers.",
                "The s 27 examination sequence starts once the person arrives."
            ],
            sections: ["22", "81", "190", "18"],
            next: [{ label: "The person has arrived at the facility — what next?", node: "e_stage" }]
        },

        out_s23: {
            kind: "outcome",
            tone: "go",
            title: "Order for examination where the person is physically inaccessible — s 23",
            summary: "A Magistrate or authorised officer may order that a medical practitioner or accredited person visit and personally examine or observe the person, with assistance if needed.",
            actions: [
                "The order requires evidence on oath that the person may be mentally ill or mentally disordered AND that they could not otherwise be examined because of physical inaccessibility.",
                "Premises may be entered, by force if needed, to enable the examination.",
                "If the criteria are met on examination, complete a Schedule 1 under s 19.",
                "Notify the person who made the order, in writing, as soon as practicable after acting on it (s 23(6))."
            ],
            sections: ["23", "19", "81"],
            next: [{ label: "Criteria met — complete the Schedule 1", node: "out_sched1" }]
        },

        out_s25: {
            kind: "outcome",
            tone: "go",
            title: "Transfer from another health facility — s 25",
            summary: "A person may be transferred from a health facility to a declared mental health facility and detained there.",
            actions: [
                "A Schedule 1 is not required for this route, but written documentation of the reasons for transfer and why the person is considered mentally ill or mentally disordered should be made (Guide Book).",
                "Once transferred, the person is taken to be detained under s 19 — so the s 27 examination sequence applies.",
                "Notify designated carers of the proposed transfer before it happens, except in an emergency (s 78(3))."
            ],
            sections: ["25", "19", "78", "80"],
            next: [{ label: "The person has arrived — what next?", node: "e_stage" }]
        },

        out_s26: {
            kind: "outcome",
            tone: "caution",
            title: "Detention on the written request of a carer, relative or friend — s 26",
            summary: "Available only where distance and urgency make it not reasonably practicable to obtain a certificate.",
            actions: [
                "The request must be in writing, to the authorised medical officer.",
                "The authorised medical officer must be satisfied that, because of the distance required for examination and the urgency, a Schedule 1 is not reasonably practicable.",
                "Document why the certificate route was not available — this is the narrowest of the entry routes."
            ],
            sections: ["26", "19", "18"],
            next: [{ label: "The person has arrived — what next?", node: "e_stage" }]
        },

        /* ---------------- Examination sequence ---------------- */

        e_stage: {
            kind: "question",
            title: "Where are you in the s 27 examination sequence?",
            help: "Every route into detention converges here. Each examination is recorded on a Form 1, and the practitioner who scheduled the person must not perform them (s 28(2)).",
            sections: ["27", "27A", "28", "12"],
            options: [
                { label: "First examination (s 27(1)(a)) — within 12 hours of arrival", next: "e_first" },
                { label: "Second examination (s 27(1)(b))", next: "e_second" },
                { label: "Third examination (s 27(1)(c))", next: "e_third" },
                { label: "Examinations done — the person is an assessable person awaiting the inquiry", next: "out_inquiry_required" },
                { label: "The person is too physically unwell to proceed", next: "out_s33" }
            ]
        },

        e_first: {
            kind: "question",
            title: "First examination — what is your finding?",
            help: "As soon as practicable, and no later than 12 hours after arrival. By an authorised medical officer, or under s 27A by a medical practitioner via audio visual link or an authorised accredited person where that is not reasonably practicable.",
            sections: ["27", "27A", "28", "12", "74", "75"],
            options: [
                { label: "Mentally ill person", next: "out_e_first_positive", set: { finding1: "mentally ill person" } },
                { label: "Mentally disordered person", next: "out_e_first_positive", set: { finding1: "mentally disordered person" } },
                { label: "Neither", next: "out_must_release" }
            ]
        },

        out_e_first_positive: {
            kind: "outcome",
            tone: "go",
            title: "Certify and arrange the second examination",
            summary: "The person may continue to be detained only because you have certified your opinion. The clock on the rest of the sequence now runs.",
            actions: [
                "Record the examination on a Form 1 — Clinical Report as to Mental State of a Detained Person.",
                "Arrange the second examination as soon as possible. It must be by a psychiatrist unless you are one.",
                "Give the person an oral explanation AND the written statement of their legal rights (s 74).",
                "Take all reasonably practicable steps to notify designated carers and the principal care provider within 24 hours (s 75).",
                "Consider information from carers, relatives, friends and treating clinicians (s 72B), and reclassification as a voluntary patient if appropriate (s 30)."
            ],
            forms: ["Form 1 — Clinical Report as to Mental State of a Detained Person", "Statement of legal rights and entitlements", "Notification to designated carer / principal care provider of detention"],
            timeframes: ["Statement of rights as soon as practicable (s 74(2)); carer notification within 24 hours (s 75(1))."],
            sections: ["27", "74", "75", "72B", "30", "29"],
            next: [{ label: "Go to the second examination", node: "e_second" }]
        },

        e_second: {
            kind: "question",
            title: "Second examination — what is the finding?",
            help: "As soon as possible after the first certificate. Must be by a psychiatrist if the first examiner was not one.",
            sections: ["27", "27A", "28"],
            options: [
                { label: "Mentally ill person", next: "out_inquiry_required" },
                { label: "Mentally disordered person", next: "e_md_check" },
                { label: "Neither, or unable to form an opinion", next: "out_third_needed" }
            ]
        },

        e_third: {
            kind: "question",
            title: "Third examination — what is the finding?",
            help: "By a psychiatrist, as soon as practicable after being notified of the second examiner's opinion. This examination decides whether the person is released or detained.",
            sections: ["27", "27A"],
            options: [
                { label: "Mentally ill person", next: "out_inquiry_required" },
                { label: "Mentally disordered person", next: "e_md_check" },
                { label: "Neither", next: "out_must_release_third" }
            ]
        },

        e_md_check: {
            kind: "question",
            title: "Was the person also found to be a mentally disordered person at the first examination?",
            help: "Detention as a mentally disordered person under step 5 requires that finding at the first examination and again at the second or third. If the first examination found the person mentally ill, a mental health inquiry is required instead.",
            sections: ["27", "31"],
            options: [
                { label: "Yes — mentally disordered at the first examination too", next: "out_md_detention" },
                { label: "No — the first examination found a mentally ill person", next: "out_inquiry_required" }
            ]
        },

        out_third_needed: {
            kind: "outcome",
            tone: "caution",
            title: "A third examination by a psychiatrist is required",
            summary: "Where the second examiner does not find the person mentally ill or mentally disordered, the authorised medical officer must arrange a third examination by a psychiatrist as soon as practicable.",
            actions: [
                "Arrange the third examination by a psychiatrist as soon as practicable after being notified.",
                "While waiting, the person may still be discharged or made voluntary if they no longer meet the criteria or less restrictive care becomes available (s 12).",
                "Record the examination on a Form 1."
            ],
            sections: ["27", "12", "30"],
            next: [{ label: "Go to the third examination", node: "e_third" }]
        },

        out_must_release: {
            kind: "outcome",
            tone: "stop",
            title: "The person must not be detained after this examination",
            summary: "Section 27(1)(a) permits continued detention only if the officer certifies the person is a mentally ill or mentally disordered person. Section 12(2) requires the officer to refuse to detain and not continue detaining.",
            actions: [
                "Release the person from detention. They may be admitted as a voluntary patient immediately on discharge if appropriate (s 12(3)).",
                "Take all reasonably practicable steps on discharge planning and follow-up information (s 79).",
                "Notify designated carers and the principal care provider of the discharge (s 78(1)(c))."
            ],
            sections: ["12", "27", "79", "78", "5"]
        },

        out_must_release_third: {
            kind: "outcome",
            tone: "stop",
            title: "The person must not be detained after the third examination",
            summary: "Where the third examiner does not find the person to be a mentally ill or mentally disordered person, detention ends.",
            actions: [
                "Release the person from detention; consider voluntary admission if appropriate.",
                "Discharge planning and carer notification apply (ss 79, 78(1)(c))."
            ],
            sections: ["27", "12", "79", "78"]
        },

        out_md_detention: {
            kind: "outcome",
            tone: "caution",
            title: "Detained as a mentally disordered person — the short clock applies",
            summary: "No mental health inquiry is held for a person detained only as a mentally disordered person, but the detention is tightly limited and the person must be examined at least every 24 hours.",
            actions: [
                "Maximum 3 days continuous detention, NOT counting weekends and public holidays (s 31(1)-(2)).",
                "Examine the person at least once every 24 hours (s 31(3)). This is the recertification step — detention continues only while the opinion holds.",
                "Release as soon as the person is not mentally disordered or mentally ill, or less restrictive care becomes appropriate and reasonably available (s 31(4)). This applies on ANY such examination, not only at the end of the 3 days.",
                "Check the calendar month limit: no more than 3 admissions as a mentally disordered person in any one calendar month (s 31(5)).",
                "If the person becomes, or is found to be, a mentally ill person, the mental health inquiry pathway applies instead."
            ],
            timeframes: ["3 days excluding weekends and public holidays; examination at least every 24 hours; maximum 3 admissions per calendar month."],
            sections: ["31", "12", "15", "79"],
            cautions: [
                "It is commonly taught as a '72 hour hold'. The Act does not say 72 hours: s 31(1) says 3 days NOT INCLUDING weekends and public holidays. Those are different periods, and the difference is not academic — a Friday afternoon detention before a public holiday Monday runs well past 72 clock hours. Count days as the section does, and check the local public holiday calendar. Detention is in any case only lawful while the s 31(3) examinations continue to support it and s 12 remains satisfied."
            ],
            next: [{ label: "The person is now a mentally ill person", node: "out_inquiry_required" }]
        },

        out_inquiry_required: {
            kind: "outcome",
            tone: "go",
            title: "Notify the Tribunal — a mental health inquiry must be held",
            summary: "The person is an assessable person. The authorised medical officer must notify the Tribunal and bring the person before it as soon as practicable after admission.",
            actions: [
                "Notify the Tribunal and arrange for the person to be brought before it as soon as practicable (s 27(1)(d), s 34(1)).",
                "Ensure the person is, as far as practicable, dressed in street clothes, that medical witnesses appear and that all relevant reports and Form 1s are provided to the Tribunal (s 34(2)).",
                "Notify the person that an inquiry will be held, and take all reasonably practicable steps to notify carers and the principal care provider (s 76).",
                "Keep medication to the minimum consistent with proper care so the person can communicate at the inquiry (s 29) — the Tribunal will inquire about this (s 35(2)(c)).",
                "The person may still be discharged or reclassified as voluntary before the inquiry (ss 12, 30)."
            ],
            forms: ["Notice of mental health inquiry", "Form 1 — Clinical Report as to Mental State of a Detained Person"],
            sections: ["27", "34", "76", "29", "35", "30", "12"],
            next: [{ label: "What can the Tribunal order at the inquiry?", node: "out_inquiry_orders" }]
        },

        out_inquiry_orders: {
            kind: "outcome",
            tone: "go",
            title: "At the inquiry: what the Tribunal decides",
            summary: "The Tribunal determines, on the balance of probabilities, whether the assessable person is a mentally ill person.",
            actions: [
                "If NOT satisfied the person is a mentally ill person: the person is discharged (operation may be deferred up to 14 days in their best interests, s 35(4)).",
                "If satisfied: the Tribunal may discharge into the care of a designated carer or principal care provider, make a community treatment order, or order detention as an involuntary patient for a specified period of up to 3 months.",
                "An involuntary patient order requires the Tribunal to be of the opinion that no less restrictive care is appropriate and reasonably available, or that no other order is appropriate.",
                "The inquiry may be adjourned for up to 14 days (s 36); detention continues during an adjournment.",
                "New involuntary patients must be notified of their appeal rights (s 77), and reviews follow the s 37 timetable."
            ],
            timeframes: ["Involuntary order up to 3 months (s 35(5)(c)); adjournment up to 14 days (s 36(1)); review at the end of the initial period, then at least 3-monthly for 12 months and 6-monthly after (s 37(1))."],
            sections: ["35", "36", "37", "38", "77", "41", "51"]
        },

        out_s33: {
            kind: "outcome",
            tone: "caution",
            title: "Steps may be delayed while the person is physically unwell — s 33",
            summary: "The authorised medical officer is not required to take or complete a s 27 step, or bring the person before the Tribunal, while they are suffering another illness and are not fit for that action because of its seriousness.",
            actions: [
                "Document the physical condition and why the person is not fit to be the subject of the step.",
                "Section 12 continues to apply throughout — detention must still be justified.",
                "Resume the sequence as soon as the person is fit; the delay is not open-ended.",
                "If the person needs medical or surgical treatment and is refusing it, use the treatment-refusal pathway."
            ],
            sections: ["33", "12", "27"],
            next: [{ label: "They are refusing medical treatment", node: "r_age" }]
        },

        /* ---------------- Treatment ---------------- */

        t_start: {
            kind: "question",
            title: "What kind of treatment is proposed?",
            options: [
                { label: "Psychiatric treatment or medication for a detained person", next: "t_detained" },
                { label: "Medical or surgical treatment (non-psychiatric)", next: "r_age" },
                { label: "Electroconvulsive therapy", next: "ect_status" }
            ]
        },

        t_detained: {
            kind: "question",
            title: "What is the person's status?",
            sections: ["82", "84", "4"],
            options: [
                { label: "Assessable person, or involuntary patient, detained in a mental health facility", next: "out_s84" },
                { label: "Voluntary patient, or not subject to the Act", next: "out_voluntary_consent" }
            ]
        },

        out_s84: {
            kind: "outcome",
            tone: "caution",
            title: "Treatment may be given under s 84 — within limits",
            summary: "An authorised medical officer may give, or authorise the giving of, any treatment the officer thinks fit to an involuntary patient or assessable person detained in the facility. For this Part, s 82 extends 'involuntary patient' to include a person detained in a mental health facility.",
            actions: [
                "Check the outer limits: s 83 prohibited treatments, s 85 excessive or inappropriate dosage, and s 29 (minimum medication so the person can communicate at their inquiry).",
                "Give the person information about their medication (s 73).",
                "Apply the s 68 principles — least restrictive, minimum interference with liberty and dignity, involve the person, monitor and support their capacity to consent.",
                "ECT is NOT authorised by s 84 — it has its own pathway.",
                "Special medical treatment (anything likely to render the person permanently infertile) is not authorised by s 84 — see ss 102-103."
            ],
            sections: ["84", "82", "83", "85", "29", "73", "68", "102"],
            cautions: [
                "Section 84 is a psychiatric treatment power. It should not be used as authority to override a competent refusal of non-psychiatric medical treatment — see Cheng et al. (2018) and the treatment-refusal pathway."
            ],
            next: [{ label: "The refusal is of medical or surgical treatment", node: "r_age" }]
        },

        out_voluntary_consent: {
            kind: "outcome",
            tone: "go",
            title: "Ordinary consent law applies",
            summary: "The Act treats a voluntary patient like any other patient in the hospital. Treatment requires the person's consent.",
            actions: [
                "Obtain informed consent in the ordinary way.",
                "If the person refuses and has capacity, the refusal stands — see the treatment-refusal pathway.",
                "A voluntary patient can only be detained by taking the Part 2 steps (s 10); being an inpatient is not authority in itself.",
                "Apply the s 68 principles."
            ],
            sections: ["5", "8", "10", "68"],
            next: [{ label: "They are refusing treatment", node: "r_age" }]
        },

        /* ---------------- Refusal of medical treatment (Cheng et al.) ---------------- */

        r_age: {
            kind: "question",
            title: "Is the person 18 years or over?",
            help: "The published algorithm is for adults. NSW lowers the statutory presumption of capacity to 14 years for medical decisions, but children and young people raise additional frameworks.",
            source: "cheng",
            options: [
                { label: "Yes — 18 or over", next: "r_excluded" },
                { label: "No — under 18", next: "out_specialist" }
            ]
        },

        r_excluded: {
            kind: "question",
            title: "Is the proposed treatment in one of the categories with its own legal framework?",
            help: "Termination of pregnancy; treatment likely to cause infertility (special medical treatment, ss 98, 102-103); treatment given as part of research; compulsory treatment of certain infectious diseases; treatment in forensic settings; end-of-life treatment that does not contribute to the person's health and well-being.",
            source: "cheng",
            sections: ["98", "102", "103"],
            options: [
                { label: "No — ordinary medical or surgical treatment", next: "r_negotiate" },
                { label: "Yes — one of those categories", next: "out_specialist" }
            ]
        },

        r_negotiate: {
            kind: "question",
            title: "Have you explained the treatment clearly and tried to reach a negotiated position?",
            help: "Cheng et al. put this first, before any legal analysis: ensure a clear explanation has been provided and try to reach some negotiated position acceptable to the patient.",
            source: "cheng",
            options: [
                { label: "Yes — and the refusal stands", next: "r_capacity" },
                { label: "Not yet", next: "out_explain_first" }
            ]
        },

        out_explain_first: {
            kind: "outcome",
            tone: "caution",
            title: "Do this before anything else",
            summary: "A refusal that has not been informed, supported and negotiated is not yet a refusal you can act on.",
            actions: [
                "Give a clear explanation of the treatment, in simple language.",
                "Allow sufficient time, and the assistance of friends or family if the person wants it and it is practicable.",
                "Use an interpreter where the person cannot communicate adequately in English (s 70).",
                "Try to reach a negotiated position acceptable to the person — a narrower or staged intervention may be acceptable where the original is not.",
                "Treat reversible contributors — pain, delirium, intoxication, medication effects — and reassess."
            ],
            sections: ["70", "68"],
            source: "cheng",
            next: [{ label: "Done — the refusal stands", node: "r_capacity" }]
        },

        r_capacity: {
            kind: "question",
            title: "Does the person have decision-making capacity for THIS decision, at THIS time?",
            help: "An adult is presumed to have capacity. The presumption is rebutted if the person is unable to comprehend or retain the information material to the decision, or unable to use and weigh that information to come to a decision. Capacity is decision-specific and time-specific, and a person should not be deemed to lack it until all reasonable steps have been taken to support them.",
            source: "cheng",
            capacityAid: true,
            options: [
                { label: "Has capacity", next: "r_status_cap" },
                { label: "Lacks capacity", next: "r_urgency" },
                { label: "Unclear", next: "out_capacity_unclear" }
            ]
        },

        out_capacity_unclear: {
            kind: "outcome",
            tone: "caution",
            title: "Resolve the capacity question before choosing a legal pathway",
            summary: "Every branch below this point turns on capacity. Getting it wrong in either direction is the error the algorithm exists to prevent.",
            actions: [
                "Take all reasonable steps to support the decision: simple language, time, a supporter present, written or repeated information.",
                "Treat and re-assess reversible contributors — delirium, pain, intoxication, sedation, acute distress.",
                "Assess against the specific decision: can the person comprehend and retain the material information, and use and weigh it?",
                "Get a second opinion and document the assessment and its reasons contemporaneously.",
                "If the situation is genuinely urgent and capacity remains unclear, act on the emergency pathway only if its criteria are squarely met, and seek legal advice."
            ],
            source: "cheng",
            next: [
                { label: "Resolved — the person has capacity", node: "r_status_cap" },
                { label: "Resolved — the person lacks capacity", node: "r_urgency" }
            ]
        },

        r_status_cap: {
            kind: "question",
            title: "What is the person's status under the Mental Health Act?",
            help: "In terms of consent to medical treatment, the law treats a voluntary patient like any other patient. Assessable persons and involuntary patients are treated differently depending on capacity and the treatment proposed.",
            source: "cheng",
            sections: ["4", "17", "5"],
            options: [
                { label: "Not subject to the Act, or a voluntary patient", next: "out_competent_refusal" },
                { label: "Assessable person, or detained as a mentally disordered person", next: "out_competent_assessable" },
                { label: "Involuntary patient", next: "r_cap_surgical" }
            ]
        },

        out_competent_refusal: {
            kind: "outcome",
            tone: "stop",
            title: "The refusal must be respected",
            summary: "With only limited exceptions, a competent adult's refusal of medical treatment must be respected, even if that refusal is likely to result in physical harm or even death.",
            actions: [
                "Document the capacity assessment, the information given, and the refusal.",
                "Offer alternatives and continue to offer care that the person will accept.",
                "Re-assess capacity if the person's condition changes — capacity is time-specific.",
                "Being subject to the Mental Health Act does not by itself remove capacity to refuse medical treatment.",
                "If you believe the situation is exceptional, seek legal advice before acting — do not rely on the Act's general provisions."
            ],
            source: "cheng",
            authority: "Hunter and New England Area Health Service v A [2009] NSWSC 761",
            sections: ["68"]
        },

        out_competent_assessable: {
            kind: "outcome",
            tone: "stop",
            title: "A competent objection should not be overridden under ss 84 or 190(2)",
            summary: "Two sections appear to raise the possibility that an authorised medical officer might treat without consent — s 84 ('any treatment the officer thinks fit') and s 190(2) (action to protect from 'serious physical harm'). Cheng et al. conclude the better view, legally and in terms of good practice, is that these provisions are not sufficiently clear to give doctors a power to override a competent objection to non-psychiatric treatment.",
            actions: [
                "Do not rely on s 84 or s 190(2) to treat over a competent refusal of medical treatment without a court order.",
                "Seek legal advice through your local health district now, and document that you have done so.",
                "Continue to offer treatment the person will accept, and re-assess capacity as the clinical situation evolves.",
                "If the person's psychiatric condition is the reason treatment is needed, that is a different question — see the psychiatric treatment pathway."
            ],
            sections: ["84", "190", "82"],
            source: "cheng",
            cautions: ["In any case, ss 84 and 190(2) should not be relied on for this purpose without a court order."]
        },

        r_cap_surgical: {
            kind: "question",
            title: "Is the proposed treatment a 'surgical operation' as defined in s 98?",
            help: "'Surgical operation' means a surgical procedure, a series of related surgical operations or surgical procedures, AND the administration of an anaesthetic for the purpose of medical investigation. That last limb catches more than people expect.",
            sections: ["98"],
            source: "cheng",
            options: [
                { label: "Yes — it is a surgical operation", next: "r_cap_surg_urgency" },
                { label: "No — medical (non-surgical) treatment", next: "out_competent_involuntary_medical" }
            ]
        },

        out_competent_involuntary_medical: {
            kind: "outcome",
            tone: "stop",
            title: "Competent refusal of medical treatment by an involuntary patient",
            summary: "The surgery provisions do not apply. The same legal uncertainty about ss 84 and 190(2) arises, and the same conclusion follows.",
            actions: [
                "Do not treat over the competent refusal on the strength of s 84 or s 190(2).",
                "If you consider treatment despite a competent refusal is justified, seek legal advice — Cheng et al. strongly recommend it.",
                "Document the capacity assessment, the discussion and the advice sought."
            ],
            sections: ["84", "190"],
            source: "cheng"
        },

        r_cap_surg_urgency: {
            kind: "question",
            title: "Is the surgery needed as a matter of urgency?",
            help: "The s 99 test: necessary as a matter of urgency to save the patient's life, to prevent serious damage to the patient's health, or to prevent the patient from suffering or continuing to suffer significant pain or distress.",
            sections: ["99"],
            options: [
                { label: "Yes — urgent on that test", next: "out_s99_competent" },
                { label: "No — it can wait", next: "out_s101_competent" }
            ]
        },

        out_s99_competent: {
            kind: "outcome",
            tone: "caution",
            title: "Section 99 permits consent — but think hard before using it",
            summary: "Section 99(1) lets an authorised medical officer or the Secretary consent to emergency surgery on an involuntary patient who is incapable of consenting, OR is capable but refuses, OR neither gives nor refuses consent.",
            actions: [
                "Confirm the patient is an involuntary patient — s 99 does not apply to assessable persons or voluntary patients.",
                "The consent must be in writing and signed by the person giving it (s 99(3)).",
                "Notify the Tribunal of the operation as soon as practicable afterwards (s 99(4)).",
                "Notify designated carers and the principal care provider that a surgical operation was performed (s 78(1)(f)).",
                "Seek legal advice first wherever time allows."
            ],
            forms: ["Notification to the Tribunal of emergency surgery"],
            sections: ["99", "98", "78", "104"],
            source: "cheng",
            cautions: [
                "An ability to perform even emergency surgery over a patient's competent objection does not automatically imply that a doctor should so proceed. Clinicians should consider proceeding only in extraordinary circumstances (Cheng et al. 2018)."
            ]
        },

        out_s101_competent: {
            kind: "outcome",
            tone: "caution",
            title: "Apply to the Tribunal for consent — s 101",
            summary: "Where an involuntary patient competently refuses non-emergency surgery, the route is an application to the Tribunal. Section 101(3)(a) expressly covers a patient who is capable of giving consent but refuses.",
            actions: [
                "The authorised medical officer applies to the Tribunal (s 101(1)).",
                "Give notice to designated carers of the proposed application (s 78(1)(g)).",
                "The application must not be made earlier than 14 days after that notice, unless the urgency requires an earlier determination or the person notified does not object (s 101(5)).",
                "The Secretary route (s 100) is not available here — it requires a designated carer who agrees in writing and a patient incapable of consenting."
            ],
            forms: ["Notice to designated carer of proposed surgical operation", "Application to the Tribunal for consent to a surgical operation"],
            timeframes: ["14 days after notice, unless urgent or no objection (s 101(5))."],
            sections: ["101", "100", "78", "98"],
            source: "cheng",
            cautions: [
                "An ability to go ahead with surgery over a patient's competent objection does not imply that a doctor should take that option; consider proceeding only in extraordinary circumstances (Cheng et al. 2018)."
            ]
        },

        r_urgency: {
            kind: "question",
            title: "Is the treatment urgently required?",
            help: "Urgency here means failure to provide the treatment will endanger the person's life, cause significant pain, or cause serious damage to health.",
            source: "cheng",
            options: [
                { label: "Yes — urgent", next: "r_urg_status" },
                { label: "No — it can wait", next: "r_nonurg_status" }
            ]
        },

        r_urg_status: {
            kind: "question",
            title: "What is the person's status under the Mental Health Act?",
            source: "cheng",
            options: [
                { label: "Not subject to the Act, or a voluntary patient", next: "out_ga37" },
                { label: "Assessable person, or detained as a mentally disordered person", next: "out_ga37" },
                { label: "Involuntary patient", next: "r_urg_surgical" }
            ]
        },

        r_urg_surgical: {
            kind: "question",
            title: "Is it a 'surgical operation' (s 98)?",
            help: "Including the administration of an anaesthetic for the purpose of medical investigation.",
            sections: ["98"],
            options: [
                { label: "Yes", next: "out_s99_incapable" },
                { label: "No — medical (non-surgical) treatment", next: "out_ga37" }
            ]
        },

        out_ga37: {
            kind: "outcome",
            tone: "go",
            title: "Emergency treatment without consent — Guardianship Act 1987 (NSW), s 37",
            summary: "Where capacity is absent, treatment may be given without consent if failure to provide urgently required treatment will endanger life, cause significant pain or serious damage to health, it is not practicable to obtain substitute consent, and there is no reason to believe the person would have refused the treatment if competent.",
            actions: [
                "Confirm each element: absent capacity, urgency, impracticability of substitute consent, and no reason to believe the person would have refused if competent.",
                "A known advance refusal, or a clearly expressed prior view, defeats this pathway — look for one.",
                "Give only the treatment the emergency requires; return to the substitute-consent pathway for anything beyond it.",
                "Document the assessment, the urgency and the attempts to obtain substitute consent.",
                "Assessable persons who lack capacity may be given emergency treatment under this pathway."
            ],
            source: "cheng",
            unverified: true,
            authority: "Guardianship Act 1987 (NSW) s 37, as described in Cheng et al. (2018)"
        },

        out_s99_incapable: {
            kind: "outcome",
            tone: "go",
            title: "Emergency surgery on an involuntary patient — s 99",
            summary: "An authorised medical officer or the Secretary may consent where the patient is incapable of giving consent and the operation is urgently necessary to save life, prevent serious damage to health, or prevent significant pain or distress.",
            actions: [
                "The consent must be in writing and signed (s 99(3)).",
                "Notify the Tribunal as soon as practicable after the operation (s 99(4)).",
                "Notify designated carers and the principal care provider that the operation was performed (s 78(1)(f)).",
                "A consent given under this Part has the same effect as the patient's own consent (s 104)."
            ],
            forms: ["Notification to the Tribunal of emergency surgery"],
            sections: ["99", "98", "78", "104"],
            source: "cheng"
        },

        r_nonurg_status: {
            kind: "question",
            title: "What is the person's status under the Mental Health Act?",
            source: "cheng",
            options: [
                { label: "Not subject to the Act, or a voluntary patient", next: "out_ncat" },
                { label: "Assessable person, or detained as a mentally disordered person", next: "out_ncat" },
                { label: "Involuntary patient", next: "r_nonurg_surgical" }
            ]
        },

        r_nonurg_surgical: {
            kind: "question",
            title: "Is it a 'surgical operation' (s 98)?",
            sections: ["98"],
            options: [
                { label: "Yes", next: "r_carer_agrees" },
                { label: "No — medical (non-surgical) treatment", next: "out_ncat" }
            ]
        },

        r_carer_agrees: {
            kind: "question",
            title: "Is there a designated carer who agrees in writing to the operation?",
            help: "This is the fork between the Secretary route and the Tribunal route. Section 71 sets out who the designated carer is.",
            sections: ["71", "100", "101"],
            options: [
                { label: "Yes — and the patient is incapable of consenting", next: "out_s100" },
                { label: "No designated carer, or the carers do not agree", next: "out_s101" }
            ]
        },

        out_s100: {
            kind: "outcome",
            tone: "go",
            title: "Apply to the Secretary for consent — s 100",
            summary: "Where a designated carer agrees in writing and the patient is incapable of consenting, the authorised medical officer applies to the Secretary, who may consent if it is desirable having regard to the interests of the patient.",
            actions: [
                "Notify the designated carer of the proposed operation and obtain their written agreement.",
                "The authorised medical officer applies to the Secretary in writing.",
                "The application must not be made earlier than 14 days after notice under s 78, unless urgent or the person notified does not object (s 100(5)).",
                "The consent must be in writing and signed (s 100(6))."
            ],
            forms: ["Notice to designated carer of proposed surgical operation", "Application to the Secretary for consent to a surgical operation"],
            timeframes: ["14 days after notice, unless urgent or no objection (s 100(5))."],
            sections: ["100", "78", "71", "104"],
            source: "cheng"
        },

        out_s101: {
            kind: "outcome",
            tone: "go",
            title: "Apply to the Tribunal for consent — s 101",
            summary: "Where none of the designated carers agree in writing, the application goes to the Tribunal, which may consent if the patient is incapable of consenting (or capable but refusing) and the operation is desirable having regard to the patient's interests.",
            actions: [
                "The authorised medical officer applies to the Tribunal.",
                "Give notice to designated carers of the proposed application (s 78(1)(g)).",
                "The application must not be made earlier than 14 days after that notice, unless urgent or no objection (s 101(5))."
            ],
            forms: ["Notice to designated carer of proposed surgical operation", "Application to the Tribunal for consent to a surgical operation"],
            timeframes: ["14 days after notice, unless urgent or no objection (s 101(5))."],
            sections: ["101", "78", "71", "104"],
            source: "cheng"
        },

        out_ncat: {
            kind: "outcome",
            tone: "go",
            title: "Substitute consent under the Guardianship Act — person responsible or NCAT",
            summary: "Where a person lacking capacity refuses non-urgent treatment and the Mental Health Act surgery provisions do not apply, consent comes through the guardianship system.",
            actions: [
                "If the person is objecting to the treatment, an application must be made to the Guardianship Division of NCAT — either to authorise a guardian to override the objection (s 46A), or to seek consent directly from the Tribunal (ss 44 and 45).",
                "Narrow exception: where the person is refusing with 'minimal or no understanding of what the treatment entails' and the treatment will cause no more than 'reasonably tolerable' and 'transient' distress, the person responsible may consent on their behalf (s 46(4)).",
                "Identify the person responsible before assuming NCAT is required.",
                "Check for an enduring guardian or an advance care directive.",
                "Document the capacity assessment and the nature of the objection — it determines which route applies."
            ],
            source: "cheng",
            unverified: true,
            authority: "Guardianship Act 1987 (NSW) ss 44, 45, 46(4), 46A, as described in Cheng et al. (2018)",
            contacts: ["NCAT Guardianship Division"]
        },

        out_specialist: {
            kind: "outcome",
            tone: "stop",
            title: "Outside the scope of this algorithm — get specialist advice",
            summary: "The published algorithm deliberately excludes people under 18 and a set of treatments that have their own legal frameworks.",
            actions: [
                "Excluded: people under 18 years; termination of pregnancy; treatments likely to cause infertility; treatment in the context of research; compulsory treatment of some infectious diseases; treatment in forensic settings; and end-of-life treatments that do not contribute to the person's health and well-being.",
                "Seek specialist legal and clinical advice for these situations.",
                "Special medical treatment under the Mental Health Act (anything likely to render a person permanently infertile) has its own pathway in ss 102-103."
            ],
            sections: ["98", "102", "103"],
            source: "cheng",
            contacts: ["Your local health district legal / after-hours executive"]
        },

        /* ---------------- Wanting to leave ---------------- */

        x_status: {
            kind: "question",
            title: "What is the person's status?",
            options: [
                { label: "Voluntary patient", next: "out_voluntary_leave" },
                { label: "Assessable person or otherwise detained", next: "out_detained_leave" },
                { label: "Involuntary patient", next: "out_involuntary_leave" }
            ]
        },

        out_voluntary_leave: {
            kind: "outcome",
            tone: "go",
            title: "A voluntary patient who wants to leave",
            summary: "A voluntary patient may be discharged at their request. Detaining them requires the Part 2 process — being an inpatient is not itself authority.",
            actions: [
                "If you consider detention is necessary, you must take the steps under Part 2 of Chapter 3 (s 10) — that means the criteria in s 12 and the examination sequence, not simply refusing to let the person go.",
                "Give the statement of legal rights if it is decided to take steps to detain (s 74(1)(b)).",
                "Otherwise discharge, with discharge planning and follow-up information (s 79)."
            ],
            sections: ["8", "10", "9", "74", "79", "12"],
            next: [{ label: "Detention may be necessary", node: "d_criteria" }]
        },

        out_detained_leave: {
            kind: "outcome",
            tone: "go",
            title: "A detained person asking to be discharged",
            summary: "The person may apply to the authorised medical officer, and has an appeal right if refused or not answered.",
            actions: [
                "The person (or a designated carer or principal care provider) may apply to the authorised medical officer for discharge (ss 42, 43).",
                "An appeal lies to the Tribunal if the officer refuses, OR fails to determine the application within 3 working days (s 44).",
                "Section 12 applies continuously: if the criteria are no longer met, the officer must not continue to detain.",
                "Consider reclassification as a voluntary patient (s 30 for assessable persons, s 40 for involuntary patients)."
            ],
            timeframes: ["3 working days before the appeal right arises (s 44(1)(b))."],
            sections: ["42", "43", "44", "12", "30", "40"]
        },

        out_involuntary_leave: {
            kind: "outcome",
            tone: "go",
            title: "An involuntary patient asking to be discharged",
            summary: "Discharge applications, appeal rights and the Tribunal's review timetable all run in parallel.",
            actions: [
                "Application to the authorised medical officer (s 42); by a designated carer or principal care provider with an undertaking of proper care (s 43).",
                "Appeal to the Tribunal if refused or not determined within 3 working days (s 44). New involuntary patients must be told of this right (s 77).",
                "The Tribunal reviews at the end of the initial period, then at least 3-monthly for 12 months and at least 6-monthly after (s 37).",
                "Reclassification as a voluntary patient is available at any time (s 40).",
                "Leave of absence on compassionate, medical or other grounds may meet the need instead (s 47)."
            ],
            sections: ["42", "43", "44", "77", "37", "38", "40", "47", "12"]
        },

        /* ---------------- ECT ---------------- */

        ect_status: {
            kind: "question",
            title: "Who is the ECT proposed for?",
            help: "Section 89 sets out the only two circumstances in which ECT may be administered.",
            sections: ["89", "88"],
            options: [
                { label: "A person 16 or over who is NOT an involuntary patient", next: "out_ect_consent" },
                { label: "An involuntary patient, or a person under 16", next: "out_ect_tribunal" },
                { label: "Unsure whether the person can give informed consent", next: "out_ect_consent_inquiry" }
            ]
        },

        out_ect_consent: {
            kind: "outcome",
            tone: "go",
            title: "ECT with informed consent — s 93",
            summary: "ECT may be administered to a person who is not an involuntary patient and is 16 or over, if they are capable of and have given informed consent, and two medical practitioners (at least one a psychiatrist) certify.",
            actions: [
                "Obtain informed consent meeting every step in s 91 — fair explanation, full description of discomforts and risks including possible memory loss, expected benefits, alternatives, opportunity to ask questions, and freedom to withdraw.",
                "Written consent in the prescribed form (s 93(1)(a)).",
                "Two certificates under s 93(2): that ECT is a reasonable and proper treatment and is necessary or desirable for the person's safety or welfare.",
                "Two medical practitioners must be present during administration, one experienced in ECT and one in anaesthesia (s 88(3)).",
                "Notify designated carers where an ECT application or capacity inquiry is proposed (s 78(1)(e))."
            ],
            forms: ["Application for an ECT inquiry"],
            sections: ["89", "91", "92", "93", "88", "78"]
        },

        out_ect_tribunal: {
            kind: "outcome",
            tone: "go",
            title: "ECT requires a Tribunal determination — s 94",
            summary: "For an involuntary patient or a person under 16, ECT may only be administered in accordance with an ECT determination made by the Tribunal at an ECT administration inquiry.",
            actions: [
                "Obtain certificates from two medical practitioners, at least one a psychiatrist (s 94(2)-(3)).",
                "For a person under 16, at least one certifying practitioner must be a psychiatrist with expertise in the treatment of children or adolescents (s 94(2A)).",
                "The authorised medical officer applies to the Tribunal for an ECT administration inquiry.",
                "Notify designated carers and the principal care provider of the proposed application (s 78(1)(e)).",
                "Two medical practitioners must be present during administration (s 88(3))."
            ],
            forms: ["Application for an ECT inquiry"],
            sections: ["89", "94", "88", "78"]
        },

        out_ect_consent_inquiry: {
            kind: "outcome",
            tone: "caution",
            title: "Apply for an ECT consent inquiry — s 93(3)",
            summary: "An authorised medical officer who is unsure whether a person is capable of giving informed consent may apply to the Tribunal to determine whether they are capable and have given that consent.",
            actions: [
                "Apply to the Tribunal for an ECT consent inquiry.",
                "Note s 92: a person impaired by medication to the extent that they cannot give informed consent is treated as incapable.",
                "Notify designated carers of the proposed application (s 78(1)(e))."
            ],
            sections: ["93", "92", "91", "78"]
        },

        /* ---------------- Community treatment orders ---------------- */

        cto_start: {
            kind: "question",
            title: "What do you need to do about a community treatment order?",
            options: [
                { label: "Apply for a new order", next: "out_cto_apply" },
                { label: "The person has breached an order", next: "out_cto_breach" },
                { label: "Vary or revoke an existing order", next: "out_cto_vary" }
            ]
        },

        out_cto_apply: {
            kind: "outcome",
            tone: "go",
            title: "Applying for a community treatment order",
            summary: "The Tribunal may make an order authorising compulsory treatment in the community, on application by an authorised medical officer, a medical practitioner familiar with the person's clinical history, or a prescribed person.",
            actions: [
                "Prepare a treatment plan meeting s 54 — the facility must be capable of implementing it.",
                "The Tribunal must be satisfied of each limb of s 53(3): no less restrictive care is appropriate and reasonably available and the person would benefit as the least restrictive alternative; the facility has an appropriate plan and can implement it; AND, where the person has been previously diagnosed with a mental illness, that they have a previous history of refusing to accept appropriate treatment.",
                "An order may be made at a mental health inquiry, on a Tribunal review, or on a free-standing application (s 51(5)).",
                "An order runs for the period specified, or 12 months if none is specified (s 56(2)).",
                "Making the order triggers discharge from detention (s 41)."
            ],
            forms: ["Application for a community treatment order"],
            timeframes: ["Maximum 12 months (s 56(2))."],
            sections: ["51", "53", "54", "56", "41", "52"]
        },

        out_cto_breach: {
            kind: "outcome",
            tone: "caution",
            title: "Breach of a community treatment order — s 58",
            summary: "The breach procedure is staged, and the early steps are mandatory before a breach order can be used.",
            actions: [
                "The director of community treatment must first be satisfied the facility has taken all reasonable steps to implement the order AND that there is a significant risk of deterioration.",
                "Make a written record of the opinions, the facts and the reasons; inform the person that further refusal will result in them being taken to the facility and treated; notify designated carers and the principal care provider (s 58(2)).",
                "On a further refusal, a breach notice may be given; then a breach order (s 58(3)-(4)).",
                "Police assistance is available under s 59; the person is examined at the facility (s 61A) and reviewed (s 61).",
                "The person must be discharged if not mentally ill or mentally disordered, or if less restrictive care is appropriate and reasonably available (s 62(1))."
            ],
            sections: ["58", "59", "60", "61", "62", "63", "65"]
        },

        out_cto_vary: {
            kind: "outcome",
            tone: "go",
            title: "Varying or revoking a community treatment order",
            summary: "The Tribunal may vary or revoke an order; the director of community treatment may revoke one.",
            actions: [
                "Apply to the Tribunal to vary or revoke (s 65).",
                "The director of community treatment may revoke an order (s 66); notification duties follow (s 66A).",
                "An order has no effect while the person is detained otherwise than under the CTO Part, or is a voluntary patient — but time keeps running (s 56(3), (5))."
            ],
            sections: ["65", "66", "56"]
        }
    };

    window.MHA_CONTENT = {
        ACT: ACT,
        SECTION_INDEX: SECTION_INDEX,
        GLOSS: GLOSS,
        FORMS: FORMS,
        TIMEFRAMES: TIMEFRAMES,
        CONTACTS: CONTACTS,
        ROLES: ROLES,
        NODES: NODES,
        URLS: {
            legislation: LEGISLATION_URL,
            guidebook: GUIDEBOOK_URL,
            forms: FORMS_URL,
            mhrt: MHRT_URL,
            ncat: NCAT_URL
        }
    };
})();
