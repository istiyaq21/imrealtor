import Badge from "@/components/ui/Badge";
import type { Tables } from "@/lib/database.types";

type ListingImportRow = Tables<"listing_imports">;

const statusTone: Record<ListingImportRow["status"], "brand" | "warning" | "success" | "danger"> = {
  parsed: "brand",
  needs_review: "warning",
  saved: "success",
  rejected: "danger",
};

export default function ListingImportsTable({ imports }: { imports: ListingImportRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Raw Text</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {imports.map((item) => (
            <tr key={item.id} className="border-b border-slate-100 last:border-0">
              <td className="max-w-md truncate px-4 py-3 text-slate-600">{item.raw_text}</td>
              <td className="px-4 py-3">
                <Badge tone={statusTone[item.status]} className="capitalize">
                  {item.status.replace("_", " ")}
                </Badge>
              </td>
              <td className="px-4 py-3 text-slate-500">{new Date(item.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {imports.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                No imports yet. Paste a listing above to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
