import PageShell from "@/components/site/PageShell";
import LoadingState from "@/components/ui/LoadingState";

export default function PropertiesLoading() {
  return (
    <PageShell>
      <LoadingState label="Loading properties…" />
    </PageShell>
  );
}
