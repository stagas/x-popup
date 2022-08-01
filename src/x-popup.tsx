/** @jsxImportSource sigl */
import $ from 'sigl'

import type { ValuesOf } from 'sigl'
import { Matrix, Rect } from 'sigl'
import { SurfaceElement, SurfaceItemElement, SurfaceState } from 'x-surface'

import type { Placement } from 'sigl'
import { Popup } from './popup'
import type { PopupSceneLocal } from './popup-scene-local'
import type { PopupSceneWorker } from './popup-scene-worker'

// ${
//   Object.entries(SurfaceAnimSettings).map(([name, { duration, easing }]) => /*css*/ `
//     :host([placed][transition=${name}]:not([rigid])) {
//       transition:
//         transform ${duration - 20}ms cubic-bezier(${easing}),
//         opacity 200ms ease-out;
//     }
//   `).join('')
// }

const style = /*css*/ `
:host {
  position: absolute;
  transform: matrix(1,0,0,1,0,0);
  -webkit-tap-highlight-color: transparent;
}
/* :host([rigid]), */
:host(:not(:focus)) {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  outline: none !important;
}
/* :host:focus {
  outline: none !important;
} */
:host(:not([placed])) {
  opacity: 0;
}
:host(:not([placed]):not([rigid])) {
  transition: opacity 200ms ease-out;
}
:host([placed]:not([rigid])) {
  transition:
    transform 150ms ease-out,
    opacity 200ms ease-out;
}
:host([placed][rigid]) {
  transition:
    transform 150ms ease-out;
}
:host(:not([placed]):not([rigid])) [part=contents] {
  transform: scale(0.1, 0.9) translate(-15px, 7px);
}
[part=contents] {
  /* transform-origin: 10% 50%;
  transition: transform 350ms cubic-bezier(0.55,0,0.4,1.0); */
  box-sizing: border-box;
  display: inline-flex;
}
:host(:not([rigid])) [part=contents] {
  transform-origin: 10% 60%;
  transition: transform 300ms cubic-bezier(0.15,0,0.05,1.0);
}
`

export interface PopupElement extends $.Element<PopupElement> {}

@$.element()
export class PopupElement extends HTMLElement {
  @$.attr() placement: Placement = 'n'
  @$.attr() placed = false
  @$.attr() center = false
  @$.attr() rigid = false
  @$.attr() transition: ValuesOf<typeof SurfaceState> = SurfaceState.Idle

  surface?: SurfaceElement
  scene?: PopupSceneLocal | PopupSceneWorker

  contents?: HTMLDivElement
  contentsRect?: Rect

  dest?: SurfaceItemElement
  destRect?: Rect

  popup?: Popup
  rect?: Rect

  viewMatrix?: Matrix
  viewportRect?: Rect

  hostMatrixString?: string
  setHostStyleTransform?: (matrixString: string) => void

  mounted($: PopupElement['$']) {
    $.effect(({ host }) => {
      host.tabIndex = 0
    })

    // place popup in scene
    $.effect(({ popup, scene }) => (
      scene.popups.add(popup), () => scene.popups.delete(popup)
    ))

    // read data from popup
    $.rect = $.fulfill(({ popup }) => (
      fulfill => popup.$.effect(({ rect }) => fulfill(rect))
    ))

    // write data to popup

    $.popup = $.reduce(({ viewMatrix, center, destRect, contentsRect, placement }): Popup => {
      const data: Partial<Popup> = {
        center,
        contentsRect,
        // placement is set once from the element and then
        // handled entirely in the worker
        // placement: placement,
        originalPlacement: placement,
        // we move the dest rectangle to our (normal dom) screen space
        // because its dimensions are in surface space (zoomed/panned etc)
        destRect: destRect.transform(viewMatrix),
      }
      //!? 'data', data
      if ($.popup) {
        return Object.assign($.popup, data)
      } else return Popup.create(data)
    })

    // read contents

    $.contentsRect = $.fulfill(({ contents }) => (
      fulfill => (
        fulfill(Rect.fromElement(contents)), //
          $.observe.resize(contents, () => fulfill(Rect.fromElement(contents)))
      )
    ))

    // read dest

    $.destRect = $.fulfill(({ dest }) => (
      fulfill => dest.$.effect(({ rect }) => fulfill(rect))
    ))

    // read surface

    $.effect(({ surface }) =>
      surface.$.effect(({ transition }) => {
        //!? 'transition', transition.current
        $.transition = transition.current
      })
    )

    // read scene

    $.effect(({ scene }) =>
      scene.$.effect(({ viewMatrix, viewportRect }) => {
        $.viewMatrix = viewMatrix
        $.viewportRect = viewportRect
      })
    )

    // draw

    $.hostMatrixString = $.reduce(({ rect, scene }) => {
      const p: Rect = rect.contain(scene.viewportRect)
      return new Matrix()
        .translateSelf(p.x, p.y)
        .toString()
    })

    if ($.isMobile) {
      $.effect.throttle(50).first.last.next(({ transition, hostMatrixString, setHostStyleTransform }) => {
        if (transition === SurfaceState.Pinching) return
        setHostStyleTransform(hostMatrixString)
      })
      $.effect.throttle(100).last.next(({ transition, hostMatrixString, setHostStyleTransform }) => {
        if (transition !== SurfaceState.Pinching) return
        setHostStyleTransform(hostMatrixString)
      })
    } else {
      $.effect.throttle(33.333).last.next(
        ({ transition, hostMatrixString, setHostStyleTransform }) => {
          if (transition === SurfaceState.Wheeling) return
          setHostStyleTransform(hostMatrixString)
        }
      )
      $.effect.throttle(33.333).last.next(({ transition, hostMatrixString, setHostStyleTransform }) => {
        if (transition !== SurfaceState.Wheeling) return
        setHostStyleTransform(hostMatrixString)
      })
    }

    $.setHostStyleTransform = $.reduce(({ host }) =>
      $.queue.raf(matrixString => {
        host.style.transform = matrixString

        // avoid flickering/animations at initial draw
        if (!host.placed) {
          setTimeout(() => {
            host.placed = true
          }, 100)
        }
      })
    )

    $.render(() => (
      <>
        <style>{style}</style>
        <slot ref={$.ref.contents} part="contents"></slot>
      </>
    ))
  }
}
