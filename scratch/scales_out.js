    // 24. PCL-R
    setupScaleCalculator({
        id: "pclr",
        name: "Psychopathy Checklist - Revised (PCL-R)",
        note: "Evaluate psychopathic traits.",
        reference: "Hare RD. The Hare Psychopathy Checklist-Revised. Multi-Health Systems. 1991.",
        items: [
            { displayName: "1. Glibness/Superficial Charm", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "2. Grandiose Sense of Self-Worth", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "3. Need for Stimulation", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "4. Pathological Lying", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "5. Conning/Manipulative", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "6. Lack of Remorse or Guilt", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "7. Shallow Affect", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "8. Callous/Lack of Empathy", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "9. Parasitic Lifestyle", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "10. Poor Behavioral Controls", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "11. Promiscuous Sexual Behavior", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "12. Early Behavior Problems", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "13. Lack of Realistic, Long-Term Goals", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "14. Impulsivity", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "15. Irresponsibility", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "16. Failure to Accept Responsibility", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "17. Many Short-Term Marital Relationships", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "18. Juvenile Delinquency", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "19. Revocation of Conditional Release", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] },
            { displayName: "20. Criminal Versatility", options: [ { value: 0, label: "0 (Not Present)" }, { value: 1, label: "1 (Partially Present)" }, { value: 2, label: "2 (Present)" } ] }
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
            { displayName: "1. I often notice small sounds when others do not.", options: [ { value: 1, label: "Definitely Agree" }, { value: 1, label: "Slightly Agree" }, { value: 0, label: "Slightly Disagree" }, { value: 0, label: "Definitely Disagree" } ] },
            { displayName: "2. I usually concentrate more on the whole picture, rather than the small details.", options: [ { value: 0, label: "Definitely Agree" }, { value: 0, label: "Slightly Agree" }, { value: 1, label: "Slightly Disagree" }, { value: 1, label: "Definitely Disagree" } ] },
            { displayName: "3. I find it easy to do more than one thing at once.", options: [ { value: 0, label: "Definitely Agree" }, { value: 0, label: "Slightly Agree" }, { value: 1, label: "Slightly Disagree" }, { value: 1, label: "Definitely Disagree" } ] },
            { displayName: "4. If there is an interruption, I can switch back to what I was doing very quickly.", options: [ { value: 0, label: "Definitely Agree" }, { value: 0, label: "Slightly Agree" }, { value: 1, label: "Slightly Disagree" }, { value: 1, label: "Definitely Disagree" } ] },
            { displayName: "5. I find it easy to 'read between the lines' when someone is talking to me.", options: [ { value: 0, label: "Definitely Agree" }, { value: 0, label: "Slightly Agree" }, { value: 1, label: "Slightly Disagree" }, { value: 1, label: "Definitely Disagree" } ] },
            { displayName: "6. I know how to tell if someone listening to me is getting bored.", options: [ { value: 0, label: "Definitely Agree" }, { value: 0, label: "Slightly Agree" }, { value: 1, label: "Slightly Disagree" }, { value: 1, label: "Definitely Disagree" } ] },
            { displayName: "7. When I'm reading a story, I find it difficult to work out the characters' intentions.", options: [ { value: 1, label: "Definitely Agree" }, { value: 1, label: "Slightly Agree" }, { value: 0, label: "Slightly Disagree" }, { value: 0, label: "Definitely Disagree" } ] },
            { displayName: "8. I like to collect information about categories of things.", options: [ { value: 1, label: "Definitely Agree" }, { value: 1, label: "Slightly Agree" }, { value: 0, label: "Slightly Disagree" }, { value: 0, label: "Definitely Disagree" } ] },
            { displayName: "9. I find it easy to work out what someone is thinking or feeling just by looking at their face.", options: [ { value: 0, label: "Definitely Agree" }, { value: 0, label: "Slightly Agree" }, { value: 1, label: "Slightly Disagree" }, { value: 1, label: "Definitely Disagree" } ] },
            { displayName: "10. I find it difficult to work out people's intentions.", options: [ { value: 1, label: "Definitely Agree" }, { value: 1, label: "Slightly Agree" }, { value: 0, label: "Slightly Disagree" }, { value: 0, label: "Definitely Disagree" } ] }
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
            { displayName: "1. In general, do you have difficulty making and keeping friends?", options: [ { value: 0, label: "No (0)" }, { value: 1, label: "Yes (1)" } ] },
            { displayName: "2. Would you normally describe yourself as a loner?", options: [ { value: 0, label: "No (0)" }, { value: 1, label: "Yes (1)" } ] },
            { displayName: "3. In general, do you trust other people?", options: [ { value: 1, label: "No (1)" }, { value: 0, label: "Yes (0)" } ] },
            { displayName: "4. Do you normally get into arguments or fights?", options: [ { value: 0, label: "No (0)" }, { value: 1, label: "Yes (1)" } ] },
            { displayName: "5. Do you often feel that you have to be the life of the party?", options: [ { value: 0, label: "No (0)" }, { value: 1, label: "Yes (1)" } ] },
            { displayName: "6. Do you generally do things on the spur of the moment?", options: [ { value: 0, label: "No (0)" }, { value: 1, label: "Yes (1)" } ] },
            { displayName: "7. Do you often worry about things that other people may be thinking of you?", options: [ { value: 0, label: "No (0)" }, { value: 1, label: "Yes (1)" } ] },
            { displayName: "8. Is it your practice to keep on good terms with everyone?", options: [ { value: 1, label: "No (1)" }, { value: 0, label: "Yes (0)" } ] }
        ],
        severityLogic: (score) => {
            if (score >= 3) return `Score: ${score}/8 - Suggests potential personality dysfunction. Further assessment recommended.`;
            return `Score: ${score}/8 - Below typical clinical threshold`;
        }
    });

    // 29. BIS-11
    setupScaleCalculator({
        id: "bis11",
        name: "BIS-11 (Barratt Impulsiveness Scale)",
        reference: "Patton JH, Stanford MS, Barratt ES. Factor structure of the Barratt Impulsiveness Scale. J Clin Psychol. 1995;51(6):768-774.",
        items: [
            { displayName: "1. I plan tasks carefully.", options: [ { value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" } ] },
            { displayName: "2. I do things without thinking.", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "3. I make-up my mind quickly.", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "4. I am happy-go-lucky.", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "5. I don't 'pay attention.'", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "6. I have 'racing' thoughts.", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "7. I plan trips well ahead of time.", options: [ { value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" } ] },
            { displayName: "8. I am self-controlled.", options: [ { value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" } ] },
            { displayName: "9. I concentrate easily.", options: [ { value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" } ] },
            { displayName: "10. I save regularly.", options: [ { value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" } ] },
            { displayName: "11. I 'squirm' at plays or lectures.", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "12. I am a careful thinker.", options: [ { value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" } ] },
            { displayName: "13. I plan for job security.", options: [ { value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" } ] },
            { displayName: "14. I say things without thinking.", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "15. I like to think about complex problems.", options: [ { value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" } ] },
            { displayName: "16. I change jobs.", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "17. I act 'on impulse.'", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "18. I get easily bored when solving thought problems.", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "19. I act on the spur of the moment.", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "20. I am a steady thinker.", options: [ { value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" } ] },
            { displayName: "21. I change residences.", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "22. I buy things on impulse.", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "23. I can only think about one thing at a time.", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "24. I change hobbies.", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "25. I spend or charge more than I earn.", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "26. I am more interested in the present than the future.", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "27. I am restless at the theater or lectures.", options: [ { value: 1, label: "Rarely/Never" }, { value: 2, label: "Occasionally" }, { value: 3, label: "Often" }, { value: 4, label: "Almost Always" } ] },
            { displayName: "28. I like puzzles.", options: [ { value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" } ] },
            { displayName: "29. I am future-oriented.", options: [ { value: 4, label: "Rarely/Never" }, { value: 3, label: "Occasionally" }, { value: 2, label: "Often" }, { value: 1, label: "Almost Always" } ] }
        ],
        severityLogic: (score) => {
            return `Total Impulsivity Score: ${score} (Range 30-120)`;
        }
    });
