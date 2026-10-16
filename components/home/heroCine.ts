import type { CineSources } from "./Cinemagraph";

/* One photo, two clips: the pre-order popup still (woman meditating) turned into an 8 s
   cinemagraph. Posters are the exact first frame of each final mp4. */
export const YOGA_SOURCES: CineSources = {
  landscape: { video: "/hero/cine/ip6-yoga-landscape.mp4", poster: "/hero/cine/ip6-yoga-landscape.jpg", width: 1760, height: 1152, pos: [0.55, 0.4] },
  portrait: { video: "/hero/cine/ip6-yoga-portrait.mp4", poster: "/hero/cine/ip6-yoga-portrait.jpg", width: 1072, height: 1904, pos: [0.5, 0.45] },
};

export const YOGA_ALT = "A woman meditating cross-legged on a yoga mat in a bright living room";
