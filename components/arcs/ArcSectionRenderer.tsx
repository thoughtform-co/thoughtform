import type { ArcMotion, ArcSection } from "@/lib/arcs/types";

import { ArcAnatomy } from "./ArcAnatomy";
import { ArcBeat } from "./ArcBeat";
import { ArcBench } from "./ArcBench";
import { ArcBoard } from "./ArcBoard";
import { ArcCards } from "./ArcCards";
import { ArcChat } from "./ArcChat";
import { ArcCircuit } from "./ArcCircuit";
import { ArcClose } from "./ArcClose";
import { ArcConfiguration } from "./ArcConfiguration";
import { ArcCrew } from "./ArcCrew";
import { ArcCurve } from "./ArcCurve";
import { ArcDossier } from "./ArcDossier";
import { ArcFlow } from "./ArcFlow";
import { ArcGuide } from "./ArcGuide";
import { ArcInstrument } from "./ArcInstrument";
import { ArcHandoff } from "./ArcHandoff";
import { ArcLeverage } from "./ArcLeverage";
import { ArcTerms } from "./ArcTerms";
import { ArcJob } from "./ArcJob";
import { ArcGround } from "./ArcGround";
import { ArcHull } from "./ArcHull";
import { ArcHeroBoard } from "./ArcHeroBoard";
import { ArcHorizon } from "./ArcHorizon";
import { ArcProgramBoard } from "./ArcProgramBoard";
import { ArcProofCard } from "./ArcProofCard";
import { ArcIntelligence } from "./ArcIntelligence";
import { ArcInterstitial } from "./ArcInterstitial";
import { ArcListGroups } from "./ArcListGroups";
import { ArcMediaSection } from "./ArcMediaSection";
import { ArcPath } from "./ArcPath";
import { ArcPluginBoard } from "./ArcPluginBoard";
import { ArcPortrait } from "./ArcPortrait";
import { ArcQuestions } from "./ArcQuestions";
import { ArcRepository } from "./ArcRepository";
import { ArcResource } from "./ArcResource";
import { ArcBreakdown, breakdownLength } from "./ArcBreakdown";
import { PromptToLoop } from "./prompt-to-loop/PromptToLoop";
import { promptToLoopRun } from "./prompt-to-loop/promptToLoopRun";
import { ArcSectionHead } from "./ArcSectionHead";
import { ArcSignal } from "./ArcSignal";
import { ArcSkillFile } from "./ArcSkillFile";
import { ArcSpectrum } from "./ArcSpectrum";
import { ArcStages } from "./ArcStages";
import { ArcSteps } from "./ArcSteps";
import { ArcStudioFilms } from "./ArcStudioFilms";
import { ArcStudioSheets } from "./ArcStudioSheets";
import { ArcSyllabus } from "./ArcSyllabus";
import { ArcToolIndex } from "./ArcToolIndex";
import { ArcWorkedBar } from "./ArcWorkedBar";
import { arcTitleText } from "./chrome";
import { workedLabel } from "./workedChrome";

/**
 * ArcSectionRenderer — exhaustive dispatch over the section union
 * (compile-time `never` check keeps new kinds honest). `motion` is
 * threaded to every kind; it decides whether the section renders the
 * ADR-052 markup or the ADR-057 beat, and defaults to reveal so a new
 * call site cannot silently opt a page into the terminal grammar.
 */
function renderSection(section: ArcSection, index: number, motion: ArcMotion) {
  switch (section.kind) {
    case "head":
      return (
        <ArcBeat
          key={section.id}
          id={section.id}
          kind="head"
          className="arc-section arc-sec arc-sec--chapter"
          ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
          motion={motion}
        >
          <div className="arc-band">
            <ArcSectionHead
              head={section.head}
              kind="head"
              index={index}
              sectionId={section.id}
              align="center"
              motion={motion}
            />
          </div>
        </ArcBeat>
      );
    case "cards":
      return <ArcCards key={section.id} section={section} index={index} motion={motion} />;
    case "list-groups":
      return <ArcListGroups key={section.id} section={section} index={index} motion={motion} />;
    case "anatomy":
      return <ArcAnatomy key={section.id} section={section} index={index} motion={motion} />;
    case "interstitial":
      return <ArcInterstitial key={section.id} section={section} motion={motion} />;
    case "hero-board":
      return <ArcHeroBoard key={section.id} section={section} index={index} motion={motion} />;
    case "media":
      return <ArcMediaSection key={section.id} section={section} index={index} motion={motion} />;
    case "portrait":
      return <ArcPortrait key={section.id} section={section} index={index} motion={motion} />;
    case "close":
      return <ArcClose key={section.id} section={section} motion={motion} />;
    case "dossier":
      return <ArcDossier key={section.id} section={section} index={index} motion={motion} />;
    case "intelligence":
      return <ArcIntelligence key={section.id} section={section} index={index} motion={motion} />;
    case "program":
      return <ArcProgramBoard key={section.id} section={section} index={index} motion={motion} />;
    case "sheets":
      return <ArcStudioSheets key={section.id} section={section} index={index} motion={motion} />;
    case "films":
      return <ArcStudioFilms key={section.id} section={section} index={index} motion={motion} />;
    case "configuration":
      return <ArcConfiguration key={section.id} section={section} index={index} motion={motion} />;
    case "tool-index":
      return <ArcToolIndex key={section.id} section={section} index={index} motion={motion} />;
    case "flow":
      return <ArcFlow key={section.id} section={section} index={index} motion={motion} />;
    case "board":
      return <ArcBoard key={section.id} section={section} index={index} motion={motion} />;
    case "steps":
      return <ArcSteps key={section.id} section={section} index={index} motion={motion} />;
    case "proof-card":
      return <ArcProofCard key={section.id} section={section} index={index} motion={motion} />;
    case "bench":
      return <ArcBench key={section.id} section={section} index={index} motion={motion} />;
    case "stages":
      return <ArcStages key={section.id} section={section} index={index} motion={motion} />;
    case "curve":
      return <ArcCurve key={section.id} section={section} index={index} motion={motion} />;
    case "horizon":
      return <ArcHorizon key={section.id} section={section} index={index} motion={motion} />;
    case "questions":
      return <ArcQuestions key={section.id} section={section} index={index} motion={motion} />;
    case "circuit":
      return <ArcCircuit key={section.id} section={section} index={index} motion={motion} />;
    case "crew":
      return <ArcCrew key={section.id} section={section} index={index} motion={motion} />;
    case "syllabus":
      return <ArcSyllabus key={section.id} section={section} index={index} motion={motion} />;
    case "path":
      return <ArcPath key={section.id} section={section} index={index} motion={motion} />;
    case "spectrum":
      return <ArcSpectrum key={section.id} section={section} index={index} motion={motion} />;
    case "resource":
      return <ArcResource key={section.id} section={section} index={index} motion={motion} />;
    case "signal":
      return <ArcSignal key={section.id} section={section} index={index} motion={motion} />;
    case "ground":
      return <ArcGround key={section.id} section={section} index={index} motion={motion} />;
    case "plugin-board":
      return <ArcPluginBoard key={section.id} section={section} index={index} motion={motion} />;
    case "skill-file":
      return <ArcSkillFile key={section.id} section={section} index={index} motion={motion} />;
    case "chat":
      return <ArcChat key={section.id} section={section} index={index} motion={motion} />;
    case "hull":
      return <ArcHull key={section.id} section={section} index={index} motion={motion} />;
    case "repository":
      return <ArcRepository key={section.id} section={section} index={index} motion={motion} />;
    case "prompt-to-loop":
      return <PromptToLoop key={section.id} startIndex={index} slides={promptToLoopRun(section)} />;
    case "breakdown":
      return <ArcBreakdown key={section.id} section={section} index={index} motion={motion} />;
    case "guide":
      return <ArcGuide key={section.id} section={section} index={index} motion={motion} />;
    case "instrument":
      return <ArcInstrument key={section.id} section={section} index={index} motion={motion} />;
    case "leverage":
      return <ArcLeverage key={section.id} section={section} index={index} motion={motion} />;
    case "handoff":
      return <ArcHandoff key={section.id} section={section} index={index} motion={motion} />;
    case "terms":
      return <ArcTerms key={section.id} section={section} index={index} motion={motion} />;
    case "job":
      return <ArcJob key={section.id} section={section} index={index} motion={motion} />;
    default: {
      const exhaustive: never = section;
      return exhaustive;
    }
  }
}

/** A stretch of the page: either one plain section, or the panels of one
 *  switched beat, gathered from the contiguous run that shares a `group`. */
type ArcRun = {
  key: string;
  group: string | null;
  items: readonly { section: ArcSection; index: number }[];
};

/**
 * Gather contiguous sections sharing a `worked.group` (ADR-139). A run of one
 * is still a run; a section with no `worked` is a run of its own with a null
 * group. Contiguity is registry-pinned, so a group that is interrupted is a
 * record fault rather than something to repair here.
 */
function arcRuns(sections: readonly ArcSection[]): ArcRun[] {
  const runs: ArcRun[] = [];
  /* A `prompt-to-loop` section draws one beat per slide (ADR-148 U1), so the
     beats after it are numbered past its whole run, not past one section. */
  let extra = 0;
  sections.forEach((section, at) => {
    const index = at + extra;
    if (section.kind === "prompt-to-loop") extra += promptToLoopRun(section).length - 1;
    if (section.kind === "breakdown") extra += breakdownLength(section) - 1;
    const group = section.worked?.group ?? null;
    const open = runs[runs.length - 1];
    if (group && open && open.group === group) {
      open.items = [...open.items, { section, index }];
      return;
    }
    runs.push({ key: section.id, group, items: [{ section, index }] });
  });
  return runs;
}

export function ArcSectionRenderer({
  sections,
  motion = "reveal",
  indexOffset = 0,
}: {
  sections: readonly ArcSection[];
  motion?: ArcMotion;
  /** Where this run's numbering starts, for a page that splits its sections
   *  around something the renderer does not draw (ADR-141 U3). Default 0. */
  indexOffset?: number;
}) {
  return (
    <>
      {arcRuns(sections).map((run) => {
        if (!run.group) {
          return run.items.map(({ section, index }) =>
            renderSection(section, index + indexOffset, motion)
          );
        }
        const choices = run.items.map(({ section }) => ({
          id: section.worked?.id ?? section.id,
          label: section.worked?.label ?? section.id,
        }));
        return (
          <div key={run.key} className="arc-worked-group" data-arc-worked-group={run.group}>
            <ArcWorkedBar group={run.group} choices={choices} label={workedLabel(run.group)} />
            {run.items.map(({ section, index }, i) => (
              <div
                key={section.id}
                className="arc-worked"
                data-arc-worked-panel={section.worked?.id ?? section.id}
                data-arc-worked-default={i === 0 ? "" : undefined}
              >
                {renderSection(section, index + indexOffset, motion)}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
