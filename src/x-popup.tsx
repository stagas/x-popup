/** @jsxImportSource mixter/jsx */
import { Matrix, Placement, Rect } from 'geometrik'
import { isMobileAgent } from 'is-mobile-agent'
import { attrs, chain, mixter, on, props, shadow, state } from 'mixter'
import { jsx, refs } from 'mixter/jsx'
import { SurfaceElement } from 'x-surface'
import { Popup } from './popup'
import { PopupScene } from './popup-core'

const style = /*css*/ `
:host {
  position: absolute;
}
:host(:not([placed])) {
  visibility: hidden;
}
:host([placed]) {
  ${
  isMobileAgent
    ? 'transition: transform 400ms cubic-bezier(0, 0, 0.75, 1);'
    : 'transition: transform 100ms cubic-bezier(0, 0.25, 0.75, 1);'
}
}
[part=contents] {
  box-sizing: border-box;
  display: inline-flex;
  user-select: none;
}`

export class PopupElement extends mixter(
  HTMLElement,
  shadow(),
  attrs(
    class {
      placement: Placement = 'n'
      placed = false
      center = false
    }
  ),
  props(
    class {
      surface?: SurfaceElement
      scene?: PopupScene

      contents?: HTMLDivElement
      contentsRect?: Rect

      target?: HTMLElement
      targetRect?: Rect

      popup?: Popup
      rect?: Rect

      viewMatrix?: Matrix
      viewportRect?: Rect
    }
  ),
  state<PopupElement>(({ $, effect, reduce }) => {
    const { render } = jsx($)
    const { ref } = refs($)

    // place popup in scene

    effect(({ popup, scene }) => (
      scene.popups.add(popup), () => scene.popups.delete(popup)
    ))

    // read data from popup

    effect(({ popup }) =>
      popup.context.effect(({ rect }) => {
        $.rect = rect
      })
    )

    // write data to popup

    $.popup = reduce(({ viewMatrix, center, targetRect, contentsRect, placement }): Popup => {
      const data: Partial<Popup> = {
        center,
        contentsRect,
        // placement is set once from the element and then
        // handled entirely in the worker
        originalPlacement: placement,
        // we move the target rectangle to our (normal dom) screen space
        // because its dimensions are in surface space (zoomed/panned etc)
        targetRect: targetRect.transform(viewMatrix),
      }
      if ($.popup) {
        return Object.assign($.popup, data)
      } else return new Popup(data)
    })

    // read contents

    $.contentsRect = reduce(({ contents }): Rect => Rect.fromElement(contents))

    // read target

    $.targetRect = reduce(({ target }): Rect => Rect.fromElement(target))

    effect(({ surface, target: thisTarget }) => {
      const maybeGetTarget = ({
        detail: { target, rect },
      }: {
        detail: { target: HTMLElement; rect: Rect }
      }) => {
        if (target === thisTarget) {
          $.targetRect = rect.clone()
        }
      }
      return chain(
        on(surface).itemmove(maybeGetTarget),
        on(surface).itemmovestart(maybeGetTarget),
        on(surface).itemmoveend(maybeGetTarget),
        //
        on(surface).itemresize(maybeGetTarget),
        on(surface).itemresizestart(maybeGetTarget),
        on(surface).itemresizeend(maybeGetTarget)
      )
    })

    // read scene

    effect(({ scene }) =>
      scene.context.effect(({ viewMatrix, viewportRect }) => {
        $.viewMatrix = viewMatrix
        $.viewportRect = viewportRect
      })
    )

    // draw

    effect.raf.desync(({ host, rect, scene }) => {
      const p = rect.contain(scene.viewportRect)

      host.style.transform = `translate(${p.x}px, ${p.y}px)`
      // new Matrix()
      //   .translateSelf(p.x, p.y)
      //   .toString()

      if (!host.placed) {
        setTimeout(() => {
          host.placed = true
        })
      }
    })

    // initial draw in order to prevent animation
    // TODO: different animation? reveal pop zoom in or something

    render(() => (
      <>
        <style>{style}</style>
        <slot ref={ref.contents} part="contents"></slot>
      </>
    ))
  })
) {}
