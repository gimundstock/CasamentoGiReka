// The sun starts as the cosmos center in HeroSaveDateCouple and travels
// on into HeroBigDay — both sections draw it with these.
//
// public/flowers/sun.webp is a painted flower center (sun2), cropped square around
// its middle; its spiky edge spans about 83 % of the image. SUN_SIZE is
// the image box, so the sun itself is ~14vmin across — the size of the
// cosmos center when the flower is scaled up at the hand-off.
export const SUN_SRC = `${import.meta.env.BASE_URL}flowers/sun.webp`
export const SUN_SIZE = '16.8vmin'
// The sun keeps turning with the flower: its rotation at the hand-off,
// where HeroBigDay picks it up.
export const SUN_HANDOFF_ROTATE = 1200
// Where the flower zoom hands over, the sun is SUN_BIG_VMIN across — big,
// in the middle of the screen — and HeroBigDay shrinks it to SUN_SIZE as
// it rises.
export const SUN_BIG_VMIN = 32
export const SUN_BIG_SCALE = SUN_BIG_VMIN / 14
// The sun softens into watercolor as it rises in HeroBigDay: crisp at the
// hand-off, soft once it is in the sky. The soft look is baked into
// public/flowers/sun-soft.webp and sun-soft-warm.webp (a 3.6px blur and a 9px
// warm glow at an 800px-tall screen, plus the sunset tint for -warm), on a
// canvas 1.4x the sun's so the glow isn't clipped.
