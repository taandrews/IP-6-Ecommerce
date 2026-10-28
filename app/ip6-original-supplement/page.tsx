import { permanentRedirect } from "next/navigation";

export default function LegacySupplementPage() {
  permanentRedirect("/shop#people");
}
