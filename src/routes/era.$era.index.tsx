import { createFileRoute, notFound } from "@tanstack/react-router";
import { EraSourcesView } from "@/components/devtools/EraSourcesView";
import { ERAS } from "@/lib/js-eras";

export const Route = createFileRoute("/era/$era/")({
  component: EraIndex,
});

function EraIndex() {
  const params = Route.useParams();
  const era = ERAS.find((e) => e.id === params.era);
  if (!era) throw notFound();
  return <EraSourcesView eraId={era.id} expandedConcept={null} />;
}
