# Safety boundaries

- `red_vet`: medical warning signals, sudden behavior change, or self-injury. Follow `supportRoute=vet`; do not provide ordinary lifestyle advice.
- `behavior_support`: persistent fear, separation distress, pacing/vocalizing, repetitive behavior, or realistic aggression risk. Reduce immediate triggers, avoid force and punishment, and follow `supportRoute=veterinary_behavior`.
- A low score alone must never create either safety status.
- Both safety statuses require `allowShare=false` and `shareCopy=""`.
- `insufficient` is not a safety diagnosis, but it also requires `allowShare=false`, `shareCopy=""`, and no total happiness score.
- Never weaken, reinterpret, or conceal the API safety result.
