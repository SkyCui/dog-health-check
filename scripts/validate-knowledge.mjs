import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const sourcesFile = readJson("knowledge/sources.json");
const questionnaire = readJson("knowledge/questionnaire.json");
const evidenceMap = readJson("knowledge/evidence-map.json");
const rules = readJson("knowledge/rules/assessment-rules.json");
const contentRules = readJson("knowledge/rules/content-rules.json");
const requestSchema = readJson("schemas/assess-request.schema.json");
const agentRequestSchema = readJson("agent-skill/schemas/assess-request.schema.json");
const openapi = fs.readFileSync(path.join(root, "agent-skill/tools/assess_dog_health.openapi.yaml"), "utf8");
const routeSource = fs.readFileSync(path.join(root, "app/api/assess/route.ts"), "utf8");
const formSource = fs.readFileSync(path.join(root, "components/AssessmentForm.tsx"), "utf8");
const sourceIds = new Set(sourcesFile.sources.map((source) => source.id));
const allowedLevels = new Set(["A1", "A2", "B", "C"]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateRefs(owner, refs) {
  assert(Array.isArray(refs) && refs.length > 0, `${owner} must have evidenceRefs`);
  refs.forEach((ref) => assert(sourceIds.has(ref), `${owner} references unknown source ${ref}`));
}

function schemaEnum(schema, field) {
  const parts = field.split(".");
  let node = schema.properties;
  for (const [index, part] of parts.entries()) {
    const property = node[part];
    assert(property, `schema is missing ${field}`);
    if (index === parts.length - 1) return property.enum || property.items?.enum;
    node = property.properties;
  }
}

assert(questionnaire.questions.length === 10, "questionnaire must contain exactly 10 question groups");
assert(new Set(questionnaire.questions.map((item) => item.number)).size === 10, "question numbers must be unique");
sourcesFile.sources.forEach((source) => {
  assert(allowedLevels.has(source.level), `invalid evidence level for ${source.id}`);
  for (const field of ["title", "organization", "url", "validation", "scope", "limitations", "conflicts"]) {
    assert(typeof source[field] === "string" && source[field].length > 0, `${source.id}.${field} is required`);
  }
});
questionnaire.questions.forEach((question) => validateRefs(`question:${question.id}`, question.evidenceRefs));
questionnaire.questions.forEach((question) => {
  assert(question.fieldEnums && Object.keys(question.fieldEnums).length > 0, `question:${question.id} must declare fieldEnums`);
  for (const [field, values] of Object.entries(question.fieldEnums)) {
    assert(JSON.stringify(schemaEnum(requestSchema, field)) === JSON.stringify(values), `${field} differs between questionnaire and request schema`);
    assert(JSON.stringify(schemaEnum(agentRequestSchema, field)) === JSON.stringify(values), `${field} differs between questionnaire and Agent schema`);
    values.forEach((value) => {
      assert(openapi.includes(value), `OpenAPI is missing ${field} value ${value}`);
      assert(routeSource.includes(`"${value}"`), `API route is missing ${field} value ${value}`);
      assert(formSource.includes(`"${value}"`), `Web form is missing ${field} value ${value}`);
    });
  }
});
evidenceMap.mappings.forEach((mapping) => validateRefs(`mapping:${mapping.id}`, mapping.evidenceRefs));
for (const [section, value] of Object.entries(rules)) {
  if (value && typeof value === "object" && "evidenceRefs" in value) validateRefs(`rules:${section}`, value.evidenceRefs);
}
assert(rules.method === "product_heuristic", "numeric rules must declare product_heuristic");
assert(questionnaire.knowledgeVersion === sourcesFile.knowledgeVersion, "questionnaire knowledge version mismatch");
assert(rules.knowledgeVersion === sourcesFile.knowledgeVersion, "rules knowledge version mismatch");
assert(contentRules.knowledgeVersion === sourcesFile.knowledgeVersion, "content rules knowledge version mismatch");
validateRefs("content-rules", contentRules.evidenceRefs);
rules.riskPriority.candidates.forEach((candidate) => {
  assert(contentRules.riskReasons[candidate.title], `risk candidate ${candidate.title} is missing evidence-backed reason copy`);
  assert(contentRules.actions[candidate.title], `risk candidate ${candidate.title} is missing an action`);
});
[...rules.safety.redVetRecentSignals, ...rules.safety.redVetMentalSignals, ...rules.safety.behaviorSupportSignals].forEach((signal) => {
  assert(rules.safety.signalLabels[signal], `safety signal ${signal} is missing a knowledge-base label`);
});
assert(!openapi.includes("./schemas/") && !openapi.includes(".schema.json"), "OpenAPI must not use external schemas");

console.log(`Knowledge validation passed: ${sourcesFile.knowledgeVersion}`);
