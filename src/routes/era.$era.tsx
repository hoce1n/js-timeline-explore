import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/devtools/AppShell";
import { ERAS } from "@/lib/js-eras";
import { siteTitle } from "@/lib/seo";

export const Route = createFileRoute("/era/$era")({
  head: ({ params }) => {
    const era = ERAS.find((e) => e.id === params.era);
    const title = era ? siteTitle(`${era.label} (${era.years})`) : siteTitle();
    const description = era?.summary ?? "An era of JavaScript, with runnable snippets.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `/era/${params.era}` },
      ],
    };
  },
  component: EraLayout,
});

function EraLayout() {
  const params = Route.useParams();
  const navigate = useNavigate();
  const era = ERAS.find((e) => e.id === params.era);
  if (!era) throw notFound();

  return (
    <AppShell
      tab="timeline"
      onTabChange={(tab) => {
        if (tab !== "timeline") navigate({ to: "/", search: { tab } });
      }}
    >
      <Outlet />
    </AppShell>
  );
}
