import { Footer } from "@/components/layout/Footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="container py-16 lg:py-24 max-w-3xl">{children}</div>
      <Footer />
    </>
  );
}
