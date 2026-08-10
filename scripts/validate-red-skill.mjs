import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const skill = fs.readFileSync(path.join(root, "red-skill/SKILL.md"), "utf8");
const questionnaire = JSON.parse(fs.readFileSync(path.join(root, "knowledge/questionnaire.json"), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(skill.startsWith("---\n"), "Red Skill must start with YAML frontmatter");
assert(/^name: assess-dog-happiness$/m.test(skill), "Red Skill name is missing or invalid");
assert(/^description: .+$/m.test(skill), "Red Skill description is required");
assert(skill.includes("https://dog-health-check.vercel.app/assessment"), "production assessment URL is missing");
assert(skill.includes("https://dog-health-check.vercel.app/api/assess"), "production API URL is missing");

for (let question = 1; question <= 10; question += 1) {
  assert(skill.includes(`问题 ${question}/10`), `question ${question}/10 is missing`);
}

for (const question of questionnaire.questions) {
  for (const [field, values] of Object.entries(question.fieldEnums)) {
    for (const value of values) {
      if (field === "bodyCondition" && value === "unknown") continue;
      assert(skill.includes(`\`${value}\``), `Red Skill is missing ${field} value ${value}`);
    }
  }
}

const bodyStart = skill.indexOf("### 问题 2/10");
const bodyEnd = skill.indexOf("### 问题 3/10");
assert(bodyStart >= 0 && bodyEnd > bodyStart, "body-condition section is malformed");
const bodySection = skill.slice(bodyStart, bodyEnd);
assert(!/^\d+\.\s+不确定/m.test(bodySection), "question 2 must not offer unknown");
for (const value of ["thin", "ideal", "slightly_fat", "obese"]) {
  assert(bodySection.includes(`\`${value}\``), `question 2 is missing ${value}`);
}

for (const command of ["上一步", "继续", "退出自查"]) {
  assert(skill.includes(command), `conversation command ${command} is missing`);
}
for (const safetyStatus of ["red_vet", "behavior_support", "allowShare", "shareCopy"]) {
  assert(skill.includes(`\`${safetyStatus}\``), `safety rule ${safetyStatus} is missing`);
}

assert(!/(?:¥|￥|1\.99|9\.99|无限次|永久会员)/.test(skill), "phase-one Red Skill must not advertise paid features");

console.log("Red Skill validation passed: phase-one free flow");
