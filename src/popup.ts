import $ from 'sigl/worker'

import { cheapRandomId, pick } from 'everyday-utils'
import { Intersect, Matrix, Placement, Point, Rect } from 'geometrik'

import { core, PopupScene } from './popup-core'

// @ts-ignore
const isWorker = (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)

export class Popup {
  static create(data: Partial<Popup>) {
    const popup = new Popup(data)
    popup.attach()
    popup.create()
    return popup
  }

  id = cheapRandomId()
  scene?: PopupScene

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

  constructor(data: Partial<Popup> = {}) {
    Object.assign(this, data)
  }

  toJSON() {
    return pick(
      this,
      isWorker
        ? core.pickFromWorker
        : core.pickFromLocal
    )
  }

  attach(this: Popup) {
    $.ContextClass.attach(this)
  }

  create(this: Popup) {
    const { $ } = this
    $.place = $.reduce(({ contentsRect, destRect }) => placement => contentsRect.place(destRect, placement))
  }
}
