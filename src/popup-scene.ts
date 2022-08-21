import $ from 'sigl'

import { Matrix, Rect } from 'sigl'
import { SurfaceElement } from 'x-surface'

import { Popup } from './popup'

const getViewportRect = () =>
  new Rect(
    document.scrollingElement!.scrollLeft,
    document.scrollingElement!.scrollTop,
    window.visualViewport.width,
    window.visualViewport.height
  )

// TODO: @$.reactive()
export class PopupScene {
  viewportRect = getViewportRect()
  viewMatrix = new Matrix()
  runCollisions?: () => void

  // @ts-ignore
  $!: $.Context<PopupScene> & typeof $
  context!: $.ContextClass<PopupScene>

  popups = new Set<Popup>()

  constructor(public surface: SurfaceElement) {
    $.ContextClass.attach(this as any, $)
    this.create()
  }

  destroy() {
    this.context.cleanup()
  }

  create(this: PopupScene) {
    const { $ } = this

    // read surface

    $.effect(({ surface }) =>
      surface.$.effect(({ viewMatrix }) => {
        $.viewMatrix = new Matrix([...viewMatrix.toFloat64Array()])
      })
    )

    $.effect(({ surface }) =>
      $.observe.resize(surface, () => {
        $.viewportRect = Rect.fromElement(surface) //.getBoundingClientRect()) //getViewportRect()
      })
    )

    $.runCollisions = $.reduce(({ popups }) => (() => {
      for (const popup of popups) {
        popup.rect = popup.place!(popup.placement ?? popup.originalPlacement)
          .containSelf($.viewportRect)
      }

      for (let i = 0; i < 10; i++) {
        for (const a of popups) {
          for (const b of popups) {
            if (a === b) continue

            if (a.rect.intersectsRect(b.rect)) {
              const c = a.rect.collisionResponse(b.rect)
              a.rect.translateSelf(c.scale(0.5)).containSelf($.viewportRect)
              b.rect.translateSelf(c.scale(-0.5)).containSelf($.viewportRect)
            }
          }

          a.rect = a.rect.clone()
        }
      }
    }))

    $.effect(({ surface, runCollisions }) =>
      surface.$.effect(({ viewStyleTransform: _ }) => {
        runCollisions()
      })
    )
  }
}
