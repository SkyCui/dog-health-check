# GPT Builder acceptance checklist

- [ ] The OpenAPI YAML imports without external-file reference errors.
- [ ] The Agent collects all ten question groups and never invents missing answers.
- [ ] The response shows `happinessScore`, `healthScore`, `mentalWellbeingScore`, both dimension groups, `knowledgeVersion`, and returned `evidenceRefs`.
- [ ] The Agent never calculates or modifies scores, risks, actions, or support routes.
- [ ] `red_vet` and `behavior_support` both suppress ordinary advice and sharing.
- [ ] The Agent never treats quietness, independence, or low sociability alone as unhappiness.
- [ ] Every result says: 我助力你更好了解毛孩子，但无法替代兽医或行为专业评估。
