/* =========================================================================
 * Patient Review Workspace "Reasoning" tab: differential diagnosis helper and
 * suicide risk formulation. Content lives in reasoning-content.js.
 *
 * The tab writes into the note only when an Insert button is pressed. It talks
 * to the workspace through events on the editor, so the existing Undo and
 * draft/auto-save keep working:
 *   "oca-before-insert"  fired on the editor just before it is changed
 *   "input"              fired after, as if the clinician had typed
 *   "oca-reset"          fired on document by Reset Session; clears this tab
 * Nothing here is stored: like the rest of the note, it lives only on screen.
 * ========================================================================= */

(function () {
    "use strict";

    const C = window.REASONING_CONTENT;
    const editor = document.getElementById("oca-editor");
    const body = document.getElementById("oca-reasoning-body");
    if (!C || !editor || !body) return;

    const RULE_OUT_STATUSES = ["Not assessed", "Excluded", "Possible", "Investigating"];
    const DX_STATUSES = ["Not considered", "Leading", "Possible", "Less likely", "Excluded"];
    const DX_TITLE = "Differential diagnosis:";
    const SR_TITLE = "Suicide risk formulation:";

    let dx;
    let sr;

    function freshState() {
        dx = { problem: "psychosis", ruleOut: {}, items: {}, flow: {} };
        sr = { acute: {}, status: {}, state: {}, baseline: "", resources: {}, plan: {},
            narrative: "", intent: "", words: "", changes: "", means: "", followUp: "" };
    }

    /* --------------------------------------------------------------- utils */

    function el(tag, cls, text) {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined && text !== null) n.textContent = text;
        return n;
    }

    // Typed text goes into single note lines, so newlines become spaces.
    function oneLine(text) {
        return String(text || "").replace(/\s*\n\s*/g, " ").trim();
    }

    function lowerFirst(text) {
        return text.charAt(0).toLowerCase() + text.slice(1);
    }

    function checkBox(text) {
        const box = el("div", "emerg-check");
        box.appendChild(el("span", "emerg-check-tag", "Check:"));
        box.appendChild(document.createTextNode(" " + text));
        return box;
    }

    function textInput(labelText, value, onInput, placeholder) {
        const wrap = el("div", "rz-field");
        const label = el("label", null, labelText);
        const input = el("input");
        input.type = "text";
        input.value = value;
        if (placeholder) input.placeholder = placeholder;
        const id = "rz-" + Math.random().toString(36).slice(2, 9);
        input.id = id;
        label.htmlFor = id;
        input.addEventListener("input", () => onInput(input.value));
        wrap.appendChild(label);
        wrap.appendChild(input);
        return wrap;
    }

    function statusSelect(options, value, onChange, labelText) {
        const select = el("select", "rz-status");
        select.setAttribute("aria-label", labelText);
        options.forEach(opt => select.appendChild(new Option(opt, opt)));
        select.value = value;
        const paint = () => { select.dataset.status = select.value; };
        paint();
        select.addEventListener("change", () => {
            paint();
            onChange(select.value);
        });
        return select;
    }

    // A tick box drawn as a chip. map[key] holds whether it is ticked.
    function chip(text, map, key, cls, onChange) {
        const label = el("label", "rz-chip" + (cls ? " " + cls : ""));
        const box = el("input");
        box.type = "checkbox";
        box.checked = !!map[key];
        label.classList.toggle("on", box.checked);
        box.addEventListener("change", () => {
            map[key] = box.checked;
            label.classList.toggle("on", box.checked);
            onChange();
        });
        label.appendChild(box);
        label.appendChild(document.createTextNode(text));
        return label;
    }

    function chipGroup(items, map, cls, onChange) {
        const group = el("div", "rz-chips");
        items.forEach(item => group.appendChild(chip(item, map, item, cls, onChange)));
        return group;
    }

    /* ----------------------------------------------------- note insertion */

    // Puts the block into the note. A block inserted earlier (found by its
    // title line, ending at the next blank line) is replaced, so pressing
    // Insert again updates rather than duplicates. Otherwise the block goes
    // under the first matching heading, or at the cursor if there is none.
    function insertBlock(title, lines, headingPatterns) {
        const block = [title].concat(lines);
        const noteLines = editor.value.split("\n");
        let where;

        const existing = noteLines.findIndex(line => line.trim() === title);
        if (existing !== -1) {
            let end = existing + 1;
            while (end < noteLines.length && noteLines[end].trim() !== "") end++;
            noteLines.splice(existing, end - existing, ...block);
            where = "updated";
        } else {
            // Patterns are in order of preference: a fallback heading such as
            // "Impression" only counts when the preferred one is missing.
            let heading = -1;
            for (const re of headingPatterns) {
                heading = noteLines.findIndex(line => re.test(line));
                if (heading !== -1) break;
            }
            if (heading !== -1) {
                noteLines.splice(heading + 1, 0, ...block, "");
                where = "heading";
            }
        }

        editor.dispatchEvent(new CustomEvent("oca-before-insert"));
        if (where) {
            editor.value = noteLines.join("\n");
        } else {
            const at = editor.selectionStart || editor.value.length;
            editor.value = editor.value.slice(0, at) + "\n" + block.join("\n") + "\n\n" + editor.value.slice(at);
            where = "cursor";
        }
        editor.dispatchEvent(new Event("input"));
        return where;
    }

    function insertMessage(where, headingName) {
        if (where === "updated") return "Updated the earlier version in the note.";
        if (where === "heading") return `Added under "${headingName}".`;
        return `No "${headingName}" heading found, so it was added at the cursor.`;
    }

    /* ----------------------------------------------- differential diagnosis */

    // The guided questions exist only for presenting problems that have a flow.
    function flowFor(problem) {
        return (window.REASONING_FLOWS || {})[problem] || null;
    }

    // Answers that mean the same in every flow, carried over when one flow
    // hands the case to another (e.g. mood with psychosis outside episodes).
    const SHARED_ANSWERS = ["feigned", "substance", "subTiming", "delirium", "cognitive", "medical"];
    // extra holds answers a flow names for the next one (result.carry), kept
    // only where the target flow asks that question with those options.
    function carryAnswers(from, toProblem, extra) {
        const to = flowFor(toProblem);
        const carried = {};
        const step0 = to && to.questions.find(question => question.id === "explained");
        const start = toProblem === "psychosis" ? "none" : "clinical";
        if (step0 && step0.options.some(o => o.value === start)) carried.explained = start;
        SHARED_ANSWERS.forEach(id => {
            const q = to && to.questions.find(question => question.id === id);
            if (q && from[id] !== undefined && q.options.some(o => o.value === from[id])) carried[id] = from[id];
        });
        // The substance questions name the substance; elsewhere "substance"
        // just asks whether one is involved.
        const named = from.substance && !["yes", "no", "unsure"].includes(from.substance);
        const target = to && to.questions.find(question => question.id === "substance");
        if (named && target && target.options.some(o => o.value === "yes")) carried.substance = "yes";
        Object.keys(extra || {}).forEach(id => {
            const q = to && to.questions.find(question => question.id === id);
            const values = [].concat(extra[id]);
            if (q && values.every(v => q.options.some(o => o.value === v))) carried[id] = extra[id];
        });
        return carried;
    }

    function flowResult() {
        const flow = flowFor(dx.problem);
        return flow ? flow.evaluate(dx.flow) : null;
    }

    function differentialLines() {
        const p = C.differentials[dx.problem];
        const lines = [];
        const guided = flowResult();
        if (guided && guided.suggestion) {
            if (guided.urgent) lines.push(`URGENT: ${guided.urgent}`);
            lines.push(`Guided assessment suggests: ${guided.suggestion.label}${guided.suggestion.provisional ? " (provisional)" : ""}.`);
            lines.push(`Reasoning: ${guided.trail.join(" ")}`);
            guided.also.forEach(note => lines.push(`Note: ${note}`));
        }
        const order = ["Leading", "Possible", "Less likely"];
        const chosen = p.differentials
            .filter(d => order.includes((dx.items[d.id] || {}).status))
            .sort((a, b) => order.indexOf(dx.items[a.id].status) - order.indexOf(dx.items[b.id].status));
        chosen.forEach((d, i) => {
            const item = dx.items[d.id];
            let line = `${i + 1}. ${d.name}${d.code ? " (" + d.code + ")" : ""}: ${item.status.toLowerCase()}.`;
            if (oneLine(item.forText)) line += ` For: ${oneLine(item.forText)}.`;
            if (oneLine(item.againstText)) line += ` Against: ${oneLine(item.againstText)}.`;
            lines.push(line.replace(/\.\./g, "."));
        });
        const excluded = p.differentials.filter(d => (dx.items[d.id] || {}).status === "Excluded").map(d => d.name);
        if (excluded.length) lines.push(`Considered and excluded: ${excluded.join("; ")}.`);

        const groups = {};
        p.ruleOut.forEach(r => {
            const status = dx.ruleOut[r.id];
            if (status && status !== "Not assessed") (groups[status] = groups[status] || []).push(lowerFirst(r.name.replace(/\s*\(.*\)$/, "")));
        });
        const organic = ["Excluded", "Possible", "Investigating"]
            .filter(s => groups[s])
            .map(s => `${s.toLowerCase()}: ${groups[s].join(", ")}`);
        if (organic.length) lines.push(`Rule-out checks - ${organic.join("; ")}.`);
        return lines;
    }

    /* ------------------------------------------------- guided questions */

    // Builds every question once and shows or hides them as answers change,
    // so typing or ticking never loses focus. Answers to questions that become
    // hidden are cleared, so they can't steer the result unseen.
    function renderFlow(flow, onChange, onApply, onSwitch) {
        const wrap = el("div", "rz-flow");
        const rows = [];
        const stepHeads = {};

        flow.questions.forEach(q => {
            if (!stepHeads[q.step]) {
                stepHeads[q.step] = el("div", "rz-flow-step", q.step);
                wrap.appendChild(stepHeads[q.step]);
            }
            const box = el("fieldset", "rz-q");
            box.dataset.q = q.id;
            box.appendChild(el("legend", null, q.text));
            if (q.hint) box.appendChild(el("div", "rz-hint", q.hint));
            const group = el("div", "rz-chips");
            const inputs = [];
            q.options.forEach(opt => {
                const label = el("label", "rz-chip");
                const input = el("input");
                input.type = q.type === "multi" ? "checkbox" : "radio";
                input.name = "rz-flow-" + q.id;
                input.value = opt.value;
                const current = dx.flow[q.id];
                input.checked = q.type === "multi" ? Array.isArray(current) && current.includes(opt.value) : current === opt.value;
                label.classList.toggle("on", input.checked);
                input.addEventListener("change", () => {
                    if (q.type === "multi") {
                        let picked = inputs.filter(i => i.checked).map(i => i.value);
                        // "None" can't be ticked alongside anything else.
                        if (opt.value === "none" && input.checked) picked = ["none"];
                        else picked = picked.filter(v => v !== "none");
                        inputs.forEach(i => { i.checked = picked.includes(i.value); });
                        dx.flow[q.id] = picked;
                    } else {
                        dx.flow[q.id] = opt.value;
                    }
                    if (dx.carried) dx.carried = dx.carried.filter(id => id !== q.id);
                    inputs.forEach(i => i.parentNode.classList.toggle("on", i.checked));
                    refresh();
                });
                inputs.push(input);
                label.appendChild(input);
                label.appendChild(document.createTextNode(opt.label));
                group.appendChild(label);
            });
            box.appendChild(group);
            wrap.appendChild(box);
            rows.push({ q, box, inputs });
        });

        const result = el("div", "rz-result");
        result.setAttribute("aria-live", "polite");
        wrap.appendChild(result);
        const buttons = el("div", "rz-btns");
        const apply = el("button", "btn-primary", "Apply to the cards below");
        apply.id = "rz-flow-apply";
        apply.addEventListener("click", onApply);
        const clear = el("button", "btn-secondary", "Start the questions again");
        clear.addEventListener("click", () => {
            dx.flow = {};
            rows.forEach(row => row.inputs.forEach(i => { i.checked = false; i.parentNode.classList.remove("on"); }));
            refresh();
        });
        buttons.appendChild(apply);
        buttons.appendChild(clear);
        wrap.appendChild(buttons);

        function refresh() {
            // Hiding a question can hide others that depended on it, so repeat
            // until nothing changes.
            let changed = true;
            while (changed) {
                changed = false;
                rows.forEach(({ q, inputs }) => {
                    const visible = !q.showIf || q.showIf(dx.flow);
                    // Answers passed on from another flow wait for their
                    // question to appear rather than being cleared.
                    const passedOn = (dx.carried || []).includes(q.id);
                    if (!visible && dx.flow[q.id] !== undefined && !passedOn) {
                        delete dx.flow[q.id];
                        inputs.forEach(i => { i.checked = false; i.parentNode.classList.remove("on"); });
                        changed = true;
                    }
                });
            }
            const shownSteps = new Set();
            rows.forEach(({ q, box }) => {
                box.hidden = !!q.showIf && !q.showIf(dx.flow);
                if (!box.hidden) shownSteps.add(q.step);
            });
            Object.keys(stepHeads).forEach(step => { stepHeads[step].hidden = !shownSteps.has(step); });

            const r = flow.evaluate(dx.flow);
            result.innerHTML = "";
            if (r.urgent) result.appendChild(el("div", "rz-acute", r.urgent));
            if (r.suggestion) {
                const title = el("div", "rz-result-title", "Suggests: " + r.suggestion.label);
                if (r.suggestion.provisional) title.appendChild(el("span", "rz-provisional", "provisional"));
                result.appendChild(title);
            } else {
                result.appendChild(el("div", "rz-result-title rz-result-empty", "Answer the questions to see a suggestion."));
            }
            if (r.pending.length) result.appendChild(el("div", "rz-hint", "Still to answer: " + [...new Set(r.pending)].join(" ")));
            if (r.also.length) {
                const list = el("ul", "rz-also");
                r.also.forEach(note => list.appendChild(el("li", null, note)));
                result.appendChild(list);
            }
            if (r.trail.length) {
                const why = el("details", "rz-why");
                why.appendChild(el("summary", null, "Why"));
                const steps = el("ol");
                r.trail.forEach(t => steps.appendChild(el("li", null, t)));
                why.appendChild(steps);
                result.appendChild(why);
            }
            if (r.switchTo && C.differentials[r.switchTo]) {
                const go = el("button", "btn-secondary rz-switch", `Open the ${C.differentials[r.switchTo].name} questions`);
                go.addEventListener("click", () => onSwitch(r.switchTo));
                result.appendChild(go);
            }
            apply.disabled = !r.suggestion;
            onChange();
        }
        refresh();
        return wrap;
    }

    // Sets the rule-out rows and differential cards from the guided result.
    // Cards the result says nothing about keep whatever the clinician chose.
    function applyFlow(r) {
        if (!r) return;
        Object.keys(r.ruleOut).forEach(id => { dx.ruleOut[id] = r.ruleOut[id]; });
        const set = (id, status) => {
            const item = dx.items[id] || (dx.items[id] = { status: "Not considered", forText: "", againstText: "" });
            item.status = status;
        };
        r.excluded.forEach(id => set(id, "Excluded"));
        r.alternatives.forEach(id => set(id, "Possible"));
        // Co-occurring diagnoses (e.g. panic disorder with agoraphobia) all lead.
        (r.additional || []).forEach(id => set(id, "Leading"));
        if (r.suggestion && r.suggestion.cardId) set(r.suggestion.cardId, "Leading");
    }

    function renderDifferential(section) {
        const p = C.differentials[dx.problem];
        const content = section.querySelector(".oca-details-content");
        content.innerHTML = "";

        const problemLabel = el("label", null, "Presenting problem");
        const problem = el("select");
        problem.id = "rz-problem";
        problemLabel.htmlFor = problem.id;
        Object.keys(C.differentials).forEach(key => problem.appendChild(new Option(C.differentials[key].name, key)));
        problem.value = dx.problem;
        problem.addEventListener("change", () => {
            dx = { problem: problem.value, ruleOut: {}, items: {}, flow: {} };
            renderDifferential(section);
        });
        content.appendChild(problemLabel);
        content.appendChild(problem);

        const preview = el("div", "rz-preview");
        const update = () => {
            const lines = differentialLines();
            preview.textContent = lines.length ? [DX_TITLE].concat(lines).join("\n")
                : "Set a status on the causes and differentials above to build this.";
        };

        const flow = flowFor(dx.problem);
        if (flow) {
            content.appendChild(el("div", "rz-step", "1 · Guided questions"));
            content.appendChild(renderFlow(flow, update, () => {
                applyFlow(flowResult());
                renderDifferential(section);
                const cards = section.querySelector(".rz-step-cards");
                if (cards) cards.scrollIntoView({ block: "start" });
            }, target => {
                const carry = (flowResult() || {}).carry;
                const flowAnswers = carryAnswers(dx.flow, target, carry);
                dx = { problem: target, ruleOut: {}, items: {}, flow: flowAnswers, carried: Object.keys(carry || {}).filter(id => id in flowAnswers) };
                renderDifferential(section);
            }));
        }

        content.appendChild(el("div", "rz-step", (flow ? "2" : "1") + " · Rule out first"));
        p.ruleOut.forEach(r => {
            const row = el("div", "rz-rule");
            const head = el("div", "rz-row");
            head.appendChild(el("span", "rz-rule-name", r.name));
            head.appendChild(statusSelect(RULE_OUT_STATUSES, dx.ruleOut[r.id] || "Not assessed", value => {
                dx.ruleOut[r.id] = value;
                update();
            }, r.name + " (rule-out) status"));
            row.appendChild(head);
            row.appendChild(el("div", "rz-hint", r.clues));
            row.appendChild(el("div", "rz-hint rz-tests", "Tests: " + r.tests));
            content.appendChild(row);
        });

        content.appendChild(el("div", "rz-step rz-step-cards", (flow ? "3" : "2") + " · Differentials (DSM-5-TR · ICD-11)"));
        p.differentials.forEach(d => {
            const item = dx.items[d.id] || (dx.items[d.id] = { status: "Not considered", forText: "", againstText: "" });
            const card = el("div", "rz-card");
            const head = el("div", "rz-card-head");
            head.appendChild(el("span", "rz-card-name", d.name));
            const details = el("div", "rz-card-body");
            head.appendChild(statusSelect(DX_STATUSES, item.status, value => {
                item.status = value;
                details.hidden = value === "Not considered";
                update();
            }, d.name + " status"));
            card.appendChild(head);
            card.appendChild(el("div", "rz-codes", `DSM-5-TR: ${d.dsm}` + (d.icd ? ` · ICD-11: ${d.icd}` : "")));

            details.hidden = item.status === "Not considered";
            details.appendChild(el("div", "rz-hint", "Typically: " + d.supports));
            const fa = el("div", "rz-fa");
            fa.appendChild(textInput("For", item.forText, v => { item.forText = v; update(); }, "Features in this patient"));
            fa.appendChild(textInput("Against", item.againstText, v => { item.againstText = v; update(); }, "What doesn't fit"));
            details.appendChild(fa);
            details.appendChild(el("div", "rz-key", "Key question: " + d.keyQuestion));
            if (d.dsmIcd) details.appendChild(el("div", "rz-diff", "DSM vs ICD: " + d.dsmIcd));
            if (d.note) details.appendChild(el("div", "rz-hint", d.note));
            if (d.check && !C.reviewed) details.appendChild(checkBox(d.check));
            card.appendChild(details);
            content.appendChild(card);
        });

        content.appendChild(el("div", "rz-step", (flow ? "4" : "3") + " · Goes into the note"));
        content.appendChild(preview);
        const buttons = el("div", "rz-btns");
        const insert = el("button", "btn-primary", "Insert into Differentials");
        insert.id = "rz-dx-insert";
        const status = el("span", "rz-insert-status");
        status.setAttribute("role", "status");
        insert.addEventListener("click", () => {
            const lines = differentialLines();
            if (!lines.length) {
                status.textContent = "Nothing to insert yet.";
                return;
            }
            const where = insertBlock(DX_TITLE, lines, [/^\W*Differentials?\b/i, /^\W*Impression\b/i]);
            status.textContent = insertMessage(where, "Differentials");
        });
        buttons.appendChild(insert);
        buttons.appendChild(status);
        content.appendChild(buttons);
        content.appendChild(sourceList(C.differentialSources));
        update();
    }

    /* ----------------------------------------------- suicide risk formulation */

    function picked(map, items) {
        return items.filter(item => map[item]);
    }

    function suicideLines() {
        const S = C.suicide;
        const lines = [];
        const acute = S.acute.filter(a => sr.acute[a.id]).map(a => a.label);
        const status = picked(sr.status, S.status);
        const stateLabels = S.state.map(s => s.label);
        const state = picked(sr.state, stateLabels);
        const targets = S.state.filter(s => s.target && sr.state[s.label]).map(s => lowerFirst(s.label));
        const resources = picked(sr.resources, S.resources);

        if (acute.length) lines.push(`Acute concerns: ${acute.map(lowerFirst).join("; ")}.`);
        if (oneLine(sr.narrative)) lines.push(`Narrative: ${oneLine(sr.narrative)}`);
        if (oneLine(sr.intent)) lines.push(`Intent and communication: ${oneLine(sr.intent)}`);
        if (status.length) lines.push(`Why this person (compared with others): ${status.map(lowerFirst).join("; ")}.`);
        if (state.length || sr.baseline) {
            const baseline = sr.baseline ? ` (compared with their usual: ${sr.baseline.toLowerCase()})` : " (compared with their usual)";
            lines.push(`Why now${baseline}: ${state.length ? state.map(lowerFirst).join("; ") + "." : "no current drivers recorded."}`);
        }
        if (resources.length) lines.push(`What helps (held lightly): ${resources.map(lowerFirst).join("; ")}.`);
        if (oneLine(sr.words)) lines.push(`In their words: "${oneLine(sr.words)}"`);
        if (oneLine(sr.changes)) lines.push(`What could make it worse (foreseeable changes): ${oneLine(sr.changes)}`);
        if (targets.length) lines.push(`Modifiable drivers to target: ${targets.join("; ")}.`);

        const plan = S.plan.filter(p => sr.plan[p.id]).map(p => {
            let text = lowerFirst(p.label);
            if (p.id === "means" && oneLine(sr.means)) text += ` (${oneLine(sr.means)})`;
            if (p.id === "follow-up" && oneLine(sr.followUp)) text += ` (${oneLine(sr.followUp)})`;
            return text;
        });
        if (plan.length) lines.push(`Plan: ${plan.join("; ")}.`);
        return lines.map(line => line.replace(/\.\.$/, "."));
    }

    function renderSuicide(section) {
        const S = C.suicide;
        const content = section.querySelector(".oca-details-content");
        content.innerHTML = "";
        const preview = el("div", "rz-preview");
        const acuteBox = el("div", "rz-acute");
        const update = () => {
            const lines = suicideLines();
            preview.textContent = lines.length ? [SR_TITLE].concat(lines).join("\n")
                : "Tick the factors above and add the person's own words to build this.";
            const acute = S.acute.filter(a => sr.acute[a.id]);
            acuteBox.hidden = !acute.length;
            acuteBox.textContent = acute.length
                ? "High-acuity features present. Act now: the person should not leave unaccompanied while this is unresolved, and consider the Mental Health Act."
                : "";
        };

        content.appendChild(el("div", "rz-hint", S.intro));

        content.appendChild(el("div", "rz-step", "Act now if any apply"));
        const acuteGroup = el("div", "rz-chips");
        S.acute.forEach(a => acuteGroup.appendChild(chip(a.label, sr.acute, a.id, "rz-chip-acute", update)));
        content.appendChild(acuteGroup);
        content.appendChild(acuteBox);

        content.appendChild(textInput("Narrative: what led to this, in their words", sr.narrative, v => { sr.narrative = v; update(); }));
        content.appendChild(textInput("Intent and communication", sr.intent, v => { sr.intent = v; update(); },
            "Planning, preparation, notes, expected to die?, what interrupted it, feelings about surviving"));

        content.appendChild(el("div", "rz-step", "Why this person · compared with others"));
        content.appendChild(chipGroup(S.status, sr.status, "", update));

        content.appendChild(el("div", "rz-step", "Why now · compared with their usual"));
        const stateGroup = el("div", "rz-chips");
        S.state.forEach(s => stateGroup.appendChild(chip(s.label, sr.state, s.label, s.target ? "rz-chip-target" : "", update)));
        content.appendChild(stateGroup);
        content.appendChild(el("div", "rz-hint", "Dotted outline = a driver treatment can change. These are listed as targets in the plan."));
        const baselineLabel = el("label", null, "Compared with their usual, current risk is");
        const baseline = el("select");
        baseline.id = "rz-sr-baseline";
        baselineLabel.htmlFor = baseline.id;
        baseline.appendChild(new Option("(not stated)", ""));
        S.baseline.forEach(b => baseline.appendChild(new Option(b, b)));
        baseline.value = sr.baseline;
        baseline.addEventListener("change", () => { sr.baseline = baseline.value; update(); });
        content.appendChild(baselineLabel);
        content.appendChild(baseline);

        content.appendChild(el("div", "rz-step", "What helps · held lightly"));
        content.appendChild(chipGroup(S.resources, sr.resources, "rz-chip-protect", update));
        content.appendChild(el("div", "rz-hint", S.resourcesCaution));
        content.appendChild(textInput("In their words: reasons for living, what they want", sr.words, v => { sr.words = v; update(); }));

        content.appendChild(el("div", "rz-step", "What could make it worse"));
        content.appendChild(textInput("Foreseeable changes", sr.changes, v => { sr.changes = v; update(); },
            "e.g. discharge, court date, anniversary, relationship ending, withdrawal"));

        content.appendChild(el("div", "rz-step", "Plan"));
        const planGroup = el("div", "rz-chips");
        S.plan.forEach(p => planGroup.appendChild(chip(p.label, sr.plan, p.id, "", update)));
        content.appendChild(planGroup);
        content.appendChild(textInput("Means safety details", sr.means, v => { sr.means = v; update(); },
            "e.g. family to hold medications; 7-day dispensing"));
        content.appendChild(textInput("Follow-up details", sr.followUp, v => { sr.followUp = v; update(); },
            "e.g. call from community team within 24 hours; appointment Tuesday 10am"));
        if (!C.reviewed) content.appendChild(checkBox(S.followUpCheck));

        content.appendChild(el("div", "rz-step", "Goes into the note"));
        content.appendChild(preview);
        const buttons = el("div", "rz-btns");
        const insert = el("button", "btn-primary", "Insert into Risk to Self");
        insert.id = "rz-sr-insert";
        const plan = el("button", "btn-secondary", "Open safety plan template");
        const status = el("span", "rz-insert-status");
        status.setAttribute("role", "status");
        insert.addEventListener("click", () => {
            const lines = suicideLines();
            if (!lines.length) {
                status.textContent = "Nothing to insert yet.";
                return;
            }
            const where = insertBlock(SR_TITLE, lines, [/^\W*Risk to Self\b/i, /^\W*Risk Assessment\b/i]);
            status.textContent = insertMessage(where, "Risk to Self");
        });
        plan.addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent("open-note-template", { detail: { id: "safety-plan" } }));
        });
        buttons.appendChild(insert);
        buttons.appendChild(plan);
        buttons.appendChild(status);
        content.appendChild(buttons);
        content.appendChild(sourceList(S.sources));
        update();
    }

    function sourceList(sources) {
        const wrap = el("details", "rz-sources");
        wrap.appendChild(el("summary", null, "Sources"));
        const list = el("ul");
        sources.forEach(s => list.appendChild(el("li", null, s)));
        wrap.appendChild(list);
        return wrap;
    }

    /* ------------------------------------------------------------- set up */

    function section(title) {
        const details = el("details", "oca-form-details");
        details.open = true;
        details.appendChild(el("summary", null, title));
        details.appendChild(el("div", "oca-details-content"));
        return details;
    }

    function render() {
        body.innerHTML = "";
        if (!C.reviewed) {
            body.appendChild(el("div", "rz-banner",
                "Draft for clinician review. Content is summarised from DSM-5-TR, ICD-11 and the sources listed; it has not yet been checked line by line. Items marked Check need confirming."));
        }
        const dxSection = section("Differential diagnosis");
        const srSection = section("Suicide risk formulation");
        body.appendChild(dxSection);
        body.appendChild(srSection);
        renderDifferential(dxSection);
        renderSuicide(srSection);
    }

    // The tab needs more room than the MSE and formulation builders, so the
    // side panel widens while it is open. The button overrides that.
    const split = document.querySelector(".oca-split-view");
    const widthBtn = document.getElementById("oca-reasoning-width-btn");
    function setWide(wide) {
        if (!split) return;
        split.classList.toggle("oca-wide", wide);
        if (widthBtn) widthBtn.textContent = wide ? "⤡ Narrow panel" : "⤢ Widen panel";
    }
    document.querySelectorAll(".oca-tab-btn").forEach(btn => {
        btn.addEventListener("click", () => setWide(btn.dataset.ocaTab === "oca-reasoning-panel"));
    });
    if (widthBtn) widthBtn.addEventListener("click", () => setWide(!split.classList.contains("oca-wide")));

    document.addEventListener("oca-reset", () => {
        freshState();
        render();
    });

    freshState();
    render();
})();
