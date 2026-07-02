import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/site/PageShell";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EnquiryForm from "@/components/forms/EnquiryForm";
import SavePropertyButton from "@/components/property/SavePropertyButton";
import { formatPrice } from "@/lib/mock-data";
import { getPublicPropertyById } from "@/lib/services/properties";
import { listPropertyImages } from "@/lib/services/properties";
import { getPropertyImagePublicOrSignedUrl } from "@/lib/services/storage";
import { getCurrentProfile } from "@/lib/auth/session";
import { isPropertySavedForBuyer } from "@/lib/services/saved-properties";

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await getPublicPropertyById(id);
  return { title: detail ? detail.property.title : "Property" };
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = await params;
  const detail = await getPublicPropertyById(id);

  if (!detail) {
    notFound();
  }

  const { property, assignedAgentName } = detail;

  const [images, profile] = await Promise.all([listPropertyImages(property.id), getCurrentProfile()]);
  const galleryUrls = (
    await Promise.all(images.map((image) => getPropertyImagePublicOrSignedUrl(image.storage_path)))
  ).filter((url): url is string => Boolean(url));

  const isApprovedBuyer = profile?.role === "buyer" && profile.status === "approved";
  const alreadySaved = isApprovedBuyer ? await isPropertySavedForBuyer(profile.id, property.id) : false;

  return (
    <PageShell>
      <Link href="/properties" className="text-sm font-medium text-brand-600 hover:text-brand-700">
        ← Back to Properties
      </Link>

      <div className="mt-4 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="col-span-4 flex h-72 items-center justify-center rounded-2xl bg-slate-100 sm:h-96">
              {galleryUrls[0] ? (
                // Signed URLs come from a per-deployment Supabase domain we
                // don't know at build time, so next/image (which requires a
                // configured remote host) isn't a good fit here.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={galleryUrls[0]} alt={property.title} className="h-full w-full rounded-2xl object-cover" />
              ) : (
                <Image src={property.image} alt={property.title} width={80} height={80} className="opacity-40" />
              )}
            </div>
            {(galleryUrls.length > 0 ? galleryUrls.slice(1, 5) : [1, 2, 3, 4]).map((src, index) => (
              <div key={typeof src === "string" ? src : index} className="flex h-20 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                {typeof src === "string" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Image src={property.image} alt="" width={28} height={28} className="opacity-30" />
                )}
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
            <p className="mt-2 text-sm text-slate-600">{assignedAgentName ?? "Agent to be assigned"}</p>
            <p className="text-xs text-slate-500">
              {assignedAgentName ? "Verified I'm Realtor Agent" : "Contact via enquiry form"}
            </p>
          </Card>

          {isApprovedBuyer && <SavePropertyButton propertyId={property.id} initialSaved={alreadySaved} />}

          <Card className="p-5">
            <h2 className="text-base font-semibold text-slate-900">Enquire About This Property</h2>
            <div className="mt-4">
              <EnquiryForm propertyId={property.id} propertyTitle={property.title} />
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
