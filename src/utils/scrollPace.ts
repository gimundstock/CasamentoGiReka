/**
 * The pace of every pinned scene (Save the Date, the big day and the
 * passport, the invitation, the padrinhos' manual): vh of real scroll per vh
 * of a scene's own timeline. The scenes' timelines are written in vh as they
 * were first paced (1); below 1, each plays the same choreography in less
 * scroll. Only the scrolled length of a scene changes, not the hand-overs
 * between sections, where one passes the other on a screen of real scroll.
 */
export const SCROLL_PACE = 0.55

/** Real vh of scroll for `vh` of a scene's timeline. */
export const paced = (vh: number) => vh * SCROLL_PACE

/** A scene's timeline vh for `vh` of real scroll into it. */
export const unpaced = (vh: number) => vh / SCROLL_PACE
