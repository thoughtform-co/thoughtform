---
name: Design System Integration
overview: "A two-track approach: (1) Seed Survey with key references and run the analysis pipeline, (2) Draft the Survey-to-MCP bridge architecture that will enable Mosaic-style component generation from visual references. The Panel Templates work becomes informed by this process."
todos:
  - id: seed-references
    content: Upload 5-6 key reference images to Survey with annotations (USER ACTION)
    status: pending
  - id: extraction-util
    content: Create extractDesignTokens.ts utility to parse Claude analysis into tokens
    status: completed
  - id: mcp-bridge-hook
    content: Create useReferenceMatch.ts hook to bridge Survey items to MCP matching
    status: completed
  - id: api-route
    content: Create /api/thoughtform/match route for server-side MCP calls
    status: completed
  - id: foundry-integration
    content: Add 'Apply from reference' action to FoundryAssistantDock
    status: completed
  - id: panel-css-zones
    content: Define panel template CSS with zone tokens
    status: completed
  - id: catalog-toolbar
    content: Refactor CatalogPanel header with toolbar zone for Forge button
    status: completed
---

# Design System Integration Plan

## Track A: Seed Survey with References (Your Action)

Upload these reference categories to Survey while I work on Track B:

### Recommended Reference Set

| Category            | Source                         | What to Annotate                                  |
| ------------------- | ------------------------------ | ------------------------------------------------- |
| **Panel Structure** | Starfield ship systems panel   | Header zone, toolbar icons, content grid          |
| **Panel Structure** | Starfield character status     | Left nav list, center content, right stats        |
| **Retrofuturism**   | Alien Romulus amber terminal   | Phosphor glow, grid overlay, labeled zones        |
| **Retrofuturism**   | Alien Romulus red/green panels | Color coding, data visualization patterns         |
| **Card Design**     | Cyberpunk 2077 weapon cards    | Chamfered corners, stat layout, socket indicators |
| **Navigation**      | Your Thoughtform.co hero       | Particle system, corner brackets, readout styling |

**Annotation Strategy**:

- Draw boxes around **structural zones** (header, toolbar, content)
- Draw boxes around **repeated patterns** (icon buttons, stat readouts)
- Use tags like: `panel-header`, `toolbar-icon`, `data-readout`, `chamfer-corner`

This gives Claude specific regions to analyze rather than whole screenshots.

---

## Track B: Survey → MCP Bridge Architecture

### Current Data Flow

```
Survey Upload → Claude Analysis → Voyage Embedding → Supabase
                     ↓
              analysis JSON with:
              - visual_elements
              - color_palette
              - typography_notes
              - layout_patterns
              - mood/aesthetic
```

### Proposed Bridge: Reference-to-Component Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    SURVEY REFERENCE                              │
│  image_url, analysis, briefing_embedding, annotations           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              EXTRACTION LAYER (new)                              │
│  Parse analysis → Design Tokens                                  │
│  - Colors → --gold, --dawn, --verde mappings                    │
│  - Typography → font-family, size, weight                        │
│  - Geometry → border-radius, chamfer angles                     │
│  - Patterns → cornerBrackets, scanlines, phosphorGlow           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              THOUGHTFORM MCP QUERY                               │
│  match_reference(extractedDescription)                          │
│  → Returns similar components + suggested tokens + patterns     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              FOUNDRY COMPONENT PREVIEW                           │
│  Apply extracted tokens to selected component                    │
│  "Make this Panel look like Reference #3"                        │
└─────────────────────────────────────────────────────────────────┘
```

### Key Integration Points

**1. Extraction Function** - New utility in `app/astrogation/_utils/`:

```typescript
// extractDesignTokens.ts
interface ExtractedTokens {
  colors: { primary: string; accent: string; background: string };
  typography: { family: string; weight: string; style: string };
  geometry: { borderRadius: string; chamferAngle?: number };
  patterns: string[]; // ['cornerBrackets', 'scanlines', 'phosphorGlow']
  mood: string; // 'industrial', 'organic', 'retrofuturist'
}

function extractDesignTokens(analysis: SurveyAnalysis): ExtractedTokens;
```

**2. MCP Bridge Hook** - Query Thoughtform from Foundry:

```typescript
// useReferenceMatch.ts
function useReferenceMatch(surveyItemId: string) {
  // 1. Get Survey item's analysis
  // 2. Extract tokens
  // 3. Call mcp_thoughtform_match_reference
  // 4. Return component suggestions + token mappings
}
```

**3. Foundry Assistant Integration** - The existing `FoundryAssistantDock` can be extended:

```
"Apply style from Survey reference: [dropdown of recent items]"
→ Extracts tokens from selected reference
→ Patches component props to match
```

### Files to Create/Modify

| File                                                   | Purpose                           |
| ------------------------------------------------------ | --------------------------------- |
| `app/astrogation/_utils/extractDesignTokens.ts`        | Parse Claude analysis → tokens    |
| `app/astrogation/_hooks/useReferenceMatch.ts`          | Bridge Survey → MCP               |
| `app/astrogation/_components/FoundryAssistantDock.tsx` | Add "Apply from reference" action |
| `app/api/thoughtform/match/route.ts`                   | Server route to call MCP tools    |

---

## Track C: Panel Templates (Parallel)

The original Forge button work proceeds alongside, now informed by reference analysis:

1. **Panel CSS zones** - Define header/toolbar/content structure
2. **CatalogPanel toolbar** - Move Forge button to header toolbar zone
3. **Document patterns** - Update DESIGN_PATTERNS.md

---

## Validation Checkpoint

After you've seeded 5-6 references and run analysis:

1. Review what Claude extracted - is it capturing the right patterns?
2. Check annotation regions - are they specific enough?
3. Test semantic search - "find references with amber phosphor glow"

This tells us if the extraction layer will have good data to work with.

---

## Mosaic-Inspired Features (Future)

Once the bridge works, we can add:

- **Interpolation**: "Blend 60% Starfield + 40% Alien Romulus"
- **Parameter steering**: Sliders for "warm↔cool", "dense↔minimal"
- **Procedural variation**: Generate 10 variants from one reference
- **Agent control**: "Make this more industrial" as natural language
