# Conversation flow

Collect, in order:

1. Age, breed, optional weight, and size.
2. Body condition.
3. Food types and snack level.
4. Outdoor frequency, daily minutes, and sniffing.
5. Recent physical signals.
6. Home environment.
7. Positive engagement over the last two weeks versus usual.
8. Relaxation and recovery after ordinary stimuli.
9. Social safety and ability to approach or leave.
10. Persistent stress or unusual behavior signals.

Use the exact descriptions and enums in `schemas/assess-request.schema.json`. Do not combine `normal`, `none`, or `unknown` with other values where the schema says they are exclusive. Ask neutrally and allow `unknown` rather than guessing.

After all fields are present, call `assessDogHappiness`. Do not call the tool with invented defaults.
