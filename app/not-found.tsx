import Link from "next/link";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <section className="container py-24 text-center max-w-xl">
        <p className="eyebrow mb-3">404</p>
        <h1 className="font-display text-display-lg text-forest-800 mb-4">Page not found.</h1>
        <p className="text-ink/75 mb-8">
          The page you're looking for may have moved or never existed.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/" className="btn-primary">Home</Link>
          <Link href="/shop" className="btn-secondary">Browse the shop</Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
