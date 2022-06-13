/** @jsxImportSource mixter/jsx */
import { AnimSettings } from 'animatrix'
import { Matrix, Placement, Point, Rect } from 'geometrik'
import { isMobileAgent } from 'is-mobile-agent'
import { attrs, chain, mixter, on, onresize, props, queue, shadow, state } from 'mixter'
import { jsx, refs } from 'mixter/jsx'
import { pick } from 'pick-omit'
import { Popup } from './x-popup-core'
import type { PopupScene } from './x-popup-worker'

export type { Popup, PopupScene }
export type { Agent, Alice, AliceBob, Bob, Payload } from 'alice-bob'

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
  transition: transform 500ms cubic-bezier(0, 0.55, 0.25, 1);
}

:host([arrowinner]) [part=arrow] {
  width: 6px;
  height: 10px;
  fill: #fff;
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

:host(:not([visible])) [part=contents] {
  transition: none;
}

:host([visible]) [part=contents] {
${
  isMobileAgent
    ? 'transition: transform 250ms cubic-bezier(0, 0.35, 0.85, 1);'
    : 'transition: transform 200ms cubic-bezier(0, 0.55, 0.25, 1);'
}
}
`

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
        matrix: Matrix
        itemRectsMap: WeakMap<HTMLElement, Rect>
        animSettings: AnimSettings
      }
      boxRect?: Rect
      viewportRect?: Rect

      target?: HTMLElement
      targetRect?: Rect

      popup?: Popup | null
      popupRect?: Rect
      popupDest?: Point

      contents?: HTMLSlotElement
      contentsMatrix = new Matrix()
      contentsMatrixString?: string

      arrowEl?: SVGSVGElement
      arrowRect?: Rect
      arrowMatrix = new Matrix()
      arrowMatrixString?: string

      draw?: () => void
      updateBox?: () => void
      updateTarget?: () => void
      getPosition?: () => Point
      placeArrow?: () => number | boolean
      placePopup?: (placement: Placement) => [Rect, Rect, Placement]

      updatePopup?: (popup: Popup) => void
    }
  ),
  state<PopupElement>(({ $, atomic, effect, mutate, mutating, reduce }) => {
    const { render } = jsx($)
    const { ref } = refs($)

    $.arrowRect = reduce(({ arrowInner }) =>
      arrowInner
        ? new Rect(0, 0, 6, 10)
        : new Rect(0, 0, 15, 20)
    )

    $.updatePopup = reduce(({ popup }) =>
      queue.raf(atomic(other => {
        if (!other.popupRect!.equals(popup.popupRect!)) {
          popup.popupRect = other.popupRect!

          Object.assign(
            $,
            pick(other, [
              'popupRect',
              'popupDest',
              'arrowMatrix',
            ])
          )
        }
      }))
    )

    effect.once(({ host, scene, popupRect: _ }) => {
      const popup = $.popup = new Popup()
      host.id = popup.id
      popup.set(host)
      scene.add(popup)
      return chain(
        on(scene.core).updatepopup(({ detail: other }) => {
          if (other.id === popup.id) {
            $.updatePopup?.(other)
          }
        }),
        async () => {
          scene.delete(popup)
          $.popup = null
        }
      )
    })

    effect(({ scene, contents }) =>
      onresize(contents, ([entry]) => {
        const box = entry.borderBoxSize[0]

        // TODO: this is too fragile/wrong
        if ($.popupRect) {
          $.popupRect.width = box.inlineSize
          $.popupRect.height = box.blockSize
          $.popupRect = $.popupRect.clone()

          scene.updatePopup(
            $.popup!,
            pick($, ['popupRect']) as Popup
          )
        } else {
          $.popupRect = new Rect(0, 0, box.inlineSize, box.blockSize)
        }
      })
    )

    effect.debounce(50).desync(({ arrowEl, contain, popupRect, popupDest }) => {
      arrowEl.style.opacity = !contain && popupRect.pos.roundSelf().equals(popupDest.pos.roundSelf())
        ? '0'
        : '1.0'
    })

    effect(({ popupRect }) => {
      $.contentsMatrix = new Matrix().translateSelf(popupRect.x, popupRect.y)
    })

    $.arrowMatrixString = reduce.raf.desync(({ arrowMatrix }) => arrowMatrix.toString())

    $.contentsMatrixString = reduce.raf.desync(({ contentsMatrix }) => contentsMatrix.toString())

    effect(({ arrowEl, arrowMatrixString }) => {
      arrowEl.style.transform = arrowMatrixString
    })

    effect(({ contents, contentsMatrixString }) => {
      contents.style.transform = contentsMatrixString
    })

    //
    // get positions and boundaries
    //

    $.updateTarget = reduce(({ box, scene, popup, target }) =>
      mutating(() => {
        $.boxRect = box.rect // ?? Rect.fromElement(box)
        $.targetRect = box.itemRectsMap.get(target) ?? Rect.fromElement(target)
        if (!$.targetRect) {
          console.warn('Target not found in box itemRectsMap', target)
          return
        }
        $.animSettings = box.animSettings

        if (box.matrix) {
          $.targetRect = $.targetRect.transform(box.matrix)
        }

        $.targetRect.translateSelf($.boxRect)

        scene.updatePopup(
          popup,
          pick($, [
            'boxRect',
            'targetRect',
            'viewportRect',
            'arrowRect',
            'arrowInner',
          ]) as Popup
        )
      })
    )

    // TODO: viewport should go to the scene

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
