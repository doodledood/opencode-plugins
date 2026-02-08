# RESEARCH Task Guidance

Investigations, analyses, comparisons, technology evaluations.

## Quality Gates

### Baselines (always enforced)

- **Source credibility** — Key findings backed by credible, identifiable sources, weighted by authority level and claim stakes
- **Cross-referencing** — Claims in conclusions corroborated across independent sources, depth proportional to claim importance
- **Evidence traceability** — Key claims traceable to specific sources
- **Internal consistency** — Findings, analysis, and conclusions don't contradict each other
- **Assumptions transparency** — Choices and assumptions made during research are explicit and revisable
- **Gap honesty** — Knowledge gaps explicitly stated
- **Scope boundaries** — What's in and out of scope stated explicitly
- **Definitional clarity** — Key terms defined and used consistently across the report; comparisons use the same definitions across all options
- **Evaluation symmetry** — When comparing options, each evaluated with comparable depth and rigor — no option gets cursory treatment while another gets deep analysis

### Selectable Gates

| Aspect | Threshold |
|--------|-----------|
| Recency | Sources published within the topic's relevance window — fast-moving topics demand recent, stable topics tolerate older |
| Counterfactual testing | Key claims tested against disconfirming evidence — "what would make this wrong?" |
| Opposing evidence sought | Research actively sought and fairly represented viewpoints opposing its conclusions |
| Emergent depth | Dedicated sections, follow-up searches, or scope evolution documented for unexpected findings |
| Synthesis | Findings connected into meaning — "so what?" answered, not just facts listed |
| Actionability | Output enables a decision or next step without further research |
| Question completeness | All dimensions of the research question identified and addressed |
| Output structure | Report organized for the reader's decision flow — navigable, scannable, key insights surfaced not buried |
| Prioritization | When multiple options or findings exist, ranked with explicit criteria — not just listed |
| Follow-up anticipation | Report preempts the reader's likely next questions rather than leaving obvious gaps |
| Quantification | Claims that could be quantified use numbers, not vague qualitative language — "faster" becomes "~2x faster" when evidence supports it |
| Conclusion robustness | Key conclusions tested for sensitivity to assumptions — "this holds unless X changes" identified, fragile recommendations flagged |

### Source Authority Scale

High (official docs, peer-reviewed, creator blogs) > Medium (established publications, top SO answers) > Low (personal blogs, forums, outdated). Use as guidance, not rigid tiers — one high-authority source can outweigh multiple medium ones depending on claim stakes.

## Risks

- **Source bias** - all sources from same perspective; probe: what viewpoints might disagree?
- **Confirmation bias** - only finding evidence supporting initial hypothesis, including biased search terms; probe: what searches would you run if you believed the *opposite* conclusion? Run those too
- **Recency gap** - topic evolved since sources published; probe: how fast-moving is this topic?
- **Coverage gap** - sub-question has no authoritative sources
- **Conflicting authorities** - high-authority sources contradict; probe: present both or resolve?
- **Premature convergence** - stopped at first satisfying answer without testing if deeper/adjacent threads change the picture; probe: what would another hour of curiosity-driven exploration reveal?
- **Second-order blindness** - recommendations evaluated in isolation without downstream consequences; probe: if we follow this recommendation, what else changes?

## Scenario Prompts

- **Conclusion unsupported** - findings don't support recommendation; probe: does evidence lead to conclusion?
- **Key question unaddressed** - stakeholder's real concern not answered; probe: what decision does this inform?
- **Scope creep dilutes** - research too broad, depth sacrificed; probe: what's the core question?
- **Wrong comparison criteria** - alternatives compared on wrong dimensions; probe: what matters for decision?
- **Missing alternative** - obvious option not considered; probe: what else could solve this?
- **Status quo unexamined** - options evaluated but "do nothing" / current state not analyzed as baseline; probe: what happens if we don't act, and how do recommendations compare against that?
- **Hidden framing bias** - question structure predetermines answer; probe: could question be asked differently?
- **Audience mismatch** - too technical or too shallow for reader; probe: who consumes this? expertise level?
- **False precision** - uncertainty ranges or caveats stripped during synthesis, making tentative findings sound definitive; probe: where did we lose nuance between raw findings and conclusions?
- **Context missing** - findings are generic, not grounded in our specific constraints (budget, timeline, team, tech stack); probe: does this apply to our situation with our constraints?
- **Single-source dependency** - key claim rests on one source; probe: corroborated elsewhere?
- **Methodology gap** - how conclusions reached is unclear; probe: can someone reproduce this?
- **Anomaly ignored** - something surprising or contradictory surfaced but was glossed over instead of explored; probe: what didn't fit the expected pattern, and did we follow that thread?
- **Shelf life unknown** - findings delivered with no indication of temporal validity; probe: how long are these conclusions reliable, and when should we re-evaluate?
- **Correlation treated as causation** - "teams using X ship faster" presented as "X makes teams ship faster" without examining confounds; probe: is this a causal claim or an observed correlation, and what alternative explanations exist?
- **Recommendation risk unexamined** - recommended option's failure modes, reversal cost, and downside scenarios not analyzed; probe: what happens if we follow this recommendation and it doesn't work out? How hard is it to reverse?

## Trade-offs

- Depth vs breadth
- Recency vs authority
- Completeness vs focus
- Quantitative evidence vs qualitative insight
- Expert consensus vs emerging contrarian evidence
- Answering the asked question vs reframing to the right question
