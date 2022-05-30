import { Bob } from 'alice-bob'
import { Point, Rect } from 'geometrik'
import { Popup } from './x-popup'
import type { PopupSceneCore } from './x-popup'

// type Popup = {
//   popupDest: Point
//   popupRect: Rect
//   prevPopupRect: Rect
//   innerRect: Rect
//   boxRect: Rect
//   targetRect: Rect
//   viewportRect: Rect
//   viewportInnerRect: Rect

//   collisions: Map<Popup, Point>

//   touchesInner: boolean
//   touchesBorder: boolean
//   touchesViewport: boolean

//   insideBox: boolean
//   insideInner: boolean
//   insideViewport: boolean
// }

export type PopupScene = {
  update: () => void
  containBorder: (a: Popup, newPrev?: Rect) => void
  popups: Set<Popup>
  add: (popup: Popup) => Promise<void>
}

export const createPopupScene = (): PopupScene => {
  let prev!: Rect
  let next!: Rect

  const containBorder = (a: Popup, newPrev?: Rect) => {
    if (newPrev) {
      prev = next = newPrev
      if (!a.innerRect) return
    }

    if (!a.touchesBorder) {
      next = prev.contain(a.innerRect!)

      a.touchesInner = a.touchesViewport = false

      if (!next.pos.equals(prev.pos)) {
        a.touchesInner = true
        a.touchesBorder = true
        prev = next
      }

      next = prev.contain(a.viewportRect!)

      if (!next.pos.equals(prev.pos)) {
        a.touchesViewport = true
        a.touchesBorder = true
      }

      if (a.touchesViewport) {
        next.setPosition(a.popupRect!.touchPoint(a.viewportInnerRect!))
      } else if (a.touchesInner) {
        next.setPosition(a.popupRect!.touchPoint(a.boxRect!))
      }
    }

    next.containSelf(a.innerRect!).containSelf(a.viewportRect!)
  }
  const popups = new Set<Popup>()
  const scene = {
    popups,
    add: async (popup: Popup) => {
      popups.add(popup)
    },
    containBorder,
    update: (() => {
      // move everything within boundaries
      for (const a of popups) {
        a.touchesBorder = false

        if (
          a.popupDest
          && a.popupRect
          && a.innerRect
          && a.boxRect
          && a.targetRect
          && a.viewportRect
        ) {
          a.prevPopupRect.set(a.popupRect)

          const diff = a.popupDest.screen(a.popupRect).pos
          a.insideBox = a.targetRect.intersectsRect(a.boxRect)
          a.insideInner = a.targetRect.intersectsRect(a.innerRect)
          a.insideViewport = a.targetRect.intersectsRect(a.viewportRect)

          a.popupRect.translateSelf(
            diff.scale(
              !a.insideInner
                ? 0.25
                : 0.92
            )
          )

          if (!a.insideViewport) {
            next = a.popupRect.clone()

            next.setPosition(a.popupRect!.touchPoint(a.viewportRect!))

            a.popupRect.setPosition(next.pos)
          } else if (!a.insideInner) {
            next = a.popupRect.clone()

            next.setPosition(a.popupRect!.touchPoint(a.boxRect!))

            a.popupRect.setPosition(next.pos)
          }
        }
      }

      let pp = [...popups]

      const solve = () => {
        // solve collisions
        pp = pp.sort(() => Math.random() > 0.5 ? 1 : -1)

        for (const a of pp) {
          a.collisions.clear()
          for (const b of pp) {
            if (a === b || a.collisions.has(b)) continue
            if (
              a.popupRect
              && b.popupRect
              && (
                b.collisions.has(a)
                || a.popupRect.intersectsRect(b.popupRect)
              )
            ) {
              const tp = a.popupRect.touchPoint(b.popupRect)
              const d = tp.screenSelf(a.popupRect).scale(a.touchesBorder ? 1 : 0.48)
              a.collisions.set(b, d)
            }
          }
        }
      }

      const apply = () => {
        for (const a of popups) {
          if (a.popupRect && a.innerRect) {
            prev = a.popupRect.clone()

            if (a.collisions.size) {
              const c = Point
                .sum([...a.collisions.values()])
                .normalizeSelf(a.collisions.size)

              if (a.touchesBorder) {
                let isX = false, isY = false
                const tolX = a.popupRect.width + (a.popupRect.width * 0.75)
                const tolY = a.popupRect.height + (a.popupRect.height * 0.75)
                if (
                  a.popupRect.center.x < a.innerRect.left + tolX
                  || a.popupRect.center.x > a.innerRect.right - tolX
                ) {
                  isX = true
                }
                if (
                  a.popupRect.center.y < a.innerRect.top + tolY
                  || a.popupRect.center.y > a.innerRect.bottom - tolY
                ) {
                  isY = true
                }
                if (!(isX && isY)) {
                  if (isX) {
                    c.x *= 0.05
                    c.y *= 0.8
                  } else if (isY) {
                    c.x *= 0.8
                    c.y *= 0.05
                  }
                } else if (isX && isY) {
                  if (Math.abs(c.x) > Math.abs(c.y)) {
                    c.x *= 0.6
                    c.y *= 0.05
                  } else {
                    c.x *= 0.05
                    c.y *= 0.6
                  }
                }
              }

              prev.translateSelf(c)
              a.collisions.clear()
            }

            next = prev

            containBorder(a)

            a.popupRect.setPosition(next.pos)
          }
        }
      }

      for (let i = 0; i < 12; i++) {
        solve()
        apply()
      }

      for (const a of popups) {
        if (
          a.touchesBorder
          && a.popupRect
          && a.boxRect
          && a.innerRect
          && a.targetRect
          && a.viewportRect
          && a.viewportInnerRect
        ) {
          a.popupRect.setPosition(
            a.popupRect
              .touchPoint(
                a.touchesViewport
                  ? a.viewportInnerRect
                  : a.boxRect
              )
          )

          a.popupRect.containSelf(a.innerRect).containSelf(a.viewportRect)
        }
      }

      for (const a of popups) {
        if (a.popupRect) {
          const diff = a.prevPopupRect.screen(a.popupRect).pos
          if (diff.absoluteSum() > .0025) a.popupRect = a.popupRect.clone()
        }
      }
    }),
  }

  return scene
}

const [worklet] = new Bob<PopupScene, PopupSceneCore>(
  data => self.postMessage(data),
  createPopupScene()
).agents({ debug: false })

self.onmessage = ({ data }) => worklet.receive(data)
