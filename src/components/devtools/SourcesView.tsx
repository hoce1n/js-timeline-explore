import { Timeline } from "./Timeline";
import { PatternLibrary } from "./PatternLibrary";

export function SourcesView({
  activeEra,
  expandedConcept,
  focusedPattern,
  onConsumeFocusedPattern,
  onSelectEra,
  onToggleConcept,
  onRun,
}: {
  activeEra: string;
  expandedConcept: string | null;
  focusedPattern?: string | undefined;
  onConsumeFocusedPattern?: (() => void) | undefined;
  onSelectEra: (eraId: string) => void;
  onToggleConcept: (conceptId: string | null) => void;
  onRun: (code: string) => void;
}) {
  return (
    <>
      <section className="mb-6 max-w-3xl">
        <h2 className="text-lg font-bold">
          One spine: <span className="text-primary">the evolution of JavaScript</span>
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-panel-foreground">
          Pick an era, expand a concept, and see where it lands in today&apos;s runtimes. Every
          snippet can be dropped straight into the sandboxed console — the event loop panel then
          shows real, instrumented execution, not a looping animation.
        </p>
      </section>
      <div className="overflow-hidden rounded-sm border border-border">
        <Timeline
          activeEra={activeEra}
          expandedConcept={expandedConcept}
          onSelectEra={onSelectEra}
          onToggleConcept={onToggleConcept}
          onRun={onRun}
        />
      </div>
      <div className="mt-8">
        <PatternLibrary
          onRun={onRun}
          focusedPattern={focusedPattern}
          onConsumeFocusedPattern={onConsumeFocusedPattern}
        />
      </div>
    </>
  );
}
