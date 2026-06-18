import { Footer } from "@/components/marketing/Footer";
import { Nav } from "@/components/marketing/Nav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-x-hidden">
      {/* ambient animated blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[34rem] w-[34rem] rounded-full bg-brand-600/20 blur-3xl animate-blob" />
        <div
          className="absolute -right-40 top-40 h-[30rem] w-[30rem] rounded-full bg-sky-500/15 blur-3xl animate-blob"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/10 blur-3xl animate-blob"
          style={{ animationDelay: "8s" }}
        />
      </div>
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
