# Thoughtform.co Semantic Editor Roadmap

## Vision

Instead of building a traditional drag-and-drop WYSIWYG editor (the "last 20%" trap), we're creating a **prompt-based semantic editing system** where natural language becomes the interface.

This aligns with Thoughtform's core philosophy: **intuition as interface**. Traditional editors force users to learn UI controls. A semantic editor inverts this - the AI learns your intent.

---

## Philosophy: Why Not WYSIWYG?

### The 80/20 Trap

Building a full-featured visual editor means:
- Endless edge cases in drag-and-drop behavior
- Complex state management for undo/redo
- Fighting browser inconsistencies
- Building what Framer/Webflow already do better

We'd spend 80% of effort on the last 20% of polish.

### The Thoughtform Way

From our manifesto:

> "AI isn't traditional software. It's an alien intelligence... In creative and strategic work, its strangeness is the source of truly novel ideas."

> "Where frameworks promise false control, intuition becomes the new interface."

A semantic editor embodies this:
- **No framework to learn** - describe what you want
- **AI handles execution** - you provide direction
- **Intuition over controls** - your taste guides, AI implements

### The Cursor Model

We already use this pattern daily:
1. Look at something on the page
2. Describe what we want changed
3. AI generates the code
4. We review and apply

Why build a worse version of this inside the browser when we can extend the same model to the website itself?

---

## Roadmap Phases

### Phase 0: Launch (Current)

**Status:** Active

**Goal:** Ship the website using Cursor for all edits.

**What exists:**
- Section-based page structure stored in Supabase
- Template sections (Hero, Services, About, etc.)
- Background customization (image, video, animation)
- Element layer system (text, image, video, button)

**What to do:**
- Complete content and styling via Cursor
- Launch the website
- Gather feedback on what edits are needed most often

**Exit criteria:** Website is live.

---

### Phase 1: Selection Context System

**Status:** Planned

**Goal:** Make it easy to grab element context for use in Claude.ai or Cursor.

**Components:**

1. **Element Inspector Mode**
   - Toggle "Inspect" mode in editor
   - Click any element to see its full context
   - Display: element type, content, styles, parent section, position

2. **Context Export**
   - "Copy Context" button generates Claude-ready prompt
   - Includes: element data, surrounding context, design system tokens
   - Format optimized for AI comprehension

3. **Quick Actions**
   - "Edit in Cursor" - opens file at relevant line
   - "Copy for Claude" - structured context to clipboard
   - "View Code" - show generated HTML/CSS

**Technical requirements:**
- Element metadata display component
- Context serialization for AI prompts
- Clipboard integration

**Example output:**
```
I'm editing the Hero section of thoughtform.co.

Current element:
- Type: Headline
- Content: "Thoughtform pioneers intuitive human-AI collaboration."
- Styles: text-lg, text-dawn-70, max-w-[420px]
- Parent: HeroSection (id: hero-123)

Design system:
- Colors: dawn (white variants), gold (#D4AF37), void (#0a0a0a)
- Fonts: mono (JetBrains Mono), sans (Inter)
- Spacing: Uses Tailwind defaults

Request: [USER DESCRIBES CHANGE HERE]
```

---

### Phase 2: Embedded Chat Interface

**Status:** Planned

**Goal:** Add a chat interface directly in the editor that connects to Claude API.

**Components:**

1. **Chat Panel**
   - Slide-out panel or modal
   - Message history for the session
   - Streaming responses

2. **Context Injection**
   - Auto-include selected element context
   - Auto-include page structure summary
   - Custom system prompt with design knowledge

3. **Code Preview**
   - Claude returns code changes
   - Display as diff view
   - "Apply" button to execute changes

4. **System Prompt**
   See [System Prompt Design](#system-prompt-design) below.

**Technical requirements:**
- Claude API integration (direct or via backend)
- Chat UI component
- Code diff viewer
- Safe code execution layer

**User flow:**
1. Select an element on the page
2. Open chat panel (keyboard shortcut or button)
3. Type: "Make this text larger and change color to gold"
4. Claude responds with code changes
5. Preview the diff
6. Click "Apply" to save

---

### Phase 3: MCP Integration

**Status:** Planned

**Goal:** Edit the website directly from Claude.ai desktop app using MCP.

**Why MCP?**
- No need to build/maintain our own chat UI
- Use Claude.ai's superior interface
- Claude can use multiple tools in sequence
- Natural integration with how we already work

**MCP Server Specification:**

```typescript
// Tools the MCP server would expose

// Reading
read_page(slug: string) -> PageData
read_section(sectionId: string) -> SectionData  
read_element(elementId: string) -> ElementData
list_sections(pageSlug: string) -> SectionSummary[]
get_design_system() -> DesignTokens

// Writing
update_section(sectionId: string, updates: Partial<Section>) -> Section
update_element(elementId: string, updates: Partial<Element>) -> Element
add_element(sectionId: string, element: NewElement) -> Element
remove_element(elementId: string) -> boolean
reorder_sections(pageSlug: string, order: string[]) -> Section[]

// Templates
apply_template(sectionId: string, templateName: string) -> Section
list_templates() -> TemplateInfo[]

// Assets
upload_image(base64: string, filename: string) -> ImageUrl
list_assets() -> Asset[]
```

**Resources the MCP server would expose:**

```typescript
// Resources (read-only data Claude can access)
thoughtform://pages/{slug}           // Full page data
thoughtform://sections/{id}          // Section data
thoughtform://design-system          // Colors, fonts, spacing
thoughtform://templates              // Available section templates
thoughtform://assets                 // Uploaded images/videos
```

**Example Claude.ai conversation:**

```
User: I want to update the hero section headline

Claude: I'll check the current hero section.
[Calls read_section("hero")]

The current headline is "Thoughtform pioneers intuitive human-AI collaboration."

What would you like to change it to?

User: Make it "Navigate AI with intention"

Claude: I'll update that for you.
[Calls update_section("hero", { config: { headline: "Navigate AI with intention" }})]

Done! The hero headline has been updated. Refresh the page to see the change.
```

**Technical requirements:**
- MCP server (Node.js or Python)
- Authentication for write operations
- Real-time sync with Supabase
- Deployment to accessible endpoint

---

## Technical Architecture

### Current Stack
- **Frontend:** Next.js 14, React, Tailwind CSS
- **State:** Zustand store
- **Database:** Supabase (Postgres + pgvector)
- **Animations:** Framer Motion, Three.js

### Phase 1 Additions
- Element metadata component
- Context serialization utilities
- Clipboard API integration

### Phase 2 Additions
- Claude API client (or Anthropic SDK)
- Chat UI component
- Code diff viewer (monaco-diff or similar)
- API route for Claude calls (keep API key server-side)

### Phase 3 Additions
- MCP server package
- Authentication middleware
- WebSocket for real-time updates (optional)

---

## System Prompt Design

The system prompt for the embedded chat (Phase 2) and MCP context (Phase 3):

```markdown
# Thoughtform.co Page Editor

You are helping edit the Thoughtform website. You have access to the page structure and can suggest code changes.

## Design System

### Colors
- `void` - #0a0a0a (background)
- `dawn` - white with opacity variants (dawn-08, dawn-15, dawn-30, dawn-50, dawn-70)
- `gold` - #D4AF37 (accent)
- `surface-1` - rgba(255,255,255,0.04)

### Typography
- `font-mono` - JetBrains Mono (headings, UI)
- `font-sans` - Inter (body text)
- Sizes: text-2xs, text-xs, text-sm, text-base, text-lg, text-xl...

### Spacing
- Standard Tailwind spacing scale
- `section-spacing` - py-24 md:py-32
- `container-base` - max-w-6xl mx-auto px-6

## Page Structure

Pages contain Sections. Sections contain:
- `type` - hero, problem, quote, shift, services, about, cta, freeform
- `config` - type-specific content (headlines, buttons, etc.)
- `background` - image, video, or animation
- `elements` - freeform elements (text, image, video, button)

## Your Role

1. Understand what the user wants to change
2. Identify which section/element needs modification
3. Generate the specific code or config changes
4. Explain what you're changing and why

## Important

- Maintain the existing design aesthetic (dark, minimal, gold accents)
- Use existing Tailwind classes over custom CSS
- Preserve accessibility (alt text, semantic HTML)
- Keep responses concise - show code, not explanations
```

---

## Success Metrics

### Phase 1
- Time to get element context: < 5 seconds
- Context quality: Claude can make changes from copied context

### Phase 2
- Average edits per session via chat
- Time from request to applied change
- User preference vs Cursor editing

### Phase 3
- Adoption rate of MCP workflow
- Complexity of changes possible via MCP
- Reduction in Cursor usage for simple edits

---

## Open Questions

1. **Authentication for MCP:** How do we secure write access?
2. **Version control:** Should changes create git commits?
3. **Rollback:** How to undo AI-made changes?
4. **Multi-user:** Can multiple people edit simultaneously?
5. **Sync:** Real-time preview while Claude makes changes?

---

## Timeline

| Phase | Target | Dependencies |
|-------|--------|--------------|
| Phase 0 | Now | - |
| Phase 1 | Post-launch | Website live |
| Phase 2 | TBD | Claude API access |
| Phase 3 | TBD | MCP ecosystem maturity |

---

## Related Resources

- [Thoughtform Manifesto](./docs/manifesto.md)
- [Astrolabe System Prompt](../10_Astrolabe%20Prime/01_Thoughtform/Astrolabe%20System%20Prompt.txt)
- [Claude MCP Documentation](https://docs.anthropic.com/mcp)
- [Cursor Editor](https://cursor.sh)

---

*This roadmap embodies Thoughtform's philosophy: instead of building another control panel, we're building an interface where intuition guides AI to execute your vision.*

