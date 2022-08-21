import $ from 'sigl'

import { cheapRandomId } from 'everyday-utils'
import { Intersect, Matrix, Placement, Point, Rect } from 'sigl'

import { SurfaceElement, SurfaceState } from 'x-surface'
import { PopupScene } from './popup-scene'

export class Popup {
  static create(data: Partial<Popup>) {
    const popup = new Popup(data)
    popup.attach()
    popup.create()
    return popup
  }

  id = cheapRandomId()
  scene?: PopupScene

  mode?: 'worker' | 'local' = 'local'

  vel = new Point()
  rect!: Rect
  rectDest = new Rect()
  prevPos = new Point()

  placement!: Placement
  originalPlacement!: Placement
  center!: boolean

  contentsRect!: Rect
  destRect!: Rect

  $!: $.Context<Popup>
  context!: $.ContextClass<Popup>

  viewMatrix?: Matrix

  // physics

  place?: (placement: Placement) => Rect

  collisions = new Map<Popup, Point>()
  viewportIntersection: Intersect = Intersect.None
  exceedsViewport = false
  destExceedsViewport = false
  destWithinViewport = false

  surface?: SurfaceElement

  constructor(data: Partial<Popup> = {}) {
    Object.assign(this, data)
  }

  attach(this: Popup) {
    $.ContextClass.attach(this)
  }

  create(this: Popup) {
    const { $ } = this
    $.place = $.reduce(({ contentsRect, destRect }) => placement => contentsRect.place(destRect, placement))
    $.surface = $.fulfill(({ scene }) => fulfill => scene.$.effect(({ surface }) => fulfill(surface)))
    $.effect.raf(({ surface, scene, destRect: _ }) => {
      if (surface.state.is(SurfaceState.Overlay)) {
        scene?.runCollisions?.()
      }
    })
  }
}
