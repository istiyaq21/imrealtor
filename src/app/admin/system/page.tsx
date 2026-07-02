import type { Metadata } from "next";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getSystemCheckData, type ReminderItem, type SystemCheckItem } from "@/lib/system/checks";

export const metadata: Metadata = {
  title: "System Check",
};

export default function AdminSystemCheckPage() {
  const data = getSystemCheckData();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Check</h1>
        <p className="mt-1 text-sm text-slate-600">
          Read-only status for launch readiness. No secret values are ever shown here — only
          presence/absence booleans and reminder text.
        </p>
      </div>

      <CheckSection title="Supabase Configuration" items={data.supabase} />
      <CheckSection title="Private Beta Safeguards" items={data.privateBeta} />
      <ReminderSection title="Storage Setup" items={data.storageReminders} />
      <ReminderSection title="Auth Setup" items={data.authReminders} />
      <ReminderSection title="Deployment Reminders" items={data.deploymentReminders} />
    </div>
  );
}

function CheckSection({ title, items }: { title: string; items: SystemCheckItem[] }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      <Card className="divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.label} className="flex flex-wrap items-start justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-medium text-slate-900">{item.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
            </div>
            <Badge tone={item.ok ? "success" : "warning"}>{item.ok ? "OK" : "Needs attention"}</Badge>
          </div>
        ))}
      </Card>
    </section>
  );
}

function ReminderSection({ title, items }: { title: string; items: ReminderItem[] }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      <Card className="divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.label} className="p-4">
            <p className="text-sm font-medium text-slate-900">{item.label}</p>
            <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
          </div>
        ))}
      </Card>
    </section>
  );
}
