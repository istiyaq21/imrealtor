import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

export default function Logo({ className = "", showWordmark = true }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/im-realtor-logo.png"
        alt="I'm Realtor"
        width={36}
        height={36}
        className="rounded-lg"
        priority
      />
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight text-slate-900">
          I&apos;m <span className="text-brand-600">Realtor</span>
        </span>
      )}
    </Link>
  );
}
