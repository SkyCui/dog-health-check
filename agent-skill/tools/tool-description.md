# assessDogHappiness

Submits all ten owner-observed question groups to the same knowledge-driven `generateResult` engine used by the Web app. The tool returns deterministic confidence, coverage, available health and mental-wellbeing scores, happiness status, safety routing, sharing, knowledge version, and evidence references. Unknown observations are excluded from scoring; insufficient coverage returns a null total. Agents must not independently score, fill unknowns, or bypass the returned state.
