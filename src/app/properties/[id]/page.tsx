import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/site/PageShell";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EnquiryForm from "@/components/forms/EnquiryForm";
import { formatPrice, getPropertyById, getUserById } from "@/lib/mock-data";

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const property = getPropertyById(id);
  return { title: property ? property.title : "Property" };
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = await params;
  const property = getPropertyById(id);

  if (!property || property.status !== "approved") {
    notFound();
  }

  const agent = property.assignedAgent ? getUserById(property.assignedAgent) : undefined;

  return (
    <PageShell>
      <Link href="/properties" className="text-sm font-medium text-brand-600 hover:text-brand-700">
        ← Back to Properties
      </Link>

      <div className="mt-4 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="col-span-4 flex h-72 items-center justify-center rounded-2xl bg-slate-100 sm:h-96">
              <Image src={property.image} alt={property.title} width={80} height={80} className="opacity-40" />
            </div>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex h-20 items-center justify-center rounded-xl bg-slate-100">
                <Image src={property.image} alt="" width={28} height={28} className="opacity-30" />
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{property.title}</h1>
                <Badge tone="success">Admin Approved</Badge>
                {property.featured && <Badge tone="brand">Featured</Badge>}
              </div>
              <p className="mt-1 text-slate-500">
                {property.locality}, {property.city}
              </p>
            </div>
            <p className="text-2xl font-semibold text-brand-700">
              {formatPrice(property.price)}
              {property.purpose === "rent" && (
                <span className="text-sm font-normal text-slate-500"> / month</span>
              )}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-4">
            <Fact label="Type" value={property.type.replace("-", " ")} />
            <Fact label="Purpose" value={property.purpose === "sell" ? "For Sale" : "For Rent"} />
            <Fact label="Bedrooms" value={String(property.bedrooms)} />
            <Fact label="Bathrooms" value={String(property.bathrooms)} />
            <Fact label="Area" value={`${property.area} sq. ft.`} />
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">Description</h2>
            <p className="mt-2 text-slate-600">{property.description}</p>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">Amenities</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {property.amenities.map((amenity) => (
                <Badge key={amenity} tone="neutral">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <Link href="/contact" className="text-sm text-slate-500 underline hover:text-brand-600">
              Report incorrect listing
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-slate-900">Listed By</h2>
            <p className="mt-2 text-sm text-slate-600">
              {agent ? agent.name : "Agent to be assigned"}
            </p>
            <p className="text-xs text-slate-500">
              {agent ? "Verified I'm Realtor Agent" : "Contact via enquiry form"}
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-slate-900">Enquire About This Property</h2>
            <div className="mt-4">
              <EnquiryForm propertyTitle={property.title} />
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium capitalize text-slate-900">{value}</p>
    </div>
  );
}
