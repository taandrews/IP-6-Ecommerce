import { permanentRedirect } from "next/navigation";

export default function LegacyPetPage() {
  permanentRedirect("/shop#pets");
}
