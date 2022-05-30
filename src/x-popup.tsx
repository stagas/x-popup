/** @jsxImportSource mixter/jsx */
import { AnimSettings } from 'animatrix'
import { Placement, Point, Rect } from 'geometrik'
import { isMobileAgent } from 'is-mobile-agent'
import { attrs, chain, mixter, on, onresize, props, queue, shadow, state } from 'mixter'
import { jsx, refs } from 'mixter/jsx'

const style = /*css*/ `
:host {
  position: absolute;
  width: 100%;
  height: 100%;
}

[part=contents] {
  position: absolute;
  display: inline-flex;
  user-select: none;
  /* transition-property: transform; */
  /* transition-duration: 200ms; */
  /* transition-delay: 5ms; */

  ${
  isMobileAgent
    ? 'transition: transform 500ms cubic-bezier(0, 0.55, 0.25, 1);'
    : 'transition: transform 200ms cubic-bezier(0, 0.55, 0.25, 1);'
}
}

[part=arrow] {
  position: absolute;
  pointer-events: none;
  left: 0;
  top: 0;
  width: 15px;
  height: 20px;
  stroke: #fff;
  fill: #000;
  transform-origin: 0 0 0;
  transition: transform 200ms cubic-bezier(0, 0.55, 0.25, 1);
}

:host([arrowinner]) [part=arrow] {
  width: 6px;
  height: 10px;
  fill: #fff;
  /* transform-origin: 0 0 0; */
  /* transform-origin: 50% 50%; */
}

[part=indicator] {
  position: fixed;
  width: 20px;
  height: 20px;
  visibility: hidden;
  font-size: 20px;
  line-height: 20px;
  transform-origin: 50% 50%;
}

:host(:not([visible])) {
  visibility: hidden;
}
`

export type PopupScene = {
  update: () => void
  containBorder: (a: PopupElement, newPrev?: Rect) => void
  popups: Set<PopupElement>
}

export const createPopupScene = (): PopupScene => {
  // @ts-ignore
  // const workerUrl = new URL('./x-popup-worker.js', import.meta.url).href
  // const worker = new Worker(workerUrl, { type: 'module' })

  let prev!: Rect
  let next!: Rect

  const containBorder = (a: PopupElement, newPrev?: Rect) => {
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
  const popups = new Set<PopupElement>()
  const scene = {
    popups,
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
export class PopupElement extends mixter(
  HTMLElement,
  shadow(),
  attrs(
    class {
      placement: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' = 'n'
      visible = Boolean
      arrow = false
      arrowInner = false
      contain = false
      hideAway = Boolean
    }
  ),
  props(
    class {
      scene?: PopupScene

      animSettings?: AnimSettings

      box?: HTMLElement & {
        rect: Rect
        matrix: DOMMatrix
        itemRectsMap: WeakMap<HTMLElement, Rect>
        animSettings: AnimSettings
      }
      boxRect?: Rect
      innerRect?: Rect

      target?: HTMLElement
      targetRect?: Rect

      popupRect?: Rect
      viewportRect?: Rect
      viewportInnerRect?: Rect

      prevPopupRect = new Rect()
      popupDest?: Point

      touchesBorder = false
      touchesInner = false
      touchesViewport = false
      insideBox = false
      insideInner = false
      insideViewport = false
      blocked: Set<Placement> = new Set()
      collisions: Map<PopupElement, Point> = new Map()

      contents?: HTMLSlotElement
      contentsMatrix = new DOMMatrix()
      contentsMatrixString?: string
      contentsAnim?: StepAnimation
      contentsAnimValues?: Point

      arrowEl?: SVGSVGElement
      arrowRect?: Rect
      arrowMatrix = new DOMMatrix()
      arrowMatrixString?: string

      draw?: () => void
      updateBox?: () => void
      updateTarget?: () => void
      getPosition?: () => Point
      placeArrow?: () => number | boolean
      placePopup?: (placement: Placement) => [Rect, Rect, Placement]
    }
  ),
  state<PopupElement>(({ $, effect, mutate, mutating, reduce }) => {
    const { render } = jsx($)
    const { ref } = refs($)

    $.arrowRect = reduce(({ arrowInner }) =>
      arrowInner
        ? new Rect(0, 0, 6, 10)
        : new Rect(0, 0, 15, 20)
    )

    $.viewportInnerRect = reduce(({ popupRect, viewportRect }) =>
      viewportRect
        .zoomLinear(popupRect.size.scale(2).negate())
    )

    effect(({ host, scene }) => {
      scene.popups.add(host)
      return () => scene.popups.delete(host)
    })

    effect(({ contents, boxRect, arrowRect, contain }) =>
      onresize(contents, ([entry]) => {
        const box = entry.borderBoxSize[0]
        $.popupRect ??= new Rect(0, 0, box.inlineSize, box.blockSize)
        $.innerRect = contain
          ? boxRect.zoomLinear($.popupRect.size.scale(2)).zoomLinear(arrowRect.size.negate().scaleLinear(0, 9)) // .zoomLinear($.popupRect.size) // 10, 10) // clone()
          : boxRect.zoomLinear($.popupRect.size.scale(2))
        // $.innerRect = boxRect.zoomLinear($.popupRect.size.scale(2))
      })
    )

    $.placePopup = reduce(({ blocked, targetRect, scene, contain }) => ((placement: Placement) => {
      const { popupRect } = $
      if (!popupRect) return [new Rect(), new Rect(), placement]

      const { popups } = scene

      let firstPos!: Rect
      let p!: Rect

      const run = (): void => {
        p = popupRect.place(targetRect, placement)

        firstPos ??= p

        for (const a of popups) {
          a.touchesBorder = false
          if (contain) {
            scene.containBorder(a, p)
          }
          if (a.targetRect && (a.touchesBorder || p.intersectsRect(a.targetRect))) {
            if (blocked.has(placement)) return
            blocked.add(placement)
            placement = placementChoices[(placementChoices.indexOf(placement) + 1) % placementChoices.length]
            return run()
          }
        }

        // if (!arrowInner) {
        //   const rotation = placeArrow()
        // }
      }

      run()

      return [firstPos, p, placement]
    }))

    let initial = true
    const placementChoices: Placement[] = ['n', 's', 'w', 'e'] // , 'nw', 'ne', 'sw', 'se']

    effect.task.desync(({ scene, placePopup, innerRect, targetRect, blocked, placement }) => {
      const { popupRect } = $
      if (!popupRect) return

      const prevPopupDest = $.popupDest?.clone()

      blocked.clear()

      let firstPos!: Rect
      let p!: Rect

      if (targetRect.withinRect(innerRect)) {
        ;[firstPos, p, placement] = placePopup(placement)
      } else {
        p = popupRect.place(targetRect, placement)
      }

      if (blocked.size === placementChoices.length) {
        p = firstPos
      } else {
        $.placement = placement
      }

      // destination
      // if (prevPopupDest && prevPopupDest.screen(p.pos).absoluteSum() < 0.000029) return
      $.popupDest = p.pos

      // set initial position immediately to target
      if (initial) {
        initial = false
        $.popupRect = popupRect.setPosition(p.pos).clone()
      }

      scene.update()
    })

    $.arrowMatrix = reduce.raf.desync((
      { contain, popupRect, insideBox, touchesInner, touchesViewport, arrowInner, arrowRect, targetRect },
    ) => {
      const arrowSize = arrowRect.size.scale(4, 2.6)
      // const popupSize = popupRect.size // .scaleLinear(-20, 0)
      // const popupSize = popupRect.size.scale(0.35, 0.82)
      const popupOuter = popupRect.zoomLinear(arrowSize.negate()) // .scaleLinear(popupSize.negate()))
      // arrowInner
      //   ? arrowRect.size.scale(3.5, 2.2).negate()
      //   : arrowRect.size // new Point(-46, -51)
      // )
      //
      const run = (): number | boolean => {
        const tc = targetRect.center

        arrowRect.setPosition(arrowRect.touchPoint(popupOuter, tc))

        // .containSelf(contain ? boxRect.zoomLinear(arrowRect.size.scale(2)) : innerRect)
        // .containSelf(viewportRect.zoomLinear(-3, 2))

        const ac = arrowRect.center
        let rotation = Math.atan2(tc.y - ac.y, tc.x - ac.x) * (180 / Math.PI)
        if (!arrowInner) {
          rotation = Math.round(rotation / 90) * 90
          if (Math.abs(rotation) === 90) {
            arrowRect.x = Math.min(
              Math.max(arrowRect.x, popupRect.x + 23),
              popupRect.right - 40
            )
          }
          if (Math.abs(rotation) === 180 || Math.abs(rotation) === 0) {
            arrowRect.y = Math.min(
              Math.max(arrowRect.y, popupRect.y + 23),
              popupRect.bottom - 40
            )
          }
        }

        if (contain && !insideBox && touchesInner && !touchesViewport) {
          rotation = 180 + rotation
        }

        arrowRect.screenSelf(popupOuter).translateSelf(arrowSize.scale(0.5))

        return rotation
      }

      const rotation = run()

      if (rotation !== false) {
        const next = new DOMMatrix()
          .translateSelf(arrowRect.x, arrowRect.y)
          .translateSelf(arrowRect.width / 2, arrowRect.height / 2)
          .rotateSelf(rotation as number)
          .translateSelf(-arrowRect.width / 2, -arrowRect.height / 2)
        return next
      } else {
        return $.arrowMatrix
      }
    })

    // let contentsAnim: Animation
    // const draw = queue.throttle(25).first.last.next(() => {
    //   mutate(({ placeArrow, contents, contentsMatrix, popupRect }) => {
    //     if (!popupRect) return

    //     placeArrow?.()
    //     // while (placeArrow?.() === false) {
    //     //   placePopup?.($.placement)
    //     // }

    //     if (contents) {
    //       const prev = contentsMatrix.toString()
    //       const next = new DOMMatrix()
    //       next.translateSelf(popupRect.x, popupRect.y)

    //       if (contentsAnim) contentsAnim.cancel()

    //       contentsAnim = contents.animate([
    //         { transform: prev },
    //         { transform: next.toString() },
    //       ], {
    //         duration: 50,
    //         // easing: 'ease-out',
    //         fill: 'forwards',
    //         iterations: 1,
    //       })

    //       contentsAnim.onfinish = () => {
    //         contentsAnim.commitStyles()
    //         contentsAnim.cancel()
    //       }

    //       $.contentsMatrix = next

    //       // contents.style.transform = `translate(${popupRect.x}px,${popupRect.y}px)`
    //       // Object.assign(contents.style, popupRect.toStylePosition())
    //     }
    //   })
    // })

    // effect.task(({ popupRect: _ }) => {
    //   draw()
    // })

    effect(({ popupRect }) => {
      $.contentsMatrix = new DOMMatrix().translateSelf(popupRect.x, popupRect.y)
    })

    effect.raf.desync(({ placeArrow, popupRect: _ }) => {
      placeArrow()
    })

    $.arrowMatrixString = reduce.raf.desync(({ arrowMatrix }) => arrowMatrix.toString())

    $.contentsMatrixString = reduce.raf.desync(({ contentsMatrix }) => contentsMatrix.toString())

    // effect(({ animSettings, contents }) => {
    //   Object.assign(contents.style, {
    //     transitionDuration: animSettings.duration * 2, // * 10, // `transform ${animSettings.duration * 8}ms cubic-bezier(${animSettings.easing});`
    //     transitionTimingFunction: `cubic-bezier(${animSettings.easing})`,
    //   })
    // })

    effect(({ arrowEl, arrowMatrixString }) => {
      arrowEl.style.transform = arrowMatrixString
    })

    effect(({ contents, contentsMatrixString }) => {
      // contents.style.transition = `transform ${animSettings.duration * 8}ms cubic-bezier(${animSettings.easing});`

      // console.timeEnd('update')
      contents.style.transform = contentsMatrixString

      // $.contentsAnim = createKeyframeAnimation(
      //   animSettings,
      //   contents,
      //   () => [
      //     // { transform: contents.style.transform },
      //     { transform: contentsMatrixString },
      //   ],
      //   $.contentsAnim
      // )
    })
    // $.contentsAnim = reduce.throttle(25).first.last.next(({ animSettings }) =>
    //   createStepAnimation(animSettings, $.contentsAnim)
    // )

    // $.contentsAnimValues = reduce.raf(({ contentsAnim: { set }, popupRect }) => set({ pos: popupRect.pos }))

    // $.contentsAnimValues = reduce.raf.desync(({ contentsAnim: { t, from, to, update }, contentsAnimValues: _ }) =>
    //   update({ pos: from.pos.translate(to.pos.screen(from.pos).scale(t)) })
    // )

    // effect.raf.desync(({ contents, contentsAnimValues }) => {
    //   Object.assign(contents.style, contentsAnimValues.pos.toStylePosition())
    // })

    // $.viewMatrixString = reduce(({ viewMatrix }) => viewMatrix.toString())

    // effect.raf.desync(({ animSettings, view, viewMatrixString }) => {
    //   if (animSettings === SurfaceAnimSettings.Instant) {
    //     view.style.transform = viewMatrixString
    //   } else {
    //     $.anim = createKeyframeAnimation(animSettings, view, () => [
    //       { transform: view.style.transform },
    //       { transform: viewMatrixString },
    //     ], $.anim)
    //   }
    // })
    //
    // get positions and boundaries
    //

    $.updateTarget = reduce(({ box, target }) =>
      // queue.task(() =>
      mutating(() => {
        // console.time('update')
        $.boxRect = box.rect // ?? Rect.fromElement(box)
        $.targetRect = box.itemRectsMap.get(target) ?? Rect.fromElement(target)
        if (!$.targetRect) {
          console.warn('Target not found in box itemRectsMap', target)
          return
        }
        $.animSettings = box.animSettings
        // console.log('got', $.targetRect)

        // // const offset = Rect.fromElement(target.offsetParent as HTMLElement)
        // $.targetRect = Rect.fromElement(target) // .translateSelf(offset) // .setPosition(getElementOffset(target)).translateSelf($.boxRect.negate())
        if (box.matrix) {
          $.targetRect = $.targetRect.transform(box.matrix)
        }

        // const data = serialize(pick($, ['boxRect', 'targetRect', 'animSettings']))
        $.targetRect.translateSelf($.boxRect)
      })
      // )
    )

    const getViewport = () =>
      new Rect(
        document.scrollingElement!.scrollLeft,
        document.scrollingElement!.scrollTop,
        window.visualViewport.width,
        window.visualViewport.height
      )

    const updateViewport = queue.task(() =>
      mutate(() => {
        $.viewportRect = getViewport()
      })
    )

    updateViewport()

    effect(({ updateTarget }) => {
      updateTarget()
      updateViewport()
      return on(window).scroll.passive(() => {
        updateViewport()
      })
    })

    effect(({ box, updateTarget }) =>
      chain(
        on(box).resize(updateTarget),
        on(box).scroll(updateTarget)
      )
    )

    effect(({ box, scene, updateTarget }) =>
      onresize(
        box,
        queue.task(() => {
          updateTarget()
          updateViewport()
          scene.update()
        })
      )
    )
    effect(({ host, updateTarget }) => onresize(host, updateTarget))

    render(({ arrowInner }) => (
      <>
        <style>{style}</style>
        <div ref={ref.contents} part="contents">
          <div part="shadow"></div>
          <slot part="inner"></slot>
          <svg
            ref={ref.arrowEl}
            part="arrow"
            viewBox="-2 -2 17 22"
            preserveAspectRatio="none"
            width="100%"
            height="100%"
          >
            {arrowInner
              ? <path d="M 0 0 L 15 10 L 0 20 L 3 10 Z" />
              : <path d="M 0 0 L 15 10 L 0 20" />}
          </svg>
        </div>
      </>
    ))
  })
) {}
