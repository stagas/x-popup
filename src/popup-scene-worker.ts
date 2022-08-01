import $ from 'sigl/worker'

import { shuffle } from 'everyday-utils'
import { Intersect, Matrix, Point, Polygon, Rect } from 'geometrik'
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

  $!: $.Context<PopupSceneWorker> & typeof $
  context!: $.ContextClass<PopupSceneWorker>

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
    $.ContextClass.attach(this as any, $)
    this.create()
  }

  create(this: PopupSceneWorker) {
    const { $ } = this

    //!? 'popup scene worker create'

    // connect to local remote

    $.remote = $.reduce(() => self as unknown as MessagePort)

    // popups synced set

    $.popups = $.reduce(({ remote }) =>
      new SyncedSet({
        send: $.queue.throttle(10).last.next((payload, cb) => {
          //!? 'sending'
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

    $.effect(({ popups }) =>
      $.chain(
        $.on(popups).add(({ detail: popup }) => {
          popup.attach()
          popup.create()
          popup.scene = this as PopupScene

          // console.log(popups)
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

    let loops = 0

    $.effect(({ popups, remote, animate }) => {
      remote.onmessage = ({ data }) => {
        if (data.popups) {
          popups.receive(core.deserialize(data.popups))
        } else {
          Object.assign($, core.deserialize(data))
        }
        // console.log('RECEIVE', data)
        animate()
        // loops = 0
      }
    })

    $.animate = $.reduce((
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
      $.queue.raf(() => {
        //!? 'animating'

        const pp = [...popups] // .filter(p => p.rect && p.destRect)

        shuffle(pp)

        placePopups(pp)
        integrate(pp, 1)

        for (let i = 0; i < 2; i++) {
          //   shuffle(pp)

          solveCollisions(pp)
          applyCollisions(pp)
          integrate(pp, 1)

          examineBoundaries(pp)
          containViewport(pp)
          integrate(pp, 1)
        }

        // examineBoundaries(pp)
        // containViewport(pp)
        // integrate(pp, 0.99)

        if (++loops < 5 && isMoving(pp)) {
          //!? 'looping anim'
          $.animate!()
        } else loops = 0
      })
    )

    $.integrate = (popups, amount = 0.5) => {
      for (const p of popups) {
        if (!p.rect) {
          p.rect = p.rectDest.clone()
        } else {
          const d = p.rectDest.pos.screen(p.rect.pos)
          p.rect.translateSelf(d.scaleSelf(amount * (p.destExceedsViewport ? 1 : 0.4)))
          p.rectDest = p.rect.clone()
        }
      }
    }

    $.isMoving = popups => {
      for (const p of popups) {
        if (p.prevPos.screen(p.rect.pos).absoluteSum() > (p.destExceedsViewport ? 45 : 1)) {
          p.prevPos.set(p.rect.pos)
          return true
        }
        p.prevPos.set(p.rect.pos)
      }
      return false
    }

    // const placementChoices: Placement[] = ['nwr', 's', 'w', 'e'] // , 'nw', 'ne', 'sw', 'se']

    $.placePopup = popup => {
      const target = popup.placement ?? popup.originalPlacement
      popup.rectDest = popup.place!(target)
    }

    // $.placePopup = $.reduce(({ touchesOther }) =>
    //   // $.with(({ viewMatrix }) =>
    //     (popup, popups) => {
    //       const target = popup.placement ?? popup.originalPlacement
    //       // if (popup.destWithinViewport && !popup.exceedsViewport) { //} && viewMatrix?.a >= 0.15) {
    //       // }
    //       popup.rectDest = popup.place!(target)
    //       // const lastValidPlacement = popup.placement ?? popup.originalPlacement

    //       // let target = popup.placement
    //       // if (
    //       //   popup.originalPlacement && popup.destWithinViewport && !popup.exceedsViewport && viewMatrix?.a >= 0.15
    //       // ) {
    //       //   target = popup.originalPlacement
    //       // }

    //       // if (target && popup.destWithinViewport && viewMatrix?.a > 0.42) {
    //       //   for (let i = 0; i < placementChoices.length; i++) {
    //       //     popup.rectDest = popup.place!(target)

    //       //     if (!touchesOther(popup, popups)) {
    //       //       if (target !== popup.placement) {
    //       //         popup.placement = target
    //       //       }
    //       //       return
    //       //     }

    //       //     target = placementChoices[(placementChoices.indexOf(target) + 1) % placementChoices.length]
    //       //   }
    //       // }

    //       // popup.rectDest = popup.place!(lastValidPlacement)
    //     }
    //   // )
    // )

    $.touchesOther = (popup, popups) => {
      for (const p of popups) {
        if (p === popup) continue
        if (!p.rect || !p.destRect) continue
        // if (p.exceedsViewport) continue
        // if (!p.targetRect.intersectsRect(viewportRect)) continue

        const touchesOtherPopup = popup.rectDest.intersectsRect(p.rectDest)
        const touchesOtherDest = popup.rectDest.intersectsRect(p.destRect)
        if (touchesOtherPopup || touchesOtherDest) {
          return true
        }
      }
      return false
    }

    $.placePopups = $.reduce(({ placePopup }) =>
      popups => {
        for (const p of popups) {
          placePopup(p, popups)
        }
      }
    )

    $.examineBoundaries = $.with(({ viewportRect }) =>
      popups => {
        for (const p of popups) {
          p.exceedsViewport = !p.rect.withinRect(viewportRect)
          p.viewportIntersection = p.exceedsViewport ? p.rect.intersectionRect(viewportRect) : 0
          p.destExceedsViewport = !p.destRect.intersectsRect(viewportRect)
          p.destWithinViewport = !p.destExceedsViewport && p.destRect.withinRect(viewportRect)
        }
      }
    )

    $.containViewport = $.with(({ viewportRect }) =>
      popups => {
        for (const p of popups) {
          if (p.destExceedsViewport) {
            const tp = p.rect.touchPoint(
              viewportRect.zoomLinear(p.contentsRect.size.scale(-2))
            )
            p.rectDest.set(p.rect.translate(tp.screen(p.rect.pos)))
          } else if (!p.destWithinViewport) {
            p.rectDest.set(p.rect.contain(viewportRect))
          }
        }
      }
    )

    $.solveCollisions = (popups: Popup[]) => {
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

    $.applyCollisions = (popups: Popup[]) => {
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

          a.rectDest = a.rect.translate(c)

          a.collisions.clear()
        }
      }
    }
  }
}

new PopupSceneWorker()
