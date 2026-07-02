import Badge from "@/components/ui/Badge";
import type { Enquiry } from "@/lib/types";

const statusTone = {
  new: "brand",
  contacted: "warning",
  closed: "success",
} as const;

export default function RecentEnquiriesTable({ enquiries }: { enquiries: Enquiry[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Buyer</th>
            <th className="px-4 py-3">Property</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {enquiries.map((enquiry) => (
            <tr key={enquiry.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 font-medium text-slate-900">{enquiry.buyerName}</td>
              <td className="px-4 py-3 text-slate-600">{enquiry.propertyTitle}</td>
              <td className="px-4 py-3 text-slate-600">
                <div>{enquiry.email}</div>
                <div className="text-xs text-slate-400">{enquiry.phone}</div>
              </td>
              <td className="px-4 py-3">
                <Badge tone={statusTone[enquiry.status]} className="capitalize">
                  {enquiry.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
