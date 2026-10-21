import type { CineSources } from "./Cinemagraph";
import { asset } from "@/lib/assets";

/* One photo, two clips: the pre-order popup still (woman meditating) turned into an 8 s
   cinemagraph. Posters are the exact first frame of each final mp4. */
export const YOGA_SOURCES: CineSources = {
  landscape: { video: asset("hero/cine/ip6-yoga-landscape.mp4"), poster: asset("hero/cine/ip6-yoga-landscape.jpg"), width: 2880, height: 1884, pos: [0.55, 0.4] },
  portrait: { video: asset("hero/cine/ip6-yoga-portrait.mp4"), poster: asset("hero/cine/ip6-yoga-portrait.jpg"), width: 1440, height: 2558, pos: [0.5, 0.45] },
};

export const YOGA_ALT = "A woman meditating cross-legged on a yoga mat in a bright living room";
