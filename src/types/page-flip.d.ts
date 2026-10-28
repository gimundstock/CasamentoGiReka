// page-flip (StPageFlip, MIT) ships no type declarations. This covers the
// part of its API the passport uses. Imported from its ES module build.
declare module 'page-flip/dist/js/page-flip.module.js' {
  export interface FlipSetting {
    startPage: number
    size: 'fixed' | 'stretch'
    width: number
    height: number
    drawShadow: boolean
    flippingTime: number
    usePortrait: boolean
    startZIndex: number
    autoSize: boolean
    maxShadowOpacity: number
    showCover: boolean
    mobileScrollSupport: boolean
    clickEventForward: boolean
    useMouseEvents: boolean
    swipeDistance: number
    showPageCorners: boolean
    disableFlipByClick: boolean
  }

  export type FlipState = 'user_fold' | 'fold_corner' | 'flipping' | 'read'

  export interface FlipEvent {
    data: unknown
    object: PageFlip
  }

  export class PageFlip {
    constructor(element: HTMLElement, setting: Partial<FlipSetting>)
    loadFromHTML(items: HTMLElement[]): void
    updateFromHtml(items: HTMLElement[]): void
    destroy(): void
    update(): void
    flip(page: number, corner?: 'top' | 'bottom'): void
    flipNext(corner?: 'top' | 'bottom'): void
    flipPrev(corner?: 'top' | 'bottom'): void
    turnToPage(page: number): void
    getCurrentPageIndex(): number
    getPageCount(): number
    getState(): FlipState
    getPageCollection(): unknown
    getRender(): unknown
    on(
      event: 'flip' | 'changeState' | 'changeOrientation' | 'init',
      cb: (e: FlipEvent) => void
    ): this
  }
}
