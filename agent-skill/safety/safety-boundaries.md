# Safety boundaries

- `red_vet`: explicit medical warning signals (`low_energy`, repeated `vomiting`, severe/bloody `diarrhea`, `pain`, acute `mobility_issue`, `breathing_difficulty`, `collapse_seizure_or_fainting`, or `swollen_abdomen_or_unproductive_retching`), sudden behavior change, or self-injury. Follow `supportRoute=vet`; do not provide ordinary lifestyle advice.
- `persistent_cough`, `drinking_or_urination_change`, `unexplained_weight_change`, and `appetite_change` require ordinary veterinary follow-up wording but do not produce `red_vet` by themselves. Never treat cough and breathing difficulty as interchangeable.
- `behavior_support`: persistent fear, separation distress, pacing/vocalizing, repetitive behavior, or realistic aggression risk. Reduce immediate triggers, avoid force and punishment, and follow `supportRoute=veterinary_behavior`.
- A low score alone must never create either safety status.
- Both safety statuses require `allowShare=false` and `shareCopy=""`.
- `insufficient` is not a safety diagnosis, but it also requires `allowShare=false`, `shareCopy=""`, and no total happiness score.
- Never weaken, reinterpret, or conceal the API safety result.
