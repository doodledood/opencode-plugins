# RESEARCH Task Guidance

Investigations, analyses, comparisons, technology evaluations. Default posture: **deep, adversarial, multi-angle** — high signal, no stones unturned, conclusions that survive scrutiny and attack.

## Quality Gates

### Baselines (always enforced)

**Source Rigor**
- **Source credibility** — Key findings backed by credible, identifiable sources, weighted by authority level and claim stakes. Higher-stakes claims demand higher-authority sources. When relying on a source below the authority level the claim demands, flag it explicitly
- **Source authority hierarchy** — Primary sources (official docs, specs, peer-reviewed research, creator/maintainer statements) over secondary (established publications, reputable analysis) over tertiary (personal blogs, forums, outdated material). Claims resting on tertiary sources alone are unsubstantiated unless no higher-authority source exists (flagged as gap)
- **Cross-referencing** — Claims in conclusions corroborated across independent sources, depth proportional to claim importance
- **Evidence traceability** — Key claims traceable to specific sources; the chain from raw evidence to conclusion is walkable

**Intellectual Rigor**
- **Counterfactual stress-testing** — Key claims tested against disconfirming evidence — "what would make this wrong?" actively investigated, not just acknowledged. Conclusions that survive: stated with confidence. Conclusions that are fragile: flagged with the conditions under which they break
- **Opposing evidence & steelmanning** — Research actively sought viewpoints opposing its conclusions. For each key conclusion, the strongest possible counter-argument is constructed (steelman) and engaged with directly — not a weak summary dismissed easily. Absence of opposing evidence is itself a finding to explain
- **Multi-angle investigation** — Research question examined from multiple independent frames (different stakeholder perspectives, time horizons, assumption sets, disciplines) — not just multiple sources within the same frame
- **Investigation depth** — Key claims investigated beyond the first satisfying source; exploration paths documented showing adjacent and deeper threads were evaluated before concluding; depth means multiple independent lines of evidence, not just source count
- **Argument chain integrity** — Every conclusion walkable from raw evidence through intermediate claims to final recommendation. Each inferential step identified (deduction, induction, analogy, authority). Gaps or unsupported leaps in the chain are flagged

**Consistency & Transparency**
- **Internal consistency** — Findings, analysis, and conclusions don't contradict each other; no claim in one section undermined by evidence in another. Report audited for contradictions between sections, between evidence and conclusions, and between different claims
- **Assumptions transparency** — Choices and assumptions made during research are explicit and revisable
- **Gap honesty** — Knowledge gaps explicitly stated
- **Scope boundaries** — What's in and out of scope stated explicitly
- **Definitional clarity** — Key terms defined and used consistently across the report; comparisons use the same definitions across all options

**Comparisons** (when comparing options)
- **Evaluation symmetry** — Each option evaluated with comparable depth and rigor — no option gets cursory treatment while another gets deep analysis

### Selectable Gates

#### Rigor

| Aspect | Threshold |
|--------|-----------|
| Emergent depth | Dedicated sections, follow-up searches, or scope evolution documented for unexpected findings |
| Question completeness | All dimensions of the research question identified and addressed |
| Quantification | Claims that could be quantified use numbers, not vague qualitative language — "faster" becomes "~2x faster" when evidence supports it |
| Recency | Sources published within the topic's relevance window — fast-moving topics demand recent, stable topics tolerate older |

#### Output Quality

| Aspect | Threshold |
|--------|-----------|
| Synthesis | Findings connected into meaning — "so what?" answered, not just facts listed |
| Output structure | Report organized for the reader's decision flow — navigable, scannable, key insights surfaced not buried |
| Prioritization | When multiple options or findings exist, ranked with explicit criteria — not just listed |

#### Utility

| Aspect | Threshold |
|--------|-----------|
| Actionability | Output enables a decision or next step without further research |
| Follow-up anticipation | Report preempts the reader's likely next questions rather than leaving obvious gaps |

## Risks

- **Source bias** - all sources from same perspective; probe: what viewpoints might disagree?
- **Confirmation bias** - only finding evidence supporting initial hypothesis, including biased search terms; probe: what searches would you run if you believed the *opposite* conclusion? Run those too
- **Authority inflation** - source treated as more authoritative than it is (blog post cited like peer-reviewed research, vendor marketing cited like independent analysis); probe: is each source's authority level honestly assessed?
- **Recency gap** - topic evolved since sources published; probe: how fast-moving is this topic?
- **Coverage gap** - sub-question has no authoritative sources
- **Conflicting authorities** - high-authority sources contradict; probe: present both or resolve?
- **Premature convergence** - stopped at first satisfying answer without testing if deeper/adjacent threads change the picture; probe: what would another hour of curiosity-driven exploration reveal? Structural countermeasure: document exploration paths showing threads followed and threads deliberately skipped (with rationale)
- **Second-order blindness** - recommendations evaluated in isolation without downstream consequences; probe: if we follow this recommendation, what else changes?
- **Single-frame blindness** - entire investigation conducted through one lens (e.g., only technical, only economic); probe: what frames haven't been applied? Would a different stakeholder see this differently?
- **Shallow depth masquerading as breadth** - many sources cited but no claim investigated deeply; probe: for the most important claim, can you trace the full chain of evidence from raw source to conclusion?
- **Survivorship bias** - only successful cases visible; failed adoptions, quiet abandonments, and "we tried X and it didn't work" are undocumented; probe: what would the failures look like? Are we only seeing winners?

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
- **Tangential threads unexplored** - adjacent questions surfaced during research but not followed; probe: what related questions did this research raise that aren't answered? Would exploring them change the conclusions?

## Trade-offs

- Depth vs breadth — default: depth on high-impact claims, breadth only for landscape mapping
- Recency vs authority
- Completeness vs focus
- Quantitative evidence vs qualitative insight
- Expert consensus vs emerging contrarian evidence
- Answering the asked question vs reframing to the right question
- Exhaustiveness vs signal density — every thread followed must earn its place; depth doesn't mean noise
