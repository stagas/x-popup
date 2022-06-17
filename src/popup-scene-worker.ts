import { shuffle } from 'everyday-utils'
import { Intersect, Matrix, Placement, Point, Polygon, Rect } from 'geometrik'
import { chain, Context, createContext, on, queue } from 'mixter'
import { SyncedSet } from 'synced-set'
import { Popup } from './popup'
import { core, PopupScene } from './popup-core'

export class PopupSceneWorker implements PopupScene {
  popups!: SyncedSet<Popup, {
    pos: Point
  }>
  remote!: MessagePort

  viewportRect!: Rect
  viewMatrix!: Matrix

  context!: Context<PopupScene>

  solveCollisions?: (popups: Popup[]) => void
  applyCollisions?: (popups: Popup[]) => void
  examineBoundaries?: (popups: Popup[]) => void
  containViewport?: (popups: Popup[]) => void
  placePopups?: (popups: Popup[]) => void

  integrate?: (popups: Popup[], amount: number) => void
  animate?: () => void
  isMoving?: (popups: Popup[]) => boolean

  placePopup?: (popup: Popup, popups: Popup[]) => void
  touchesOther?: (popup: Popup, popups: Popup[]) => boolean

  constructor() {
    this.create()
  }

  create(this: PopupSceneWorker) {
    // @ts-ignore
    const $ = this.context = createContext<PopupSceneWorker>(this)
    const { callback, effect, reduce } = $

    // connect to local remote

    $.remote = reduce(() => self as unknown as MessagePort)

    // popups synced set

    $.popups = reduce(({ remote }) =>
      new SyncedSet({
        send: queue.raf((payload, cb) => {
          remote.postMessage({ popups: core.serialize(payload) })
          cb()
        }),
        pick: core.pickFromLocal,
        reducer: popup => ({
          pos: popup.rect?.pos ?? new Point(),
        }),
        equal: (prev, next) => prev.pos.equals(next.pos),
      })
    )

    effect(({ popups }) =>
      chain(
        on(popups).add(({ detail: popup }) => {
          popup.scene = this as PopupScene

          // popup.context.effect.once(({ placement }) => {
          //   popup.originalPlacement = placement
          // })
        })
        // on(popups).delete(popup => {
        //   //
        // })
      )
    )

    // receive data from local

    effect(({ popups, remote, animate }) => {
      remote.onmessage = ({ data }) => {
        if (data.popups) {
          popups.receive(core.deserialize(data.popups))
        } else {
          Object.assign(this, core.deserialize(data))
        }

        animate()
      }
    })

    $.animate = reduce((
      {
        popups,
        integrate,
        placePopups,
        examineBoundaries,
        containViewport,
        solveCollisions,
        applyCollisions,
        isMoving,
      },
    ) =>
      queue.raf(() => {
        const pp = [...popups] // .filter(p => p.rect && p.destRect)

        shuffle(pp)

        placePopups(pp)
        integrate(pp, 0.32)

        for (let i = 0; i < 30; i++) {
          shuffle(pp)

          solveCollisions(pp)
          applyCollisions(pp)
          integrate(pp, 0.45)

          examineBoundaries(pp)
          containViewport(pp)
          integrate(pp, 0.92)
        }

        examineBoundaries(pp)
        containViewport(pp)
        integrate(pp, 0.45)

        if (isMoving(pp)) $.animate!()
      })
    )

    $.integrate = (popups, amount = 0.5) => {
      for (const p of popups) {
        if (!p.rect) {
          p.rect = p.destRect.clone()
        } else {
          const d = p.destRect.pos.screen(p.rect.pos)
          p.rect = p.rect.translate(d.scale(amount * (p.targetExceedsViewport ? 1 : 0.6)))
          p.destRect.set(p.rect)
        }
      }
    }

    $.isMoving = popups => {
      for (const p of popups) {
        const prev = p.prevRect.pos
        p.prevRect = p.rect.clone()
        if (prev.screen(p.rect.pos).absoluteSum() > (p.targetExceedsViewport ? 8 : 5)) {
          return true
        }
      }
      return false
    }

    const placementChoices: Placement[] = ['nwr', 's', 'w', 'e'] // , 'nw', 'ne', 'sw', 'se']

    $.placePopup = reduce(({ touchesOther }) =>
      callback(({ viewMatrix }) =>
        (popup, popups) => {
          // const { viewportRect } = $
          const lastValidPlacement = popup.placement ?? popup.originalPlacement

          let target = popup.placement
          if (popup.targetWithinViewport && !popup.exceedsViewport && viewMatrix?.a >= 0.6) {
            target = popup.originalPlacement
          }

          if (target && popup.targetWithinViewport && viewMatrix?.a > 0.42) {
            for (let i = 0; i < placementChoices.length; i++) {
              popup.destRect = popup.place!(target)

              if (!touchesOther(popup, popups)) {
                if (target !== popup.placement) {
                  popup.placement = target
                }
                return
              }

              target = placementChoices[(placementChoices.indexOf(target) + 1) % placementChoices.length]
            }
          }

          popup.destRect = popup.place!(lastValidPlacement)
        }
      )
    )

    $.touchesOther = (popup, popups) => {
      for (const p of popups) {
        if (p === popup) continue
        // if (p.exceedsViewport) continue
        // if (!p.targetRect.intersectsRect(viewportRect)) continue

        const touchesOtherPopup = popup.destRect.intersectsRect(p.rect)
        const touchesOtherTarget = popup.destRect.intersectsRect(p.targetRect)
        if (touchesOtherPopup || touchesOtherTarget) {
          return true
        }
      }
      return false
    }

    $.placePopups = reduce(({ placePopup }) =>
      popups => {
        for (const p of popups) {
          placePopup(p, popups)
        }
      }
    )

    $.examineBoundaries = callback(({ viewportRect }) =>
      popups => {
        for (const p of popups) {
          p.exceedsViewport = !p.rect.withinRect(viewportRect)
          p.viewportIntersection = p.exceedsViewport ? p.rect.intersectionRect(viewportRect) : 0
          p.targetExceedsViewport = !p.targetRect.intersectsRect(viewportRect)
          p.targetWithinViewport = !p.targetExceedsViewport && p.targetRect.withinRect(viewportRect)
        }
      }
    )

    $.containViewport = callback(({ viewportRect }) =>
      popups => {
        for (const p of popups) {
          if (p.targetExceedsViewport) {
            const tp = p.rect.touchPoint(
              viewportRect.zoomLinear(p.contentsRect.size.scale(-2))
            )
            p.destRect = p.rect.translate(tp.screen(p.rect.pos))
          } else if (!p.targetWithinViewport) {
            p.destRect = p.rect.contain(viewportRect)
          }
        }
      }
    )

    $.solveCollisions = reduce(() =>
      (popups: Popup[]) => {
        for (const a of popups) {
          a.collisions.clear()

          for (const b of popups) {
            if (a === b) continue

            if (a.rect.intersectsRect(b.rect)) {
              const tp = a.rect.touchPoint(b.rect)
              const d = tp.screenSelf(a.rect)
              a.collisions.set(b, d)
            }
          }
        }
      }
    )

    $.applyCollisions = reduce(() =>
      callback(() =>
        (popups: Popup[]) => {
          for (const a of popups) {
            if (a.collisions.size) {
              const c = Polygon
                .sum([...a.collisions.values()])
                .normalizeSelf(a.collisions.size)

              if (
                (a.viewportIntersection & Intersect.Left)
                || (a.viewportIntersection & Intersect.Right)
              ) {
                c.y *= 1.025
                c.x *= 0.65
              }

              if (
                (a.viewportIntersection & Intersect.Top)
                || (a.viewportIntersection & Intersect.Bottom)
              ) {
                c.x *= 1.025
                c.y *= 0.65
              }

              a.destRect = a.rect.translate(c)

              a.collisions.clear()
            }
          }
        }
      )
    )
  }
}

new PopupSceneWorker()
