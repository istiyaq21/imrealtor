import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PropertyCard from "@/components/property/PropertyCard";
import { getFeaturedProperties } from "@/lib/mock-data";

const howItWorks = [
  {
    step: "01",
    title: "Owners Submit",
    description: "Property owners submit listing details and photos for review.",
  },
  {
    step: "02",
    title: "Admin Verifies",
    description: "Our admin team verifies property details before it goes live.",
  },
  {
    step: "03",
    title: "Agents Connect",
    description: "Approved agents are assigned to manage and represent listings.",
  },
  {
    step: "04",
    title: "Buyers Enquire",
    description: "Buyers browse verified listings and enquire directly.",
  },
];

const trustPoints = [
  {
    title: "Verified Agents",
    description: "Every agent on the platform is reviewed and approved by our admin team.",
  },
  {
    title: "Approved Listings",
    description: "No listing goes live without passing an admin verification step.",
  },
  {
    title: "Admin Reviewed Data",
    description: "Property data is checked for accuracy before buyers ever see it.",
  },
];

export default function Home() {
  const featuredProperties = getFeaturedProperties();

  return (
    <div>
      <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50/60 to-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center">
          <Image
            src="/im-realtor-logo.png"
            alt="I'm Realtor"
            width={72}
            height={72}
            className="mb-6 rounded-2xl"
            priority
          />

          <Badge tone="brand" className="mb-4">
            Soft-live Private Beta
          </Badge>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
            I&apos;m <span className="text-brand-600">Realtor</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-slate-600 md:text-xl">
            A simple real estate marketplace for verified agents, property owners,
            buyers, and admin-approved listings.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button href="/properties" size="lg">
              Browse Properties
            </Button>
            <Button href="/request-access" variant="outline" size="lg">
              Request Agent Preview
            </Button>
          </div>

          <p className="mt-8 max-w-xl text-sm text-slate-500">
            Public signup is currently controlled. Every agent, owner, and
            listing is reviewed by our admin team before it appears here.
          </p>
        </div>
      </section>

      {featuredProperties.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">Featured Properties</h2>
            <Link href="/properties" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </section>
      )}

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-2xl font-semibold text-slate-900">How It Works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item) => (
              <div key={item.step} className="rounded-2xl border border-slate-200 bg-white p-6">
                <span className="text-sm font-semibold text-brand-600">{item.step}</span>
                <h3 className="mt-2 text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold text-slate-900">Why Trust I&apos;m Realtor</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {trustPoints.map((point) => (
            <div key={point.title} className="rounded-2xl border border-brand-100 bg-brand-50/50 p-6 text-center">
              <h3 className="text-base font-semibold text-slate-900">{point.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{point.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold text-white">Ready to get early access?</h2>
          <p className="max-w-xl text-slate-300">
            Request access as an agent, owner, or buyer. Our team reviews every
            request personally during the private beta.
          </p>
          <Button href="/request-access" size="lg">
            Request Access
          </Button>
        </div>
      </section>
    </div>
  );
}
