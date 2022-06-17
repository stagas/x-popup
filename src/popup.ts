import { cheapRandomId } from 'everyday-utils'
import { Intersect, Matrix, Placement, Point, Rect } from 'geometrik'
import { Context, createContext } from 'mixter'
import { pick } from 'pick-omit'
import { core, PopupScene } from './popup-core'

// @ts-ignore
const isWorker = (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)

export class Popup {
  id = cheapRandomId()
  scene?: PopupScene

  rect!: Rect
  destRect = new Rect()
  prevRect = new Rect()

  placement!: Placement
  originalPlacement!: Placement
  center!: boolean

  contentsRect!: Rect
  targetRect!: Rect

  context!: Context<Popup>

  viewMatrix?: Matrix

  // physics

  place?: (placement: Placement) => Rect

  collisions = new Map<Popup, Point>()
  viewportIntersection: Intersect = Intersect.None
  exceedsViewport = false
  targetExceedsViewport = false
  targetWithinViewport = false

  constructor(data: Partial<Popup> = {}) {
    this.create(data)
  }

  toJSON() {
    return pick(
      this,
      isWorker
        ? core.pickFromWorker
        : core.pickFromLocal
    )
  }

  create(this: Popup, data: Partial<Popup>) {
    Object.assign(this, data)

    const $ = this.context = createContext<Popup>(this)
    const { reduce } = $

    $.place = reduce(({ contentsRect, targetRect }) => placement => contentsRect.place(targetRect, placement))
  }
}
