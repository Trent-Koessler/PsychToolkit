const fs = require('fs');

function buildPCLR() {
    let out = `    // 24. PCL-R
    setupScaleCalculator({
        id: "pclr",
        name: "Psychopathy Checklist - Revised (PCL-R)",
        note: "Evaluate psychopathic traits.",
        reference: "Hare RD. The Hare Psychopathy Checklist-Revised. Multi-Health Systems. 1991.",
        items: [\n`;
    const sections = {
        "factor1": ["1. Glibness/Superficial Charm", "2. Grandiose Sense of Self-Worth", "4. Pathological Lying", "5. Conning/Manipulative", "6. Lack of Remorse or Guilt", "7. Shallow Affect", "8. Callous/Lack of Empathy", "16. Failure to Accept Responsibility"],
        "factor2": ["3. Need for Stimulation", "9. Parasitic Lifestyle", "10. Poor Behavioral Controls", "12. Early Behavior Problems", "13. Lack of Realistic, Long-Term Goals", "14. Impulsivity", "15. Irresponsibility", "18. Juvenile Delinquency", "19. Revocation of Conditional Release", "20. Criminal Versatility"],
        "additional": ["11. Promiscuous Sexual Behavior", "17. Many Short-Term Marital Relationships"]
    };
    let all = [];
    Object.values(sections).forEach(arr => all = all.concat(arr));
    // sort by number
    all.sort((a,b) => parseInt(a) - parseInt(b));
    all.forEach((item, i) => {
        out += `            { displayName: "${item}", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] }`;
        if (i < all.length - 1) out += ",\n";
    });
    out += `\n        ],
        severityLogic: (score) => {
            return \`Total PCL-R Score: \${score} / 40\`;
        }
    });\n\n`;
    return out;
}

function buildAQ10() {
    const items = [
        ["1. I often notice small sounds when others do not.", true],
        ["2. I usually concentrate more on the whole picture, rather than the small details.", false],
        ["3. I find it easy to do more than one thing at once.", false],
        ["4. If there is an interruption, I can switch back to what I was doing very quickly.", false],
        ["5. I find it easy to 'read between the lines' when someone is talking to me.", false],
        ["6. I know how to tell if someone listening to me is getting bored.", false],
        ["7. When I'm reading a story, I find it difficult to work out the characters' intentions.", true],
        ["8. I like to collect information about categories of things.", true],
        ["9. I find it easy to work out what someone is thinking or feeling just by looking at their face.", false],
        ["10. I find it difficult to work out people's intentions.", true]
    ];
    let out = `    // 25. AQ-10
    setupScaleCalculator({
        id: "aq10",
        name: "Autism Spectrum Quotient (AQ-10)",
        note: "Diagnostic referral screen for adult autism.",
        reference: "Allison C, Auyeung B, Baron-Cohen S. A user guide to the AQ-10. J Am Acad Child Adolesc Psychiatry. 2012;51(2):202-212.",
        items: [\n`;
    items.forEach((x, i) => {
        if (x[1]) {
            out += `            { displayName: "${x[0]}", options: [ { value: 1, label: "Definitely Agree" }, { value: 1, label: "Slightly Agree" }, { value: 0, label: "Slightly Disagree" }, { value: 0, label: "Definitely Disagree" } ] }`;
        } else {
            out += `            { displayName: "${x[0]}", options: [ { value: 0, label: "Definitely Agree" }, { value: 0, label: "Slightly Agree" }, { value: 1, label: "Slightly Disagree" }, { value: 1, label: "Definitely Disagree" } ] }`;
        }
        if (i < items.length - 1) out += ",\n";
    });
    out += `\n        ],
        severityLogic: (score) => {
            if (score >= 6) return \`Score: \${score}/10 - Suggests referral for formal autism spectrum assessment (score >= 6)\`;
            return \`Score: \${score}/10 - Below referral threshold\`;
        }
    });\n\n`;
    return out;
}

function buildSAPAS() {
    const items = [
        ["1. In general, do you have difficulty making and keeping friends?", false],
        ["2. Would you normally describe yourself as a loner?", false],
        ["3. In general, do you trust other people?", true],
        ["4. Do you normally get into arguments or fights?", false],
        ["5. Do you often feel that you have to be the life of the party?", false],
        ["6. Do you generally do things on the spur of the moment?", false],
        ["7. Do you often worry about things that other people may be thinking of you?", false],
        ["8. Is it your practice to keep on good terms with everyone?", true]
    ];
    let out = `    // 26. SAPAS
    setupScaleCalculator({
        id: "sapas",
        name: "SAPAS (Standardised Assessment of Personality - Abbreviated)",
        note: "Screening tool for personality disorders.",
        reference: "Moran P, Leese M, Lee T, et al. Standardised Assessment of Personality - Abbreviated Scale (SAPAS). Br J Psychiatry. 2003;183:228-232.",
        items: [\n`;
    items.forEach((x, i) => {
        if (x[1]) {
            out += `            { displayName: "${x[0]}", options: [ { value: 1, label: "No (1)" }, { value: 0, label: "Yes (0)" } ] }`;
        } else {
            out += `            { displayName: "${x[0]}", options: [ { value: 0, label: "No (0)" }, { value: 1, label: "Yes (1)" } ] }`;
        }
        if (i < items.length - 1) out += ",\n";
    });
    out += `\n        ],
        severityLogic: (score) => {
            if (score >= 3) return \`Score: \${score}/8 - Suggests potential personality dysfunction. Further assessment recommended.\`;
            return \`Score: \${score}/8 - Below typical clinical threshold\`;
        }
    });\n\n`;
    return out;
}

function buildBIS() {
    const raw = [["I plan tasks carefully.", true], ["I do things without thinking.", false], ["I make-up my mind quickly.", false], ["I am happy-go-lucky.", false], ["I don't 'pay attention.'", false], ["I have 'racing' thoughts.", false], ["I plan trips well ahead of time.", true], ["I am self-controlled.", true], ["I concentrate easily.", true], ["I save regularly.", true], ["I 'squirm' at plays or lectures.", false], ["I am a careful thinker.", true], ["I plan for job security.", true], ["I say things without thinking.", false], ["I like to think about complex problems.", true], ["I change jobs.", false], ["I act 'on impulse.'", false], ["I get easily bored when solving thought problems.", false], ["I act on the spur of the moment.", false], ["I am a steady thinker.", true], ["I change residences.", false], ["I buy things on impulse.", false], ["I can only think about one thing at a time.", false], ["I change hobbies.", false], ["I spend or charge more than I earn.", false], ["I am more interested in the present than the future.", false], ["I am restless at the theater or lectures.", false], ["I like puzzles.", true], ["I am future-oriented.", true]];
    
    let out = `    // 29. BIS-11
    setupScaleCalculator({
        id: "bis11",
        name: "BIS-11 (Barratt Impulsiveness Scale)",
        reference: "Patton JH, Stanford MS, Barratt ES. Factor structure of the Barratt Impulsiveness Scale. J Clin Psychol. 1995;51(6):768-774.",
        items: [\n`;
    
    raw.forEach((x, i) => {
        let title = `${i+1}. ${x[0]}`;
        if (x[1]) {
            out += `            { displayName: "${title}", options: [ { value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" } ] }`;
        } else {
            out += `            { displayName: "${title}", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] }`;
        }
        if (i < raw.length - 1) out += ",\n";
    });
    out += `\n        ],
        severityLogic: (score) => {
            return \`Total Impulsivity Score: \${score} (Range 30-120)\`;
        }
    });\n`;
    return out;
}

const full = buildPCLR() + buildAQ10() + buildSAPAS() + buildBIS();
fs.writeFileSync('scratch/scales_out.js', full);
