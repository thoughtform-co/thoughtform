import { CelestialManifesto } from "@/components/sections/CelestialManifesto";

export default function CelestialManifestoTest() {
  return (
    <div>
      <CelestialManifesto
        title="AI ISN'T SOFTWARE"
        content={[
          "Most companies struggle with their AI adoption because they treat AI like normal software.",
          "But AI isn't a tool to command. It's a strange, new intelligence we have to learn how to **navigate**. It leaps across dimensions we can't fathom. It hallucinates. It surprises.",
          "In technical work, that strangeness must be constrained. But in creative and strategic work? It's the source of truly novel ideas.",
          "Thoughtform teaches teams to think **with** that intelligence—navigating its strangeness for creative breakthroughs.",
        ]}
        coordinates={{
          delta: 0.52,
          theta: 73.1,
          rho: 0.78,
          zeta: 5.9,
        }}
        waypoints={[
          { label: "NAVIGATE", position: { x: 25, y: 30 }, active: true },
          { label: "STRANGENESS", position: { x: 60, y: 50 }, active: false },
          { label: "BREAKTHROUGH", position: { x: 75, y: 70 }, active: false },
        ]}
      />
    </div>
  );
}
