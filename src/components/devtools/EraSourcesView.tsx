import { useNavigate } from "@tanstack/react-router";
import { SourcesView } from "./SourcesView";
import { buildShareHash } from "@/lib/share";

/** Sources view wired to the /era/* routes: era/concept selections update the URL. */
export function EraSourcesView({
  eraId,
  expandedConcept,
}: {
  eraId: string;
  expandedConcept: string | null;
}) {
  const navigate = useNavigate();

  return (
    <SourcesView
      activeEra={eraId}
      expandedConcept={expandedConcept}
      onSelectEra={(id) => navigate({ to: "/era/$era", params: { era: id } })}
      onToggleConcept={(id) => {
        if (id === null) {
          navigate({ to: "/era/$era", params: { era: eraId } });
        } else {
          navigate({ to: "/era/$era/$concept", params: { era: eraId, concept: id } });
        }
      }}
      onRun={(code) =>
        navigate({ to: "/", search: { tab: "console" }, hash: buildShareHash(code) })
      }
    />
  );
}
