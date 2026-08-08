import { createFileRoute, notFound } from "@tanstack/react-router";
import { EraSourcesView } from "@/components/devtools/EraSourcesView";
import { ERAS } from "@/lib/js-eras";
import { siteTitle } from "@/lib/seo";

export const Route = createFileRoute("/era/$era/$concept")({
  head: ({ params }) => {
    const era = ERAS.find((e) => e.id === params.era);
    const concept = era?.concepts.find((c) => c.id === params.concept);
    const title = concept ? siteTitle(concept.name) : siteTitle();
    const description = concept?.blurb ?? era?.summary ?? "A concept from the JavaScript timeline.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `/era/${params.era}/${params.concept}` },
      ],
    };
  },
  component: ConceptPage,
});

function ConceptPage() {
  const params = Route.useParams();
  const era = ERAS.find((e) => e.id === params.era);
  if (!era || !era.concepts.some((c) => c.id === params.concept)) throw notFound();
  return <EraSourcesView eraId={era.id} expandedConcept={params.concept} />;
}
