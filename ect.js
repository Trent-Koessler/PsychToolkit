// EEG for ECT page: Thymatron System IV dose charts, the dose helper and the
// drawn sample tracings. Dose data is copied from the NSW Health ECT Handbook
// v1.2 (5 August 2026), Appendix 6. Change it only from a newer handbook.

document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("ect-page")) return;

    const SOURCES = [
        '<a href="https://www.health.nsw.gov.au/mentalhealth/resources/Pages/electroconvulsive-therapy-handbook.aspx" target="_blank" rel="noopener">NSW Health. Electroconvulsive Therapy Handbook: Implementing the practice requirements for ECT. Version 1.2, 5 August 2026</a> (sections 8.1, 9.2&ndash;9.7, 10.6, 10.10, 11.4 and Appendix 6).',
        "NSW Health Policy Directive PD2026_010, Practice requirements for electroconvulsive therapy services (mandatory requirements that the handbook implements).",
        '<a href="https://www.ranzcp.org/clinical-guidelines-publications/clinical-guidelines-publications-library/electroconvulsive-therapy-ect" target="_blank" rel="noopener">RANZCP. Professional practice guidelines for the administration of ECT</a> (referred to by the handbook for modality switching).',
        'Points tagged "General teaching" (EEG phases, quality features, Thymatron printout measures) are standard ECT teaching, not handbook content. Check them against the Thymatron System IV manual and local training.'
    ];
    document.querySelectorAll("#ect-page .ect-sources").forEach(list => {
        list.innerHTML = SOURCES.map(s => `<li>${s}</li>`).join("");
    });

    // ------------------------------------------------------------------
    // Dose charts (Appendix 6, Thymatron columns)
    // ------------------------------------------------------------------
    const CHARTS = {
        p10: {
            title: "1.0 ms brief pulse dose chart, Thymatron DGx program (12 levels)",
            levels: [
                ["1", 5, 25], ["2", 10, 50], ["3", 15, 76], ["4", 20, 101], ["5", 25, 126], ["6", 35, 176],
                ["7", 50, 252], ["8", 70, 353], ["9", 100, 504], ["10", 130, 655], ["11", 170, 857], ["12", 200, 1008]
            ],
            start: { under50: 0, "50plus": 1 }, // index into levels
            treatments: [
                { label: "High dose unilateral (approx. 5 × ST)", step: i => (i === 0 ? 4 : 5), rule: "increase 5 levels (exception: Level 1 → Level 5)" },
                { label: "Moderate dose unilateral (approx. 3.5 × ST)", step: i => (i === 0 ? 3 : 4), rule: "increase 4 levels (exception: Level 1 → Level 4)" },
                { label: "Low dose bilateral (approx. 1.5 × ST)", step: () => 1, rule: "increase 1 level" }
            ]
        },
        p05: {
            title: "0.5 ms pulse width dose chart, Thymatron System IV (13 levels)",
            levels: [
                ["0", 4, 20], ["1", 6, 30], ["2", 10, 50], ["3", 15, 76], ["4", 20, 101], ["5", 25, 126], ["6", 35, 176],
                ["7", 55, 277], ["8", 75, 378], ["9", 100, 504], ["10", 125, 630], ["11", 170, 856], ["12", 200, 1008]
            ],
            start: { under50: 0, "50plus": 1 },
            treatments: [
                { label: "Moderate dose bifrontal (approx. 2 × ST)", step: () => 2, rule: "increase 2 levels" },
                { label: "High dose bifrontal (approx. 3 × ST)", step: () => 3, rule: "increase 3 levels" },
                { label: "Low dose bitemporal (approx. 1.5 × ST)", step: () => 1, rule: "increase 1 level" },
                { label: "High dose bitemporal (approx. 2 × ST)", step: () => 2, rule: "increase 2 levels" },
                { label: "Right unilateral (approx. 5–6 × ST)", step: i => (i === 0 ? 4 : 5), rule: "increase 4 levels if ST was Level 0, otherwise 5 levels (if possible)" }
            ],
            note: "Above 125% the Thymatron reaches higher doses in the 0.5 ms program by raising the frequency above 90 Hz, which is likely to be inefficient. At these doses consider switching ECT modality."
        },
        ub: {
            title: "Right unilateral ultra-brief, Thymatron System IV (treatment at 6 × threshold)",
            titration: [["T1", 2], ["T2", 4], ["T3", 8], ["T4", 15], ["T5", 25], ["T6", 35]],
            treatment: [["R1", 10], ["R1.5", 15], ["R2", 25], ["R2.5", 35], ["R3", 50], ["R3.5", 70], ["R4", 100], ["R5", 140], ["R6", 200]],
            start: { under50: 0, "50plus": 1 }
        }
    };

    // T-level -> matching R-level index in CHARTS.ub.treatment
    const UB_T_TO_R = [0, 2, 4, 6, 7, 8];

    function levelName(chartId, idx) {
        const chart = CHARTS[chartId];
        if (chartId === "ub") return `${chart.titration[idx][0]} (${chart.titration[idx][1]}%)`;
        return `Level ${chart.levels[idx][0]} (${chart.levels[idx][1]}%)`;
    }

    function titrationSequence(chartId, startIdx) {
        const count = chartId === "ub" ? CHARTS.ub.titration.length : CHARTS[chartId].levels.length;
        // Stimuli 1-3 go up one level each; the 4th goes up two (Appendix 6).
        const steps = [0, 1, 2, 4].map(offset => startIdx + offset).filter(i => i < count);
        return steps.map((idx, n) => `<li>Stimulus ${n + 1}: ${levelName(chartId, idx)}</li>`).join("");
    }

    function renderCharts() {
        const holder = document.getElementById("ect-charts");
        const p = CHARTS;
        const levelTable = (chart) => `
            <p><strong>${chart.title}</strong></p>
            <div class="emerg-table-wrap"><table class="emerg-table ect-chart-table">
                <thead><tr><th>Level</th><th>% energy</th><th>mC</th></tr></thead>
                <tbody>${chart.levels.map(([lvl, pct, mc]) => `<tr><td>${lvl}</td><td>${pct}%</td><td>${mc}</td></tr>`).join("")}</tbody>
            </table></div>
            <p>Start titration at Level ${chart.levels[chart.start.under50][0]} if under 50, Level ${chart.levels[chart.start["50plus"]][0]} if 50 or older.
            Treatment: ${chart.treatments.map(t => `${t.label}: ${t.rule}`).join("; ")}.</p>
            ${chart.note ? `<p class="emerg-check"><span class="emerg-check-tag">Note:</span> ${chart.note}</p>` : ""}`;

        const ubRows = p.ub.titration.map(([t, tp], i) => {
            const r = p.ub.treatment[UB_T_TO_R[i]];
            const half = i < 3 ? p.ub.treatment[UB_T_TO_R[i] + 1] : null;
            return `<tr><td>${t}</td><td>${tp}%</td><td>${r[0]}</td><td>${r[1]}%</td></tr>` +
                (half ? `<tr class="ect-half-row"><td></td><td></td><td>${half[0]}</td><td>${half[1]}%</td></tr>` : "");
        }).join("");

        holder.innerHTML = `
            <p><strong>${p.ub.title}</strong></p>
            <div class="emerg-table-wrap"><table class="emerg-table ect-chart-table">
                <thead><tr><th>Titration level</th><th>Setting</th><th>Treatment level</th><th>Setting</th></tr></thead>
                <tbody>${ubRows}</tbody>
            </table></div>
            <p>Start titration at T1 if under 50, T2 if 50 or older. Once ST is found, treat at the matching R level.
            To increase during the course, move down one R level.</p>
            ${levelTable(p.p05)}
            ${levelTable(p.p10)}`;
    }

    // ------------------------------------------------------------------
    // Dose helper
    // ------------------------------------------------------------------
    const chartSel = document.getElementById("ect-chart");
    const ageSel = document.getElementById("ect-age");
    const stSel = document.getElementById("ect-st");
    const treatSel = document.getElementById("ect-treatment");
    const titrationOut = document.getElementById("ect-titration-out");
    const treatmentOut = document.getElementById("ect-treatment-out");

    function fillOptions(select, options) {
        const previous = select.value;
        select.innerHTML = options.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
        if (options.some(([value]) => value === previous)) select.value = previous;
    }

    function refreshHelper(chartChanged) {
        const chartId = chartSel.value;
        const chart = CHARTS[chartId];
        const startIdx = chart.start[ageSel.value];

        titrationOut.innerHTML = `<strong>Titration:</strong> start at ${levelName(chartId, startIdx)}.
            If no seizure, step up as below (maximum 4 stimuli in one session):
            <ol class="ect-steps">${titrationSequence(chartId, startIdx)}</ol>`;

        if (chartChanged) {
            const stLevels = chartId === "ub" ? chart.titration : chart.levels;
            fillOptions(stSel, stLevels.map((_, i) => [String(i), levelName(chartId, i)]));
            stSel.value = String(startIdx);
            fillOptions(treatSel, chartId === "ub"
                ? [["ub", "Right unilateral ultra-brief at 6 × ST"]]
                : chart.treatments.map((t, i) => [String(i), t.label]));
        }

        const stIdx = Number(stSel.value);
        let text;
        if (chartId === "ub") {
            const rIdx = UB_T_TO_R[stIdx];
            const r = chart.treatment[rIdx];
            const next = chart.treatment[rIdx + 1];
            text = `<strong>Treat at ${r[0]} (${r[1]}%).</strong> ` +
                (next ? `If an increase is needed later: ${next[0]} (${next[1]}%).` : "This is the top of the chart.");
        } else {
            const treatment = chart.treatments[Number(treatSel.value)];
            const target = stIdx + treatment.step(stIdx);
            const top = chart.levels.length - 1;
            if (target > top) {
                text = `<strong>Beyond the top of the chart</strong> (${treatment.rule} from ${levelName(chartId, stIdx)}). ` +
                    `The highest setting is ${levelName(chartId, top)}. Discuss with the ECT clinical lead, and consider switching modality.`;
            } else {
                const pct = chart.levels[target][1];
                text = `<strong>Treat at ${levelName(chartId, target)}</strong> (${treatment.rule}). ` +
                    (target < top ? `If an increase is needed later: ${levelName(chartId, target + 1)}.` : "This is the top of the chart.");
                if (chartId === "p05" && pct > 125) text += ` <br><em>${chart.note}</em>`;
            }
        }
        treatmentOut.innerHTML = text;
    }

    if (chartSel) {
        renderCharts();
        chartSel.addEventListener("change", () => refreshHelper(true));
        ageSel.addEventListener("change", () => refreshHelper(true));
        stSel.addEventListener("change", () => refreshHelper(false));
        treatSel.addEventListener("change", () => refreshHelper(false));
        refreshHelper(true);
    }

    // ------------------------------------------------------------------
    // Sample tracings: schematic two-channel EEG drawn as SVG
    // ------------------------------------------------------------------
    function seededRandom(seed) {
        let s = seed;
        return () => {
            s = (s * 16807) % 2147483647;
            return s / 2147483647 - 0.5;
        };
    }

    // Each pattern returns the signal (roughly -1..1) at time t for a channel.
    // Frequencies are slowed so the shapes stay visible at screen size.
    function makeSignal(kind, channel) {
        const rand = seededRandom(kind.length * 97 + channel * 13 + 7);
        const gain = channel === 0 ? 1 : (kind === "poor" ? 0.6 : 0.92);
        const phase = channel * 0.15;
        const stimEnd = 6;
        return (t) => {
            const noise = rand() * 0.08;
            if (t < 2) return noise;
            if (t < stimEnd) return (Math.sin(t * 40) > 0 ? 0.9 : -0.9) * 0.6 + noise; // stimulus artefact
            if (kind === "missed") return noise;
            const s = t - stimEnd;
            if (kind === "good") {
                if (s < 9) return gain * Math.min(1, 0.2 + s / 7) * Math.sin(s * 18 + phase) * 0.9 + noise;
                if (s < 27) {
                    const k = s - 9;
                    const wave = Math.sin(k * (6.5 - k * 0.12) + phase);
                    return gain * (0.85 * wave + 0.35 * Math.max(0, Math.sin(k * 26)) * (wave > 0 ? 1 : 0)) + noise;
                }
                return rand() * 0.04; // abrupt end, flat postictal suppression
            }
            if (kind === "poor") {
                if (s < 5) return gain * 0.35 * Math.sin(s * 18 + phase) + noise;
                if (s < 30) {
                    const fade = s < 18 ? 1 : Math.max(0, 1 - (s - 18) / 12);
                    return gain * 0.35 * fade * Math.sin(s * (5 + rand() * 2) + phase) + noise * 1.6;
                }
                return rand() * 0.18; // little suppression
            }
            if (kind === "prolonged") {
                if (s < 9) return gain * Math.min(1, 0.2 + s / 7) * Math.sin(s * 18 + phase) * 0.9 + noise;
                return gain * (0.6 + 0.2 * Math.sin(s / 9)) * Math.sin(s * 6 + phase) + noise;
            }
            return noise;
        };
    }

    const TRACINGS = [
        {
            kind: "good", title: "Good-quality seizure", seconds: 50,
            marks: [[2, "Stimulus"], [6, "Polyspike"], [15, "Slow-wave"], [33, "Abrupt end"], [36, "Postictal suppression"]],
            notice: "High amplitude, regular slow waves, both channels alike, a clear end-point and a flat line afterwards.",
            action: "Record motor and EEG durations and compare with previous treatments."
        },
        {
            kind: "poor", title: "Poor-quality seizure", seconds: 50,
            marks: [[2, "Stimulus"], [6, "Low-amplitude activity"], [24, "Gradual fade"], [36, "Little suppression"]],
            notice: "Low amplitude, poorly formed slow waves, channels unequal, no clear end and little suppression.",
            action: "Not a missed seizure. If quality is falling across the course, see Troubleshooting: short or declining-quality seizures."
        },
        {
            kind: "missed", title: "Missed seizure", seconds: 50,
            marks: [[2, "Stimulus"], [6, "No seizure activity"]],
            notice: "After the stimulus the trace returns to baseline. No motor seizure in the cuffed limb.",
            action: "Go up one level and re-stimulate straight away; check electrode placement. See Troubleshooting: missed seizure."
        },
        {
            kind: "prolonged", title: "Prolonged seizure", seconds: 200,
            marks: [[2, "Stimulus"], [120, "120 s: alert anaesthetist"], [180, "180 s: terminate"]],
            notice: "Seizure activity continues on the EEG. The time axis is compressed to show 200 s.",
            action: "Over 120 s, alert the anaesthetist. Over 180 s, the anaesthetist terminates it with medication."
        }
    ];

    function drawTracing(spec) {
        const W = 900, H = 230, left = 44, right = 8, top = 34, chH = 70, gap = 26;
        const plotW = W - left - right;
        const xOf = t => left + (t / spec.seconds) * plotW;
        const samples = 1600;
        const paths = [0, 1].map(ch => {
            const signal = makeSignal(spec.kind, ch);
            const mid = top + chH / 2 + ch * (chH + gap);
            let d = "";
            for (let i = 0; i <= samples; i++) {
                const t = (i / samples) * spec.seconds;
                const y = mid - Math.max(-1, Math.min(1, signal(t))) * (chH / 2);
                d += (i ? "L" : "M") + xOf(t).toFixed(1) + " " + y.toFixed(1);
            }
            return `<path class="ect-trace-line" d="${d}"/>`;
        }).join("");

        const marks = spec.marks.map(([t, label], i) => {
            const x = xOf(t);
            const warn = /alert|terminate/.test(label) ? " ect-trace-mark-warn" : "";
            const anchor = x > W - 150 ? "end" : "start";
            const tx = anchor === "end" ? x - 4 : x + 4;
            return `<line class="ect-trace-mark${warn}" x1="${x}" y1="${top - 6}" x2="${x}" y2="${H - 18}"/>` +
                `<text class="ect-trace-label${warn}" x="${tx}" y="${i % 2 ? 26 : 14}" text-anchor="${anchor}">${label}</text>`;
        }).join("");

        const tickStep = spec.seconds > 100 ? 30 : 10;
        let ticks = "";
        for (let t = 0; t <= spec.seconds; t += tickStep) {
            ticks += `<text class="ect-trace-tick" x="${xOf(t)}" y="${H - 4}" text-anchor="${t === 0 ? "start" : "middle"}">${t} s</text>`;
        }
        // Channel names sit in the left gutter so they never overlap the trace.
        const chLabels = [0, 1].map(ch =>
            `<text class="ect-trace-tick" x="4" y="${top + chH / 2 + ch * (chH + gap) + 4}">Ch ${ch + 1}</text>`).join("");

        return `<svg class="ect-trace" viewBox="0 0 ${W} ${H}" role="img" aria-label="Illustration: ${spec.title}">${marks}${paths}${ticks}${chLabels}</svg>`;
    }

    const tracingList = document.getElementById("ect-tracing-list");
    if (tracingList) {
        tracingList.innerHTML = TRACINGS.map(spec => `
            <div class="ect-trace-card">
                <h4>${spec.title}</h4>
                <div class="ect-trace-scroll">${drawTracing(spec)}</div>
                <p class="ect-swipe-hint">Swipe sideways to see the whole tracing.</p>
                <p><strong>What you see:</strong> ${spec.notice}</p>
                <p><strong>What to do:</strong> ${spec.action}</p>
            </div>`).join("");
    }
});
