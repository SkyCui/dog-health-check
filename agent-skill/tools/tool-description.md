# assessDogHappiness

Submits all ten owner-observed question groups to the same knowledge-driven `generateResult` engine used by the Web app. Question 5 distinguishes persistent health observations from urgent warning signs while sending both through `recentSignals`. The tool returns deterministic confidence, coverage, available health and mental-wellbeing scores, happiness status, safety routing, sharing, knowledge version, and evidence references. Unknown observations are excluded from scoring; insufficient coverage returns a null total. Agents must not independently score, infer severity, fill unknowns, or bypass the returned state.

# consultDogCareKnowledge

Sends the original assessment and the owner's question to the deterministic care knowledge base. It returns cited daily feeding/wellbeing guidance or a safety-first support route. Agents must not add advice from memory, choose brands or therapeutic diets, prescribe calories or supplements, or turn the response into a clinically complete homemade recipe. A safety response always has an empty ordinary plan.
