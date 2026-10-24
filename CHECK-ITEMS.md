# Clinical reasoning: items to check

Points in the Reasoning tab that could not be confirmed against the primary source (mostly ICD-11 codes found only on coding sites, not the WHO browser at icd.who.int).
Each one shows as a "Check:" note in the app until it is confirmed.

When an item is confirmed (or corrected), remove its `check` line in `reasoning-content.js` and run `npm run checks` to update this list.
When the list is empty and the content has been reviewed, set `reviewed: true` in `reasoning-content.js` to remove the draft banner.

**51 items to check.** Draft banner: on.

## Suicide risk formulation

- [ ] **Follow-up:** Your Safety Planning note gives contact within 24-72 hours of discharge. Confirm the timeframe in NSW Health PD2022_043 and your local procedure before relying on it.

## Psychosis

- [ ] **Substance/medication-induced psychotic disorder:** Confirm the ICD-11 codes 6C41.6 (cannabis) and 6C40.6 (alcohol). 6C46.6 and 6C45.6 were confirmed.
- [ ] **Psychosis due to another medical condition:** Confirm the ICD-11 code 6E61.
- [ ] **Other specified psychotic disorder:** Confirm the ICD-11 code 6A2Y.

## Depressed mood

- [ ] **Substance/medication-induced depressive disorder:** Confirm the ICD-11 codes for substances other than alcohol (6C40.70 was confirmed).
- [ ] **Depressive disorder due to another medical condition:** Confirm the ICD-11 code 6E62.
- [ ] **Persistent depressive disorder (dysthymia):** Confirm the ICD-11 code 6A72.
- [ ] **Other specified bipolar disorder:** Confirm the ICD-11 code 6A6Y.
- [ ] **Cyclothymic disorder:** Confirm the ICD-11 code 6A62.
- [ ] **Other specified depressive disorder:** Confirm the ICD-11 code 6A7Y.

## Elevated or irritable mood

- [ ] **Substance/medication-induced bipolar disorder:** Confirm the ICD-11 code 6C46.70 (6C40.70 for alcohol was confirmed).
- [ ] **Bipolar and related disorder due to another medical condition:** Confirm the ICD-11 code 6E62.
- [ ] **Other specified bipolar disorder:** Confirm the ICD-11 code 6A6Y.
- [ ] **Cyclothymic disorder:** Confirm the ICD-11 code 6A62.
- [ ] **Borderline personality disorder or ADHD:** Confirm the ICD-11 codes 6D11.5 and 6A05.

## Anxiety

- [ ] **Substance/medication-induced anxiety disorder:** Confirm the ICD-11 codes for substance-induced anxiety disorders (6C4x.71).
- [ ] **Separation anxiety disorder:** Confirm the ICD-11 code 6B05.
- [ ] **Illness anxiety disorder (health anxiety):** Confirm the ICD-11 code 6B23.
- [ ] **Somatic symptom disorder:** Confirm the ICD-11 code 6C20.
- [ ] **Obsessive-compulsive disorder:** Confirm the ICD-11 code 6B20.
- [ ] **Body dysmorphic disorder:** Confirm the ICD-11 code 6B21.
- [ ] **Post-traumatic stress disorder:** Confirm the ICD-11 codes 6B40 and 6B41.
- [ ] **Other specified anxiety disorder:** Confirm the ICD-11 code 6B0Y.

## Catatonia

- [ ] **Delirium:** Confirm the ICD-11 code 6D70.

## Cognitive impairment

- [ ] **Alcohol-related brain injury (Wernicke-Korsakoff):** Confirm the ICD-11 code 6D84.
- [ ] **Dissociative amnesia or PTSD:** Confirm the ICD-11 code 6B61.
- [ ] **Frontotemporal neurocognitive disorder:** Confirm the ICD-11 code 6D83.
- [ ] **Neurocognitive disorder due to Parkinson's disease:** Confirm the ICD-11 code 6D85.
- [ ] **Neurocognitive disorder, cause not yet known:** Confirm the ICD-11 code 6D8Z.
- [ ] **Intellectual developmental disorder:** Confirm the ICD-11 code 6A00.

## Problematic substance use

- [ ] **Substance use disorder:** Confirm the ICD-11 dependence threshold (two or more of the three central features) and the substance codes other than alcohol (6C40).
- [ ] **Intoxication or withdrawal only:** Confirm the ICD-11 intoxication and withdrawal subcodes (.3 and .4).
- [ ] **Use without a disorder:** Confirm the ICD-11 code QE10 and its equivalents for other substances.

## Suicidal, self-harm or aggressive behaviour

- [ ] **Post-traumatic stress disorder:** Confirm the ICD-11 codes 6B40 and 6B41.
- [ ] **Borderline personality disorder:** Confirm the ICD-11 codes 6D10 and 6D11.5.
- [ ] **Antisocial personality disorder:** Confirm the ICD-11 code 6D11.2.
- [ ] **Neurodevelopmental condition:** Confirm the ICD-11 codes 6A02, 6A00 and 6A05.
- [ ] **Body-focused repetitive behaviour:** Confirm the ICD-11 codes 6B25.0 and 6B25.1.
- [ ] **Delirium or another medical cause:** Confirm the ICD-11 code 6E68.

## Sleep problems (insomnia or sleepiness)

- [ ] **Short-term insomnia:** Confirm how ICD-11 codes insomnia for 3 months or more on fewer than 3 nights a week (7A00 asks for 'several times a week').
- [ ] **Hypersomnolence disorder:** Confirm how ICD-11 maps DSM-5-TR hypersomnolence disorder (7A21 is the closest match, not an exact one).
- [ ] **Sleepwalking or sleep terrors:** Confirm the ICD-11 sub-codes 7B00.0–7B00.3.

## Eating or weight change

- [ ] **Anorexia nervosa:** Confirm the ICD-11 BMI cut-off of 14 for 'dangerously low' and the restricting / binge-purge pattern sub-codes.
- [ ] **Binge-eating disorder:** Confirm the ICD-11 duration for binge eating disorder (several months).

## Physical symptoms or health worry

- [ ] **Psychological factors affecting a medical condition:** Confirm the ICD-11 code 6E40.
- [ ] **Other specified somatic symptom and related disorder:** Confirm the ICD-11 code 6C2Y.

## Depersonalisation or derealisation

- [ ] **Dissociative amnesia:** Confirm the ICD-11 code 6B61.
- [ ] **Dissociative identity disorder:** Confirm the ICD-11 codes 6B64 and 6B65.

## Psychomotor slowing

- [ ] **Other specified depressive disorder or unspecified catatonia:** Confirm the ICD-11 code 6A7Y.

## Sexual problems

- [ ] **Genito-pelvic pain/penetration disorder:** Confirm the ICD-11 code HA20.
- [ ] **Substance/medication-induced sexual dysfunction:** Confirm the ICD-11 aetiological qualifier codes (HA40).
