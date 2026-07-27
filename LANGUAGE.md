# Language

Shared vocabulary for architectural discussion in this repo. Use the **Matt Pocock** terms exactly when talking about structure; use **Thoughtform** terms when talking about the product and scroll/HUD metaphor. Don’t substitute random synonyms — consistent language is the point.

---

## Terms (Matt Pocock vocabulary)

Source: adapted from [improve-codebase-architecture / LANGUAGE.md](https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/LANGUAGE.md).

**Module**  
Anything with an interface and an implementation. Deliberately scale-agnostic — applies equally to a function, class, package, or tier-spanning slice.  
_Avoid_: unit, component, service.

**Interface**  
Everything a caller must know to use the module correctly. Includes the type signature, but also invariants, ordering constraints, error modes, required configuration, and performance characteristics.  
_Avoid_: API, signature (too narrow — those refer only to the type-level surface).

**Implementation**  
What’s inside a module — its body of code. Distinct from **Adapter**: a thing can be a small adapter with a large implementation (a Postgres repo) or a large adapter with a small implementation (an in-memory fake). Reach for “adapter” when the seam is the topic; “implementation” otherwise.

**Depth**  
Leverage at the interface — the amount of behaviour a caller (or test) can exercise per unit of interface they have to learn. A module is **deep** when a large amount of behaviour sits behind a small interface. A module is **shallow** when the interface is nearly as complex as the implementation.

**Seam** _(from Michael Feathers)_  
A place where you can alter behaviour without editing in that place. The _location_ at which a module’s interface lives. Choosing where to put the seam is its own design decision, distinct from what goes behind it.  
_Avoid_: boundary (overloaded with DDD’s bounded context).

**Adapter**  
A concrete thing that satisfies an interface at a seam. Describes _role_ (what slot it fills), not substance (what’s inside).

**Leverage**  
What callers get from depth. More capability per unit of interface they have to learn. One implementation pays back across N call sites and M tests.

**Locality**  
What maintainers get from depth. Change, bugs, knowledge, and verification concentrate at one place rather than spreading across callers. Fix once, fixed everywhere.

### Principles

- **Depth is a property of the interface, not the implementation.** A deep module can be internally composed of small, mockable, swappable parts — they just aren’t part of the interface. A module can have **internal seams** (private to its implementation, used by its own tests) as well as the **external seam** at its interface.
- **The deletion test.** Imagine deleting the module. If complexity vanishes, the module wasn’t hiding anything (it was a pass-through). If complexity reappears across N callers, the module was earning its keep.
- **The interface is the test surface.** Callers and tests cross the same seam. If you want to test _past_ the interface, the module is probably the wrong shape.
- **One adapter means a hypothetical seam. Two adapters means a real one.** Don’t introduce a seam unless something actually varies across it.

### Relationships

- A **Module** has exactly one **Interface** (the surface it presents to callers and tests).
- **Depth** is a property of a **Module**, measured against its **Interface**.
- A **Seam** is where a **Module**’s **Interface** lives.
- An **Adapter** sits at a **Seam** and satisfies the **Interface**.
- **Depth** produces **Leverage** for callers and **Locality** for maintainers.

### Rejected framings

- **Depth as ratio of implementation-lines to interface-lines** (Ousterhout): rewards padding the implementation. We use depth-as-leverage instead.
- **“Interface” as the TypeScript `interface` keyword or a class’s public methods**: too narrow — interface here includes every fact a caller must know.
- **“Boundary”**: overloaded with DDD’s bounded context. Say **seam** or **interface**.

---

## Thoughtform vocabulary (this codebase)

| Term          | Meaning                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Station**   | A full-height landing **section** (e.g. hero, interface, manifesto) inside `.stations` — a scroll “chapter.”                                                                                                                                                                                                                                                                                                                                                          |
| **Connector** | A **CelestialConnector** (or similar) band between stations — often a diagram + copy, with its own reveal rules.                                                                                                                                                                                                                                                                                                                                                      |
| **Sigil**     | The **brand geometric mark** (the icon part of the logo system), as rendered in a section (e.g. diagram centre).                                                                                                                                                                                                                                                                                                                                                      |
| **Actor**     | The **fixed** `BrandmarkActor` / `.tf-brandmark-actor` instance that **travels** in viewport space while the page scrolls.                                                                                                                                                                                                                                                                                                                                            |
| **Brandmark** | The sigil as **live UI** (actor + states), not a static image export.                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Gateway**   | The **full-viewport** atmospheric layer (`.gateway`) behind the scroll flow — not “the API gateway.”                                                                                                                                                                                                                                                                                                                                                                  |
| **HUD**       | The **heads-up** navigation frame (bars, wordmark, controls) — where the mark often **docks** when not in a diagram.                                                                                                                                                                                                                                                                                                                                                  |
| **Cockpit**   | `NavigationCockpitV2` and related **scroll-driven** chrome — the interactive navigation “instrument.”                                                                                                                                                                                                                                                                                                                                                                 |
| **Continuum** | The **middle** landing band (definition / continuum) between major stations — handoff timing often keys off it.                                                                                                                                                                                                                                                                                                                                                       |
| **Practice**  | **“Thoughtform in Practice”** block — **Navigate / Encode / Build**; orbit docking lives here.                                                                                                                                                                                                                                                                                                                                                                        |
| **Orbit**     | The **circular / orbital diagram** target inside Practice where the brandmark should **park** (not float outside the diagram).                                                                                                                                                                                                                                                                                                                                        |
| **Manifest**  | The **left rail's section rolodex** (ADR-031 Update 3) — a masked window at mid-rail holding a **reel** of every journey entry's name; the **active** row sits at the fixed anchor in gold with its authored number ("08 SERVICES"), neighbors dim by distance, and section changes **glide the reel** one detent. The services row carries the **docked card ring** (layered-stack glyph) once seated.                                                               |
| **Arc**       | The **strategic loop** — Navigate → Encode → Build → repeat — that Practice renders as UI. Canon term for what was informally called “the flywheel” in conversation and in `/thoughtform-strategy` / `/ai-adoption-loop`. Use **Arc** for the business/strategy concept; use **Practice** for the on-page block that visualizes it. _Avoid_: flywheel (superseded; still appears in older code identifiers like ADR-020's title — don't propagate it in new writing). |
| **Arc page**  | A **client landing page** under `/arcs/[slug]` (ADR-052) — a ported deck (workshop / keynote) rendered in the landing's HUD grammar; the overview grid lives at `/arcs`. Also “client arc.” **Distinct from the Arc** (the strategic loop above) — never shorten “arc page” to “the Arc.” Code: `lib/arcs/` + `components/arcs/` (vs the corridor's `arc-cases/`, which belongs to the Arc).                                                                          |

When writing ADRs, prefer these terms over ad-hoc names (“the floating thing”, “the middle part”).

---

## See also

- [CLAUDE.md](CLAUDE.md) — project context + Sentinel pointers
- [sentinel/MAINTENANCE.md](sentinel/MAINTENANCE.md) — when to add ADRs, rules, and skills
