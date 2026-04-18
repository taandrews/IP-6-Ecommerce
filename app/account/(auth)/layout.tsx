import { Footer } from "@/components/layout/Footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="container py-16 lg:py-24 max-w-md">{children}</div>
      <Footer />
    </>
  );
}
