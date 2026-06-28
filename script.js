document.addEventListener("DOMContentLoaded", () => {
    const APP_VERSION = "1.0.0";
    document.querySelectorAll(".app-version").forEach(el => el.textContent = APP_VERSION);
    setupEquivalentsConverters();

    // --- PASSWORD LOCK --- //
    const lockScreen = document.getElementById("lock-screen");
    const unlockBtn = document.getElementById("unlock-btn");
    const passInput = document.getElementById("passphrase-input");
    const lockError = document.getElementById("lock-error");

    function checkPassword() {
        if (passInput.value.toLowerCase() === "psych123") {
            lockScreen.classList.remove("active");
            // Optional: store in sessionStorage to prevent locking on refresh
            sessionStorage.setItem("unlocked", "true");
        } else {
            lockError.style.display = "block";
        }
    }

    if (sessionStorage.getItem("unlocked") === "true") {
        lockScreen.classList.remove("active");
    }

    if (unlockBtn) unlockBtn.addEventListener("click", checkPassword);
    if (passInput) passInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") checkPassword();
    });

    // --- DATE HELPERS --- //
    function parseDate(str) {
        if (!str) return new Date();
        const parts = str.split("/");
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                return new Date(year, month, day);
            }
        }
        return new Date();
    }

    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Set default dates on inputs
    const todayStr = formatDate(new Date());
    ["meth-start-date", "bup-start-date", "lai-last-date", "diz-wean-date"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = todayStr;
    });

    // --- DISCLAIMER MODAL --- //
    const disclaimerModal = document.getElementById("disclaimer-modal");
    const acceptDisclaimerBtn = document.getElementById("accept-disclaimer-btn");

    if (disclaimerModal && acceptDisclaimerBtn) {
        disclaimerModal.style.display = "block";
        document.body.classList.add("modal-open");

        acceptDisclaimerBtn.addEventListener("click", () => {
            disclaimerModal.style.display = "none";
            document.body.classList.remove("modal-open");
        });
    }

    // --- HAMBURGER MENU --- //
    const hamburger = document.getElementById("hamburger-menu");
    const headerControls = document.getElementById("header-controls");

    if (hamburger && headerControls) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            headerControls.classList.toggle("active");
        });

        document.addEventListener("click", (e) => {
            if (!hamburger.contains(e.target) && !headerControls.contains(e.target)) {
                hamburger.classList.remove("active");
                headerControls.classList.remove("active");
            }
        });

        headerControls.querySelectorAll("button").forEach(button => {
            button.addEventListener("click", () => {
                hamburger.classList.remove("active");
                headerControls.classList.remove("active");
            });
        });
    }

    // --- THEME TOGGLE --- //
    const themeToggle = document.getElementById("theme-toggle");
    const rootEl = document.documentElement;

    if (themeToggle) {
        const updateThemeBtnText = () => {
            const isDark = rootEl.hasAttribute("data-theme");
            themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
        };
        updateThemeBtnText();

        themeToggle.addEventListener("click", () => {
            const isDark = rootEl.hasAttribute("data-theme");
            if (isDark) {
                rootEl.removeAttribute("data-theme");
                localStorage.setItem("theme", "light");
            } else {
                rootEl.setAttribute("data-theme", "dark");
                localStorage.setItem("theme", "dark");
            }
            updateThemeBtnText();
        });
    }

    // --- PAGE NAVIGATION --- //
    const pageTitle = document.getElementById("page-title");
    const pages = document.querySelectorAll(".page");
    const navButtons = document.querySelectorAll("[data-page]");
    const homeButton = document.getElementById("home-button");
    const aboutButton = document.getElementById("about-button");
    const feedbackButton = document.getElementById("feedback-button");

    function showPage(pageId) {
        pages.forEach(page => page.classList.remove("active-page"));
        const newPage = document.getElementById(pageId);
        if (newPage) {
            newPage.classList.add("active-page");
            let title = "PsychToolkit";
            if (pageId === "home-page") {
                title = "Psychiatry Toolkit (PsychToolkit)";
            } else {
                title = newPage.dataset.title || "PsychToolkit";
            }
            pageTitle.textContent = title;
            document.title = title + " - PsychToolkit";
        }
    }

    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            showPage(button.dataset.page);
        });
    });

    if (homeButton) homeButton.addEventListener("click", () => showPage("home-page"));
    if (aboutButton) aboutButton.addEventListener("click", () => showPage("about-page"));
    if (feedbackButton) {
        feedbackButton.addEventListener("click", () => {
            const feedbackUrl = "mailto:trentkoessler@gmail.com?subject=PsychToolkit Feedback";
            window.open(feedbackUrl, "_blank");
        });
    }

    // --- TAB CONTAINER LOGIC (OTP, Weaning, Generators, Checklists) --- //
    document.querySelectorAll(".tab-container").forEach(container => {
        const tabButtons = container.querySelectorAll(":scope > .tab-buttons > .tab-button");
        const tabContents = container.querySelectorAll(":scope > .tab-content");

        tabButtons.forEach(button => {
            button.addEventListener("click", () => {
                const tabId = button.dataset.tab;
                tabButtons.forEach(btn => btn.classList.remove("active"));
                button.classList.add("active");
                tabContents.forEach(content => content.classList.remove("active"));

                const activeContent = container.querySelector(`#${tabId}`);
                if (activeContent) activeContent.classList.add("active");
            });
        });
    });

    // =================================================================
    // CLINICAL CALCULATOR ENGINE & SETUP
    // =================================================================

    function setupScaleCalculator(config) {
        const template = document.getElementById("calculator-template");
        const container = document.getElementById(config.id);

        if (!template || !container) return;

        const calcNode = template.cloneNode(true);
        calcNode.removeAttribute("id");
        calcNode.style.display = "block";

        const titleEl = calcNode.querySelector(".calculator-title");
        const noteEl = calcNode.querySelector(".calculator-note");
        const itemsContainer = calcNode.querySelector(".calculator-items");
        const totalScoreEl = calcNode.querySelector(".total-score");
        const severityEl = calcNode.querySelector(".severity");
        const emrSummaryEl = calcNode.querySelector(".emr-summary");
        const copyBtn = calcNode.querySelector(".copy-btn");
        const resetBtn = calcNode.querySelector(".reset-btn");
        const referenceEl = calcNode.querySelector(".calculator-reference");

        titleEl.textContent = config.name;
        if (config.note) {
            noteEl.innerHTML = `<i>${config.note}</i>`;
            noteEl.style.display = "block";
        }
        if (config.reference) {
            referenceEl.innerHTML = `<strong>Reference:</strong><br>${config.reference}`;
        }

        let itemsHtml = "";
        config.items.forEach((item, itemIdx) => {
            const radioName = `${config.id}-q-${itemIdx}`;
            itemsHtml += `<fieldset class="calculator-item"><legend>${item.displayName}</legend>`;
            if (item.instruction) {
                itemsHtml += `<p class="calculator-item-instruction">${item.instruction}</p>`;
            }
            item.options.forEach((opt, optIdx) => {
                const isChecked = optIdx === 0 ? "checked" : "";
                itemsHtml += `
                    <div class="radio-option">
                        <label>
                            <input type="radio" name="${radioName}" value="${opt.value}" ${isChecked}>
                            ${opt.label}
                        </label>
                    </div>`;
            });
            itemsHtml += `</fieldset>`;
        });
        itemsContainer.innerHTML = itemsHtml;

        function updateState() {
            let total = 0;
            let breakdown = "";
            config.items.forEach((item, itemIdx) => {
                const radioName = `${config.id}-q-${itemIdx}`;
                const checkedRadio = itemsContainer.querySelector(`input[name="${radioName}"]:checked`);
                if (checkedRadio) {
                    const scoreVal = parseInt(checkedRadio.value, 10);
                    total += scoreVal;
                    const optText = checkedRadio.parentElement.textContent.trim();
                    breakdown += `- ${item.displayName}: ${optText}\n`;
                }
            });

            const severity = config.severityLogic(total, itemsContainer);
            totalScoreEl.textContent = total;
            severityEl.textContent = severity;

            let summary = `${config.name} assessed. Total score: ${total} (${severity}).\nBreakdown:\n${breakdown}`;

            // Special alerts for specific scales
            if (config.id === "epds") {
                const q10Radio = itemsContainer.querySelector(`input[name="epds-q-9"]:checked`);
                if (q10Radio && parseInt(q10Radio.value, 10) > 0) {
                    summary += `\n!! ALERT: Positive response to self-harm question (Q10). Immediate risk assessment is required. !!`;
                }
            } else if (config.id === "cssrs") {
                const q6Radio = itemsContainer.querySelector(`input[name="cssrs-q-5"]:checked`);
                if (q6Radio && parseInt(q6Radio.value, 10) > 0) {
                    summary += `\n!! ALERT: Positive suicidal behavior screen. Immediate safety plan required. !!`;
                }
            }

            emrSummaryEl.value = summary.trim();
        }

        itemsContainer.addEventListener("change", updateState);

        copyBtn.addEventListener("click", () => {
            emrSummaryEl.select();
            navigator.clipboard.writeText(emrSummaryEl.value);
            const origText = copyBtn.textContent;
            copyBtn.textContent = "Copied!";
            setTimeout(() => { copyBtn.textContent = origText; }, 2000);
        });

        resetBtn.addEventListener("click", () => {
            itemsContainer.querySelectorAll("fieldset").forEach(fieldset => {
                const radios = fieldset.querySelectorAll('input[type="radio"]');
                if (radios.length > 0) {
                    radios[0].checked = true;
                }
            });
            updateState();
        });

        container.innerHTML = "";
        container.appendChild(calcNode);
        updateState();
    }

    // =================================================================
    // HORIZONTAL TAB NAVIGATION (OPTION A DRAG SELECTOR / BUTTONS)
    // =================================================================
    const scaleSelector = document.getElementById("scale-selector");
    const prevScaleBtn = document.getElementById("prev-scale-btn");
    const nextScaleBtn = document.getElementById("next-scale-btn");
    const scaleSections = document.querySelectorAll("#scales-page .tab-content");

    function syncScaleView() {
        if (!scaleSelector) return;
        const activeScaleId = scaleSelector.value;
        scaleSections.forEach(section => {
            if (section.id === activeScaleId) {
                section.classList.add("active");
            } else {
                section.classList.remove("active");
            }
        });
    }

    if (scaleSelector) {
        scaleSelector.addEventListener("change", syncScaleView);

        prevScaleBtn.addEventListener("click", () => {
            let idx = scaleSelector.selectedIndex - 1;
            if (idx < 0) idx = scaleSelector.options.length - 1;
            scaleSelector.selectedIndex = idx;
            syncScaleView();
        });

        nextScaleBtn.addEventListener("click", () => {
            let idx = scaleSelector.selectedIndex + 1;
            if (idx >= scaleSelector.options.length) idx = 0;
            scaleSelector.selectedIndex = idx;
            syncScaleView();
        });
    }

    // =================================================================
    // DEFINE 29 CLINICAL SCALES
    // =================================================================

    // Standard options databases
    const optNotAtAll = [{ value: 0, label: "0 - Not at all" }, { value: 1, label: "1 - Several days" }, { value: 2, label: "2 - More than half the days" }, { value: 3, label: "3 - Nearly every day" }];
    const optYesNo = [{ value: 0, label: "No" }, { value: 1, label: "Yes" }];
    const optZeroFour = [{ value: 0, label: "0 - Not at all" }, { value: 1, label: "1 - A little bit" }, { value: 2, label: "2 - Moderately" }, { value: 3, label: "3 - Quite a bit" }, { value: 4, label: "4 - Extremely" }];
    const optZeroFourClinical = [{ value: 0, label: "0 - None / Normal" }, { value: 1, label: "1 - Mild" }, { value: 2, label: "2 - Moderate" }, { value: 3, label: "3 - Severe" }, { value: 4, label: "4 - Very Severe" }];

    // 1. PHQ-9
    setupScaleCalculator({
        id: "phq9",
        name: "PHQ-9 (Depression Screen)",
        note: "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
        reference: "Kroenke K, Spitzer RL, Williams JB. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med. 2001;16(9):606-613.",
        items: [
            { displayName: "1. Little interest or pleasure in doing things", options: optNotAtAll },
            { displayName: "2. Feeling down, depressed, or hopeless", options: optNotAtAll },
            { displayName: "3. Trouble falling or staying asleep, or sleeping too much", options: optNotAtAll },
            { displayName: "4. Feeling tired or having little energy", options: optNotAtAll },
            { displayName: "5. Poor appetite or overeating", options: optNotAtAll },
            { displayName: "6. Feeling bad about yourself — or that you are a failure or have let yourself or your family down", options: optNotAtAll },
            { displayName: "7. Trouble concentrating on things, such as reading the newspaper or watching television", options: optNotAtAll },
            { displayName: "8. Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual", options: optNotAtAll },
            { displayName: "9. Thoughts that you would be better off dead or of hurting yourself in some way", options: optNotAtAll }
        ],
        severityLogic: (score) => {
            if (score <= 4) return "Minimal Depression";
            if (score <= 9) return "Mild Depression";
            if (score <= 14) return "Moderate Depression";
            if (score <= 19) return "Moderately Severe Depression";
            return "Severe Depression";
        }
    });

    // 2. GAD-7
    setupScaleCalculator({
        id: "gad7",
        name: "GAD-7 (Anxiety Screen)",
        note: "Over the last 2 weeks, how often have you been bothered by the following problems?",
        reference: "Spitzer RL, Kroenke K, Williams JB, et al. A brief measure for assessing generalized anxiety disorder: the GAD-7. Arch Intern Med. 2006;166(10):1092-1097.",
        items: [
            { displayName: "1. Feeling nervous, anxious or on edge", options: optNotAtAll },
            { displayName: "2. Not being able to stop or control worrying", options: optNotAtAll },
            { displayName: "3. Worrying too much about different things", options: optNotAtAll },
            { displayName: "4. Trouble relaxing", options: optNotAtAll },
            { displayName: "5. Being so restless that it is hard to sit still", options: optNotAtAll },
            { displayName: "6. Becoming easily annoyed or irritable", options: optNotAtAll },
            { displayName: "7. Feeling afraid as if something awful might happen", options: optNotAtAll }
        ],
        severityLogic: (score) => {
            if (score <= 4) return "Minimal Anxiety";
            if (score <= 9) return "Mild Anxiety";
            if (score <= 14) return "Moderate Anxiety";
            return "Severe Anxiety";
        }
    });

    // 3. EPDS
    setupScaleCalculator({
        id: "epds",
        name: "EPDS (Perinatal Depression)",
        note: "Please select the response that comes closest to how you have felt in the past 7 days.",
        reference: "Cox JL, Holden JM, Sagovsky R. Detection of postnatal depression. Development of the 10-item Edinburgh Postnatal Depression Scale. Br J Psychiatry. 1987;150:782-786.",
        items: [
            { displayName: "1. I have been able to laugh and see the funny side of things", options: [{ value: 0, label: "As much as I always could" }, { value: 1, label: "Not quite so much now" }, { value: 2, label: "Definitely not so much now" }, { value: 3, label: "Not at all" }] },
            { displayName: "2. I have looked forward with enjoyment to things", options: [{ value: 0, label: "As much as I ever did" }, { value: 1, label: "Rather less than I used to" }, { value: 2, label: "Definitely less than I used to" }, { value: 3, label: "Hardly at all" }] },
            { displayName: "3. I have blamed myself unnecessarily when things went wrong", options: [{ value: 3, label: "Yes, most of the time" }, { value: 2, label: "Yes, some of the time" }, { value: 1, label: "Not very often" }, { value: 0, label: "No, never" }] },
            { displayName: "4. I have been anxious or worried for no good reason", options: [{ value: 0, label: "No, not at all" }, { value: 1, label: "Hardly ever" }, { value: 2, label: "Yes, sometimes" }, { value: 3, label: "Yes, very often" }] },
            { displayName: "5. I have felt scared or panicky for no very good reason", options: [{ value: 3, label: "Yes, quite a lot" }, { value: 2, label: "Yes, sometimes" }, { value: 1, label: "No, not much" }, { value: 0, label: "No, not at all" }] },
            { displayName: "6. Things have been getting on top of me", options: [{ value: 3, label: "Yes, most of the time I haven't been able to cope at all" }, { value: 2, label: "Yes, sometimes I haven't been coping as well as usual" }, { value: 1, label: "No, most of the time I have coped quite well" }, { value: 0, label: "No, I have been coping as well as ever" }] },
            { displayName: "7. I have been so unhappy that I have had difficulty sleeping", options: [{ value: 3, label: "Yes, most of the time" }, { value: 2, label: "Yes, sometimes" }, { value: 1, label: "Not very often" }, { value: 0, label: "No, not at all" }] },
            { displayName: "8. I have felt sad or miserable", options: [{ value: 3, label: "Yes, most of the time" }, { value: 2, label: "Yes, quite often" }, { value: 1, label: "Not very often" }, { value: 0, label: "No, not at all" }] },
            { displayName: "9. I have been so unhappy that I have been crying", options: [{ value: 3, label: "Yes, most of the time" }, { value: 2, label: "Yes, quite often" }, { value: 1, label: "Only occasionally" }, { value: 0, label: "No, never" }] },
            { displayName: "10. The thought of harming myself has occurred to me", options: [{ value: 3, label: "Yes, quite often" }, { value: 2, label: "Sometimes" }, { value: 1, label: "Hardly ever" }, { value: 0, label: "Never" }] }
        ],
        severityLogic: (score) => {
            if (score >= 13) return "High probability of depression (Further clinical assessment recommended)";
            if (score >= 10) return "Possible depression (Monitoring and follow-up recommended)";
            return "Below typical depression threshold";
        }
    });

    // 4. PCL-5
    setupScaleCalculator({
        id: "pcl5",
        name: "PCL-5 (PTSD Screen)",
        note: "Keeping your worst event in mind, please indicate how much you have been bothered by that problem in the past month.",
        reference: "Blevins CA, Weathers FW, Davis MT, et al. The Posttraumatic Stress Disorder Checklist for DSM-5 (PCL-5): development and initial psychometric evaluation. J Trauma Stress. 2015;28(6):489-498.",
        items: [
            { displayName: "1. Repeated, disturbing, and unwanted memories of the stressful experience?", options: optZeroFour },
            { displayName: "2. Repeated, disturbing dreams of the stressful experience?", options: optZeroFour },
            { displayName: "3. Suddenly feeling or acting as if the stressful experience were actually happening again (as if you were actually back there reliving it)?", options: optZeroFour },
            { displayName: "4. Feeling very upset when something reminded you of the stressful experience?", options: optZeroFour },
            { displayName: "5. Having strong physical reactions when something reminded you of the stressful experience (for example, heart pounding, trouble breathing, sweating)?", options: optZeroFour },
            { displayName: "6. Avoiding memories, thoughts, or feelings related to the stressful experience?", options: optZeroFour },
            { displayName: "7. Avoiding external reminders of the stressful experience (for example, people, places, conversations, activities, objects, or situations)?", options: optZeroFour },
            { displayName: "8. Trouble remembering important parts of the stressful experience?", options: optZeroFour },
            { displayName: "9. Having strong negative beliefs about yourself, other people, or the world (for example, having thoughts such as: I am bad, there is something seriously wrong with me, no one can be trusted, the world is completely dangerous)?", options: optZeroFour },
            { displayName: "10. Blaming yourself or someone else for the stressful experience or what happened after it?", options: optZeroFour },
            { displayName: "11. Having strong negative feelings such as fear, horror, anger, guilt, or shame?", options: optZeroFour },
            { displayName: "12. Loss of interest in activities that you used to enjoy?", options: optZeroFour },
            { displayName: "13. Feeling distant or cut off from other people?", options: optZeroFour },
            { displayName: "14. Trouble experiencing positive feelings (for example, being unable to feel happiness or have loving feelings for people close to you)?", options: optZeroFour },
            { displayName: "15. Irritable behavior, angry outbursts, or acting aggressively?", options: optZeroFour },
            { displayName: "16. Taking too many risks or doing things that could cause you harm?", options: optZeroFour },
            { displayName: "17. Being 'superalert' or watchful or on guard?", options: optZeroFour },
            { displayName: "18. Feeling jumpy or easily startled?", options: optZeroFour },
            { displayName: "19. Having difficulty concentrating?", options: optZeroFour },
            { displayName: "20. Trouble falling or staying asleep?", options: optZeroFour }
        ],
        severityLogic: (score) => {
            if (score >= 31) return "POSITIVE SCREEN (Score >= 31, preliminary indicator of clinically significant PTSD symptoms. Requires clinical interview.)";
            return "Below typical diagnostic threshold";
        }
    });

    // 5. YMRS
    setupScaleCalculator({
        id: "ymrs",
        name: "YMRS (Young Mania Rating Scale)",
        note: "Rate each item based on report and observation over the past 48 hours. Note that items 5, 6, 8, and 9 are double-weighted (options are 0, 2, 4, 6, 8 points).",
        reference: "Young RC, Biggs JT, Ziegler VE, et al. A rating scale for mania: reliability, validity and sensitivity. Br J Psychiatry. 1978;133:429-435.",
        items: [
            { displayName: "1. Elevated Mood", options: [{ value: 0, label: "0 - Absent" }, { value: 1, label: "1 - Mildly or possibly increased" }, { value: 2, label: "2 - Definite subjective elevation" }, { value: 3, label: "3 - Elated, inappropriate laughing" }, { value: 4, label: "4 - Euphoric, inappropriate singing" }] },
            { displayName: "2. Increased Motor Activity-Energy", options: [{ value: 0, label: "0 - Absent" }, { value: 1, label: "1 - Subjective increase" }, { value: 2, label: "2 - Appears energetic" }, { value: 3, label: "3 - Excessive energy, restless" }, { value: 4, label: "4 - Continuous hyperactivity" }] },
            { displayName: "3. Sexual Interest", options: [{ value: 0, label: "0 - Normal / Absent" }, { value: 1, label: "1 - Mildly or possibly increased" }, { value: 2, label: "2 - Definite increase" }, { value: 3, label: "3 - Hypersexual" }, { value: 4, label: "4 - Overt sexual acts" }] },
            { displayName: "4. Sleep", options: [{ value: 0, label: "0 - Reports no decrease" }, { value: 1, label: "1 - Sleeping less up to 1 hr" }, { value: 2, label: "2 - Sleeping less > 1 hr" }, { value: 3, label: "3 - Decreased need for sleep" }, { value: 4, label: "4 - Denies need for sleep" }] },
            { displayName: "5. Irritability (Double Weighted)", options: [{ value: 0, label: "0 - Absent" }, { value: 2, label: "2 - Subjectively increased / irritable at times" }, { value: 4, label: "4 - Frequently irritable / outbursts" }, { value: 6, label: "6 - Hostile, threatening" }, { value: 8, label: "8 - Assaultive, destructive" }] },
            { displayName: "6. Speech (Rate and Amount) (Double Weighted)", options: [{ value: 0, label: "0 - No increase" }, { value: 2, label: "2 - Talkative at times" }, { value: 4, label: "4 - Pressured; difficult to interrupt" }, { value: 6, label: "6 - Continuous, pressured" }, { value: 8, label: "8 - Incomprehensible" }] },
            { displayName: "7. Language-Thought Disorder", options: [{ value: 0, label: "0 - Absent" }, { value: 1, label: "1 - Circumstantial, mild distractibility" }, { value: 2, label: "2 - Distractible, changes topics" }, { value: 3, label: "3 - Flight of ideas, clanging" }, { value: 4, label: "4 - Incoherent, incomprehensible" }] },
            { displayName: "8. Content (Double Weighted)", options: [{ value: 0, label: "0 - Normal" }, { value: 2, label: "2 - Questionable plans / special projects" }, { value: 4, label: "4 - Grandiose plans or ideas" }, { value: 6, label: "6 - Paranoid accusations / delusions" }, { value: 8, label: "8 - Hallucinations / bizarre delusions" }] },
            { displayName: "9. Disruptive-Aggressive Behavior (Double Weighted)", options: [{ value: 0, label: "0 - Absent" }, { value: 2, label: "2 - Sarcastic, loud or demanding" }, { value: 4, label: "4 - Shouting, demands, yelling" }, { value: 6, label: "6 - Threatens interviewer" }, { value: 8, label: "8 - Assaultive, destructive" }] },
            { displayName: "10. Appearance", options: [{ value: 0, label: "0 - Appropriate dress / grooming" }, { value: 1, label: "1 - Slightly unkempt" }, { value: 2, label: "2 - Poorly groomed / moderately disheveled" }, { value: 3, label: "3 - Disheveled, bizarre garb" }, { value: 4, label: "4 - Completely unkempt / bizarre" }] },
            { displayName: "11. Insight", options: [{ value: 0, label: "0 - Admits illness; agrees to treatment" }, { value: 1, label: "1 - Possibly ill" }, { value: 2, label: "2 - Admits behavior change; denies illness" }, { value: 3, label: "3 - Admits possible change; denies illness" }, { value: 4, label: "4 - Denies behavior change" }] }
        ],
        severityLogic: (score) => {
            if (score >= 20) return "Moderate to severe mania (Further clinical assessment/intervention required)";
            if (score >= 12) return "Minimal to mild mania";
            return "Normal range / Euthymia";
        }
    });

    // 6. MDQ
    setupScaleCalculator({
        id: "mdq",
        name: "MDQ (Mood Disorder Questionnaire)",
        note: "Screening tool for Bipolar Spectrum Disorder. A positive screen requires YES to 7/13 symptoms in Q1, co-occurrence in Q2, and moderate/serious impairment in Q3.",
        reference: "Hirschfeld RM, Williams JB, Spitzer RL, et al. Development and validation of a screening instrument for bipolar spectrum disorder: the Mood Disorder Questionnaire. Am J Psychiatry. 2000;157(11):1873-1875.",
        items: [
            { displayName: "Q1.1: Felt so good or hyper that others thought you were not your usual self or you got into trouble?", options: optYesNo },
            { displayName: "Q1.2: So irritable that you shouted at people or started fights or arguments?", options: optYesNo },
            { displayName: "Q1.3: Felt much more self-confident than usual?", options: optYesNo },
            { displayName: "Q1.4: Got much less sleep than usual and found you didn't really miss it?", options: optYesNo },
            { displayName: "Q1.5: Much more talkative or spoke much faster than usual?", options: optYesNo },
            { displayName: "Q1.6: Thoughts raced through your head or you couldn't slow your mind down?", options: optYesNo },
            { displayName: "Q1.7: So easily distracted by things around you that you had trouble concentrating or staying on track?", options: optYesNo },
            { displayName: "Q1.8: Had much more energy than usual?", options: optYesNo },
            { displayName: "Q1.9: Much more active or did many more things than usual?", options: optYesNo },
            { displayName: "Q1.10: Much more social or outgoing than usual (e.g. calling friends in middle of night)?", options: optYesNo },
            { displayName: "Q1.11: Much more interested in sex than usual?", options: optYesNo },
            { displayName: "Q1.12: Did things that were unusual for you or that other people might have thought were excessive, foolish, or risky?", options: optYesNo },
            { displayName: "Q1.13: Spending money got you or your family into trouble?", options: optYesNo },
            { displayName: "Q2: Have several of these ever happened during the same period of time?", options: optYesNo },
            { displayName: "Q3: How much of a problem did any of these cause you?", options: [{ value: 0, label: "0 - No Problem" }, { value: 1, label: "1 - Minor Problem" }, { value: 2, label: "2 - Moderate Problem" }, { value: 3, label: "3 - Serious Problem" }] }
        ],
        severityLogic: (score, itemsContainer) => {
            let yesCount = 0;
            for (let i = 0; i < 13; i++) {
                const radio = itemsContainer.querySelector(`input[name="mdq-q-${i}"]:checked`);
                if (radio && parseInt(radio.value, 10) === 1) {
                    yesCount++;
                }
            }
            const q2Radio = itemsContainer.querySelector(`input[name="mdq-q-13"]:checked`);
            const q2Yes = q2Radio && parseInt(q2Radio.value, 10) === 1;

            const q3Radio = itemsContainer.querySelector(`input[name="mdq-q-14"]:checked`);
            const q3Score = q3Radio ? parseInt(q3Radio.value, 10) : 0;

            const isPositive = yesCount >= 7 && q2Yes && q3Score >= 2;

            if (isPositive) {
                return `POSITIVE SCREEN (Yes to ${yesCount} symptoms, occurred together, moderate/serious impairment)`;
            } else {
                return `Negative Screen (Yes to ${yesCount} symptoms)`;
            }
        }
    });

    // 7. ASRS v1.1
    setupScaleCalculator({
        id: "asrs",
        name: "ASRS v1.1 (ADHD Screen)",
        note: "Adult ADHD Self-Report Scale 6-item screening version. Shaded indicators are: Q1-3 (Sometimes/Often/Very Often) and Q4-6 (Often/Very Often). 4 or more indicators constitutes a positive screen.",
        reference: "Kessler RC, Adler L, Ames M, et al. The World Health Organization Adult ADHD Self-Report Scale (ASRS): a short screening scale for use in the general population. Psychol Med. 2005;35(2):245-256.",
        items: [
            { displayName: "1. Trouble wrapping up the final details of a project, once the challenging parts have been done?", options: [{ value: 0, label: "Never" }, { value: 1, label: "Rarely" }, { value: 2, label: "Sometimes" }, { value: 3, label: "Often" }, { value: 4, label: "Very Often" }] },
            { displayName: "2. Difficulty getting things in order when you have to task a task that requires organization?", options: [{ value: 0, label: "Never" }, { value: 1, label: "Rarely" }, { value: 2, label: "Sometimes" }, { value: 3, label: "Often" }, { value: 4, label: "Very Often" }] },
            { displayName: "3. Problems remembering appointments or obligations?", options: [{ value: 0, label: "Never" }, { value: 1, label: "Rarely" }, { value: 2, label: "Sometimes" }, { value: 3, label: "Often" }, { value: 4, label: "Very Often" }] },
            { displayName: "4. When you have a task that requires a lot of thought, how often do you avoid or delay getting started?", options: [{ value: 0, label: "Never" }, { value: 1, label: "Rarely" }, { value: 2, label: "Sometimes" }, { value: 3, label: "Often" }, { value: 4, label: "Very Often" }] },
            { displayName: "5. Fidget or squirm with your hands or feet when you have to sit down for a long time?", options: [{ value: 0, label: "Never" }, { value: 1, label: "Rarely" }, { value: 2, label: "Sometimes" }, { value: 3, label: "Often" }, { value: 4, label: "Very Often" }] },
            { displayName: "6. Feel overly active and compelled to do things, as if you were driven by a motor?", options: [{ value: 0, label: "Never" }, { value: 1, label: "Rarely" }, { value: 2, label: "Sometimes" }, { value: 3, label: "Often" }, { value: 4, label: "Very Often" }] }
        ],
        severityLogic: (score, itemsContainer) => {
            let indicators = 0;
            for (let i = 0; i < 6; i++) {
                const radio = itemsContainer.querySelector(`input[name="asrs-q-${i}"]:checked`);
                if (radio) {
                    const val = parseInt(radio.value, 10);
                    if (i < 3) {
                        if (val >= 2) indicators++; // Sometimes (2), Often (3), Very Often (4)
                    } else {
                        if (val >= 3) indicators++; // Often (3), Very Often (4)
                    }
                }
            }
            if (indicators >= 4) {
                return `POSITIVE SCREEN (${indicators} of 6 indicators shaded. Referral for clinical interview is recommended.)`;
            } else {
                return `Negative Screen (${indicators} of 6 indicators shaded)`;
            }
        }
    });

    // 8. HAM-D
    setupScaleCalculator({
        id: "hamd",
        name: "HAM-D (Hamilton Depression Rating Scale)",
        note: "Evaluate based on clinical interview (17-item version).",
        reference: "Hamilton M. A rating scale for depression. J Neurol Neurosurg Psychiatry. 1960;23:56-62.",
        items: [
            { displayName: "1. Depressed Mood", options: [{ value: 0, label: "0 - Absent" }, { value: 1, label: "1 - Mild" }, { value: 2, label: "2 - Moderate" }, { value: 3, label: "3 - Severe" }, { value: 4, label: "4 - Very Severe" }] },
            { displayName: "2. Feelings of Guilt", options: [{ value: 0, label: "0 - Absent" }, { value: 1, label: "1 - Self-reproach" }, { value: 2, label: "2 - Ideas of guilt" }, { value: 3, label: "3 - Present illness is punishment" }, { value: 4, label: "4 - Hallucinations of guilt" }] },
            { displayName: "3. Suicide", options: [{ value: 0, label: "0 - Absent" }, { value: 1, label: "1 - Feels life not worth living" }, { value: 2, label: "2 - Wishes he were dead" }, { value: 3, label: "3 - Suicidal ideas/gestures" }, { value: 4, label: "4 - Attempts" }] },
            { displayName: "4. Insomnia (Initial)", options: [{ value: 0, label: "0 - No difficulty" }, { value: 1, label: "1 - Occasional difficulty" }, { value: 2, label: "2 - Nightly difficulty" }] },
            { displayName: "5. Insomnia (Middle)", options: [{ value: 0, label: "0 - No difficulty" }, { value: 1, label: "1 - Restless/disturbed" }, { value: 2, label: "2 - Waking during night" }] },
            { displayName: "6. Insomnia (Late)", options: [{ value: 0, label: "0 - No difficulty" }, { value: 1, label: "1 - Waking early but goes back to sleep" }, { value: 2, label: "2 - Unable to fall asleep again" }] },
            { displayName: "7. Work and Activities", options: [{ value: 0, label: "0 - Normal" }, { value: 1, label: "1 - Feelings of incapacity" }, { value: 2, label: "2 - Loss of interest" }, { value: 3, label: "3 - Decrease in actual time spent" }, { value: 4, label: "4 - Stopped working" }] },
            { displayName: "8. Retardation (Psychomotor)", options: [{ value: 0, label: "0 - Normal" }, { value: 1, label: "1 - Slight retardation" }, { value: 2, label: "2 - Obvious retardation" }, { value: 3, label: "3 - Interview difficult" }, { value: 4, label: "4 - Stupor" }] },
            { displayName: "9. Agitation", options: [{ value: 0, label: "0 - None" }, { value: 1, label: "1 - Fidgetiness" }, { value: 2, label: "2 - Hand wringing/pulling hair" }] },
            { displayName: "10. Anxiety (Psychic)", options: [{ value: 0, label: "0 - No difficulty" }, { value: 1, label: "1 - Tension/irritability" }, { value: 2, label: "2 - Worrying" }, { value: 3, label: "3 - Apprehension" }, { value: 4, label: "4 - Panic" }] },
            { displayName: "11. Anxiety (Somatic)", options: [{ value: 0, label: "0 - Absent" }, { value: 1, label: "1 - Mild (GI, CV, etc)" }, { value: 2, label: "2 - Moderate" }, { value: 3, label: "3 - Severe" }, { value: 4, label: "4 - Incapacitating" }] },
            { displayName: "12. Somatic Symptoms (GI)", options: [{ value: 0, label: "0 - None" }, { value: 1, label: "1 - Loss of appetite" }, { value: 2, label: "2 - Heavy GI complaints" }] },
            { displayName: "13. Somatic Symptoms (General)", options: [{ value: 0, label: "0 - None" }, { value: 1, label: "1 - Heaviness in limbs, backaches" }, { value: 2, label: "2 - Clear somatic symptoms" }] },
            { displayName: "14. Genital Symptoms (e.g. libido loss)", options: [{ value: 0, label: "0 - Absent" }, { value: 1, label: "1 - Mild" }, { value: 2, label: "2 - Severe" }] },
            { displayName: "15. Hypochondriasis", options: [{ value: 0, label: "0 - Absent" }, { value: 1, label: "1 - Self-absorption" }, { value: 2, label: "2 - Preoccupation with health" }, { value: 3, label: "3 - Frequent complaints" }, { value: 4, label: "4 - Hypochondriacal delusions" }] },
            { displayName: "16. Loss of Weight", options: [{ value: 0, label: "0 - No weight loss" }, { value: 1, label: "1 - Probable loss" }, { value: 2, label: "2 - Definite loss" }] },
            { displayName: "17. Insight", options: [{ value: 0, label: "0 - Acknowledges illness" }, { value: 1, label: "1 - Attributes cause to other sources" }, { value: 2, label: "2 - Denies illness" }] }
        ],
        severityLogic: (score) => {
            if (score <= 7) return "Normal / Euthymia";
            if (score <= 16) return "Mild Depression";
            if (score <= 23) return "Moderate Depression";
            return "Severe Depression";
        }
    });

    // 9. HAM-A
    setupScaleCalculator({
        id: "hama",
        name: "HAM-A (Hamilton Anxiety Rating Scale)",
        note: "Evaluate based on patient symptoms.",
        reference: "Hamilton M. The assessment of anxiety states by rating. Br J Med Psychol. 1959;32:50-55.",
        items: [
            { displayName: "1. Anxious Mood", options: optZeroFourClinical },
            { displayName: "2. Tension", options: optZeroFourClinical },
            { displayName: "3. Fears", options: optZeroFourClinical },
            { displayName: "4. Insomnia", options: optZeroFourClinical },
            { displayName: "5. Intellectual (Cognitive)", options: optZeroFourClinical },
            { displayName: "6. Depressed Mood", options: optZeroFourClinical },
            { displayName: "7. Somatic (Muscular)", options: optZeroFourClinical },
            { displayName: "8. Somatic (Sensory)", options: optZeroFourClinical },
            { displayName: "9. Cardiovascular Symptoms", options: optZeroFourClinical },
            { displayName: "10. Respiratory Symptoms", options: optZeroFourClinical },
            { displayName: "11. Gastrointestinal Symptoms", options: optZeroFourClinical },
            { displayName: "12. Genitourinary Symptoms", options: optZeroFourClinical },
            { displayName: "13. Autonomic Symptoms", options: optZeroFourClinical },
            { displayName: "14. Behavior at Interview", options: optZeroFourClinical }
        ],
        severityLogic: (score) => {
            if (score < 17) return "Mild Anxiety";
            if (score <= 24) return "Moderate Anxiety";
            return "Severe Anxiety";
        }
    });

    // 10. Panic and Agoraphobia Scale
    setupScaleCalculator({
        id: "panic",
        name: "Panic and Agoraphobia Scale (PAS)",
        reference: "Bandelow B. Assessing the efficacy of treatments for panic disorder and agoraphobia. Int Clin Psychopharmacol. 1995;10:33-37.",
        items: [
            { displayName: "1. Frequency of panic attacks", options: optZeroFour },
            { displayName: "2. Severity of panic attacks", options: optZeroFour },
            { displayName: "3. Anticipatory anxiety (frequency)", options: optZeroFour },
            { displayName: "4. Anticipatory anxiety (severity)", options: optZeroFour },
            { displayName: "5. Agoraphobia (avoidance of situations)", options: optZeroFour },
            { displayName: "6. Avoidance of being alone", options: optZeroFour },
            { displayName: "7. Social limitations", options: optZeroFour },
            { displayName: "8. Family relationship limitations", options: optZeroFour },
            { displayName: "9. Employment/work limitations", options: optZeroFour },
            { displayName: "10. Health worries", options: optZeroFour }
        ],
        severityLogic: (score) => {
            if (score <= 8) return "Mild Panic Disorder";
            if (score <= 27) return "Moderate Panic Disorder";
            return "Severe Panic Disorder";
        }
    });

    // 11. Brief Pain Inventory (BPI)
    setupScaleCalculator({
        id: "bpi",
        name: "Brief Pain Inventory (BPI)",
        note: "Evaluate pain severity and interference.",
        reference: "Cleeland CS, Ryan KM. Pain assessment: global use of the Brief Pain Inventory. Ann Acad Med Singapore. 1994;23:129-138.",
        items: [
            { displayName: "1. Pain Severity: Worst pain in last 24 hours (0-10)", options: [{ value: 0, label: "0 - No pain" }, { value: 3, label: "3 - Mild" }, { value: 6, label: "6 - Moderate" }, { value: 10, label: "10 - Worst imaginable" }] },
            { displayName: "2. Pain Severity: Least pain in last 24 hours (0-10)", options: [{ value: 0, label: "0 - No pain" }, { value: 3, label: "3 - Mild" }, { value: 6, label: "6 - Moderate" }, { value: 10, label: "10 - Worst imaginable" }] },
            { displayName: "3. Pain Severity: Pain on average (0-10)", options: [{ value: 0, label: "0 - No pain" }, { value: 3, label: "3 - Mild" }, { value: 6, label: "6 - Moderate" }, { value: 10, label: "10 - Worst imaginable" }] },
            { displayName: "4. Pain Severity: Pain right now (0-10)", options: [{ value: 0, label: "0 - No pain" }, { value: 3, label: "3 - Mild" }, { value: 6, label: "6 - Moderate" }, { value: 10, label: "10 - Worst imaginable" }] },
            { displayName: "5. Pain Interference: General Activity (0-10)", options: [{ value: 0, label: "0 - Does not interfere" }, { value: 5, label: "5 - Moderately" }, { value: 10, label: "10 - Completely interferes" }] },
            { displayName: "6. Pain Interference: Mood (0-10)", options: [{ value: 0, label: "0 - Does not interfere" }, { value: 5, label: "5 - Moderately" }, { value: 10, label: "10 - Completely interferes" }] },
            { displayName: "7. Pain Interference: Relations with other people (0-10)", options: [{ value: 0, label: "0 - Does not interfere" }, { value: 5, label: "5 - Moderately" }, { value: 10, label: "10 - Completely interferes" }] },
            { displayName: "8. Pain Interference: Sleep (0-10)", options: [{ value: 0, label: "0 - Does not interfere" }, { value: 5, label: "5 - Moderately" }, { value: 10, label: "10 - Completely interferes" }] },
            { displayName: "9. Pain Interference: Enjoyment of Life (0-10)", options: [{ value: 0, label: "0 - Does not interfere" }, { value: 5, label: "5 - Moderately" }, { value: 10, label: "10 - Completely interferes" }] }
        ],
        severityLogic: (score) => {
            const avg = score / 9;
            return `Avg score: ${avg.toFixed(2)}/10 (${avg >= 5 ? "Significant clinical impairment" : "Mild impairment"})`;
        }
    });

    // 12. BFCRS (Catatonia)
    setupScaleCalculator({
        id: "bfcrs",
        name: "Bush-Francis Catatonia Rating Scale (BFCRS)",
        note: "A screening score of 2 or more indicates probable Catatonia.",
        reference: "Bush G, Fink M, Petrides G, et al. Catatonia. I. Rating scale and standardized examination. Acta Psychiatr Scand. 1996;93(2):129-136.",
        items: [
            { displayName: "1. Immobility/Stupor", options: [{ value: 0, label: "0 (Absent)" }, { value: 1, label: "1 (Mild)" }, { value: 2, label: "2 (Moderate)" }, { value: 3, label: "3 (Severe)" }] },
            { displayName: "2. Mutism", options: [{ value: 0, label: "0 (Absent)" }, { value: 1, label: "1 (Mild)" }, { value: 2, label: "2 (Moderate)" }, { value: 3, label: "3 (Severe)" }] },
            { displayName: "3. Staring", options: [{ value: 0, label: "0 (Absent)" }, { value: 1, label: "1 (Mild)" }, { value: 2, label: "2 (Moderate)" }, { value: 3, label: "3 (Severe)" }] },
            { displayName: "4. Posturing/Catalepsy", options: [{ value: 0, label: "0 (Absent)" }, { value: 1, label: "1 (Mild)" }, { value: 2, label: "2 (Moderate)" }, { value: 3, label: "3 (Severe)" }] },
            { displayName: "5. Grimacing", options: [{ value: 0, label: "0 (Absent)" }, { value: 1, label: "1 (Mild)" }, { value: 2, label: "2 (Moderate)" }, { value: 3, label: "3 (Severe)" }] },
            { displayName: "6. Echophenomena", options: [{ value: 0, label: "0 (Absent)" }, { value: 1, label: "1 (Mild)" }, { value: 2, label: "2 (Moderate)" }, { value: 3, label: "3 (Severe)" }] },
            { displayName: "7. Stereotypy", options: [{ value: 0, label: "0 (Absent)" }, { value: 1, label: "1 (Mild)" }, { value: 2, label: "2 (Moderate)" }, { value: 3, label: "3 (Severe)" }] },
            { displayName: "8. Mannerisms", options: [{ value: 0, label: "0 (Absent)" }, { value: 1, label: "1 (Mild)" }, { value: 2, label: "2 (Moderate)" }, { value: 3, label: "3 (Severe)" }] },
            { displayName: "9. Verbigeration", options: [{ value: 0, label: "0 (Absent)" }, { value: 1, label: "1 (Mild)" }, { value: 2, label: "2 (Moderate)" }, { value: 3, label: "3 (Severe)" }] },
            { displayName: "10. Rigidity", options: [{ value: 0, label: "0 (Absent)" }, { value: 1, label: "1 (Mild)" }, { value: 2, label: "2 (Moderate)" }, { value: 3, label: "3 (Severe)" }] },
            { displayName: "11. Negativism", options: [{ value: 0, label: "0 (Absent)" }, { value: 1, label: "1 (Mild)" }, { value: 2, label: "2 (Moderate)" }, { value: 3, label: "3 (Severe)" }] },
            { displayName: "12. Waxy Flexibility", options: [{ value: 0, label: "0 (Absent)" }, { value: 1, label: "1 (Mild)" }, { value: 2, label: "2 (Moderate)" }, { value: 3, label: "3 (Severe)" }] },
            { displayName: "13. Withdrawal", options: [{ value: 0, label: "0 (Absent)" }, { value: 1, label: "1 (Mild)" }, { value: 2, label: "2 (Moderate)" }, { value: 3, label: "3 (Severe)" }] },
            { displayName: "14. Excitement", options: [{ value: 0, label: "0 (Absent)" }, { value: 1, label: "1 (Mild)" }, { value: 2, label: "2 (Moderate)" }, { value: 3, label: "3 (Severe)" }] }
        ],
        severityLogic: (score) => {
            if (score >= 2) return "POSITIVE SCREEN for Catatonia (Further full rating advised)";
            return "Negative Screen";
        }
    });

    // 13. BPRS
    setupScaleCalculator({
        id: "bprs",
        name: "Brief Psychiatric Rating Scale (BPRS)",
        reference: "Overall JE, Gorham DR. The Brief Psychiatric Rating Scale. Psychol Rep. 1962;10:799-812.",
        items: [
            { displayName: "1. Somatic Concern", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] },
            { displayName: "2. Anxiety", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] },
            { displayName: "3. Depression", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] },
            { displayName: "4. Suicidality", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] },
            { displayName: "5. Guilt", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] },
            { displayName: "6. Hostility", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] },
            { displayName: "7. Elated Mood", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] },
            { displayName: "8. Grandiosity", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] },
            { displayName: "9. Suspiciousness", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] },
            { displayName: "10. Hallucinations", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] },
            { displayName: "11. Unusual Thought Content", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] },
            { displayName: "12. Bizarre Behavior", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] },
            { displayName: "13. Self-Neglect", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] },
            { displayName: "14. Disorientation", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] },
            { displayName: "15. Conceptual Disorganization", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] },
            { displayName: "16. Blunted Affect", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] },
            { displayName: "17. Emotional Withdrawal", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] },
            { displayName: "18. Motor Retardation", options: [{ value: 1, label: "1 - Not present" }, { value: 2, label: "2 - Very Mild" }, { value: 3, label: "3 - Mild" }, { value: 4, label: "4 - Moderate" }, { value: 5, label: "5 - Mod. Severe" }, { value: 6, label: "6 - Severe" }, { value: 7, label: "7 - Ext. Severe" }] }
        ],
        severityLogic: (score) => {
            return `Total score: ${score} (Scores range from 18 to 126)`;
        }
    });

    // 14. PANSS
    setupScaleCalculator({
        id: "panss",
        name: "Positive and Negative Syndrome Scale (PANSS)",
        note: "Evaluate severity of schizophrenia symptoms.",
        reference: "Kay SR, Fiszbein A, Opler LA. The Positive and Negative Syndrome Scale (PANSS) for schizophrenia. Schizophr Bull. 1987;13(2):261-276.",
        items: [
            { displayName: "P1: Delusions", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "P2: Conceptual Disorganization", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "P3: Hallucinatory Behavior", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "P4: Excitement", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "P5: Grandiosity", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "P6: Suspiciousness/Persecution", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "P7: Hostility", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "N1: Blunted Affect", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "N2: Emotional Withdrawal", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "N3: Poor Rapport", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "N4: Passive/Apathetic Social Withdrawal", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "N5: Difficulty in Abstract Thinking", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "N6: Lack of Spontaneity & Flow of Conversation", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "N7: Stereotyped Thinking", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "G1: Somatic Concern", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "G2: Anxiety", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "G3: Guilt Feelings", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "G4: Tension", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "G5: Mannerisms & Posturing", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "G6: Depression", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "G7: Motor Retardation", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "G8: Uncooperativeness", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "G9: Unusual Thought Content", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "G10: Disorientation", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "G11: Poor Attention", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "G12: Lack of Judgment & Insight", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "G13: Disturbance of Volition", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "G14: Poor Impulse Control", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "G15: Preoccupation", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] },
            { displayName: "G16: Active Social Avoidance", options: [{ value: 1, label: "1 (Absent)" }, { value: 2, label: "2 (Minimal)" }, { value: 3, label: "3 (Mild)" }, { value: 4, label: "4 (Moderate)" }, { value: 5, label: "5 (Moderate Severe)" }, { value: 6, label: "6 (Severe)" }, { value: 7, label: "7 (Extreme)" }] }
        ],
        severityLogic: (score) => {
            return `Total PANSS Score: ${score} (Min: 30, Max: 210)`;
        }
    });

    // 15. AIMS
    setupScaleCalculator({
        id: "aims",
        name: "Abnormal Involuntary Movement Scale (AIMS)",
        note: "Used to detect Tardive Dyskinesia.",
        reference: "Guy W. ECDEU Assessment Manual for Psychopharmacology. US Dept Health, Education, and Welfare. 1976.",
        items: [
            { displayName: "1. Muscles of Facial Expression (e.g., movements of forehead, eyebrows, periorbital area, cheeks)", options: optZeroFourClinical },
            { displayName: "2. Lips and Perioral Area (e.g., puckering, pouting, smacking)", options: optZeroFourClinical },
            { displayName: "3. Jaw (e.g., biting, clenching, chewing, mouth opening, lateral movements)", options: optZeroFourClinical },
            { displayName: "4. Tongue (Rate only protrusion and movements at rest)", options: optZeroFourClinical },
            { displayName: "5. Upper Extremities (e.g., choreic or athetoid movements of arms, wrists, hands, fingers)", options: optZeroFourClinical },
            { displayName: "6. Lower Extremities (e.g., lateral knee movement, foot tapping, inversion/eversion of foot)", options: optZeroFourClinical },
            { displayName: "7. Trunk (e.g., rocking, twisting, squirming, pelvic thrusts)", options: optZeroFourClinical }
        ],
        severityLogic: (score) => {
            if (score >= 2) return "Alert: Suggests potential Tardive Dyskinesia (score >= 2). Clinician review indicated.";
            return "Minimal abnormal movements detected";
        }
    });

    // 16. AUDIT
    setupScaleCalculator({
        id: "audit",
        name: "AUDIT (Alcohol Use Disorders Identification Test)",
        reference: "Saunders JB, Aasland OG, Babor TF, et al. Development of the Alcohol Use Disorders Identification Test (AUDIT): WHO Collaborative Project. Drug Alcohol Depend. 1993;33(3):209-229.",
        items: [
            { displayName: "1. How often do you have a drink containing alcohol?", options: [{ value: 0, label: "0 - Never" }, { value: 1, label: "1 - Monthly or less" }, { value: 2, label: "2 - 2-4 times a month" }, { value: 3, label: "3 - 2-3 times a week" }, { value: 4, label: "4 - 4+ times a week" }] },
            { displayName: "2. How many standard drinks do you have on a typical day when you are drinking?", options: [{ value: 0, label: "0 - 1 or 2" }, { value: 1, label: "1 - 3 or 4" }, { value: 2, label: "2 - 5 or 6" }, { value: 3, label: "3 - 7 to 9" }, { value: 4, label: "4 - 10+" }] },
            { displayName: "3. How often do you have six or more drinks on one occasion?", options: [{ value: 0, label: "0 - Never" }, { value: 1, label: "1 - Less than monthly" }, { value: 2, label: "2 - Monthly" }, { value: 3, label: "3 - Weekly" }, { value: 4, label: "4 - Daily or almost daily" }] },
            { displayName: "4. How often during the last year have you found that you were not able to stop drinking once you had started?", options: [{ value: 0, label: "0 - Never" }, { value: 1, label: "1 - Less than monthly" }, { value: 2, label: "2 - Monthly" }, { value: 3, label: "3 - Weekly" }, { value: 4, label: "4 - Daily or almost daily" }] },
            { displayName: "5. How often during the last year have you failed to do what was normally expected from you because of drinking?", options: [{ value: 0, label: "0 - Never" }, { value: 1, label: "1 - Less than monthly" }, { value: 2, label: "2 - Monthly" }, { value: 3, label: "3 - Weekly" }, { value: 4, label: "4 - Daily or almost daily" }] },
            { displayName: "6. How often during the last year have you needed a first drink in the morning to get yourself going after a heavy drinking session?", options: [{ value: 0, label: "0 - Never" }, { value: 1, label: "1 - Less than monthly" }, { value: 2, label: "2 - Monthly" }, { value: 3, label: "3 - Weekly" }, { value: 4, label: "4 - Daily or almost daily" }] },
            { displayName: "7. How often during the last year have you had a feeling of guilt or remorse after drinking?", options: [{ value: 0, label: "0 - Never" }, { value: 1, label: "1 - Less than monthly" }, { value: 2, label: "2 - Monthly" }, { value: 3, label: "3 - Weekly" }, { value: 4, label: "4 - Daily or almost daily" }] },
            { displayName: "8. How often during the last year have you been unable to remember what happened the night before because you had been drinking?", options: [{ value: 0, label: "0 - Never" }, { value: 1, label: "1 - Less than monthly" }, { value: 2, label: "2 - Monthly" }, { value: 3, label: "3 - Weekly" }, { value: 4, label: "4 - Daily or almost daily" }] },
            { displayName: "9. Have you or someone else been injured as a result of your drinking?", options: [{ value: 0, label: "0 - No" }, { value: 2, label: "2 - Yes, but not in the last year" }, { value: 4, label: "4 - Yes, during the last year" }] },
            { displayName: "10. Has a relative or friend, doctor or other health worker been concerned about your drinking or suggested you cut down?", options: [{ value: 0, label: "0 - No" }, { value: 2, label: "2 - Yes, but not in the last year" }, { value: 4, label: "4 - Yes, during the last year" }] }
        ],
        severityLogic: (score) => {
            if (score >= 8) return "Hazardous or harmful alcohol consumption pattern (score >= 8)";
            return "Low risk consumption pattern";
        }
    });

    // 17. DAST-10
    setupScaleCalculator({
        id: "dast10",
        name: "DAST-10 (Drug Abuse Screening Test)",
        note: "Scoring: 1 point for each 'Yes' response, except Question 3 where 'No' receives 1 point.",
        reference: "Skinner HA. The Drug Abuse Screening Test. Addict Behav. 1982;7(4):363-371.",
        items: [
            { displayName: "1. Have you used drugs other than those required for medical reasons?", options: optYesNo },
            { displayName: "2. Do you abuse more than one drug?", options: optYesNo },
            { displayName: "3. Are you always able to stop using drugs when you want to?", options: [{ value: 1, label: "No (Significant)" }, { value: 0, label: "Yes" }] },
            { displayName: "4. Have you had blackouts or flashbacks as a result of drug use?", options: optYesNo },
            { displayName: "5. Do you ever feel bad or guilty about your drug use?", options: optYesNo },
            { displayName: "6. Does your spouse (or parents) ever complain about your drug involvement?", options: optYesNo },
            { displayName: "7. Have you neglected your family because of your use of drugs?", options: optYesNo },
            { displayName: "8. Have you engaged in illegal activities in order to obtain drugs?", options: optYesNo },
            { displayName: "9. Have you ever experienced withdrawal symptoms (felt sick) when you stopped taking drugs?", options: optYesNo },
            { displayName: "10. Have you had medical problems as a result of your drug use?", options: optYesNo }
        ],
        severityLogic: (score) => {
            if (score === 0) return "No problems reported";
            if (score <= 2) return "Low Level drug involvement";
            if (score <= 5) return "Moderate Level drug involvement";
            if (score <= 8) return "Substantial Level drug involvement";
            return "Severe Level drug involvement";
        }
    });

    // 18. CUDIT-R
    setupScaleCalculator({
        id: "cuditr",
        name: "CUDIT-R (Cannabis Use Disorders Identification Test - Revised)",
        reference: "Adamson SJ, Kay-Lambkin FJ, Baker AL, et al. An improved brief measure of cannabis use disorder: the CUDIT-R. Drug Alcohol Depend. 2010;110(1-2):137-143.",
        items: [
            { displayName: "1. How often do you use cannabis?", options: [{ value: 0, label: "0 - Never" }, { value: 1, label: "1 - Monthly or less" }, { value: 2, label: "2 - 2-4 times a month" }, { value: 3, label: "3 - 2-3 times per week" }, { value: 4, label: "4 - 4+ times a week" }] },
            { displayName: "2. How many hours were you 'stoned' on a typical day when you were using cannabis?", options: [{ value: 0, label: "0 - Less than 1" }, { value: 1, label: "1 - 1 or 2" }, { value: 2, label: "2 - 3 or 4" }, { value: 3, label: "3 - 5 or 6" }, { value: 4, label: "4 - 7 or more" }] },
            { displayName: "3. How often during the past 6 months have you found that you were not able to stop using cannabis once you had started?", options: [{ value: 0, label: "0 - Never" }, { value: 1, label: "1 - Less than monthly" }, { value: 2, label: "2 - Monthly" }, { value: 3, label: "3 - Weekly" }, { value: 4, label: "4 - Daily or almost daily" }] },
            { displayName: "4. How often during the past 6 months have you failed to do what was normally expected of you because of your use of cannabis?", options: [{ value: 0, label: "0 - Never" }, { value: 1, label: "1 - Less than monthly" }, { value: 2, label: "2 - Monthly" }, { value: 3, label: "3 - Weekly" }, { value: 4, label: "4 - Daily or almost daily" }] },
            { displayName: "5. How often during the past 6 months have you devoted a great deal of your time to obtaining, using, or recovering from cannabis?", options: [{ value: 0, label: "0 - Never" }, { value: 1, label: "1 - Less than monthly" }, { value: 2, label: "2 - Monthly" }, { value: 3, label: "3 - Weekly" }, { value: 4, label: "4 - Daily or almost daily" }] },
            { displayName: "6. How often during the past 6 months have you had a problem with your health, social life, finances, or work/study as a result of your cannabis use?", options: [{ value: 0, label: "0 - Never" }, { value: 1, label: "1 - Less than monthly" }, { value: 2, label: "2 - Monthly" }, { value: 3, label: "3 - Weekly" }, { value: 4, label: "4 - Daily or almost daily" }] },
            { displayName: "7. Has a relative, friend, doctor, or other health worker been concerned about your cannabis use or suggested you cut down?", options: [{ value: 0, label: "0 - Never" }, { value: 1, label: "1 - Less than monthly" }, { value: 2, label: "2 - Monthly" }, { value: 3, label: "3 - Weekly" }, { value: 4, label: "4 - Daily or almost daily" }] },
            { displayName: "8. How often have you been told you have tolerance to cannabis, OR, how often have you had to use a lot more cannabis to get the same effect?", options: [{ value: 0, label: "0 - Never" }, { value: 1, label: "1 - Less than monthly" }, { value: 2, label: "2 - Monthly" }, { value: 3, label: "3 - Weekly" }, { value: 4, label: "4 - Daily or almost daily" }] }
        ],
        severityLogic: (score) => {
            if (score >= 8) return "Possible Cannabis Use Disorder / Hazardous cannabis use pattern";
            return "Low risk consumption pattern";
        }
    });

    // 19. PGSI
    setupScaleCalculator({
        id: "pgsi",
        name: "PGSI (Problem Gambling Severity Index)",
        reference: "Ferris J, Wynne H. The Canadian Problem Gambling Index: Final Report. Canadian Consortium for Gambling Research. 2001.",
        items: [
            { displayName: "1. Have you bet more than you could afford to lose?", options: [{ value: 0, label: "0 - Never" }, { value: 1, label: "1 - Sometimes" }, { value: 2, label: "2 - Most of the time" }, { value: 3, label: "3 - Almost always" }] },
            { displayName: "2. Have you needed to gamble with larger amounts of money to get the same feeling of excitement?", options: [{ value: 0, label: "0 - Never" }, { value: 1, label: "1 - Sometimes" }, { value: 2, label: "2 - Most of the time" }, { value: 3, label: "3 - Almost always" }] },
            { displayName: "3. Have you gone back another day to try to win back the money you lost?", options: [{ value: 0, label: "0 - Never" }, { value: 1, label: "1 - Sometimes" }, { value: 2, label: "2 - Most of the time" }, { value: 3, label: "3 - Almost always" }] }
        ],
        severityLogic: (score) => {
            if (score === 0) return "Non-problem gambler";
            if (score <= 2) return "Low level of problems / Low risk";
            if (score <= 7) return "Moderate level of problems / Moderate risk";
            return "Problem gambler (score >= 8)";
        }
    });

    // 20. MoCA
    setupScaleCalculator({
        id: "moca",
        name: "Montreal Cognitive Assessment (MoCA Subset)",
        note: "Evaluate cognitive domains. Total score max 30.",
        reference: "Nasreddine ZS, Phillips NA, Bedirian V, et al. The Montreal Cognitive Assessment, MoCA: a brief screening tool for mild cognitive impairment. J Am Geriatr Soc. 2005;53(4):695-699.",
        items: [
            { displayName: "1. Visuospatial / Executive (Trail, Cube, Clock)", options: [{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }, { value: 5, label: "5" }] },
            { displayName: "2. Naming (Lion, Rhino, Camel)", options: [{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }] },
            { displayName: "3. Attention (Digit span, Vigilance, Serial 7s)", options: [{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }, { value: 5, label: "5" }, { value: 6, label: "6" }] },
            { displayName: "4. Language (Repetition, Fluency)", options: [{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }] },
            { displayName: "5. Abstraction (Similarity)", options: [{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }] },
            { displayName: "6. Delayed Recall (Short-term memory)", options: [{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }, { value: 5, label: "5" }] },
            { displayName: "7. Orientation (Time, Place)", options: [{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }, { value: 5, label: "5" }, { value: 6, label: "6" }] },
            { displayName: "8. Education Adjustment (<= 12 years formal education)", options: [{ value: 0, label: "0 - No" }, { value: 1, label: "1 - Yes (+1 point)" }] }
        ],
        severityLogic: (score) => {
            if (score > 30) score = 30; // Max score is 30
            let interp = "Severe Cognitive Impairment";
            if (score >= 26) interp = "Normal Cognitive Function";
            else if (score >= 18) interp = "Mild Cognitive Impairment (MCI)";
            else if (score >= 10) interp = "Moderate Cognitive Impairment";
            return `Total MoCA Score: ${score} / 30\nInterpretation: ${interp}`;
        }
    });

    // 21. MMSE
    setupScaleCalculator({
        id: "mmse",
        name: "Mini-Mental State Examination (MMSE Subset)",
        reference: "Folstein MF, Folstein SE, McHugh PR. 'Mini-mental state'. A practical method for grading the cognitive state of patients for the clinician. J Psychiatr Res. 1975;12(3):189-198.",
        items: [
            { displayName: "1. Orientation to Time (Year, Season, Month, Date, Day)", options: [{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }, { value: 5, label: "5" }] },
            { displayName: "2. Orientation to Place (State, County, Town, Hospital, Floor)", options: [{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }, { value: 5, label: "5" }] },
            { displayName: "3. Registration (Naming 3 objects)", options: [{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }] },
            { displayName: "4. Attention and Calculation (Serial 7s backward OR WORLD backward)", options: [{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }, { value: 5, label: "5" }] },
            { displayName: "5. Recall (Name 3 objects from step 3)", options: [{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }] },
            { displayName: "6. Language (Naming, Repetition, 3-stage command, Reading, Writing, Copying)", options: [{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }, { value: 5, label: "5" }, { value: 6, label: "6" }, { value: 7, label: "7" }, { value: 8, label: "8" }, { value: 9, label: "9" }] }
        ],
        severityLogic: (score) => {
            let interp = "Severe cognitive impairment";
            if (score >= 24) interp = "No cognitive impairment";
            else if (score >= 18) interp = "Mild cognitive impairment";
            else if (score >= 10) interp = "Moderate cognitive impairment";
            return `Total MMSE Score: ${score} / 30\nInterpretation: ${interp}`;
        }
    });

    // 22. FAB
    setupScaleCalculator({
        id: "fab",
        name: "Frontal Assessment Battery (FAB)",
        note: "Measures executive fronto-striatal function.",
        reference: "Dubois B, Slachevsky A, Litvan I, et al. The FAB: a Frontal Assessment Battery at bedside. Neurology. 2000;55(11):1621-1626.",
        items: [
            { displayName: "1. Similarities (Conceptualization)", options: [{ value: 0, label: "0 - 0 correct" }, { value: 1, label: "1 - 1 correct" }, { value: 2, label: "2 - 2 correct" }, { value: 3, label: "3 - 3 correct" }] },
            { displayName: "2. Lexical Fluency (Mental Flexibility)", options: [{ value: 0, label: "0 - < 3 words" }, { value: 1, label: "1 - 3 to 5 words" }, { value: 2, label: "2 - 6 to 9 words" }, { value: 3, label: "3 - > 9 words" }] },
            { displayName: "3. Motor Series (Luria's Test)", options: [{ value: 0, label: "0 - Unable" }, { value: 1, label: "1 - Needs prompting" }, { value: 2, label: "2 - Correctly performs >3 series" }, { value: 3, label: "3 - Correctly performs 6 series" }] },
            { displayName: "4. Conflicting Instructions", options: [{ value: 0, label: "0 - > 2 errors" }, { value: 1, label: "1 - 2 errors" }, { value: 2, label: "2 - 1 error" }, { value: 3, label: "3 - 0 errors" }] },
            { displayName: "5. Go-No Go", options: [{ value: 0, label: "0 - > 2 errors" }, { value: 1, label: "1 - 2 errors" }, { value: 2, label: "2 - 1 error" }, { value: 3, label: "3 - 0 errors" }] },
            { displayName: "6. Prehension Behavior", options: [{ value: 0, label: "0 - Takes hands" }, { value: 1, label: "1 - Hesitates then takes" }, { value: 2, label: "2 - Hesitates, no take" }, { value: 3, label: "3 - Does not take hands" }] }
        ],
        severityLogic: (score) => {
            return `Total FAB Score: ${score}/18\n` + (score < 11 ? "Interpretation: Score is suggestive of frontal lobe dysfunction." : "Interpretation: Score is not suggestive of frontal lobe dysfunction.");
        }
    });

    // 23. BPD Screen
    setupScaleCalculator({
        id: "bpd",
        name: "BPD Screening Tool (MSI-BPD)",
        note: "Yes/No screening for Borderline Personality Disorder features.",
        reference: "Zanarini MC, Vujanovic AA, Parachini EA, et al. A screening measure for BPD: the McLean Screening Instrument for Borderline Personality Disorder (MSI-BPD). J Personal Disord. 2003;17(6):568-573.",
        items: [
            { displayName: "1. Have you often been impulsive in areas like spending, sex, substance use, driving, or eating?", options: optYesNo },
            { displayName: "2. Have you often had unstable and intense relationships?", options: optYesNo },
            { displayName: "3. Have you often felt empty?", options: optYesNo },
            { displayName: "4. Have you often had a hard time controlling your anger?", options: optYesNo },
            { displayName: "5. Have you often been terrified of being abandoned?", options: optYesNo },
            { displayName: "6. Have you often felt that your sense of self or identity was unstable?", options: optYesNo },
            { displayName: "7. Have you often had suicidal thoughts, gestures, or attempts, or have you mutilated yourself?", options: optYesNo },
            { displayName: "8. Have you often had brief periods of feeling unreal, paranoid, or spaced out?", options: optYesNo },
            { displayName: "9. Have you often had dramatic mood swings?", options: optYesNo },
            { displayName: "10. Have you often felt that people were persecuting you?", options: optYesNo }
        ],
        severityLogic: (score) => {
            if (score >= 3) return "POSITIVE BPD SCREEN indicators present (further diagnostic check advised)";
            return "Negative Screen";
        }
    });

    // 24. PCL-R
    setupScaleCalculator({
        id: "pclr",
        name: "Psychopathy Checklist - Revised (PCL-R)",
        note: "Evaluate psychopathic traits.",
        reference: "Hare RD. The Hare Psychopathy Checklist-Revised. Multi-Health Systems. 1991.",
        items: [
            { displayName: "1. Glibness/Superficial Charm", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "2. Grandiose Sense of Self-Worth", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "3. Need for Stimulation", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "4. Pathological Lying", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "5. Conning/Manipulative", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "6. Lack of Remorse or Guilt", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "7. Shallow Affect", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "8. Callous/Lack of Empathy", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "9. Parasitic Lifestyle", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "10. Poor Behavioral Controls", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "11. Promiscuous Sexual Behavior", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "12. Early Behavior Problems", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "13. Lack of Realistic, Long-Term Goals", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "14. Impulsivity", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "15. Irresponsibility", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "16. Failure to Accept Responsibility", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "17. Many Short-Term Marital Relationships", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "18. Juvenile Delinquency", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "19. Revocation of Conditional Release", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] },
            { displayName: "20. Criminal Versatility", options: [{ value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" }] }
        ],
        severityLogic: (score) => {
            return `Total PCL-R Score: ${score} / 40`;
        }
    });

    // 25. AQ-10
    setupScaleCalculator({
        id: "aq10",
        name: "Autism Spectrum Quotient (AQ-10)",
        note: "Diagnostic referral screen for adult autism.",
        reference: "Allison C, Auyeung B, Baron-Cohen S. A user guide to the AQ-10. J Am Acad Child Adolesc Psychiatry. 2012;51(2):202-212.",
        items: [
            { displayName: "1. I often notice small sounds when others do not.", options: [{ value: 1, label: "Definitely Agree" }, { value: 1, label: "Slightly Agree" }, { value: 0, label: "Slightly Disagree" }, { value: 0, label: "Definitely Disagree" }] },
            { displayName: "2. I usually concentrate more on the whole picture, rather than the small details.", options: [{ value: 0, label: "Definitely Agree" }, { value: 0, label: "Slightly Agree" }, { value: 1, label: "Slightly Disagree" }, { value: 1, label: "Definitely Disagree" }] },
            { displayName: "3. I find it easy to do more than one thing at once.", options: [{ value: 0, label: "Definitely Agree" }, { value: 0, label: "Slightly Agree" }, { value: 1, label: "Slightly Disagree" }, { value: 1, label: "Definitely Disagree" }] },
            { displayName: "4. If there is an interruption, I can switch back to what I was doing very quickly.", options: [{ value: 0, label: "Definitely Agree" }, { value: 0, label: "Slightly Agree" }, { value: 1, label: "Slightly Disagree" }, { value: 1, label: "Definitely Disagree" }] },
            { displayName: "5. I find it easy to 'read between the lines' when someone is talking to me.", options: [{ value: 0, label: "Definitely Agree" }, { value: 0, label: "Slightly Agree" }, { value: 1, label: "Slightly Disagree" }, { value: 1, label: "Definitely Disagree" }] },
            { displayName: "6. I know how to tell if someone listening to me is getting bored.", options: [{ value: 0, label: "Definitely Agree" }, { value: 0, label: "Slightly Agree" }, { value: 1, label: "Slightly Disagree" }, { value: 1, label: "Definitely Disagree" }] },
            { displayName: "7. When I'm reading a story, I find it difficult to work out the characters' intentions.", options: [{ value: 1, label: "Definitely Agree" }, { value: 1, label: "Slightly Agree" }, { value: 0, label: "Slightly Disagree" }, { value: 0, label: "Definitely Disagree" }] },
            { displayName: "8. I like to collect information about categories of things.", options: [{ value: 1, label: "Definitely Agree" }, { value: 1, label: "Slightly Agree" }, { value: 0, label: "Slightly Disagree" }, { value: 0, label: "Definitely Disagree" }] },
            { displayName: "9. I find it easy to work out what someone is thinking or feeling just by looking at their face.", options: [{ value: 0, label: "Definitely Agree" }, { value: 0, label: "Slightly Agree" }, { value: 1, label: "Slightly Disagree" }, { value: 1, label: "Definitely Disagree" }] },
            { displayName: "10. I find it difficult to work out people's intentions.", options: [{ value: 1, label: "Definitely Agree" }, { value: 1, label: "Slightly Agree" }, { value: 0, label: "Slightly Disagree" }, { value: 0, label: "Definitely Disagree" }] }
        ],
        severityLogic: (score) => {
            if (score >= 6) return `Score: ${score}/10 - Suggests referral for formal autism spectrum assessment (score >= 6)`;
            return `Score: ${score}/10 - Below referral threshold`;
        }
    });

    // 26. SAPAS
    setupScaleCalculator({
        id: "sapas",
        name: "SAPAS (Standardised Assessment of Personality - Abbreviated)",
        note: "Screening tool for personality disorders.",
        reference: "Moran P, Leese M, Lee T, et al. Standardised Assessment of Personality - Abbreviated Scale (SAPAS). Br J Psychiatry. 2003;183:228-232.",
        items: [
            { displayName: "1. In general, do you have difficulty making and keeping friends?", options: [{ value: 0, label: "No (0)" }, { value: 1, label: "Yes (1)" }] },
            { displayName: "2. Would you normally describe yourself as a loner?", options: [{ value: 0, label: "No (0)" }, { value: 1, label: "Yes (1)" }] },
            { displayName: "3. In general, do you trust other people?", options: [{ value: 1, label: "No (1)" }, { value: 0, label: "Yes (0)" }] },
            { displayName: "4. Do you normally get into arguments or fights?", options: [{ value: 0, label: "No (0)" }, { value: 1, label: "Yes (1)" }] },
            { displayName: "5. Do you often feel that you have to be the life of the party?", options: [{ value: 0, label: "No (0)" }, { value: 1, label: "Yes (1)" }] },
            { displayName: "6. Do you generally do things on the spur of the moment?", options: [{ value: 0, label: "No (0)" }, { value: 1, label: "Yes (1)" }] },
            { displayName: "7. Do you often worry about things that other people may be thinking of you?", options: [{ value: 0, label: "No (0)" }, { value: 1, label: "Yes (1)" }] },
            { displayName: "8. Is it your practice to keep on good terms with everyone?", options: [{ value: 1, label: "No (1)" }, { value: 0, label: "Yes (0)" }] }
        ],
        severityLogic: (score) => {
            if (score >= 3) return `Score: ${score}/8 - Suggests potential personality dysfunction. Further assessment recommended.`;
            return `Score: ${score}/8 - Below typical clinical threshold`;
        }
    });

    // 27. C-SSRS
    setupScaleCalculator({
        id: "cssrs",
        name: "C-SSRS (Columbia Suicide Severity Rating Scale)",
        note: "Suicide ideation and behavior screening tool.",
        reference: "Posner K, Brown GK, Stanley B, et al. The Columbia-Suicide Severity Rating Scale: initial validity and internal consistency. Am J Psychiatry. 2011;168(12):1266-1277.",
        items: [
            { displayName: "1. Wish to be Dead (Have you wished you were dead or could go to sleep and not wake up?)", options: optYesNo },
            { displayName: "2. Non-Specific Active Suicidal Thoughts", options: optYesNo },
            { displayName: "3. Active Suicidal Ideation with any Methods (not plan)", options: optYesNo },
            { displayName: "4. Active Suicidal Ideation with Some Intent to Act", options: optYesNo },
            { displayName: "5. Active Suicidal Ideation with Specific Plan and Intent", options: optYesNo },
            { displayName: "6. Suicidal Behavior (Have you ever done anything, started to do anything, or prepared to do anything to end your life?)", options: optYesNo }
        ],
        severityLogic: (score, itemsContainer) => {
            const hasIdeation = [1, 2, 3, 4, 5].some(idx => {
                const radio = itemsContainer.querySelector(`input[name="cssrs-q-${idx}"]:checked`);
                return radio && parseInt(radio.value, 10) === 1;
            });
            const hasBehavior = itemsContainer.querySelector(`input[name="cssrs-q-5"]:checked`);
            const hasBehValue = hasBehavior && parseInt(hasBehavior.value, 10) === 1;

            if (hasBehValue || (itemsContainer.querySelector(`input[name="cssrs-q-4"]:checked`) && parseInt(itemsContainer.querySelector(`input[name="cssrs-q-4"]:checked`).value, 10) === 1)) {
                return "HIGH RISK (Positive suicidal screen. Immediate psychiatric evaluation/intervention required)";
            }
            if (hasIdeation) {
                return "Moderate Risk (Safety plan required)";
            }
            return "Low Risk screen";
        }
    });

    // 28. PSQI
    setupScaleCalculator({
        id: "psqi",
        name: "PSQI (Pittsburgh Sleep Quality Index Subset)",
        reference: "Buysse DJ, Reynolds CF, Monk TH, et al. The Pittsburgh Sleep Quality Index: a new instrument for psychiatric practice and research. Psychiatry Res. 1989;28(2):193-213.",
        items: [
            { displayName: "1. Subjective sleep quality", options: [{ value: 0, label: "0 - Very Good" }, { value: 1, label: "1 - Fairly Good" }, { value: 2, label: "2 - Fairly Bad" }, { value: 3, label: "3 - Very Bad" }] },
            { displayName: "2. Sleep latency (trouble falling asleep within 30 min)", options: [{ value: 0, label: "0 - Not during past month" }, { value: 1, label: "1 - Less than once a week" }, { value: 2, label: "2 - Once or twice a week" }, { value: 3, label: "3 - Three or more times a week" }] },
            { displayName: "3. Sleep duration (hours of sleep)", options: [{ value: 0, label: "0 - > 7 hours" }, { value: 1, label: "1 - 6-7 hours" }, { value: 2, label: "2 - 5-6 hours" }, { value: 3, label: "3 - < 5 hours" }] }
        ],
        severityLogic: (score) => {
            if (score >= 5) return "Poor sleep quality suggested (Score >= 5)";
            return "Good sleep quality";
        }
    });

    // 29. BIS-11
    setupScaleCalculator({
        id: "bis11",
        name: "BIS-11 (Barratt Impulsiveness Scale)",
        reference: "Patton JH, Stanford MS, Barratt ES. Factor structure of the Barratt Impulsiveness Scale. J Clin Psychol. 1995;51(6):768-774.",
        items: [
            { displayName: "1. I plan tasks carefully.", options: [{ value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" }] },
            { displayName: "2. I do things without thinking.", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "3. I make-up my mind quickly.", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "4. I am happy-go-lucky.", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "5. I don't 'pay attention.'", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "6. I have 'racing' thoughts.", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "7. I plan trips well ahead of time.", options: [{ value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" }] },
            { displayName: "8. I am self-controlled.", options: [{ value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" }] },
            { displayName: "9. I concentrate easily.", options: [{ value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" }] },
            { displayName: "10. I save regularly.", options: [{ value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" }] },
            { displayName: "11. I 'squirm' at plays or lectures.", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "12. I am a careful thinker.", options: [{ value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" }] },
            { displayName: "13. I plan for job security.", options: [{ value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" }] },
            { displayName: "14. I say things without thinking.", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "15. I like to think about complex problems.", options: [{ value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" }] },
            { displayName: "16. I change jobs.", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "17. I act 'on impulse.'", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "18. I get easily bored when solving thought problems.", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "19. I act on the spur of the moment.", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "20. I am a steady thinker.", options: [{ value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" }] },
            { displayName: "21. I change residences.", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "22. I buy things on impulse.", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "23. I can only think about one thing at a time.", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "24. I change hobbies.", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "25. I spend or charge more than I earn.", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "26. I am more interested in the present than the future.", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "27. I am restless at the theater or lectures.", options: [{ value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" }] },
            { displayName: "28. I like puzzles.", options: [{ value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" }] },
            { displayName: "29. I am future-oriented.", options: [{ value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" }] }
        ],
        severityLogic: (score) => {
            return `Total Impulsivity Score: ${score} (Range 30-120)`;
        }
    });

    // Call sync scale view initially
    syncScaleView();

    // =================================================================
    // OPIOID TREATMENT (OTP) CALCULATORS
    // =================================================================

    // 1. Methadone Titration
    const methGenBtn = document.getElementById("meth-generate-btn");
    if (methGenBtn) {
        methGenBtn.addEventListener("click", () => {
            const dateStr = document.getElementById("meth-start-date").value;
            const startDose = parseInt(document.getElementById("meth-start-dose").value, 10) || 0;
            const targetDose = parseInt(document.getElementById("meth-target-dose").value, 10) || 0;
            const step = parseInt(document.getElementById("meth-dose-step").value, 10) || 0;
            const days = parseInt(document.getElementById("meth-dose-days").value, 10) || 0;
            const outEl = document.getElementById("meth-schedule-out");

            if (startDose <= 0 || targetDose <= 0 || step <= 0 || days <= 0) {
                outEl.value = "Please enter valid dosing numbers.";
                return;
            }

            let d = parseDate(dateStr);
            let current = startDose;
            let log = `--- Methadone Commencement Titration Schedule ---\nStarting Dose: ${startDose}mg, Target Dose: ${targetDose}mg\n\n`;

            while (current <= targetDose) {
                const stepStart = formatDate(d);
                d.setDate(d.getDate() + days - 1);
                const stepEnd = formatDate(d);
                log += `${stepStart} to ${stepEnd} [${days} days]: ${current}mg daily\n`;
                d.setDate(d.getDate() + 1);
                current += step;
                if (current - step === targetDose) break;
                if (current > targetDose) {
                    current = targetDose;
                }
            }
            log += `\nWARNING: Check QTc baseline prior to initiation and clinical status daily. Do not dose if sedated.`;
            outEl.value = log;
        });

        document.getElementById("meth-copy-btn").addEventListener("click", () => {
            const outEl = document.getElementById("meth-schedule-out");
            navigator.clipboard.writeText(outEl.value);
        });
    }

    // 2. Buprenorphine Titration
    const bupGenBtn = document.getElementById("bup-generate-btn");
    if (bupGenBtn) {
        bupGenBtn.addEventListener("click", () => {
            const dateStr = document.getElementById("bup-start-date").value;
            const startDose = parseInt(document.getElementById("bup-start-dose").value, 10) || 0;
            const targetDose = parseInt(document.getElementById("bup-target-dose").value, 10) || 0;
            const step = parseInt(document.getElementById("bup-dose-step").value, 10) || 0;
            const days = parseInt(document.getElementById("bup-dose-days").value, 10) || 0;
            const outEl = document.getElementById("bup-schedule-out");

            if (startDose <= 0 || targetDose <= 0 || step <= 0 || days <= 0) {
                outEl.value = "Please enter valid dosing numbers.";
                return;
            }

            let d = parseDate(dateStr);
            let current = startDose;
            let log = `--- Buprenorphine/Suboxone Commencement Schedule ---\nStarting Dose: ${startDose}mg, Target Dose: ${targetDose}mg\n\n`;

            while (current <= targetDose) {
                const stepStart = formatDate(d);
                d.setDate(d.getDate() + days - 1);
                const stepEnd = formatDate(d);
                log += `${stepStart} to ${stepEnd} [${days} days]: ${current}mg daily\n`;
                d.setDate(d.getDate() + 1);
                current += step;
                if (current - step === targetDose) break;
                if (current > targetDose) {
                    current = targetDose;
                }
            }
            log += `\nWARNING: Induction must only begin when patient is in moderate withdrawal (COWS score >= 12) to avoid precipitated withdrawal.`;
            outEl.value = log;
        });

        document.getElementById("bup-copy-btn").addEventListener("click", () => {
            const outEl = document.getElementById("bup-schedule-out");
            navigator.clipboard.writeText(outEl.value);
        });
    }

    // 3. LAI (Buvidal & Sublocade) PK Window
    const laiCalcBtn = document.getElementById("lai-calculate-btn");
    if (laiCalcBtn) {
        laiCalcBtn.addEventListener("click", () => {
            const type = document.getElementById("lai-type").value;
            const lastDateStr = document.getElementById("lai-last-date").value;
            const outEl = document.getElementById("lai-schedule-out");

            let lastDate = parseDate(lastDateStr);
            let dueDate = new Date(lastDate);
            let winStart = new Date(lastDate);
            let winEnd = new Date(lastDate);
            let text = "";

            if (type === "buvidal-weekly") {
                dueDate.setDate(lastDate.getDate() + 7);
                winStart.setDate(lastDate.getDate() + 5);
                winEnd.setDate(lastDate.getDate() + 9);
                text = `--- Buvidal Weekly Dosing Window ---\n`;
            } else if (type === "buvidal-monthly") {
                dueDate.setDate(lastDate.getDate() + 28);
                winStart.setDate(lastDate.getDate() + 26);
                winEnd.setDate(lastDate.getDate() + 32);
                text = `--- Buvidal Monthly Dosing Window ---\n`;
            } else {
                dueDate.setDate(lastDate.getDate() + 28);
                winStart.setDate(lastDate.getDate() + 26);
                winEnd.setDate(lastDate.getDate() + 35);
                text = `--- Sublocade Monthly Dosing Window ---\n`;
            }

            text += `Last Injection Date: ${lastDateStr}\n`;
            text += `Next Target Due Date: ${formatDate(dueDate)}\n`;
            text += `Clinical Safe Window: ${formatDate(winStart)} to ${formatDate(winEnd)}\n\n`;
            text += `Pharmacokinetics Note: Steady-state requires approximately 4-5 months of monthly Sublocade injections or 4 weeks of monthly Buvidal injections. Keep within window to prevent trough levels dropping below therapeutic threshold.`;
            outEl.value = text;
        });

        document.getElementById("lai-copy-btn").addEventListener("click", () => {
            const outEl = document.getElementById("lai-schedule-out");
            navigator.clipboard.writeText(outEl.value);
        });
    }

    // =================================================================
    // WITHDRAWAL & NRT TOOLS LOGIC
    // =================================================================

    // 1. Diazepam Weaning Builder
    const dizGenBtn = document.getElementById("diz-generate-btn");
    if (dizGenBtn) {
        dizGenBtn.addEventListener("click", () => {
            const dateStr = document.getElementById("diz-wean-date").value;
            const startDose = parseInt(document.getElementById("diz-wean-start").value, 10) || 0;
            const step = parseInt(document.getElementById("diz-wean-step").value, 10) || 0;
            const weeks = parseInt(document.getElementById("diz-wean-weeks").value, 10) || 0;
            const outEl = document.getElementById("diz-schedule-out");

            if (startDose <= 0 || step <= 0 || weeks <= 0) {
                outEl.value = "Please enter valid weaning numbers.";
                return;
            }

            let d = parseDate(dateStr);
            let current = startDose;
            let log = `--- Diazepam Gradual Weaning Plan ---\nStarting Dose: ${startDose}mg, Decrements: ${step}mg every ${weeks} weeks\n\n`;
            let weekCount = 1;

            while (current > 0) {
                const stepStart = formatDate(d);
                d.setDate(d.getDate() + (weeks * 7) - 1);
                const stepEnd = formatDate(d);
                log += `Weeks ${weekCount}-${weekCount + weeks - 1} (${stepStart} to ${stepEnd}): ${current}mg daily\n`;
                d.setDate(d.getDate() + 1);
                current -= step;
                weekCount += weeks;
            }
            log += `\nWean Ceased / Completed.\nWARNING: Slow the taper rate if patient experiences severe anxiety, insomnia, or tremors.`;
            outEl.value = log;
        });

        document.getElementById("diz-copy-btn").addEventListener("click", () => {
            const outEl = document.getElementById("diz-schedule-out");
            navigator.clipboard.writeText(outEl.value);
        });
    }

    // 2. NRT Calculator
    const nrtCalcBtn = document.getElementById("nrt-calculate-btn");
    if (nrtCalcBtn) {
        nrtCalcBtn.addEventListener("click", () => {
            const cpd = parseInt(document.getElementById("nrt-cpd").value, 10) || 0;
            const time = document.getElementById("nrt-time").value;
            const outEl = document.getElementById("nrt-schedule-out");

            let recommendation = "";
            if (cpd >= 20) {
                recommendation += "High Dependency Nicotine Intake.\nPlan: Combination NRT Therapy Recommended.\n";
                if (time === "within-30") {
                    recommendation += "- Nicotine Patch: 21mg/24hr (or 15mg/16hr) daily, consider adding a second 7mg patch if heavy smoker (>25 cpd).\n";
                } else {
                    recommendation += "- Nicotine Patch: 21mg/24hr daily.\n";
                }
                recommendation += "- Oral NRT: Nicotine gum 4mg or lozenge 4mg PRN (max 12/day) for breakthrough cravings.";
            } else if (cpd >= 10) {
                recommendation += "Moderate Dependency Nicotine Intake.\nPlan: Single or Combination NRT.\n";
                recommendation += "- Nicotine Patch: 14mg or 21mg daily.\n";
                recommendation += "- Oral NRT: Nicotine gum 2mg or lozenge 2mg PRN.";
            } else {
                recommendation += "Low Dependency Nicotine Intake.\nPlan: Single agent or PRN oral therapy.\n";
                recommendation += "- Nicotine Patch: 7mg or 14mg daily.\n- Oral NRT: Gum/lozenge 2mg PRN.";
            }

            let note = `--- NRT Assessment & Dosage Recommendation ---\nCigarettes per Day: ${cpd}\nTime to first cigarette: ${time === "within-30" ? "Within 30 mins" : "More than 30 mins"}\n\n`;
            note += recommendation;
            outEl.value = note;
        });

        document.getElementById("nrt-copy-btn").addEventListener("click", () => {
            const outEl = document.getElementById("nrt-schedule-out");
            navigator.clipboard.writeText(outEl.value);
        });
    }

    // 3. Alcohol Elimination (Widmark)
    const widCalcBtn = document.getElementById("wid-calculate-btn");
    if (widCalcBtn) {
        widCalcBtn.addEventListener("click", () => {
            const sex = document.getElementById("wid-sex").value;
            const weight = parseFloat(document.getElementById("wid-weight").value) || 0;
            const drinks = parseFloat(document.getElementById("wid-drinks").value) || 0;
            const hours = parseFloat(document.getElementById("wid-hours").value) || 0;
            const outEl = document.getElementById("wid-schedule-out");

            if (weight <= 0 || drinks < 0 || hours < 0) {
                outEl.value = "Please enter valid biological variables.";
                return;
            }

            // Grams of alcohol = standard drinks * 10
            const grams = drinks * 10;
            // Biological distribution constant r
            const r = sex === "male" ? 0.68 : 0.55;
            // Peak BAC calculation
            const peakBac = (grams / (weight * 1000 * r)) * 100; // Multiply by 100 for percentage BAC
            // Elimination rate (beta) = 0.015% per hour
            const beta = 0.015;
            const currentBac = Math.max(0, peakBac - (beta * hours));
            const hoursToZero = currentBac / beta;

            let log = `--- Alcohol Elimination Rate (Widmark Estimation) ---\n`;
            log += `Body Weight: ${weight}kg | Biological Sex: ${sex.toUpperCase()}\n`;
            log += `Standard Drinks: ${drinks} | Hours elapsed: ${hours}\n\n`;
            log += `Estimated Peak BAC: ${peakBac.toFixed(3)}%\n`;
            log += `Current Estimated BAC: ${currentBac.toFixed(3)}%\n`;
            log += `Estimated Time until BAC reaches 0.00%: ${hoursToZero.toFixed(1)} hours\n\n`;
            log += `WARNING: Widmark calculations are biological estimates. Individual metabolic rates, food consumption, and gastric emptying vary widely. Do not use for legal/safety purposes.`;
            outEl.value = log;
        });

        document.getElementById("wid-copy-btn").addEventListener("click", () => {
            const outEl = document.getElementById("wid-schedule-out");
            navigator.clipboard.writeText(outEl.value);
        });
    }

    // =================================================================
    // QTc PROLONGATION GUIDE DATA & LOGIC
    // =================================================================
    const QTC_DRUGS = [
        { name: "Methadone", risk: "High", msec: "15-30", monitoring: "Avoid combination with other QTc prolonging drugs. Perform ECG at baseline, weekly during titration, and annually." },
        { name: "Citalopram", risk: "High", msec: "10-20", monitoring: "Max recommended dose 40mg daily (20mg in elderly or hepatic impairment). Check ECG." },
        { name: "Escitalopram", risk: "Intermediate", msec: "5-10", monitoring: "Max recommended dose 20mg daily (10mg in elderly). Monitor levels." },
        { name: "Haloperidol", risk: "High", msec: "15-25", monitoring: "Higher risk with IV administration. Check baseline ECG. Monitor potassium and magnesium levels." },
        { name: "Ziprasidone", risk: "High", msec: "10-20", monitoring: "Higher risk than other atypicals. ECG monitoring indicated, especially if risk factors present." },
        { name: "Quetiapine", risk: "Intermediate", msec: "5-10", monitoring: "Monitor in patients with hepatic impairment or cardiovascular disease." },
        { name: "Risperidone", risk: "Intermediate", msec: "5-10", monitoring: "Check ECG if co-administered with CYP2D6 inhibitors." },
        { name: "Olanzapine", risk: "Low", msec: "1-5", monitoring: "Low risk of QTc prolongation under standard therapeutic dosing." },
        { name: "Aripiprazole", risk: "Low", msec: "0-2", monitoring: "Minimal QTc interval impact. Safe first-line option for cardiac risks." }
    ];

    const qtcTableBody = document.getElementById("qtc-table-body");
    const qtcSearch = document.getElementById("qtc-search");

    function renderQtcTable(filterText = "") {
        if (!qtcTableBody) return;
        qtcTableBody.innerHTML = "";

        const filtered = QTC_DRUGS.filter(d => d.name.toLowerCase().includes(filterText.toLowerCase()));

        filtered.forEach(d => {
            const tr = document.createElement("tr");
            const badgeClass = d.risk === "High" ? "risk-high" : d.risk === "Intermediate" ? "risk-intermediate" : "risk-low";
            tr.innerHTML = `
                <td><strong>${d.name}</strong></td>
                <td><span class="qtc-risk-badge ${badgeClass}">${d.risk}</span></td>
                <td>${d.msec} msec</td>
                <td>${d.monitoring}</td>
            `;
            qtcTableBody.appendChild(tr);
        });
    }

    if (qtcSearch) {
        qtcSearch.addEventListener("input", (e) => renderQtcTable(e.target.value));
    }
    renderQtcTable(); // Initial draw

    // =================================================================
    // CLINICAL ASSESSMENT NOTE GENERATORS
    // =================================================================

    // 1. MSE Note Generator
    const mseContainer = document.getElementById("gen-mse");
    const mseNoteOut = document.getElementById("mse-note-out");
    const mseResetBtn = document.getElementById("mse-reset-btn");
    const mseCopyBtn = document.getElementById("mse-copy-btn");

    if (mseContainer && mseNoteOut) {
        // Form controls
        const elements = {
            consciousness: document.getElementById("mse-consciousness"),
            ageAppearance: document.getElementById("mse-age-appearance"),
            habitus: document.getElementById("mse-habitus"),
            facialExpression: document.getElementById("mse-facial-expression"),
            hygiene: document.getElementById("mse-hygiene"),
            appearanceFree: document.getElementById("mse-appearance-free"),

            attitude: document.getElementById("mse-attitude"),
            eyeContact: document.getElementById("mse-eye-contact"),
            posture: document.getElementById("mse-posture"),
            activity: document.getElementById("mse-activity"),
            behaviourFree: document.getElementById("mse-behaviour-free"),

            speechRate: document.getElementById("mse-speech-rate"),
            speechVolume: document.getElementById("mse-speech-volume"),
            speechProsody: document.getElementById("mse-speech-prosody"),
            speechArticulation: document.getElementById("mse-speech-articulation"),
            speechFree: document.getElementById("mse-speech-free"),

            mood: document.getElementById("mse-mood"),
            affectType: document.getElementById("mse-affect-type"),
            affectRange: document.getElementById("mse-affect-range"),
            affectIntensity: document.getElementById("mse-affect-intensity"),
            affectMobility: document.getElementById("mse-affect-mobility"),
            affectCongruence: document.getElementById("mse-affect-congruence"),
            affectFree: document.getElementById("mse-affect-free"),

            perceptionFree: document.getElementById("mse-perception-free"),
            hallucinationDesc: document.getElementById("mse-hallucination-desc"),

            si: document.getElementById("mse-si"),
            siDesc: document.getElementById("mse-si-desc"),
            shi: document.getElementById("mse-shi"),
            tho: document.getElementById("mse-tho"),
            delusionDesc: document.getElementById("mse-delusion-desc"),

            judgement: document.getElementById("mse-judgement"),
            orientation: document.getElementById("mse-orientation"),
            concentration: document.getElementById("mse-concentration"),
            abstraction: document.getElementById("mse-abstraction"),
            visuospatial: document.getElementById("mse-visuospatial")
        };

        // Checkboxes & Radios lists
        const motorChecks = ["mse-motor-tremor", "mse-motor-chorea", "mse-motor-athetosis", "mse-motor-dystonias", "mse-motor-tics", "mse-motor-catatonic"];
        const mannerismChecks = ["mse-mannerism-stereotypies", "mse-mannerism-compulsions", "mse-mannerism-lip-smacking", "mse-mannerism-wringing-hands"];
        const hallucinationChecks = ["mse-hallucination-denies", "mse-hallucination-auditory", "mse-hallucination-visual", "mse-hallucination-tactile", "mse-hallucination-olfactory"];
        const thoughtFormChecks = ["mse-thought-form-coherent", "mse-thought-form-circumstantial", "mse-thought-form-tangential", "mse-thought-form-loosening", "mse-thought-form-salad"];
        const otherThoughtChecks = ["mse-other-obsessions", "mse-other-ruminations", "mse-other-preoccupations"];
        const delusionChecks = ["mse-delusion-none", "mse-delusion-persecutory", "mse-delusion-grandiose", "mse-delusion-referential", "mse-delusion-somatic", "mse-delusion-nihilistic", "mse-delusion-control", "mse-delusion-insertion"];
        const insightRadios = ["mse-insight-good", "mse-insight-partial", "mse-insight-poor", "mse-insight-absent"];

        // Handle Mutually Exclusive Checkboxes
        function setupMutexCheckboxes(group, noneId) {
            group.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.addEventListener("change", () => {
                        if (id === noneId && el.checked) {
                            // Uncheck all other checkboxes in group
                            group.forEach(otherId => {
                                if (otherId !== noneId) {
                                    const otherEl = document.getElementById(otherId);
                                    if (otherEl) otherEl.checked = false;
                                }
                            });
                        } else if (id !== noneId && el.checked) {
                            // Uncheck the "none" option
                            const noneEl = document.getElementById(noneId);
                            if (noneEl) noneEl.checked = false;
                        } else if (id !== noneId && !el.checked) {
                            // If all unchecked, check the none/denies option
                            const anyChecked = group.some(oid => oid !== noneId && document.getElementById(oid).checked);
                            if (!anyChecked) {
                                const noneEl = document.getElementById(noneId);
                                if (noneEl) noneEl.checked = true;
                            }
                        }
                        updateVisibility();
                        compileMseNote();
                        saveMseDraft();
                    });
                }
            });
        }

        setupMutexCheckboxes(hallucinationChecks, "mse-hallucination-denies");
        setupMutexCheckboxes(delusionChecks, "mse-delusion-none");
        setupMutexCheckboxes(thoughtFormChecks, "mse-thought-form-coherent");

        // Set up generic change triggers for regular fields
        Object.keys(elements).forEach(key => {
            const el = elements[key];
            if (el) {
                el.addEventListener("input", () => {
                    compileMseNote();
                    saveMseDraft();
                });
                el.addEventListener("change", () => {
                    updateVisibility();
                    compileMseNote();
                    saveMseDraft();
                });
            }
        });

        // Other checkboxes triggers
        [...motorChecks, ...mannerismChecks, ...otherThoughtChecks, ...insightRadios].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("change", () => {
                    compileMseNote();
                    saveMseDraft();
                });
            }
        });

        function updateVisibility() {
            // Hallucinations details visibility
            const anyHallucinations = hallucinationChecks.some(id => id !== "mse-hallucination-denies" && document.getElementById(id).checked);
            const halContainer = document.getElementById("mse-hallucination-desc-container");
            if (halContainer) halContainer.style.display = anyHallucinations ? "block" : "none";

            // SI details visibility
            const siValue = elements.si.value;
            const siContainer = document.getElementById("mse-si-desc-container");
            if (siContainer) siContainer.style.display = (siValue !== "Denied") ? "block" : "none";

            // Delusions details visibility
            const anyDelusions = delusionChecks.some(id => id !== "mse-delusion-none" && document.getElementById(id).checked);
            const delContainer = document.getElementById("mse-delusion-desc-container");
            if (delContainer) delContainer.style.display = anyDelusions ? "block" : "none";
        }

        function getCheckedLabels(ids) {
            const labels = [];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el && el.checked) {
                    labels.push(el.value);
                }
            });
            return labels;
        }

        function getCheckedLabelsExclude(ids, excludeVal) {
            const labels = [];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el && el.checked && el.value !== excludeVal) {
                    labels.push(el.value);
                }
            });
            return labels;
        }

        function compileMseNote() {
            const parts = [];

            // 1. Appearance
            const appParts = [];
            appParts.push(`appears ${elements.ageAppearance.value.toLowerCase()}.`);
            if (elements.habitus.value !== "(Select...)") {
                appParts.push(`Build is ${elements.habitus.value.toLowerCase()}.`);
            }
            if (elements.facialExpression.value !== "(Select...)") {
                appParts.push(`Facial expression is ${elements.facialExpression.value.toLowerCase()}.`);
            }
            appParts.push(`Hygiene is ${elements.hygiene.value.toLowerCase()}.`);
            const appFree = elements.appearanceFree.value.trim();
            if (appFree) appParts.push(appFree);
            parts.push(`Appearance: Level of consciousness is ${elements.consciousness.value.toLowerCase()}. ` + appParts.join(" "));

            // 2. Behavior
            const behParts = [];
            behParts.push(`Attitude is ${elements.attitude.value.toLowerCase()}.`);
            behParts.push(`Eye contact is ${elements.eyeContact.value.toLowerCase()}.`);
            behParts.push(`Posture is ${elements.posture.value.toLowerCase()}.`);
            behParts.push(`Psychomotor activity is ${elements.activity.value.toLowerCase()}.`);

            const motors = getCheckedLabels(motorChecks);
            if (motors.length > 0) {
                behParts.push(`Abnormal movements noted: ${motors.join(", ").toLowerCase()}.`);
            }
            const mannerisms = getCheckedLabels(mannerismChecks);
            if (mannerisms.length > 0) {
                behParts.push(`Mannerisms noted: ${mannerisms.join(", ").toLowerCase()}.`);
            }
            const behFree = elements.behaviourFree.value.trim();
            if (behFree) behParts.push(behFree);
            parts.push(`Behaviour: ` + behParts.join(" "));

            // 3. Speech
            const speechParts = [];
            speechParts.push(`Rate is ${elements.speechRate.value.toLowerCase()}, volume is ${elements.speechVolume.value.toLowerCase()}, with ${elements.speechArticulation.value.toLowerCase()} articulation and ${elements.speechProsody.value.toLowerCase()} tone.`);
            const speechFree = elements.speechFree.value.trim();
            if (speechFree) speechParts.push(speechFree);
            parts.push(`Speech: ` + speechParts.join(" "));

            // 4. Emotions
            const emoParts = [];
            const moodVal = elements.mood.value.trim();
            if (moodVal) {
                emoParts.push(`Mood is subjectively '${moodVal}'.`);
            } else {
                emoParts.push(`Mood is euthymic.`);
            }
            emoParts.push(`Affect is ${elements.affectType.value.toLowerCase()} with a ${elements.affectRange.value.toLowerCase()} range and ${elements.affectIntensity.value.toLowerCase()} intensity. Mobility is ${elements.affectMobility.value.toLowerCase()}. It is ${elements.affectCongruence.value.toLowerCase()}.`);
            const affectFree = elements.affectFree.value.trim();
            if (affectFree) emoParts.push(affectFree);
            parts.push(`Emotions: ` + emoParts.join(" "));

            // 5. Perceptions
            const percParts = [];
            const hallucinations = getCheckedLabelsExclude(hallucinationChecks, "Denies hallucinations");
            if (hallucinations.length > 0) {
                const desc = elements.hallucinationDesc.value.trim();
                const descStr = desc ? ` (describes: ${desc})` : "";
                percParts.push(`Reports ${hallucinations.join(", ").toLowerCase()} hallucinations${descStr}.`);
            } else {
                percParts.push(`Denies hallucinations.`);
            }
            const percFree = elements.perceptionFree.value.trim();
            if (percFree) percParts.push(percFree);
            parts.push(`Perceptions: ` + percParts.join(" "));

            // 6. Thought
            const tForm = getCheckedLabelsExclude(thoughtFormChecks, "Coherent and logical");
            const formStr = "Form: " + (tForm.length > 0 ? tForm.join(", ").toLowerCase() : "coherent and logical.");

            const contentParts = [];
            const siVal = elements.si.value;
            if (siVal !== "Denied") {
                const desc = elements.siDesc.value.trim();
                const descStr = desc ? ` (details: ${desc})` : "";
                contentParts.push(`suicidal ideation is present (${siVal.toLowerCase()})${descStr}`);
            } else {
                contentParts.push(`denies suicidal ideation`);
            }

            const shiVal = elements.shi.value.trim();
            contentParts.push(shiVal ? `self-harm ideation: ${shiVal}` : `denies self-harm ideation`);

            const thoVal = elements.tho.value.trim();
            contentParts.push(thoVal ? `homicidal/violent ideation: ${thoVal}` : `denies homicidal/violent ideation`);

            const otherThoughts = getCheckedLabels(otherThoughtChecks);
            if (otherThoughts.length > 0) {
                contentParts.push(`other phenomena include ${otherThoughts.join(", ").toLowerCase()}`);
            }

            const delusions = getCheckedLabelsExclude(delusionChecks, "No delusions present");
            if (delusions.length > 0) {
                const desc = elements.delusionDesc.value.trim();
                const descStr = desc ? ` (details: ${desc})` : "";
                contentParts.push(`expresses delusions of a ${delusions.join(", ").toLowerCase()} nature${descStr}`);
            } else {
                contentParts.push(`denies delusions`);
            }

            const contentStr = "Content: " + contentParts.join("; ") + ".";
            parts.push(`Thought:\n  - ${formStr}\n  - ${contentStr}`);

            // 7. Insight & Judgement
            let insightChecked = "Good";
            insightRadios.forEach(id => {
                const r = document.getElementById(id);
                if (r && r.checked) insightChecked = r.value;
            });
            parts.push(`Insight/Judgement: Insight is ${insightChecked.toLowerCase()}. Judgement appears ${elements.judgement.value.toLowerCase()}.`);

            // 8. Cognition
            const cogParts = [];
            cogParts.push(`Is ${elements.orientation.value.toLowerCase()}.`);
            cogParts.push(`Attention and concentration appear ${elements.concentration.value.toLowerCase()}.`);
            const absVal = elements.abstraction.value.trim();
            if (absVal) cogParts.push(`Abstraction is ${absVal}.`);
            const visVal = elements.visuospatial.value.trim();
            if (visVal) cogParts.push(`Visuoconstructional ability is ${visVal}.`);
            parts.push(`Cognition: ` + cogParts.join(" "));

            const text = "--- Mental Status Examination (MSE) Summary ---\n" + parts.join("\n");
            mseNoteOut.value = text;
        }

        // Draft Saving and Loading
        function saveMseDraft() {
            const draft = {};
            // Selects and Inputs
            Object.keys(elements).forEach(key => {
                const el = elements[key];
                if (el) draft[el.id] = el.value;
            });
            // Checkboxes
            const allCheckboxes = [...motorChecks, ...mannerismChecks, ...hallucinationChecks, ...thoughtFormChecks, ...otherThoughtChecks, ...delusionChecks];
            allCheckboxes.forEach(id => {
                const el = document.getElementById(id);
                if (el) draft[id] = el.checked;
            });
            // Radios
            insightRadios.forEach(id => {
                const el = document.getElementById(id);
                if (el) draft[id] = el.checked;
            });

            localStorage.setItem("psych_mse_draft", JSON.stringify(draft));
        }

        function loadMseDraft() {
            try {
                const saved = localStorage.getItem("psych_mse_draft");
                if (!saved) return;
                const draft = JSON.parse(saved);

                // Selects and Inputs
                Object.keys(elements).forEach(key => {
                    const el = elements[key];
                    if (el && draft[el.id] !== undefined) {
                        el.value = draft[el.id];
                    }
                });

                // Checkboxes
                const allCheckboxes = [...motorChecks, ...mannerismChecks, ...hallucinationChecks, ...thoughtFormChecks, ...otherThoughtChecks, ...delusionChecks];
                allCheckboxes.forEach(id => {
                    const el = document.getElementById(id);
                    if (el && draft[id] !== undefined) {
                        el.checked = draft[id];
                    }
                });

                // Radios
                insightRadios.forEach(id => {
                    const el = document.getElementById(id);
                    if (el && draft[id] !== undefined) {
                        el.checked = draft[id];
                    }
                });

                updateVisibility();
                compileMseNote();
            } catch (e) {
                console.error("Error loading MSE draft", e);
            }
        }

        // Reset Fields
        if (mseResetBtn) {
            mseResetBtn.addEventListener("click", () => {
                if (confirm("Are you sure you want to reset all MSE fields to defaults?")) {
                    // Reset Selects to first option
                    Object.keys(elements).forEach(key => {
                        const el = elements[key];
                        if (el) {
                            if (el.tagName === "SELECT") {
                                el.selectedIndex = 0;
                            } else {
                                el.value = "";
                            }
                        }
                    });

                    // Reset Checkboxes
                    const allCheckboxes = [...motorChecks, ...mannerismChecks, ...hallucinationChecks, ...thoughtFormChecks, ...otherThoughtChecks, ...delusionChecks];
                    allCheckboxes.forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.checked = false;
                    });

                    // Set standard default checked boxes
                    document.getElementById("mse-hallucination-denies").checked = true;
                    document.getElementById("mse-thought-form-coherent").checked = true;
                    document.getElementById("mse-delusion-none").checked = true;

                    // Reset Radios
                    insightRadios.forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.checked = false;
                    });
                    document.getElementById("mse-insight-good").checked = true;

                    localStorage.removeItem("psych_mse_draft");
                    updateVisibility();
                    compileMseNote();
                }
            });
        }

        if (mseCopyBtn) {
            mseCopyBtn.addEventListener("click", () => {
                mseNoteOut.select();
                navigator.clipboard.writeText(mseNoteOut.value);
            });
        }

        // Initialize
        loadMseDraft();
        if (!localStorage.getItem("psych_mse_draft")) {
            compileMseNote();
        }
    }

    // 2. Definitive 4P Formulation Maker
    const factorsMap = {
        "Predisposing": {
            "Biological": ["Family history", "Medical illness"],
            "Psychological": ["Development history", "Trauma history", "Personality traits/structure"],
            "Social": ["Accommodation", "Finance/vocation", "Migration/Cultural factors"]
        },
        "Precipitating": {
            "Biological": ["Medication change", "New medical illness"],
            "Psychological": ["Interpersonal conflict", "Loss or grief"],
            "Social": ["Changes to social supports", "Legal issues"]
        },
        "Perpetuating": {
            "Biological": ["Ongoing substance use", "Poor sleep/nutrition"],
            "Psychological": ["Cognitive distortions", "Poor insight", "Avoidant coping"],
            "Social": ["Stigma", "Lack of access to services"]
        },
        "Protective": {
            "Biological": ["Good physical health", "Medication adherence"],
            "Psychological": ["Good insight", "History of resilience"],
            "Social": ["Strong support networks", "Stable accommodation"]
        }
    };

    function compileFormulation() {
        const outParts = [];

        // 1. Synthesize Presenting Problem
        const name = document.getElementById("form-pp-name").value.trim();
        const age = document.getElementById("form-pp-age").value.trim();
        const gender = document.getElementById("form-pp-gender").value.trim();
        const duration = document.getElementById("form-pp-duration").value.trim();
        const symptoms = document.getElementById("form-pp-symptoms").value.trim();
        const context = document.getElementById("form-pp-context").value.trim();
        const coping = document.getElementById("form-pp-coping").value.trim();

        // Get pronouns based on entered gender
        function getPronouns(genderStr) {
            const g = (genderStr || "").toLowerCase().trim();
            if (g === "female" || g === "woman" || g === "she" || g === "f" || g === "girl") {
                return { subject: "she", object: "her", possessive: "her", possessivePronoun: "hers", verb: "reports", presents: "presents", copes: "copes", CopingCapitalized: "She reports" };
            } else if (g === "male" || g === "man" || g === "he" || g === "m" || g === "boy") {
                return { subject: "he", object: "him", possessive: "his", possessivePronoun: "his", verb: "reports", presents: "presents", copes: "copes", CopingCapitalized: "He reports" };
            } else {
                return { subject: "they", object: "them", possessive: "their", possessivePronoun: "theirs", verb: "report", presents: "present", copes: "cope", CopingCapitalized: "They report" };
            }
        }

        const pronouns = getPronouns(gender);

        const ppTextParts = [];
        if (name && age && gender) {
            ppTextParts.push(`${name} is a ${age}-year-old ${gender}`);
        }
        if (symptoms) {
            let durStr = duration || "a history";
            const lowerDur = durStr.toLowerCase().trim();
            let symptomsPhrase = "";
            if (lowerDur.endsWith("of")) {
                symptomsPhrase = `who ${pronouns.presents} with ${durStr} ${symptoms}`;
            } else {
                symptomsPhrase = `who ${pronouns.presents} with ${durStr} of ${symptoms}`;
            }

            // Determine if the next clause (context) will start a new sentence
            let nextStartsNewSentence = false;
            if (context) {
                const lowerContext = context.toLowerCase().trim();
                if (lowerContext.startsWith("precipitated by") || lowerContext.startsWith("occurring")) {
                    nextStartsNewSentence = true;
                }
            }

            // If there's no context, or the context starts a new sentence, end this sentence with a period
            if (!context || nextStartsNewSentence) {
                symptomsPhrase += ".";
            }
            ppTextParts.push(symptomsPhrase);
        } else if (ppTextParts.length > 0 && !context) {
            // Close the name/age/gender sentence if no symptoms and no context
            ppTextParts[ppTextParts.length - 1] += ".";
        }

        if (context) {
            let contextStr = context;
            const lowerContext = contextStr.toLowerCase().trim();
            if (lowerContext.startsWith("in the context of")) {
                ppTextParts.push(`${contextStr}.`);
            } else if (lowerContext.startsWith("precipitated by") || lowerContext.startsWith("occurring")) {
                // Capitalize the first letter for a new sentence
                const capitalizedContext = contextStr.charAt(0).toUpperCase() + contextStr.slice(1);
                ppTextParts.push(`${capitalizedContext}.`);
            } else {
                ppTextParts.push(`in the context of ${contextStr}.`);
            }
        }

        if (coping) {
            let copingStr = coping;
            const lowerCoping = copingStr.toLowerCase().trim();
            if (lowerCoping.startsWith("they report") ||
                lowerCoping.startsWith("he reports") ||
                lowerCoping.startsWith("she reports") ||
                lowerCoping.startsWith("patient reports")) {
                let rest = copingStr;
                if (lowerCoping.startsWith("they report")) rest = copingStr.slice(11).trim();
                else if (lowerCoping.startsWith("he reports")) rest = copingStr.slice(10).trim();
                else if (lowerCoping.startsWith("she reports")) rest = copingStr.slice(11).trim();
                else if (lowerCoping.startsWith("patient reports")) rest = copingStr.slice(15).trim();

                ppTextParts.push(`${pronouns.CopingCapitalized} ${rest}.`);
            } else if (lowerCoping.startsWith("resulting in")) {
                ppTextParts.push(`This is ${copingStr}.`);
            } else {
                ppTextParts.push(`${pronouns.CopingCapitalized} ${copingStr}.`);
            }
        }

        if (ppTextParts.length > 0) {
            outParts.push("PRESENTING PROBLEM\n" + ppTextParts.join(" "));
        }

        // 2. Add Diagnostic Impression
        const primary = document.getElementById("form-diag-primary").value.trim();
        const diff = document.getElementById("form-diag-diff").value.trim();
        const contrib = document.getElementById("form-diag-contrib").value.trim();

        const diagTextParts = [];
        if (primary) diagTextParts.push(`* **Primary:** ${primary}`);
        if (diff) diagTextParts.push(`* **Differentials:** ${diff}`);
        if (contrib) diagTextParts.push(`* **Contributing:** ${contrib}`);

        if (diagTextParts.length > 0) {
            outParts.push("DIAGNOSTIC IMPRESSION\n" + diagTextParts.join("\n"));
        }

        // Helper to get factors text for a category and subcategory
        function getFactorsText(pKeyFilter, subKeyFilter) {
            const details = [];
            const subCats = factorsMap[pKeyFilter];
            if (!subCats) return details;

            if (subKeyFilter) {
                const factorsList = subCats[subKeyFilter] || [];
                factorsList.forEach(factor => {
                    const id = `${pKeyFilter}_${subKeyFilter}_${factor.replace(/\//g, '_').replace(/ /g, '_')}`;
                    const el = document.getElementById(id);
                    if (el && el.value.trim()) {
                        details.push(el.value.trim());
                    }
                });
            } else {
                Object.keys(subCats).forEach(sk => {
                    const factorsList = subCats[sk] || [];
                    factorsList.forEach(factor => {
                        const id = `${pKeyFilter}_${sk}_${factor.replace(/\//g, '_').replace(/ /g, '_')}`;
                        const el = document.getElementById(id);
                        if (el && el.value.trim()) {
                            details.push(el.value.trim());
                        }
                    });
                });
            }
            return details;
        }

        // Get output format preference (integrated narrative vs sectioned report)
        const formatSelect = document.getElementById("form-output-format");
        const isIntegrated = formatSelect ? (formatSelect.value === "integrated") : true;

        // 3. Generate Narrative Formulation
        const narrativeParagraphs = [];
        const narrativeParts = [];
        const bioDiathesis = getFactorsText("Predisposing", "Biological");
        if (bioDiathesis.length > 0) {
            const subjectPronoun = pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1);
            const verbHave = pronouns.subject === "they" ? "have" : "has";
            narrativeParts.push(`${subjectPronoun} ${verbHave} a biological diathesis of mental illness from ${bioDiathesis.join(", ")}.`);
        }
        const psychPredisposition = getFactorsText("Predisposing", "Psychological");
        if (psychPredisposition.length > 0) {
            const possessivePronoun = pronouns.possessive.charAt(0).toUpperCase() + pronouns.possessive.slice(1);
            narrativeParts.push(`${possessivePronoun} psychological predisposition to illness includes ${psychPredisposition.join(", ")}.`);
        }
        const socialFactors = getFactorsText("Predisposing", "Social");
        if (socialFactors.length > 0) {
            narrativeParts.push(`This is further augmented by social factors of ${socialFactors.join(", ")}.`);
        }

        const precipitatingFactors = getFactorsText("Precipitating");
        if (precipitatingFactors.length > 0) {
            narrativeParts.push(`Precipitating this presentation was ${precipitatingFactors.join(", ")}.`);
        }
        const perpetuatingFactors = getFactorsText("Perpetuating");
        if (perpetuatingFactors.length > 0) {
            narrativeParts.push(`Perpetuating these problems, the patient faces a milieu of ${perpetuatingFactors.join(", ")}.`);
        }
        const protectiveFactors = getFactorsText("Protective");
        if (protectiveFactors.length > 0) {
            const subjectPronoun = pronouns.subject === "they" ? "they" : pronouns.subject;
            const verbHave = pronouns.subject === "they" ? "have" : "has";
            narrativeParts.push(`Protectively, ${subjectPronoun} ${verbHave} ${protectiveFactors.join(", ")}.`);
        }

        if (narrativeParts.length > 0) {
            narrativeParagraphs.push(narrativeParts.join(" "));
        }

        // Compile transdiagnostic theoretical frameworks prose and markdown lists
        const activeFrameworks = ["cbt", "psychodynamic", "selfpsych", "erikson", "attachment"];
        const theoryProseParts = [];
        const sectionedFrameworksData = [];

        activeFrameworks.forEach(fw => {
            const cb = document.getElementById(`form-framework-${fw}`);
            if (cb && cb.checked) {
                let frameworkTitle = "";
                const tcParts = [];
                let prose = "";

                if (fw === "cbt") {
                    frameworkTitle = "Cognitive Behavioral (CBT)";
                    const core = document.getElementById("form-cbt-core").value.trim();
                    const inter = document.getElementById("form-cbt-intermediate").value.trim();
                    const thoughts = document.getElementById("form-cbt-thoughts").value.trim();
                    if (core) tcParts.push(`* **Core Beliefs / Schemas:** ${core}`);
                    if (inter) tcParts.push(`* **Rules & Assumptions (Intermediate Beliefs):** ${inter}`);
                    if (thoughts) tcParts.push(`* **Automatic Thoughts / Cognitive Distortions:** ${thoughts}`);

                    if (core || inter || thoughts) {
                        const proseParts = [];
                        if (core) proseParts.push(`core beliefs/schemas of "${core}"`);
                        if (inter) proseParts.push(`rules/assumptions including "${inter}"`);
                        if (thoughts) proseParts.push(`automatic thoughts/cognitive distortions of "${thoughts}"`);
                        prose = `From a Cognitive Behavioral (CBT) perspective, this presentation is maintained by ${proseParts.join(", and ")}.`;
                    }
                } else if (fw === "psychodynamic") {
                    frameworkTitle = "Psychodynamic & Defenses";
                    const defenses = document.getElementById("form-dyn-defenses").value.trim();
                    const conflict = document.getElementById("form-dyn-conflict").value.trim();
                    const ego = document.getElementById("form-dyn-ego").value.trim();
                    if (defenses) tcParts.push(`* **Dominant Defense Mechanisms:** ${defenses}`);
                    if (conflict) tcParts.push(`* **Central Conflict:** ${conflict}`);
                    if (ego) tcParts.push(`* **Ego Functioning & Strengths:** ${ego}`);

                    if (defenses || conflict || ego) {
                        const proseParts = [];
                        if (defenses) proseParts.push(`defense mechanisms of ${defenses}`);
                        if (conflict) proseParts.push(`a central conflict of ${conflict}`);
                        if (ego) proseParts.push(`ego functioning described as ${ego}`);
                        const subjectPronoun = pronouns.subject;
                        const verbUtilize = pronouns.subject === "they" ? "utilize" : "utilizes";
                        prose = `Psychodynamically, the presentation is understood through ${subjectPronoun} ${verbUtilize} of ${proseParts.join(", alongside ")}.`;
                    }
                } else if (fw === "selfpsych") {
                    frameworkTitle = "Self Psychology";
                    const needs = document.getElementById("form-self-needs").value.trim();
                    const cohesion = document.getElementById("form-self-cohesion").value.trim();
                    if (needs) tcParts.push(`* **Unmet Selfobject Needs:** ${needs}`);
                    if (cohesion) tcParts.push(`* **Self Cohesion / Fragmentation Dynamics:** ${cohesion}`);

                    if (needs || cohesion) {
                        const proseParts = [];
                        if (needs) proseParts.push(`unmet selfobject needs for ${needs}`);
                        if (cohesion) proseParts.push(`self cohesion vs. fragmentation dynamics of ${cohesion}`);
                        const subjectPronoun = pronouns.subject;
                        const verbExperience = pronouns.subject === "they" ? "experience" : "experiences";
                        prose = `Under a Self Psychology framework, ${subjectPronoun} ${verbExperience} ${proseParts.join(", with ")}.`;
                    }
                } else if (fw === "erikson") {
                    frameworkTitle = "Erikson's Developmental Stages";
                    const currentStage = document.getElementById("form-erikson-current").value.trim();
                    const pastStage = document.getElementById("form-erikson-past").value.trim();
                    if (currentStage) tcParts.push(`* **Current Developmental Stage Conflict:** ${currentStage}`);
                    if (pastStage) tcParts.push(`* **Unresolved Past Stage(s):** ${pastStage}`);

                    if (currentStage || pastStage) {
                        const proseParts = [];
                        if (currentStage) proseParts.push(`currently navigating the conflict of ${currentStage}`);
                        if (pastStage) proseParts.push(`with unresolved developmental issues from the stage of ${pastStage}`);
                        const subjectPronoun = pronouns.subject;
                        const verbBe = pronouns.subject === "they" ? "are" : "is";
                        prose = `Developmentally, Erikson's model suggests ${subjectPronoun} ${verbBe} ${proseParts.join(" ")}.`;
                    }
                } else if (fw === "attachment") {
                    frameworkTitle = "Attachment Theory";
                    const style = document.getElementById("form-attach-style").value;
                    const dynamics = document.getElementById("form-attach-dynamics").value.trim();
                    if (style) tcParts.push(`* **Dominant Attachment Style:** ${style}`);
                    if (dynamics) tcParts.push(`* **Attachment Figure & Separation Dynamics:** ${dynamics}`);

                    if (style || dynamics) {
                        const proseParts = [];
                        if (style) proseParts.push(`a dominant attachment style of ${style}`);
                        if (dynamics) proseParts.push(`separation/threat dynamics involving ${dynamics}`);
                        prose = `Attachment formulation indicates ${proseParts.join(", alongside ")}.`;
                    }
                }

                if (tcParts.length > 0) {
                    sectionedFrameworksData.push({ title: frameworkTitle, lines: tcParts });
                }
                if (prose) {
                    theoryProseParts.push(prose);
                }
            }
        });

        const mgmtText = document.getElementById("form-mgmt").value.trim();

        if (isIntegrated) {
            if (theoryProseParts.length > 0) {
                narrativeParagraphs.push(theoryProseParts.join(" "));
            }
            if (mgmtText) {
                narrativeParagraphs.push(mgmtText);
            }
        }

        if (narrativeParagraphs.length > 0) {
            outParts.push("NARRATIVE FORMULATION\n" + narrativeParagraphs.join("\n\n"));
        }

        if (!isIntegrated) {
            // Add separate sections for Sectioned format
            sectionedFrameworksData.forEach(fwData => {
                outParts.push(`THEORETICAL CONSIDERATIONS (${fwData.title.toUpperCase()})\n` + fwData.lines.join("\n"));
            });

            if (mgmtText) {
                outParts.push("PROGNOSIS & MANAGEMENT IMPLICATIONS\n" + mgmtText);
            }
        }

        // 6. Generate Structured List
        const structuredLines = [];
        Object.keys(factorsMap).forEach(pKey => {
            const pKeyLines = [];
            Object.keys(factorsMap[pKey]).forEach(subKey => {
                const subKeyLines = [];
                factorsMap[pKey][subKey].forEach(factor => {
                    const id = `${pKey}_${subKey}_${factor.replace(/\//g, '_').replace(/ /g, '_')}`;
                    const el = document.getElementById(id);
                    if (el && el.value.trim()) {
                        subKeyLines.push(`    - ${factor}: ${el.value.trim()}`);
                    }
                });
                if (subKeyLines.length > 0) {
                    pKeyLines.push(`  ${subKey}:`);
                    pKeyLines.push(...subKeyLines);
                }
            });
            if (pKeyLines.length > 0) {
                structuredLines.push(`\n${pKey.toUpperCase()} FACTORS:`);
                structuredLines.push(...pKeyLines);
            }
        });

        if (structuredLines.length > 0) {
            outParts.push("STRUCTURED FORMULATION" + structuredLines.join("\n"));
        }

        const outEl = document.getElementById("form-note-out");
        if (outEl) {
            outEl.value = outParts.join("\n\n");
        }
    }

    function saveFormulationDraft() {
        const draftData = {};
        const ppFields = ["form-pp-name", "form-pp-age", "form-pp-gender", "form-pp-duration", "form-pp-symptoms", "form-pp-context", "form-pp-coping"];
        ppFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) draftData[id] = el.value;
        });

        const diagFields = ["form-diag-primary", "form-diag-diff", "form-diag-contrib"];
        diagFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) draftData[id] = el.value;
        });

        const mgmtEl = document.getElementById("form-mgmt");
        if (mgmtEl) draftData["form-mgmt"] = mgmtEl.value;

        // Save output format preference
        const formatSelect = document.getElementById("form-output-format");
        if (formatSelect) draftData["form-output-format"] = formatSelect.value;

        // Save factors
        Object.keys(factorsMap).forEach(pKey => {
            Object.keys(factorsMap[pKey]).forEach(subKey => {
                factorsMap[pKey][subKey].forEach(factor => {
                    const id = `${pKey}_${subKey}_${factor.replace(/\//g, '_').replace(/ /g, '_')}`;
                    const el = document.getElementById(id);
                    if (el) draftData[id] = el.value;
                });
            });
        });

        // Save framework checkboxes
        const activeFrameworks = ["cbt", "psychodynamic", "selfpsych", "erikson", "attachment"];
        activeFrameworks.forEach(fw => {
            const cb = document.getElementById(`form-framework-${fw}`);
            if (cb) draftData[`form-framework-${fw}`] = cb.checked;
        });

        // Save framework text fields
        const allFrameworkFields = [
            "form-cbt-core", "form-cbt-intermediate", "form-cbt-thoughts",
            "form-dyn-defenses", "form-dyn-conflict", "form-dyn-ego",
            "form-self-needs", "form-self-cohesion",
            "form-erikson-current", "form-erikson-past",
            "form-attach-style", "form-attach-dynamics"
        ];
        allFrameworkFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) draftData[id] = el.value;
        });

        localStorage.setItem("psych_formulation_draft", JSON.stringify(draftData));
    }

    function loadFormulationDraft() {
        const draftStr = localStorage.getItem("psych_formulation_draft");
        if (!draftStr) return;
        try {
            const draftData = JSON.parse(draftStr);

            // Load PP and diagnostic text inputs
            const basicFields = [
                "form-pp-name", "form-pp-age", "form-pp-gender", "form-pp-duration",
                "form-pp-symptoms", "form-pp-context", "form-pp-coping",
                "form-diag-primary", "form-diag-diff", "form-diag-contrib",
                "form-mgmt"
            ];
            basicFields.forEach(id => {
                const el = document.getElementById(id);
                if (el && draftData[id] !== undefined) {
                    el.value = draftData[id];
                }
            });

            // Load output format preference
            const formatSelect = document.getElementById("form-output-format");
            if (formatSelect && draftData["form-output-format"] !== undefined) {
                formatSelect.value = draftData["form-output-format"];
            }

            // Load 4Ps factors
            Object.keys(factorsMap).forEach(pKey => {
                Object.keys(factorsMap[pKey]).forEach(subKey => {
                    factorsMap[pKey][subKey].forEach(factor => {
                        const id = `${pKey}_${subKey}_${factor.replace(/\//g, '_').replace(/ /g, '_')}`;
                        const el = document.getElementById(id);
                        if (el && draftData[id] !== undefined) {
                            el.value = draftData[id];
                        }
                    });
                });
            });

            // Load checkboxes
            const activeFrameworks = ["cbt", "psychodynamic", "selfpsych", "erikson", "attachment"];
            activeFrameworks.forEach(fw => {
                const cb = document.getElementById(`form-framework-${fw}`);
                if (cb && draftData[`form-framework-${fw}`] !== undefined) {
                    cb.checked = draftData[`form-framework-${fw}`];
                    // Trigger changes to toggle visibility
                    cb.dispatchEvent(new Event("change"));
                }
            });

            // Load framework text fields
            const allFrameworkFields = [
                "form-cbt-core", "form-cbt-intermediate", "form-cbt-thoughts",
                "form-dyn-defenses", "form-dyn-conflict", "form-dyn-ego",
                "form-self-needs", "form-self-cohesion",
                "form-erikson-current", "form-erikson-past",
                "form-attach-style", "form-attach-dynamics"
            ];
            allFrameworkFields.forEach(id => {
                const el = document.getElementById(id);
                if (el && draftData[id] !== undefined) {
                    el.value = draftData[id];
                }
            });

            compileFormulation();
        } catch (e) {
            console.error("Error loading formulation draft", e);
        }
    }

    function resetFormulation() {
        const ppFields = ["form-pp-name", "form-pp-age", "form-pp-gender", "form-pp-duration", "form-pp-symptoms", "form-pp-context", "form-pp-coping"];
        ppFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });

        const diagFields = ["form-diag-primary", "form-diag-diff", "form-diag-contrib"];
        diagFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });

        const mgmtEl = document.getElementById("form-mgmt");
        if (mgmtEl) mgmtEl.value = "";

        // Reset format selector
        const formatSelect = document.getElementById("form-output-format");
        if (formatSelect) formatSelect.value = "integrated";

        Object.keys(factorsMap).forEach(pKey => {
            Object.keys(factorsMap[pKey]).forEach(subKey => {
                factorsMap[pKey][subKey].forEach(factor => {
                    const id = `${pKey}_${subKey}_${factor.replace(/\//g, '_').replace(/ /g, '_')}`;
                    const el = document.getElementById(id);
                    if (el) el.value = "";
                });
            });
        });

        // Clear checkboxes
        const activeFrameworks = ["cbt", "psychodynamic", "selfpsych", "erikson", "attachment"];
        activeFrameworks.forEach(fw => {
            const cb = document.getElementById(`form-framework-${fw}`);
            if (cb) {
                cb.checked = false;
                cb.dispatchEvent(new Event("change"));
            }
        });

        // Clear framework text fields
        const allFrameworkFields = [
            "form-cbt-core", "form-cbt-intermediate", "form-cbt-thoughts",
            "form-dyn-defenses", "form-dyn-conflict", "form-dyn-ego",
            "form-self-needs", "form-self-cohesion",
            "form-erikson-current", "form-erikson-past",
            "form-attach-style", "form-attach-dynamics"
        ];
        allFrameworkFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });

        const outEl = document.getElementById("form-note-out");
        if (outEl) outEl.value = "";

        localStorage.removeItem("psych_formulation_draft");
    }

    const formContainer = document.getElementById("gen-5ps");
    if (formContainer) {
        // Collapsible Reference Guide Toggle
        const refHeader = formContainer.querySelector(".reference-header");
        const refCard = formContainer.querySelector(".reference-card");
        const refContent = formContainer.querySelector(".reference-content");
        if (refHeader && refContent && refCard) {
            refHeader.addEventListener("click", () => {
                const isOpen = refCard.classList.toggle("open");
                refContent.style.display = isOpen ? "block" : "none";
            });
        }

        // Reference Guide Tabs Toggle
        const refTabButtons = formContainer.querySelectorAll(".ref-tab-btn");
        refTabButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                const targetTabId = btn.dataset.refTab;
                // Deactivate all buttons & contents
                refTabButtons.forEach(b => b.classList.remove("active"));
                formContainer.querySelectorAll(".ref-tab-content").forEach(c => {
                    c.style.display = "none";
                    c.classList.remove("active");
                });
                // Activate target
                btn.classList.add("active");
                const targetContent = document.getElementById(targetTabId);
                if (targetContent) {
                    targetContent.style.display = "block";
                    targetContent.classList.add("active");
                }
            });
        });

        // Toggle checkboxes event listeners
        const activeFrameworks = ["cbt", "psychodynamic", "selfpsych", "erikson", "attachment"];
        activeFrameworks.forEach(fw => {
            const cb = document.getElementById(`form-framework-${fw}`);
            if (cb) {
                cb.addEventListener("change", () => {
                    const target = document.getElementById(`framework-fields-${fw}`);
                    if (target) {
                        target.style.display = cb.checked ? "block" : "none";
                    }
                    compileFormulation();
                    saveFormulationDraft();
                });
            }
        });

        // Sentence starters click handler via event delegation
        formContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("starter-tag")) {
                const targetId = e.target.dataset.target;
                const text = e.target.dataset.text;
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    targetEl.focus();
                    if (targetEl.value.trim() === "") {
                        targetEl.value = text;
                    } else {
                        targetEl.value = targetEl.value.trim() + " " + text;
                    }
                    // Fire input event to trigger compilation & auto-save
                    targetEl.dispatchEvent(new Event("input", { bubbles: true }));
                }
            }
        });

        // Real-time compiling and saving on any input or change event
        const triggerCompileSave = (e) => {
            if (e.target.id && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT")) {
                compileFormulation();
                saveFormulationDraft();
            }
        };
        formContainer.addEventListener("input", triggerCompileSave);
        formContainer.addEventListener("change", triggerCompileSave);

        // Copy button
        const copyBtn = document.getElementById("form-copy-btn");
        if (copyBtn) {
            copyBtn.addEventListener("click", () => {
                const outEl = document.getElementById("form-note-out");
                if (outEl) {
                    outEl.select();
                    navigator.clipboard.writeText(outEl.value);
                }
            });
        }

        // Reset button
        const resetBtn = document.getElementById("form-reset-btn");
        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                if (confirm("Are you sure you want to reset all fields in the formulation builder?")) {
                    resetFormulation();
                }
            });
        }

        // Load saved draft on startup
        loadFormulationDraft();
    }

    // 3. Clinical Templates Note Selector
    const templates = {
        addiction: `Addiction Medicine Clinic Consultation Note\n\nBackground:\nLives with:\nFamily:\nWork/Finances:\nGP/Pharmacy:\n\nDrug & Alcohol History:\n- Alcohol:\n- Tobacco:\n- Cannabis:\n- Opioids:\n- Stimulants (Methamphetamine/Cocaine):\n\nPhysical & Lab Checks (LFTs, EUC, BAC):\n\nImpression & Treatment Plan:\n- Pharmacological Support:\n- Psychosocial Referral:\n- Follow-up details:`,
        otp: `OTP Clinic Review Note\n\nCurrent Medication Type: Methadone / Suboxone / Buvidal\nCurrent daily dose: _____mg\nLast injection date (LAI): __/__/____\n\nAdverse effects screening (Constipation, Sedation, Dental check):\nCravings / Withdrawal check:\nUrine Drug Screen (UDS) results:\nSafety & Takeaway storage verified: Yes/No\n\nImpression:\nPlan & Dosing updates:`,
        review: `Psychiatry Initial Review & Assessment Note\n\nHistory of Presenting Illness (HPI):\n\nDiagnostic Screen (DSM-5 / ICD-11):\n- Organic causes ruled out: Yes/No\n- Psychotic Symptoms:\n- Mood Symptoms (Mania/Depression):\n- Anxiety/Trauma Symptoms:\n\nRisk Assessment:\n- Risk to Self (Ideation/Intent/Plan):\n- Risk to Others:\n- Vulnerability/Self-neglect:\n\nMental Status Examination (MSE):\n\nFormulation (Biopsychosocial):\n\nTreatment Plan (Biomedical, Psychological, Social):`,
        oca: `Registrar Initial Review - Koessler

Situation:

Psychosocial Background:
Address - 
Lives with 
Family - 
	Person responsible: 
Pets - 
Work - 
Finances -  
GP - 
Previous Diagnoses -
Ethnicity - 
Religion - 
Relevant other services / professionals - 

On review:


- Mood right now - 
- Suicidality - 
- Sleep - 
- Appetite and oral intake - 

Diagnostic screen:
- Manic experiences - 
- Depressive (anhedonia / guild / energy / concentration / slowing)
- Organic and somatic - pain
- Cognitive - difficulties thinking, confusion, memory
- Psychotic experiences - 
- Anxiety and panic attacks - worry difficult to control? Difficulty concentrating? Keyed up, on edge / restless?
- Personality (difficulty making or keeping friends? Loner? Trust other people generally? Lose temper easily? Impulsive? Worrier? Depend on others a lot? Perfectionist?)
- Trauma - nightmares, dissociation, and flashbacks

Functional screen:
ADLs:
-Bathing & Hygiene:
-Dressing: 
-Toileting: 
-Mobility (Transfers): 
-Eating/Feeding: 

iADLs:
-Managing Finances
-Managing Medication
-Meal Preparation
-Housekeeping & Laundry
-Shopping
-Transportation
-Communication: Using the phone, mail, or computer


Risk Assessment
Risk to Self:
	Suicidal Ideation: (Current/past, intent, plan, access to means)
	Self-Harm: (Current/past, nature of harm)
	Self-Neglect / Vulnerability:

Risk to Others:
	Aggression/Violence: (Current/past ideation, intent, plan, targets)
	Child Welfare Concerns:

Risk From Others:
	Domestic Violence, Exploitation, Abuse:

Substance-Specific Risks:
	Overdose Risk: (History of OD, current tolerance changes, polypharmacy)
	Withdrawal Risk: (History of severe withdrawal, seizures, delirium tremens)
	Injecting-Related Risks: (BBV status/risk, vein care, needle sharing)
	Driving/Operating Machinery:


Past Mental Health History: 
- Diagnoses:

- Previous admissions:

- Psychology:

- Psychiatry:

Past Medical History: 

[Neurological: Head injuries; Seizures, peripheral neuropathy, cognitive impairment
Endocrinological: Thyroid or hormonal issues
Blood-Borne Viruses (BBVs)
Surgical history or history of ECT
Liver disease: Cirrhosis, abnormal LFTs.
Cardiovascular: Endocarditis, cardiomyopathy.
.
Trauma/Injuries.]

Current Medications:

Safescript review:

ADRs / Allergies:


Drug and Alcohol History 
- Alcohol 
- Tobacco 
- Cannabis 
- Amphetamine type substances (ice, MDMA etc.) 
- Benzodiazepines (prescribed & illicit) 
- Heroin
- Other opioids (oxycodone, non-prescribed methadone/buprenorphine) 
- Cocaine 
- Hallucinogens  
- Ketamine 
- GHB 
- Other substances (e.g. inhalants / solvents, nitrous oxide, hand sanitiser, anabolic steroids) 


Alcohol and other drug treatment history - Previous withdrawal management (setting, medications, outcome), rehabilitation (program, duration), counselling, mutual help groups (AA/NA).

Gambling History: 

Forensic History:


Family History / Family Structure
- Psychiatric

- Medical

Personal / developmental history
- Birth
Location:
Ante, peri or post-natal complications:

- Illnesses as a baby:

- Milestones (especially walking and talking)

- What sort of childhood memories do you recall?

- 3 words/phrases to describe mum:
- 3 words/phrases to describe dad: 

- Parental occupation

- DV exposure and violence in the home

- Major traumas (e.g. physical or sexual abuse)

- School: 
Enjoyment -
Social and friends -
Bullying - 
Academic function -  
Behavioural issues - 
Age left school - 

- Workplace / vocational history
After school
Job history
Longest period of employment

- Relationship – romantic & platonic, psychosexual history, children
Number of significant relationshops
Longest relationship
"What sort of person are you in the relationship?"
"Do you find your relationships get unusually emotionally intense?"
"Are you sensitive to rejection or constantly fearful of being abandoned in relationships?"

# Strengths, Goals & Recovery Capital:
- Patient-identified strengths, skills, and positive attributes.
- Hobbies and friendships
- Life goals (short and long term).
- Culture - 
- Spirituality - 
	
# Goals for this treatment episode:

MSE
Appearance: __ appears of stated age in top and __. __ Distinctive features. Appears of reasonable hygiene.
Behaviour: cooperative and openly communicating. Psychomotor __
Speech: normal R/T/V. __ paucity and vagueness of speech
Emotions
	Mood: states mood is 
	Affect: congruent, appears 
Perceptions: denies auditory, visual, tactile or other hallucinations
Thought form: No evidence of FTD - coherent and logical
Thought content: __ TOSH / suicidal ideation. __ delusions / overvalued ideas
Insight/judgement: Insight into mental condition is __. Insight into precipitants and causes is __
Cognition:  Oriented to PPT, aware of own autobiographical details. No formal cognitive testing at present.

Orientation: Date - Month - Year - Day - Place - Suburb

Delayed Recall: Face - Velvet - Church - Daisy - Red

Frontal assessments:
- Similarities - in what way are these alike?
An apple and banana [fruit]
Table and a chair [furniture]
Tulip, a rose and a daisy [flowers]
- Luria test (fist - knife - palm down - 3 examiner alone; 3 with patient; then get them to do it 6 times alone)- 

Physical examination:
# General examination
Vitals

# Thyroid
Weight
Voice hoarseness 
Hands: Thyroid acropachy and onycholysis; palmar erythema, tremor
Sweat
Lid retraction, exopthalmos, lid lag
Neck midline masses / scars; swallow and tongue protrude (masses and thyroglossal cysts move upwards with swallowing but only TG cysts move with tongue protrusion)
Palpate thyroid gland - size, symmetry, consistency, masses, thrill 
Lymph nodes
Tracheal deviation (goitre)
+/- reflexes; myopathy; pretibial myxoedema

# EPSEs
Gait
Tone
Tremor (postural / intention / resting)
Orobuccal dyskinesia
Abnormal involuntary movements (chorea / athetosis / tics)
Akathisia



Impression:
Diagnosis
# 


Integrative Formulation:
# Presentation and Context:

# Biopsychosocial Considerations:

# Speculative/Theoretical Hypotheses:


Barriers to implementation:
Rapport/alliance:
Alliance:


Prognosis:
Short-term:
Long-term:
Anticipated response to treatment:

Risks
Abs - 
Agg - 
DSH - 
SR - 
SS - 
Vul -  

N.B.: while risk formulation may serve a heuristic purpose during admission, relative risk for all categories for patients admitted to a mental health ward is significantly elevated compared to the general population. Please interpret with care.

Plan:
# Setting and risk management
(consider Crisis safety or distress tolerance plan, consider if patient needs to have overdose prevention education and Naloxone kit.)

# Diagnostic clarification and information gathering
- Sources of collateral history:

# Psychiatric and psychobiological treatment of symptoms

- Relapse prevention

# Other medical treatment / Ix

# D&A

- Relapse prevention

# Psychological

- Relapse prevention

# Social and cultural

- Psychosocial rehabilitation

# Legal and ethical

# Follow-up and referrals to other professionals and organisations

# Discharge arrangements and conditions

-Legal status: __
-CL: 3
-Leave: nil

Dr Trent Koessler
Psychiatry Registrar`
    };

    const templateSelect = document.getElementById("template-select");
    const templateNoteOut = document.getElementById("template-note-out");

    if (templateSelect && templateNoteOut) {
        templateSelect.addEventListener("change", () => {
            const selected = templateSelect.value;
            templateNoteOut.value = templates[selected] || "";
        });

        document.getElementById("template-copy-btn").addEventListener("click", () => {
            templateNoteOut.select();
            navigator.clipboard.writeText(templateNoteOut.value);
        });

        // Load default
        templateNoteOut.value = templates[templateSelect.value] || "";
    }

    // =================================================================
    // PHARMACOKINETICS VISUALISER
    // =================================================================

    let pkChartInstance = null; // keep reference to destroy before re-render

    // Drug preset → half-life autofill
    const pkDrugSelect = document.getElementById("pk-drug-select");
    const pkHalfLifeInput = document.getElementById("pk-half-life");

    if (pkDrugSelect && pkHalfLifeInput) {
        pkDrugSelect.addEventListener("change", () => {
            const val = pkDrugSelect.value;
            if (val) {
                pkHalfLifeInput.value = val;
            }
        });
    }

    // ----------------------------------------------------------------
    // CORE CALCULATION FUNCTIONS
    // ----------------------------------------------------------------

    /**
     * One-compartment superposition model (port of Python _calculate_pk_curve).
     * Returns arrays of time points (in hours) and concentration (arbitrary units).
     */
    function calculatePkCurve(halfLife, durationDays, doseTimes, doseAmounts) {
        const k = Math.LN2 / halfLife;
        const totalHours = durationDays * 24;
        const resolution = Math.min(totalHours * 8, 8000); // cap for performance
        const times = [];
        const concentrations = [];

        for (let i = 0; i <= resolution; i++) {
            const t = (i / resolution) * totalHours;
            let c = 0;
            for (let j = 0; j < doseTimes.length; j++) {
                if (t >= doseTimes[j] && doseAmounts[j] > 0) {
                    c += doseAmounts[j] * Math.exp(-k * (t - doseTimes[j]));
                }
            }
            times.push(t);
            concentrations.push(c);
        }
        return { times, concentrations };
    }

    /**
     * Analytic steady-state calculations (port of Python generate_pk_graph SS block).
     * Only valid when a regular interval regimen is detectable.
     */
    function calculateSteadyState(doseAmount, intervalHours, halfLife) {
        const k = Math.LN2 / halfLife;
        const denominator = 1 - Math.exp(-k * intervalHours);
        if (denominator < 1e-9 || k <= 0) return null;

        const cmaxSS = doseAmount / denominator;
        const cminSS = cmaxSS * Math.exp(-k * intervalHours);
        const cssAvg = (doseAmount / intervalHours) / k;
        const timeTo95SS = (-Math.log(0.05) / k) / 24; // days

        return { cmaxSS, cminSS, cssAvg, timeTo95SS };
    }

    /**
     * Parse the regimen textarea into parallel arrays.
     * Lines: "hour, dose" or "# comment"
     */
    function parseRegimen(text) {
        const doseTimes = [];
        const doseAmounts = [];
        const lines = text.split("\n");
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const parts = trimmed.split(",");
            if (parts.length === 2) {
                const t = parseFloat(parts[0].trim());
                const d = parseFloat(parts[1].trim());
                if (!isNaN(t) && !isNaN(d)) {
                    doseTimes.push(t);
                    doseAmounts.push(d);
                }
            }
        }
        return { doseTimes, doseAmounts };
    }

    /**
     * Detect whether the regimen has a consistent dosing interval.
     * Returns the modal (most common) interval or null.
     */
    function detectInterval(doseTimes) {
        if (doseTimes.length < 2) return null;
        const intervals = [];
        for (let i = 1; i < doseTimes.length; i++) {
            intervals.push(Math.round(doseTimes[i] - doseTimes[i - 1]));
        }
        // Find mode
        const freq = {};
        let maxFreq = 0, modalInterval = null;
        intervals.forEach(iv => {
            freq[iv] = (freq[iv] || 0) + 1;
            if (freq[iv] > maxFreq) { maxFreq = freq[iv]; modalInterval = iv; }
        });
        return modalInterval;
    }

    // ----------------------------------------------------------------
    // CHART RENDERING
    // ----------------------------------------------------------------

    function renderPkChart(times, concentrations, ssData, drugLabel, halfLife) {
        const canvas = document.getElementById("pk-chart");
        if (!canvas) return;

        // Destroy previous chart to avoid memory leak
        if (pkChartInstance) {
            pkChartInstance.destroy();
            pkChartInstance = null;
        }

        // Convert hours → days for x-axis
        const xDays = times.map(t => +(t / 24).toFixed(3));

        const datasets = [
            {
                label: "Drug Concentration",
                data: xDays.map((d, i) => ({ x: d, y: +concentrations[i].toFixed(4) })),
                borderColor: "rgba(79, 70, 229, 0.9)",
                backgroundColor: "rgba(79, 70, 229, 0.08)",
                fill: true,
                tension: 0.3,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
            }
        ];

        // Add steady-state reference lines if available
        if (ssData) {
            const maxDay = xDays[xDays.length - 1];

            datasets.push({
                label: `Avg Css (${ssData.cssAvg.toFixed(2)} AU)`,
                data: [{ x: 0, y: ssData.cssAvg }, { x: maxDay, y: ssData.cssAvg }],
                borderColor: "rgba(147, 51, 234, 0.8)",
                borderDash: [8, 4],
                borderWidth: 1.5,
                pointRadius: 0,
                fill: false,
                tension: 0,
            });

            datasets.push({
                label: `Peak SS / Cmax (${ssData.cmaxSS.toFixed(2)} AU)`,
                data: [{ x: 0, y: ssData.cmaxSS }, { x: maxDay, y: ssData.cmaxSS }],
                borderColor: "rgba(220, 38, 38, 0.7)",
                borderDash: [5, 4],
                borderWidth: 1.5,
                pointRadius: 0,
                fill: false,
                tension: 0,
            });

            datasets.push({
                label: `Trough SS / Cmin (${ssData.cminSS.toFixed(2)} AU)`,
                data: [{ x: 0, y: ssData.cminSS }, { x: maxDay, y: ssData.cminSS }],
                borderColor: "rgba(5, 150, 105, 0.7)",
                borderDash: [5, 4],
                borderWidth: 1.5,
                pointRadius: 0,
                fill: false,
                tension: 0,
            });
        }

        const isDark = document.documentElement.hasAttribute("data-theme");
        const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
        const textColor = isDark ? "#cbd5e1" : "#374151";

        pkChartInstance = new Chart(canvas, {
            type: "line",
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 400 },
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: {
                        display: true,
                        position: "top",
                        labels: { color: textColor, font: { size: 11 }, boxWidth: 20 }
                    },
                    title: {
                        display: true,
                        text: `${drugLabel || "Drug"} — Concentration Over Time (t½ ≈ ${halfLife} hrs)`,
                        color: textColor,
                        font: { size: 13, weight: "bold" }
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(3)} AU`
                        }
                    }
                },
                scales: {
                    x: {
                        type: "linear",
                        title: { display: true, text: "Time (days)", color: textColor },
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    y: {
                        title: { display: true, text: "Concentration (Arbitrary Units)", color: textColor },
                        ticks: { color: textColor },
                        grid: { color: gridColor },
                        beginAtZero: true,
                    }
                }
            }
        });
    }

    // ----------------------------------------------------------------
    // MAIN GENERATE HANDLER
    // ----------------------------------------------------------------

    const pkGenerateBtn = document.getElementById("pk-generate-btn");
    const pkClearBtn = document.getElementById("pk-clear-btn");
    const pkErrorMsg = document.getElementById("pk-error-msg");
    const pkPlaceholder = document.getElementById("pk-chart-placeholder");
    const pkSSPanel = document.getElementById("pk-ss-panel");

    function showPkError(msg) {
        if (pkErrorMsg) {
            pkErrorMsg.textContent = msg;
            pkErrorMsg.style.display = "block";
        }
        if (pkPlaceholder) pkPlaceholder.style.display = "none";
    }

    function clearPkError() {
        if (pkErrorMsg) pkErrorMsg.style.display = "none";
    }

    if (pkGenerateBtn) {
        pkGenerateBtn.addEventListener("click", () => {
            clearPkError();

            // 1. Read and validate half-life
            const halfLifeStr = (pkHalfLifeInput ? pkHalfLifeInput.value : "").trim();
            if (!halfLifeStr) {
                showPkError("⚠️ Please enter a half-life value (hours), or select a drug preset.");
                return;
            }

            // Support range input (e.g. "24-36") → take midpoint
            let halfLife;
            if (halfLifeStr.includes("-")) {
                const parts = halfLifeStr.split("-").map(Number);
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    halfLife = (parts[0] + parts[1]) / 2;
                } else {
                    showPkError("⚠️ Invalid half-life format. Use a number (e.g. 30) or a range (e.g. 24-36).");
                    return;
                }
            } else {
                halfLife = parseFloat(halfLifeStr);
            }

            if (isNaN(halfLife) || halfLife <= 0) {
                showPkError("⚠️ Half-life must be a positive number.");
                return;
            }

            // 2. Read duration
            const durationEl = document.getElementById("pk-duration");
            const durationDays = durationEl ? (parseInt(durationEl.value, 10) || 14) : 14;
            if (durationDays < 1 || durationDays > 730) {
                showPkError("⚠️ Simulation duration must be between 1 and 730 days.");
                return;
            }

            // 3. Parse regimen
            const regimenEl = document.getElementById("pk-regimen");
            const regimenText = regimenEl ? regimenEl.value : "";
            const { doseTimes, doseAmounts } = parseRegimen(regimenText);

            if (doseTimes.length === 0) {
                showPkError("⚠️ No valid dose entries found. Use format: hour, dose_amount (one per line).");
                return;
            }

            // 4. Run PK model
            const { times, concentrations } = calculatePkCurve(halfLife, durationDays, doseTimes, doseAmounts);

            // 5. Detect interval and compute steady-state
            const interval = detectInterval(doseTimes);
            let ssData = null;
            if (interval && interval > 0 && doseAmounts.length >= 2) {
                // Use the first dose amount as reference (assumes uniform dosing)
                const refDose = doseAmounts[0];
                ssData = calculateSteadyState(refDose, interval, halfLife);
            }

            // 6. Determine drug label
            const selectedOption = pkDrugSelect ? pkDrugSelect.options[pkDrugSelect.selectedIndex] : null;
            const drugLabel = (selectedOption && selectedOption.value) ? selectedOption.text : "Custom Drug";

            // 7. Check if LAI antipsychotic (warn user)
            const isLAI = selectedOption && selectedOption.parentElement &&
                selectedOption.parentElement.label &&
                selectedOption.parentElement.label.includes("LAI Antipsychotic");

            // 8. Update SS panel
            if (ssData && pkSSPanel) {
                pkSSPanel.style.display = "block";
                document.getElementById("pk-ss-avg").textContent = ssData.cssAvg.toFixed(3) + " AU";
                document.getElementById("pk-ss-max").textContent = ssData.cmaxSS.toFixed(3) + " AU";
                document.getElementById("pk-ss-min").textContent = ssData.cminSS.toFixed(3) + " AU";
                const ssTimeDays = ssData.timeTo95SS;
                document.getElementById("pk-ss-time").textContent =
                    ssTimeDays >= 1
                        ? ssTimeDays.toFixed(1) + " days"
                        : (ssTimeDays * 24).toFixed(1) + " hrs";
            } else if (pkSSPanel) {
                pkSSPanel.style.display = "none";
            }

            // 9. Hide placeholder and render chart
            if (pkPlaceholder) pkPlaceholder.style.display = "none";

            let chartTitle = drugLabel;
            if (isLAI) chartTitle += " ⚠️ (Approx. – complex absorption PK)";
            renderPkChart(times, concentrations, ssData, chartTitle, halfLife);
        });
    }

    if (pkClearBtn) {
        pkClearBtn.addEventListener("click", () => {
            if (pkChartInstance) { pkChartInstance.destroy(); pkChartInstance = null; }
            if (pkSSPanel) pkSSPanel.style.display = "none";
            if (pkPlaceholder) pkPlaceholder.style.display = "block";
            if (pkErrorMsg) pkErrorMsg.style.display = "none";
            if (pkDrugSelect) pkDrugSelect.selectedIndex = 0;
            if (pkHalfLifeInput) pkHalfLifeInput.value = "";
            const durationEl = document.getElementById("pk-duration");
            if (durationEl) durationEl.value = 14;
            const regimenEl = document.getElementById("pk-regimen");
            if (regimenEl) regimenEl.value = "# Example: 30mg Methadone daily\n0, 30\n24, 30\n48, 30\n72, 30\n96, 30\n120, 30\n144, 30";
        });
    }

    // ----------------------------------------------------------------
    // OTP Script Maker & Visualiser Logic
    // ----------------------------------------------------------------

    const generateScriptBtn = document.getElementById("generate-script-btn");
    const scriptVisualiser = document.getElementById("script-visualiser");

    if (generateScriptBtn) {
        generateScriptBtn.addEventListener("click", () => {
            // Read inputs
            const name = document.getElementById("script-patient-name").value || "______________________";
            const dob = document.getElementById("script-dob").value || "__/__/____";
            const med = document.getElementById("script-med").value || "______________________";
            const dose = document.getElementById("script-dose").value || "____";
            const freq = document.getElementById("script-freq").value || "________________";
            const location = document.getElementById("script-location").value || "______________________";
            const interval = document.getElementById("script-repeat-interval").value || "________";
            const start = document.getElementById("script-start").value || "__/__/____";
            const end = document.getElementById("script-end").value || "__/__/____";

            // Today's date for script date
            const today = new Date();
            const dateStr = today.toLocaleDateString('en-GB'); // DD/MM/YYYY format

            // Populate visualiser
            document.getElementById("out-script-date").textContent = dateStr;
            document.getElementById("out-script-name").textContent = name;
            document.getElementById("out-script-dob").textContent = dob;
            document.getElementById("out-script-med").textContent = med;
            document.getElementById("out-script-dose").textContent = dose;
            document.getElementById("out-script-freq").textContent = freq;
            document.getElementById("out-script-loc").textContent = location;
            document.getElementById("out-script-start").textContent = start;
            document.getElementById("out-script-end").textContent = end;
            document.getElementById("out-script-interval").textContent = interval;

            // Show visualiser
            if (scriptVisualiser) {
                scriptVisualiser.style.display = "block";
            }
        });
    }

    // =================================================================
    // DOSE EQUIVALENTS CONVERTERS
    // =================================================================
    function setupEquivalentsConverters() {
        const apFromDrug = document.getElementById("ap-from-drug");
        const apFromDose = document.getElementById("ap-from-dose");
        const apCpzOut = document.getElementById("ap-cpz-out");
        const apOlzOut = document.getElementById("ap-olz-out");

        const apMedians = {
            aripiprazole: 30,
            clozapine: 400,
            haloperidol: 10,
            olanzapine: 20,
            paliperidone: 9,
            quetiapine: 750,
            risperidone: 6,
            ziprasidone: 160,
            chlorpromazine: 600
        };

        function calculateApEquivalents() {
            const drug = apFromDrug.value;
            const dose = parseFloat(apFromDose.value);

            if (isNaN(dose) || dose <= 0) {
                apCpzOut.textContent = "0.00 mg";
                apOlzOut.textContent = "0.00 mg";
                return;
            }

            const median = apMedians[drug];
            if (!median) return;

            // CPZ median is 600 mg
            const cpzEquivalent = (dose / median) * 600;
            // OLZ median is 20 mg
            const olzEquivalent = (dose / median) * 20;

            apCpzOut.textContent = `${cpzEquivalent.toFixed(2)} mg`;
            apOlzOut.textContent = `${olzEquivalent.toFixed(2)} mg`;
        }

        if (apFromDrug && apFromDose) {
            apFromDrug.addEventListener("change", calculateApEquivalents);
            apFromDose.addEventListener("input", calculateApEquivalents);
        }

        // Benzodiazepine equivalents
        const benzoFromDrug = document.getElementById("benzo-from-drug");
        const benzoFromDose = document.getElementById("benzo-from-dose");
        const benzoToDrug = document.getElementById("benzo-to-drug");
        const benzoDdeOut = document.getElementById("benzo-dde-out");
        const benzoTargetOut = document.getElementById("benzo-target-out");

        const benzoFactors = {
            diazepam: 10,
            alprazolam: 0.5,
            clonazepam: 0.5,
            lorazepam: 1,
            oxazepam: 30,
            temazepam: 20,
            nitrazepam: 5
        };

        function calculateBenzoEquivalents() {
            const fromDrug = benzoFromDrug.value;
            const toDrug = benzoToDrug.value;
            const dose = parseFloat(benzoFromDose.value);

            if (isNaN(dose) || dose <= 0) {
                benzoDdeOut.textContent = "0.00 mg";
                benzoTargetOut.textContent = "0.00 mg";
                return;
            }

            const fromFactor = benzoFactors[fromDrug];
            const toFactor = benzoFactors[toDrug];

            if (!fromFactor || !toFactor) return;

            // Calculate Diazepam Dose Equivalent (DDE)
            const dde = (dose / fromFactor) * 10;
            // Calculate target drug equivalent from DDE
            const targetEquivalent = (dde / 10) * toFactor;

            benzoDdeOut.textContent = `${dde.toFixed(2)} mg`;
            benzoTargetOut.textContent = `${targetEquivalent.toFixed(2)} mg`;
        }

        if (benzoFromDrug && benzoFromDose && benzoToDrug) {
            benzoFromDrug.addEventListener("change", calculateBenzoEquivalents);
            benzoFromDose.addEventListener("input", calculateBenzoEquivalents);
            benzoToDrug.addEventListener("change", calculateBenzoEquivalents);
        }
    }

    // =================================================================
    // PATIENT REVIEW WORKSPACE (OCA) LOGIC
    // =================================================================

    const ocaEditor = document.getElementById("oca-editor");

    // 1. Navigation & Default Template Load
    if (ocaEditor && !ocaEditor.value.trim()) {
        ocaEditor.value = templates.oca || "";
    }

    // 2. Sidebar Tab Toggling
    const ocaTabBtns = document.querySelectorAll(".oca-tab-btn");
    ocaTabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.ocaTab;
            ocaTabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            document.querySelectorAll(".oca-panel-content").forEach(content => {
                content.classList.remove("active");
            });
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.add("active");
            }
        });
    });

    // 3. Auto-save to Local File via File System Access API
    let ocaFileHandle = null;
    const ocaConnectBtn = document.getElementById("oca-connect-btn");
    const ocaSaveStatus = document.getElementById("oca-save-status");
    const ocaStatusText = document.getElementById("oca-status-text");

    async function writeToFile(fileHandle, contents) {
        try {
            const writable = await fileHandle.createWritable();
            await writable.write(contents);
            await writable.close();
            return true;
        } catch (err) {
            console.error("Auto-save failed", err);
            return false;
        }
    }

    let saveTimeout = null;
    function triggerAutoSave() {
        if (!ocaFileHandle) return;

        ocaSaveStatus.className = "oca-save-status-saving";
        ocaStatusText.textContent = "Saving...";

        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            if (!ocaFileHandle) return;
            const success = await writeToFile(ocaFileHandle, ocaEditor.value);
            if (success) {
                ocaSaveStatus.className = "oca-save-status-success";
                ocaStatusText.textContent = "Auto-saved";
            } else {
                ocaSaveStatus.className = "oca-save-status-error";
                ocaStatusText.textContent = "Error auto-saving";
            }
        }, 500);
    }

    // Connect new file (save picker)
    if (ocaConnectBtn) {
        ocaConnectBtn.addEventListener("click", async () => {
            try {
                const opts = {
                    suggestedName: 'patient_review_assessment.txt',
                    types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt'] } }],
                };
                ocaFileHandle = await window.showSaveFilePicker(opts);
                ocaSaveStatus.className = "oca-save-status-success";
                ocaStatusText.textContent = "Connected to file";
                triggerAutoSave();
            } catch (err) {
                console.warn("User cancelled or file access denied", err);
                ocaSaveStatus.className = "oca-save-status-idle";
                ocaStatusText.textContent = "Not connected (Auto-save offline)";
            }
        });
    }

    // Load existing file (open picker)
    const ocaLoadBtn = document.getElementById("oca-load-btn");
    if (ocaLoadBtn) {
        ocaLoadBtn.addEventListener("click", async () => {
            try {
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt'] } }],
                    multiple: false
                });
                const file = await fileHandle.getFile();
                const contents = await file.text();
                if (ocaEditor) {
                    // Store undo snapshot before loading
                    ocaUndoSnapshot = ocaEditor.value;
                    ocaUndoBtn.disabled = false;
                    ocaEditor.value = contents;
                    // Re-use this handle for auto-saving too
                    ocaFileHandle = fileHandle;
                    ocaSaveStatus.className = "oca-save-status-success";
                    ocaStatusText.textContent = `Loaded: ${file.name}`;
                }
            } catch (err) {
                console.warn("File open cancelled", err);
            }
        });
    }

    // Undo Last Insertion
    let ocaUndoSnapshot = null;
    const ocaUndoBtn = document.getElementById("oca-undo-btn");

    function saveUndoSnapshot() {
        if (ocaEditor) {
            ocaUndoSnapshot = ocaEditor.value;
            if (ocaUndoBtn) ocaUndoBtn.disabled = false;
        }
    }

    if (ocaUndoBtn) {
        ocaUndoBtn.addEventListener("click", () => {
            if (ocaUndoSnapshot !== null && ocaEditor) {
                ocaEditor.value = ocaUndoSnapshot;
                ocaUndoSnapshot = null;
                ocaUndoBtn.disabled = true;
                triggerAutoSave();
            }
        });
    }

    if (ocaEditor) {
        ocaEditor.addEventListener("input", triggerAutoSave);
    }

    // Session Timer
    const ocaTimerEl = document.getElementById("oca-session-timer");
    let ocaSessionStart = null;
    let ocaTimerInterval = null;

    function startSessionTimer() {
        if (ocaTimerInterval) return; // already running
        ocaSessionStart = Date.now();
        ocaTimerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - ocaSessionStart) / 1000);
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            const display = `⏱ ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            if (ocaTimerEl) {
                ocaTimerEl.textContent = display;
                // Warn after 60 mins (yellow tint) — useful for billing awareness
                ocaTimerEl.classList.toggle("timer-warning", mins >= 60);
            }
        }, 1000);
    }

    // Start timer when OCA page is navigated to
    document.querySelectorAll(".big-button[data-page='oca-assessment-page']").forEach(btn => {
        btn.addEventListener("click", () => startSessionTimer());
    });
    // Also start if already on the page on load
    const ocaPage = document.getElementById("oca-assessment-page");
    if (ocaPage && ocaPage.classList.contains("active")) {
        startSessionTimer();
    }

    // 4. Live-updating MSE Generator Sidebar
    const ocaMseMotorChecks = ["oca-mse-motor-tremor", "oca-mse-motor-chorea", "oca-mse-motor-athetosis", "oca-mse-motor-dystonias", "oca-mse-motor-tics", "oca-mse-motor-catatonic"];
    const ocaMseMannerismChecks = ["oca-mse-mannerism-stereotypies", "oca-mse-mannerism-compulsions", "oca-mse-mannerism-lip-smacking", "oca-mse-mannerism-wringing-hands"];
    const ocaMseHallucinationChecks = ["oca-mse-hallucination-denies", "oca-mse-hallucination-auditory", "oca-mse-hallucination-visual", "oca-mse-hallucination-tactile", "oca-mse-hallucination-olfactory"];
    const ocaMseThoughtFormChecks = ["oca-mse-thought-form-coherent", "oca-mse-thought-form-circumstantial", "oca-mse-thought-form-tangential", "oca-mse-thought-form-loosening", "oca-mse-thought-form-salad"];
    const ocaMseOtherThoughtChecks = ["oca-mse-other-obsessions", "oca-mse-other-ruminations", "oca-mse-other-preoccupations"];
    const ocaMseDelusionChecks = ["oca-mse-delusion-none", "oca-mse-delusion-persecutory", "oca-mse-delusion-grandiose", "oca-mse-delusion-referential", "oca-mse-delusion-somatic", "oca-mse-delusion-nihilistic", "oca-mse-delusion-control", "oca-mse-delusion-insertion"];
    const ocaMseInsightRadios = ["oca-mse-insight-good", "oca-mse-insight-partial", "oca-mse-insight-poor", "oca-mse-insight-absent"];

    function getOcaCheckedLabels(list) {
        const labels = [];
        list.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.checked) {
                labels.push(el.value);
            }
        });
        return labels;
    }

    function getOcaCheckedLabelsExclude(list, excludeVal) {
        const labels = [];
        list.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.checked && el.value !== excludeVal) {
                labels.push(el.value);
            }
        });
        return labels;
    }

    function updateMseInOcaText() {
        if (!ocaEditor) return;
        let text = ocaEditor.value;

        const consciousness = document.getElementById("oca-mse-consciousness").value;
        const ageAppearance = document.getElementById("oca-mse-age-appearance").value;
        const habitus = document.getElementById("oca-mse-habitus").value;
        const facialExpression = document.getElementById("oca-mse-facial-expression").value;
        const hygiene = document.getElementById("oca-mse-hygiene").value;
        const appearanceFree = document.getElementById("oca-mse-appearance-free").value.trim();

        const attitude = document.getElementById("oca-mse-attitude").value;
        const eyeContact = document.getElementById("oca-mse-eye-contact").value;
        const posture = document.getElementById("oca-mse-posture").value;
        const activity = document.getElementById("oca-mse-activity").value;
        const behaviourFree = document.getElementById("oca-mse-behaviour-free").value.trim();

        const speechRate = document.getElementById("oca-mse-speech-rate").value;
        const speechVolume = document.getElementById("oca-mse-speech-volume").value;
        const speechProsody = document.getElementById("oca-mse-speech-prosody").value;
        const speechArticulation = document.getElementById("oca-mse-speech-articulation").value;
        const speechFree = document.getElementById("oca-mse-speech-free").value.trim();

        const mood = document.getElementById("oca-mse-mood").value.trim();
        const affectType = document.getElementById("oca-mse-affect-type").value;
        const affectRange = document.getElementById("oca-mse-affect-range").value;
        const affectIntensity = document.getElementById("oca-mse-affect-intensity").value;
        const affectMobility = document.getElementById("oca-mse-affect-mobility").value;
        const affectCongruence = document.getElementById("oca-mse-affect-congruence").value;
        const affectFree = document.getElementById("oca-mse-affect-free").value.trim();

        const perceptionFree = document.getElementById("oca-mse-perception-free").value.trim();
        const hallucinationDesc = document.getElementById("oca-mse-hallucination-desc").value.trim();

        const si = document.getElementById("oca-mse-si").value;
        const siDesc = document.getElementById("oca-mse-si-desc").value.trim();
        const shi = document.getElementById("oca-mse-shi").value.trim();
        const tho = document.getElementById("oca-mse-tho").value.trim();
        const delusionDesc = document.getElementById("oca-mse-delusion-desc").value.trim();

        const judgement = document.getElementById("oca-mse-judgement").value;
        const orientation = document.getElementById("oca-mse-orientation").value;
        const concentration = document.getElementById("oca-mse-concentration").value;
        const abstraction = document.getElementById("oca-mse-abstraction").value.trim();
        const visuospatial = document.getElementById("oca-mse-visuospatial").value.trim();

        const parts = [];

        // 1. Appearance
        const appParts = [];
        appParts.push(`appears ${ageAppearance.toLowerCase()}.`);
        if (habitus !== "(Select...)") {
            appParts.push(`Build is ${habitus.toLowerCase()}.`);
        }
        if (facialExpression !== "(Select...)") {
            appParts.push(`Facial expression is ${facialExpression.toLowerCase()}.`);
        }
        appParts.push(`Hygiene is ${hygiene.toLowerCase()}.`);
        if (appearanceFree) appParts.push(appearanceFree);
        parts.push(`Appearance: Level of consciousness is ${consciousness.toLowerCase()}. ` + appParts.join(" "));

        // 2. Behavior
        const behParts = [];
        behParts.push(`Attitude is ${attitude.toLowerCase()}.`);
        behParts.push(`Eye contact is ${eyeContact.toLowerCase()}.`);
        behParts.push(`Posture is ${posture.toLowerCase()}.`);
        behParts.push(`Psychomotor activity is ${activity.toLowerCase()}.`);

        const motors = getOcaCheckedLabels(ocaMseMotorChecks);
        if (motors.length > 0) {
            behParts.push(`Abnormal movements noted: ${motors.join(", ").toLowerCase()}.`);
        }
        const mannerisms = getOcaCheckedLabels(ocaMseMannerismChecks);
        if (mannerisms.length > 0) {
            behParts.push(`Mannerisms noted: ${mannerisms.join(", ").toLowerCase()}.`);
        }
        if (behaviourFree) behParts.push(behaviourFree);
        parts.push(`Behaviour: ` + behParts.join(" "));

        // 3. Speech
        const speechParts = [];
        speechParts.push(`Rate is ${speechRate.toLowerCase()}, volume is ${speechVolume.toLowerCase()}, with ${speechArticulation.toLowerCase()} articulation and ${speechProsody.toLowerCase()} tone.`);
        if (speechFree) speechParts.push(speechFree);
        parts.push(`Speech: ` + speechParts.join(" "));

        // 4. Emotions
        const emoParts = [];
        if (mood) {
            emoParts.push(`Mood is subjectively '${mood}'.`);
        } else {
            emoParts.push(`Mood is euthymic.`);
        }
        emoParts.push(`Affect is ${affectType.toLowerCase()} with a ${affectRange.toLowerCase()} range and ${affectIntensity.toLowerCase()} intensity. Mobility is ${affectMobility.toLowerCase()}. It is ${affectCongruence.toLowerCase()}.`);
        if (affectFree) emoParts.push(affectFree);
        parts.push(`Emotions: ` + emoParts.join(" "));

        // 5. Perceptions
        const percParts = [];
        const hallucinations = getOcaCheckedLabelsExclude(ocaMseHallucinationChecks, "Denies hallucinations");
        if (hallucinations.length > 0) {
            const descStr = hallucinationDesc ? ` (describes: ${hallucinationDesc})` : "";
            percParts.push(`Reports ${hallucinations.join(", ").toLowerCase()} hallucinations${descStr}.`);
        } else {
            percParts.push(`Denies hallucinations.`);
        }
        if (perceptionFree) percParts.push(perceptionFree);
        parts.push(`Perceptions: ` + percParts.join(" "));

        // 6. Thought
        const tForm = getOcaCheckedLabelsExclude(ocaMseThoughtFormChecks, "Coherent and logical");
        const formStr = "Form: " + (tForm.length > 0 ? tForm.join(", ").toLowerCase() : "coherent and logical.");

        const contentParts = [];
        if (si !== "Denied") {
            const descStr = siDesc ? ` (details: ${siDesc})` : "";
            contentParts.push(`suicidal ideation is present (${si.toLowerCase()})${descStr}`);
        } else {
            contentParts.push(`denies suicidal ideation`);
        }

        contentParts.push(shi ? `self-harm ideation: ${shi}` : `denies self-harm ideation`);
        contentParts.push(tho ? `homicidal/violent ideation: ${tho}` : `denies homicidal/violent ideation`);

        const otherThoughts = getOcaCheckedLabels(ocaMseOtherThoughtChecks);
        if (otherThoughts.length > 0) {
            contentParts.push(`other phenomena include ${otherThoughts.join(", ").toLowerCase()}`);
        }

        const delusions = getOcaCheckedLabelsExclude(ocaMseDelusionChecks, "No delusions present");
        if (delusions.length > 0) {
            const descStr = delusionDesc ? ` (details: ${delusionDesc})` : "";
            contentParts.push(`expresses delusions of a ${delusions.join(", ").toLowerCase()} nature${descStr}`);
        } else {
            contentParts.push(`denies delusions`);
        }

        const contentStr = "Content: " + contentParts.join("; ") + ".";
        parts.push(`Thought:\n  - ${formStr}\n  - ${contentStr}`);

        // 7. Insight & Judgement
        let insightChecked = "Good";
        ocaMseInsightRadios.forEach(id => {
            const r = document.getElementById(id);
            if (r && r.checked) {
                insightChecked = r.value;
            }
        });
        parts.push(`Insight/Judgement: Insight is ${insightChecked.toLowerCase()}. Judgement appears ${judgement.toLowerCase()}.`);

        // 8. Cognition
        const cogParts = [];
        cogParts.push(`Is ${orientation.toLowerCase()}.`);
        cogParts.push(`Attention and concentration appear ${concentration.toLowerCase()}.`);
        if (abstraction) cogParts.push(`Abstraction is ${abstraction}.`);
        if (visuospatial) cogParts.push(`Visuoconstructional ability is ${visuospatial}.`);
        parts.push(`Cognition: ` + cogParts.join(" "));

        const compiledMse = `MSE\n` + parts.join("\n");
        const fixedOcaMseDetails = `Orientation: Date - Month - Year - Day - Place - Suburb\n\nDelayed Recall: Face - Velvet - Church - Daisy - Red\n\nFrontal assessments:\n- Similarities - in what way are these alike?\nAn apple and banana [fruit]\nTable and a chair [furniture]\nTulip, a rose and a daisy [flowers]\n- Luria test (fist - knife - palm down - 3 examiner alone; 3 with patient; then get them to do it 6 times alone)-`;

        const startRegex = /^MSE\b/m;
        const endRegex = /^Physical examination:/m;

        const startMatch = text.match(startRegex);
        const endMatch = text.match(endRegex);

        if (startMatch && endMatch && startMatch.index < endMatch.index) {
            const beforeMse = text.substring(0, startMatch.index);
            const afterMse = text.substring(endMatch.index);
            saveUndoSnapshot();
            ocaEditor.value = beforeMse + compiledMse + "\n\n" + fixedOcaMseDetails + "\n\n\n" + afterMse;
        }
    }

    const ocaMseSimpleInputIds = [
        "oca-mse-consciousness", "oca-mse-age-appearance", "oca-mse-habitus", "oca-mse-facial-expression", "oca-mse-hygiene", "oca-mse-appearance-free",
        "oca-mse-attitude", "oca-mse-eye-contact", "oca-mse-posture", "oca-mse-activity", "oca-mse-behaviour-free",
        "oca-mse-speech-rate", "oca-mse-speech-volume", "oca-mse-speech-prosody", "oca-mse-speech-articulation", "oca-mse-speech-free",
        "oca-mse-mood", "oca-mse-affect-type", "oca-mse-affect-range", "oca-mse-affect-intensity", "oca-mse-affect-mobility", "oca-mse-affect-congruence", "oca-mse-affect-free",
        "oca-mse-hallucination-desc", "oca-mse-perception-free",
        "oca-mse-si", "oca-mse-si-desc", "oca-mse-shi", "oca-mse-tho", "oca-mse-delusion-desc",
        "oca-mse-judgement", "oca-mse-orientation", "oca-mse-concentration", "oca-mse-abstraction", "oca-mse-visuospatial"
    ];

    ocaMseSimpleInputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const eventType = el.tagName === "INPUT" || el.tagName === "TEXTAREA" ? "input" : "change";
            el.addEventListener(eventType, () => {
                updateMseInOcaText();
                triggerAutoSave();
            });
        }
    });

    // Register check/uncheck denies behavior for Hallucinations
    const ocaDeniesHal = document.getElementById("oca-mse-hallucination-denies");
    const ocaHalContainer = document.getElementById("oca-mse-hallucination-desc-container");
    const ocaHalDesc = document.getElementById("oca-mse-hallucination-desc");

    if (ocaDeniesHal) {
        ocaDeniesHal.addEventListener("change", () => {
            if (ocaDeniesHal.checked) {
                ocaMseHallucinationChecks.forEach(id => {
                    if (id !== "oca-mse-hallucination-denies") {
                        const el = document.getElementById(id);
                        if (el) el.checked = false;
                    }
                });
                if (ocaHalContainer) ocaHalContainer.style.display = "none";
                if (ocaHalDesc) ocaHalDesc.value = "";
            }
            updateMseInOcaText();
            triggerAutoSave();
        });
    }

    ocaMseHallucinationChecks.forEach(id => {
        if (id !== "oca-mse-hallucination-denies") {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("change", () => {
                    if (el.checked) {
                        if (ocaDeniesHal) ocaDeniesHal.checked = false;
                        if (ocaHalContainer) ocaHalContainer.style.display = "block";
                    } else {
                        const anyChecked = ocaMseHallucinationChecks.some(hid => {
                            if (hid === "oca-mse-hallucination-denies") return false;
                            const hEl = document.getElementById(hid);
                            return hEl && hEl.checked;
                        });
                        if (!anyChecked) {
                            if (ocaDeniesHal) ocaDeniesHal.checked = true;
                            if (ocaHalContainer) ocaHalContainer.style.display = "none";
                            if (ocaHalDesc) ocaHalDesc.value = "";
                        }
                    }
                    updateMseInOcaText();
                    triggerAutoSave();
                });
            }
        }
    });

    // Register SI visibility toggle
    const ocaSiSelect = document.getElementById("oca-mse-si");
    const ocaSiContainer = document.getElementById("oca-mse-si-desc-container");
    const ocaSiDesc = document.getElementById("oca-mse-si-desc");
    if (ocaSiSelect) {
        ocaSiSelect.addEventListener("change", () => {
            if (ocaSiSelect.value !== "Denied") {
                if (ocaSiContainer) ocaSiContainer.style.display = "block";
            } else {
                if (ocaSiContainer) ocaSiContainer.style.display = "none";
                if (ocaSiDesc) ocaSiDesc.value = "";
            }
            updateMseInOcaText();
            triggerAutoSave();
        });
    }

    // Register check/uncheck denies behavior for Delusions
    const ocaDeniesDel = document.getElementById("oca-mse-delusion-none");
    const ocaDelContainer = document.getElementById("oca-mse-delusion-desc-container");
    const ocaDelDesc = document.getElementById("oca-mse-delusion-desc");

    if (ocaDeniesDel) {
        ocaDeniesDel.addEventListener("change", () => {
            if (ocaDeniesDel.checked) {
                ocaMseDelusionChecks.forEach(id => {
                    if (id !== "oca-mse-delusion-none") {
                        const el = document.getElementById(id);
                        if (el) el.checked = false;
                    }
                });
                if (ocaDelContainer) ocaDelContainer.style.display = "none";
                if (ocaDelDesc) ocaDelDesc.value = "";
            }
            updateMseInOcaText();
            triggerAutoSave();
        });
    }

    ocaMseDelusionChecks.forEach(id => {
        if (id !== "oca-mse-delusion-none") {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("change", () => {
                    if (el.checked) {
                        if (ocaDeniesDel) ocaDeniesDel.checked = false;
                        if (ocaDelContainer) ocaDelContainer.style.display = "block";
                    } else {
                        const anyChecked = ocaMseDelusionChecks.some(did => {
                            if (did === "oca-mse-delusion-none") return false;
                            const dEl = document.getElementById(did);
                            return dEl && dEl.checked;
                        });
                        if (!anyChecked) {
                            if (ocaDeniesDel) ocaDeniesDel.checked = true;
                            if (ocaDelContainer) ocaDelContainer.style.display = "none";
                            if (ocaDelDesc) ocaDelDesc.value = "";
                        }
                    }
                    updateMseInOcaText();
                    triggerAutoSave();
                });
            }
        }
    });

    const ocaMseOtherChecks = [
        ...ocaMseMotorChecks,
        ...ocaMseMannerismChecks,
        ...ocaMseThoughtFormChecks,
        ...ocaMseOtherThoughtChecks
    ];
    ocaMseOtherChecks.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("change", () => {
                updateMseInOcaText();
                triggerAutoSave();
            });
        }
    });

    ocaMseInsightRadios.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("change", () => {
                updateMseInOcaText();
                triggerAutoSave();
            });
        }
    });

    // 5. Formulation Builder & Gemini AI
    function updateFormulationInOcaText() {
        if (!ocaEditor) return;
        let text = ocaEditor.value;

        // 1. Synthesize Presenting Problem
        const name = document.getElementById("oca-form-pp-name").value.trim();
        const age = document.getElementById("oca-form-pp-age").value.trim();
        const gender = document.getElementById("oca-form-pp-gender").value.trim();
        const duration = document.getElementById("oca-form-pp-duration").value.trim();
        const symptoms = document.getElementById("oca-form-pp-symptoms").value.trim();
        const context = document.getElementById("oca-form-pp-context").value.trim();
        const coping = document.getElementById("oca-form-pp-coping").value.trim();

        // Get pronouns based on entered gender
        function getPronouns(genderStr) {
            const g = (genderStr || "").toLowerCase().trim();
            if (g === "female" || g === "woman" || g === "she" || g === "f" || g === "girl") {
                return { subject: "she", object: "her", possessive: "her", possessivePronoun: "hers", verb: "reports", presents: "presents", copes: "copes", CopingCapitalized: "She reports" };
            } else if (g === "male" || g === "man" || g === "he" || g === "m" || g === "boy") {
                return { subject: "he", object: "him", possessive: "his", possessivePronoun: "his", verb: "reports", presents: "presents", copes: "copes", CopingCapitalized: "He reports" };
            } else {
                return { subject: "they", object: "them", possessive: "their", possessivePronoun: "theirs", verb: "report", presents: "present", copes: "cope", CopingCapitalized: "They report" };
            }
        }

        const pronouns = getPronouns(gender);

        const ppTextParts = [];
        if (name && age && gender) {
            ppTextParts.push(`${name} is a ${age}-year-old ${gender}`);
        }
        if (symptoms) {
            let durStr = duration || "a history";
            const lowerDur = durStr.toLowerCase().trim();
            let symptomsPhrase = "";
            if (lowerDur.endsWith("of")) {
                symptomsPhrase = `who ${pronouns.presents} with ${durStr} ${symptoms}`;
            } else {
                symptomsPhrase = `who ${pronouns.presents} with ${durStr} of ${symptoms}`;
            }

            let nextStartsNewSentence = false;
            if (context) {
                const lowerContext = context.toLowerCase().trim();
                if (lowerContext.startsWith("precipitated by") || lowerContext.startsWith("occurring")) {
                    nextStartsNewSentence = true;
                }
            }

            if (!context || nextStartsNewSentence) {
                symptomsPhrase += ".";
            }
            ppTextParts.push(symptomsPhrase);
        } else if (ppTextParts.length > 0 && !context) {
            ppTextParts[ppTextParts.length - 1] += ".";
        }

        if (context) {
            let contextStr = context;
            const lowerContext = contextStr.toLowerCase().trim();
            if (lowerContext.startsWith("in the context of")) {
                ppTextParts.push(`${contextStr}.`);
            } else if (lowerContext.startsWith("precipitated by") || lowerContext.startsWith("occurring")) {
                const capitalizedContext = contextStr.charAt(0).toUpperCase() + contextStr.slice(1);
                ppTextParts.push(`${capitalizedContext}.`);
            } else {
                ppTextParts.push(`in the context of ${contextStr}.`);
            }
        }

        if (coping) {
            let copingStr = coping;
            const lowerCoping = copingStr.toLowerCase().trim();
            if (lowerCoping.startsWith("they report") ||
                lowerCoping.startsWith("he reports") ||
                lowerCoping.startsWith("she reports") ||
                lowerCoping.startsWith("patient reports")) {
                let rest = copingStr;
                if (lowerCoping.startsWith("they report")) rest = copingStr.slice(11).trim();
                else if (lowerCoping.startsWith("he reports")) rest = copingStr.slice(10).trim();
                else if (lowerCoping.startsWith("she reports")) rest = copingStr.slice(11).trim();
                else if (lowerCoping.startsWith("patient reports")) rest = copingStr.slice(15).trim();

                ppTextParts.push(`${pronouns.CopingCapitalized} ${rest}.`);
            } else if (lowerCoping.startsWith("resulting in")) {
                ppTextParts.push(`This is ${copingStr}.`);
            } else {
                ppTextParts.push(`${pronouns.CopingCapitalized} ${copingStr}.`);
            }
        }

        // Helper to get factors text for a category and subcategory
        function getOcaFactorsText(pKeyFilter, subKeyFilter) {
            const details = [];
            const subCats = factorsMap[pKeyFilter];
            if (!subCats) return details;

            if (subKeyFilter) {
                const factorsList = subCats[subKeyFilter] || [];
                factorsList.forEach(factor => {
                    const id = `oca-${pKeyFilter}_${subKeyFilter}_${factor.replace(/\//g, '_').replace(/ /g, '_')}`;
                    const el = document.getElementById(id);
                    if (el && el.value.trim()) {
                        details.push(el.value.trim());
                    }
                });
            } else {
                Object.keys(subCats).forEach(sk => {
                    const factorsList = subCats[sk] || [];
                    factorsList.forEach(factor => {
                        const id = `oca-${pKeyFilter}_${sk}_${factor.replace(/\//g, '_').replace(/ /g, '_')}`;
                        const el = document.getElementById(id);
                        if (el && el.value.trim()) {
                            details.push(el.value.trim());
                        }
                    });
                });
            }
            return details;
        }

        // 2. Generate Narrative Formulation
        const narrativeParts = [];
        const bioDiathesis = getOcaFactorsText("Predisposing", "Biological");
        if (bioDiathesis.length > 0) {
            const subjectPronoun = pronouns.subject.charAt(0).toUpperCase() + pronouns.subject.slice(1);
            const verbHave = pronouns.subject === "they" ? "have" : "has";
            narrativeParts.push(`${subjectPronoun} ${verbHave} a biological diathesis of mental illness from ${bioDiathesis.join(", ")}.`);
        }
        const psychPredisposition = getOcaFactorsText("Predisposing", "Psychological");
        if (psychPredisposition.length > 0) {
            const possessivePronoun = pronouns.possessive.charAt(0).toUpperCase() + pronouns.possessive.slice(1);
            narrativeParts.push(`${possessivePronoun} psychological predisposition to illness includes ${psychPredisposition.join(", ")}.`);
        }
        const socialFactors = getOcaFactorsText("Predisposing", "Social");
        if (socialFactors.length > 0) {
            narrativeParts.push(`This is further augmented by social factors of ${socialFactors.join(", ")}.`);
        }

        const precipitatingFactors = getOcaFactorsText("Precipitating");
        if (precipitatingFactors.length > 0) {
            narrativeParts.push(`Precipitating this presentation was ${precipitatingFactors.join(", ")}.`);
        }
        const perpetuatingFactors = getOcaFactorsText("Perpetuating");
        if (perpetuatingFactors.length > 0) {
            narrativeParts.push(`Perpetuating these problems, the patient faces a milieu of ${perpetuatingFactors.join(", ")}.`);
        }
        const protectiveFactors = getOcaFactorsText("Protective");
        if (protectiveFactors.length > 0) {
            const subjectPronoun = pronouns.subject === "they" ? "they" : pronouns.subject;
            const verbHave = pronouns.subject === "they" ? "have" : "has";
            narrativeParts.push(`Protectively, ${subjectPronoun} ${verbHave} ${protectiveFactors.join(", ")}.`);
        }

        // 3. Compile Frameworks
        const activeFrameworks = ["cbt", "psychodynamic", "selfpsych", "erikson", "attachment"];
        const theoryProseParts = [];

        activeFrameworks.forEach(fw => {
            const cb = document.getElementById(`oca-form-framework-${fw}`);
            if (cb && cb.checked) {
                let prose = "";

                if (fw === "cbt") {
                    const core = document.getElementById("oca-form-cbt-core").value.trim();
                    const inter = document.getElementById("oca-form-cbt-intermediate").value.trim();
                    const thoughts = document.getElementById("oca-form-cbt-thoughts").value.trim();

                    if (core || inter || thoughts) {
                        const proseParts = [];
                        if (core) proseParts.push(`core beliefs/schemas of "${core}"`);
                        if (inter) proseParts.push(`rules/assumptions including "${inter}"`);
                        if (thoughts) proseParts.push(`automatic thoughts/cognitive distortions of "${thoughts}"`);
                        prose = `From a Cognitive Behavioral (CBT) perspective, this presentation is maintained by ${proseParts.join(", and ")}.`;
                    }
                } else if (fw === "psychodynamic") {
                    const defenses = document.getElementById("oca-form-dyn-defenses").value.trim();
                    const conflict = document.getElementById("oca-form-dyn-conflict").value.trim();
                    const ego = document.getElementById("oca-form-dyn-ego").value.trim();

                    if (defenses || conflict || ego) {
                        const proseParts = [];
                        if (defenses) proseParts.push(`defense mechanisms of ${defenses}`);
                        if (conflict) proseParts.push(`a central conflict of ${conflict}`);
                        if (ego) proseParts.push(`ego functioning described as ${ego}`);
                        const subjectPronoun = pronouns.subject;
                        const verbUtilize = pronouns.subject === "they" ? "utilize" : "utilizes";
                        prose = `Psychodynamically, the presentation is understood through ${subjectPronoun} ${verbUtilize} of ${proseParts.join(", alongside ")}.`;
                    }
                } else if (fw === "selfpsych") {
                    const needs = document.getElementById("oca-form-self-needs").value.trim();
                    const cohesion = document.getElementById("oca-form-self-cohesion").value.trim();

                    if (needs || cohesion) {
                        const proseParts = [];
                        if (needs) proseParts.push(`unmet selfobject needs for ${needs}`);
                        if (cohesion) proseParts.push(`self cohesion vs. fragmentation dynamics of ${cohesion}`);
                        const subjectPronoun = pronouns.subject;
                        const verbExperience = pronouns.subject === "they" ? "experience" : "experiences";
                        prose = `Under a Self Psychology framework, ${subjectPronoun} ${verbExperience} ${proseParts.join(", with ")}.`;
                    }
                } else if (fw === "erikson") {
                    const currentStage = document.getElementById("oca-form-erikson-current").value.trim();
                    const pastStage = document.getElementById("oca-form-erikson-past").value.trim();

                    if (currentStage || pastStage) {
                        const proseParts = [];
                        if (currentStage) proseParts.push(`currently navigating the conflict of ${currentStage}`);
                        if (pastStage) proseParts.push(`with unresolved developmental issues from the stage of ${pastStage}`);
                        const subjectPronoun = pronouns.subject;
                        const verbBe = pronouns.subject === "they" ? "are" : "is";
                        prose = `Developmentally, Erikson's model suggests ${subjectPronoun} ${verbBe} ${proseParts.join(" ")}.`;
                    }
                } else if (fw === "attachment") {
                    const style = document.getElementById("oca-form-attach-style").value.trim();
                    const dynamics = document.getElementById("oca-form-attach-dynamics").value.trim();

                    if (style || dynamics) {
                        const proseParts = [];
                        if (style) proseParts.push(`a dominant attachment style of ${style}`);
                        if (dynamics) proseParts.push(`separation/threat dynamics involving ${dynamics}`);
                        prose = `Attachment formulation indicates ${proseParts.join(", alongside ")}.`;
                    }
                }

                if (prose) {
                    theoryProseParts.push(prose);
                }
            }
        });

        // 4. Assemble Integrative Formulation Cohesive Prose
        const primary = document.getElementById("oca-form-diag-primary").value.trim();
        const diff = document.getElementById("oca-form-diag-diff").value.trim();
        const contrib = document.getElementById("oca-form-diag-contrib").value.trim();

        const diagProseParts = [];
        if (primary) diagProseParts.push(`The primary clinical diagnostic impression is ${primary}`);
        if (diff) diagProseParts.push(`with key differential considerations including ${diff}`);
        if (contrib) diagProseParts.push(`complicated by contributing factors of ${contrib}`);

        const diagProse = diagProseParts.length > 0 ? diagProseParts.join(", ") + "." : "";

        const section1Text = ppTextParts.join(" ");
        const section2Text = [diagProse, narrativeParts.join(" ")].filter(p => p).join(" ");
        const section3Text = theoryProseParts.join(" ");

        const compiledFormulation = `Integrative Formulation:
# Presentation and Context:
${section1Text || 'N/A'}

# Biopsychosocial Considerations:
${section2Text || 'N/A'}

# Speculative/Theoretical Hypotheses:
${section3Text || 'No theoretical frameworks selected.'}`;

        const startRegex = /^Integrative Formulation:/m;
        const endRegex = /^Barriers to implementation:/m;

        const startMatch = text.match(startRegex);
        const endMatch = text.match(endRegex);

        if (startMatch && endMatch && startMatch.index < endMatch.index) {
            const beforeForm = text.substring(0, startMatch.index);
            const afterForm = text.substring(endMatch.index);
            saveUndoSnapshot();
            ocaEditor.value = beforeForm + compiledFormulation + "\n\n\n" + afterForm;
        }
    }

    const ocaFormulationInputIds = [
        "oca-form-pp-name", "oca-form-pp-age", "oca-form-pp-gender",
        "oca-form-pp-duration", "oca-form-pp-symptoms", "oca-form-pp-context", "oca-form-pp-coping",
        "oca-form-diag-primary", "oca-form-diag-diff", "oca-form-diag-contrib",
        "oca-Predisposing_Biological_Family_history", "oca-Predisposing_Biological_Medical_illness",
        "oca-Predisposing_Psychological_Development_history", "oca-Predisposing_Psychological_Trauma_history", "oca-Predisposing_Psychological_Personality_traits_structure",
        "oca-Predisposing_Social_Accommodation", "oca-Predisposing_Social_Finance_vocation", "oca-Predisposing_Social_Migration_Cultural_factors",
        "oca-Precipitating_Biological_Medication_change", "oca-Precipitating_Biological_New_medical_illness",
        "oca-Precipitating_Psychological_Interpersonal_conflict", "oca-Precipitating_Psychological_Loss_or_grief",
        "oca-Precipitating_Social_Changes_to_social_supports", "oca-Precipitating_Social_Legal_issues",
        "oca-Perpetuating_Biological_Ongoing_substance_use", "oca-Perpetuating_Biological_Poor_sleep_nutrition",
        "oca-Perpetuating_Psychological_Cognitive_distortions", "oca-Perpetuating_Psychological_Poor_insight", "oca-Perpetuating_Psychological_Avoidant_coping",
        "oca-Perpetuating_Social_Stigma", "oca-Perpetuating_Social_Lack_of_access_to_services",
        "oca-Protective_Biological_Good_physical_health", "oca-Protective_Biological_Medication_adherence",
        "oca-Protective_Psychological_Good_insight", "oca-Protective_Psychological_History_of_resilience",
        "oca-Protective_Social_Strong_support_networks", "oca-Protective_Social_Stable_accommodation",
        "oca-form-cbt-core", "oca-form-cbt-intermediate", "oca-form-cbt-thoughts",
        "oca-form-dyn-defenses", "oca-form-dyn-conflict", "oca-form-dyn-ego",
        "oca-form-self-needs", "oca-form-self-cohesion",
        "oca-form-erikson-current", "oca-form-erikson-past",
        "oca-form-attach-style", "oca-form-attach-dynamics"
    ];

    const ocaFormulationCheckboxes = [
        "oca-form-framework-cbt", "oca-form-framework-psychodynamic",
        "oca-form-framework-selfpsych", "oca-form-framework-erikson", "oca-form-framework-attachment"
    ];

    ocaFormulationCheckboxes.forEach(fwId => {
        const cb = document.getElementById(fwId);
        if (cb) {
            const shortName = fwId.replace("oca-form-framework-", "");
            const fieldsDiv = document.getElementById(`oca-framework-fields-${shortName}`);
            cb.addEventListener("change", () => {
                if (fieldsDiv) {
                    fieldsDiv.style.display = cb.checked ? "block" : "none";
                }
                updateFormulationInOcaText();
                triggerAutoSave();
            });
        }
    });

    ocaFormulationInputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", () => {
                updateFormulationInOcaText();
                triggerAutoSave();
            });
        }
    });

    // 6. API Configuration Modal and Storage
    const ocaKeyBtn = document.getElementById("oca-key-btn");
    const ocaKeyModal = document.getElementById("oca-key-modal");
    const ocaKeyClose = document.getElementById("oca-key-close");
    const ocaKeySaveBtn = document.getElementById("oca-key-save-btn");
    const ocaKeyClearBtn = document.getElementById("oca-key-clear-btn");
    const ocaGeminiKeyInput = document.getElementById("oca-gemini-key");

    if (ocaKeyBtn && ocaKeyModal) {
        ocaKeyBtn.addEventListener("click", () => {
            const savedKey = localStorage.getItem("oca_gemini_api_key") || "";
            if (ocaGeminiKeyInput) ocaGeminiKeyInput.value = savedKey;
            ocaKeyModal.style.display = "block";
        });
    }
    if (ocaKeyClose) {
        ocaKeyClose.addEventListener("click", () => {
            ocaKeyModal.style.display = "none";
        });
    }
    if (ocaKeySaveBtn) {
        ocaKeySaveBtn.addEventListener("click", () => {
            const key = ocaGeminiKeyInput.value.trim();
            if (key) {
                localStorage.setItem("oca_gemini_api_key", key);
                alert("Gemini API key saved locally.");
            }
            ocaKeyModal.style.display = "none";
        });
    }
    if (ocaKeyClearBtn) {
        ocaKeyClearBtn.addEventListener("click", () => {
            localStorage.removeItem("oca_gemini_api_key");
            if (ocaGeminiKeyInput) ocaGeminiKeyInput.value = "";
            alert("Gemini API key cleared.");
            ocaKeyModal.style.display = "none";
        });
    }
    window.addEventListener("click", (e) => {
        if (e.target === ocaKeyModal) {
            ocaKeyModal.style.display = "none";
        }
    });

    // 7. Gemini AI call to auto-fill
    const ocaGeminiFillBtn = document.getElementById("oca-gemini-fill-btn");
    if (ocaGeminiFillBtn) {
        ocaGeminiFillBtn.addEventListener("click", async () => {
            const apiKey = localStorage.getItem("oca_gemini_api_key");
            if (!apiKey) {
                alert("Please enter a Gemini API Key under settings first.");
                if (ocaKeyModal) ocaKeyModal.style.display = "block";
                return;
            }

            const btn = ocaGeminiFillBtn;
            btn.disabled = true;
            btn.textContent = "🪄 Analyzing...";

            try {
                const notesText = ocaEditor.value;
                const prompt = `You are an expert clinical psychiatry assistant.
Read the following clinician notes from a patient review:
---
${notesText}
---
Extract the predisposing, precipitating, perpetuating, and protective factors under the Biopsychosocial (Biological, Psychological, Social) framework.
Also extract presenting problem context (name, age, gender, symptoms, duration, context, coping mechanisms), diagnostic impressions (primary, differentials, and contributing), and any applicable theoretical frameworks (CBT, psychodynamic, self psychology, Erikson's stages, or attachment dynamics).

Return the result strictly as a JSON object matching this schema:
{
  "name": "Patient's name",
  "age": "Patient's age",
  "gender": "Patient's gender",
  "duration": "Duration of symptoms",
  "symptoms": "Primary presenting symptoms",
  "context": "Stressors or context of onset",
  "coping": "Coping mechanisms or impairment",
  "primary": "Primary diagnosis",
  "diff": "Differential diagnoses",
  "contrib": "Contributing factors",
  "Predisposing_Biological_Family_history": "Biological family history factors",
  "Predisposing_Biological_Medical_illness": "Predisposing medical illness",
  "Predisposing_Psychological_Development_history": "Predisposing developmental history",
  "Predisposing_Psychological_Trauma_history": "Predisposing trauma history",
  "Predisposing_Psychological_Personality_traits_structure": "Predisposing personality traits",
  "Predisposing_Social_Accommodation": "Predisposing accommodation factors",
  "Predisposing_Social_Finance_vocation": "Predisposing financial/vocational factors",
  "Predisposing_Social_Migration_Cultural_factors": "Predisposing migration/cultural factors",
  "Precipitating_Biological_Medication_change": "Precipitating medication changes",
  "Precipitating_Biological_New_medical_illness": "Precipitating new medical illnesses",
  "Precipitating_Psychological_Interpersonal_conflict": "Precipitating interpersonal conflicts",
  "Precipitating_Psychological_Loss_or_grief": "Precipitating loss/grief",
  "Precipitating_Social_Changes_to_social_supports": "Precipitating changes to supports",
  "Precipitating_Social_Legal_issues": "Precipitating legal issues",
  "Perpetuating_Biological_Ongoing_substance_use": "Perpetuating substance use",
  "Perpetuating_Biological_Poor_sleep_nutrition": "Perpetuating sleep/nutrition issues",
  "Perpetuating_Psychological_Cognitive_distortions": "Perpetuating cognitive distortions",
  "Perpetuating_Psychological_Poor_insight": "Perpetuating poor insight",
  "Perpetuating_Psychological_Avoidant_coping": "Perpetuating avoidant coping",
  "Perpetuating_Social_Stigma": "Perpetuating stigma",
  "Perpetuating_Social_Lack_of_access_to_services": "Perpetuating access issues",
  "Protective_Biological_Good_physical_health": "Protective physical health",
  "Protective_Biological_Medication_adherence": "Protective medication adherence",
  "Protective_Psychological_Good_insight": "Protective insight",
  "Protective_Psychological_History_of_resilience": "Protective history of resilience",
  "Protective_Social_Strong_support_networks": "Protective social networks",
  "Protective_Social_Stable_accommodation": "Protective accommodation",
  "framework_cbt": false,
  "cbt_core": "CBT core beliefs if any",
  "cbt_intermediate": "CBT intermediate beliefs if any",
  "cbt_thoughts": "CBT automatic thoughts if any",
  "framework_psychodynamic": false,
  "dyn_defenses": "Defense mechanisms if any",
  "dyn_conflict": "Central conflicts if any",
  "dyn_ego": "Ego functioning if any",
  "framework_selfpsych": false,
  "self_needs": "Unmet selfobject needs if any",
  "self_cohesion": "Self cohesion details if any",
  "framework_erikson": false,
  "erikson_current": "Current Erikson stage conflict if any",
  "erikson_past": "Unresolved past stage conflict if any",
  "framework_attachment": false,
  "attach_style": "Attachment style if any",
  "attach_dynamics": "Attachment dynamics if any"
}
If a category lacks information in the notes, use a blank string "". Set the framework boolean fields to true if there is relevant theoretical material, otherwise false. Do not include any formatting or other text, just the raw JSON.`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            responseMimeType: "application/json"
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`API returned status ${response.status}`);
                }

                const data = await response.json();
                const jsonText = data.candidates[0].content.parts[0].text;
                const parsed = JSON.parse(jsonText);

                const keyMap = {
                    "oca-form-pp-name": "name",
                    "oca-form-pp-age": "age",
                    "oca-form-pp-gender": "gender",
                    "oca-form-pp-duration": "duration",
                    "oca-form-pp-symptoms": "symptoms",
                    "oca-form-pp-context": "context",
                    "oca-form-pp-coping": "coping",
                    "oca-form-diag-primary": "primary",
                    "oca-form-diag-diff": "diff",
                    "oca-form-diag-contrib": "contrib",
                    "oca-form-cbt-core": "cbt_core",
                    "oca-form-cbt-intermediate": "cbt_intermediate",
                    "oca-form-cbt-thoughts": "cbt_thoughts",
                    "oca-form-dyn-defenses": "dyn_defenses",
                    "oca-form-dyn-conflict": "dyn_conflict",
                    "oca-form-dyn-ego": "dyn_ego",
                    "oca-form-self-needs": "self_needs",
                    "oca-form-self-cohesion": "self_cohesion",
                    "oca-form-erikson-current": "erikson_current",
                    "oca-form-erikson-past": "erikson_past",
                    "oca-form-attach-style": "attach_style",
                    "oca-form-attach-dynamics": "attach_dynamics"
                };

                // Populate text fields
                ocaFormulationInputIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    let jsonKey = keyMap[id];
                    if (!jsonKey) {
                        jsonKey = id.replace("oca-", "");
                    }
                    if (parsed[jsonKey] !== undefined) {
                        el.value = parsed[jsonKey] || "";
                    }
                });

                // Populate checkboxes
                ocaFormulationCheckboxes.forEach(id => {
                    const cb = document.getElementById(id);
                    if (!cb) return;
                    const jsonKey = id.replace("oca-form-", "").replace(/-/g, "_");
                    if (parsed[jsonKey] !== undefined) {
                        cb.checked = !!parsed[jsonKey];
                        const shortName = id.replace("oca-form-framework-", "");
                        const fieldsDiv = document.getElementById(`oca-framework-fields-${shortName}`);
                        if (fieldsDiv) {
                            fieldsDiv.style.display = cb.checked ? "block" : "none";
                        }
                    }
                });

                // Update editor text
                updateFormulationInOcaText();
                triggerAutoSave();
                alert("Formulation successfully populated with detailed cohesive narrative!");
            } catch (err) {
                console.error("Gemini autofill error", err);
                alert("Failed to parse and autofill: " + err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = "🪄 Auto-Fill with Gemini";
            }
        });
    }

    // 8. Reset Session
    const ocaResetBtn = document.getElementById("oca-reset-btn");
    if (ocaResetBtn) {
        ocaResetBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to reset the current patient review session? This will clear all changes.")) {
                if (ocaEditor) ocaEditor.value = templates.oca || "";

                // Reset formulation fields
                ocaFormulationInputIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = "";
                });
                ocaFormulationCheckboxes.forEach(id => {
                    const cb = document.getElementById(id);
                    if (cb) {
                        cb.checked = false;
                        const shortName = id.replace("oca-form-framework-", "");
                        const fieldsDiv = document.getElementById(`oca-framework-fields-${shortName}`);
                        if (fieldsDiv) fieldsDiv.style.display = "none";
                    }
                });

                // Reset MSE simple selects/inputs
                ocaMseSimpleInputIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        if (el.tagName === "SELECT") {
                            el.selectedIndex = 0;
                        } else {
                            el.value = "";
                        }
                    }
                });

                // Reset MSE checkboxes to defaults
                const allMseChecks = [
                    ...ocaMseMotorChecks, ...ocaMseMannerismChecks,
                    ...ocaMseHallucinationChecks, ...ocaMseThoughtFormChecks,
                    ...ocaMseOtherThoughtChecks, ...ocaMseDelusionChecks
                ];
                allMseChecks.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        // Default checked: "denies" boxes
                        el.checked = (id === "oca-mse-hallucination-denies" || id === "oca-mse-delusion-none" || id === "oca-mse-thought-form-coherent");
                    }
                });

                // Reset insight radios
                ocaMseInsightRadios.forEach((id, i) => {
                    const el = document.getElementById(id);
                    if (el) el.checked = (i === 0); // default = "Good"
                });

                // Hide conditional containers
                const halDescCont = document.getElementById("oca-mse-hallucination-desc-container");
                if (halDescCont) halDescCont.style.display = "none";
                const siDescCont = document.getElementById("oca-mse-si-desc-container");
                if (siDescCont) siDescCont.style.display = "none";
                const delDescCont = document.getElementById("oca-mse-delusion-desc-container");
                if (delDescCont) delDescCont.style.display = "none";

                triggerAutoSave();
            }
        });
    }

});
