import { Alice } from 'alice-bob'
import { cheapRandomId } from 'everyday-utils'
import { Matrix, Placement, Point, Rect } from 'geometrik'
import { createContext } from 'mixter'
import type { EventHandler } from 'mixter'
import { pick } from 'pick-omit'
import { deserialize, serialize } from 'serialize-whatever'
import type { PopupElement } from './x-popup'
import type { PopupScene } from './x-popup-worker'

export class Popup {
  id = cheapRandomId()

  placement: Placement = 'nwr'
  contain = false
  arrowInner = false

  boxRect?: Rect
  innerRect?: Rect
  targetRect?: Rect
  popupRect?: Rect
  viewportRect?: Rect
  viewportInnerRect?: Rect

  prevPopupRect = new Rect()
  popupDest?: Point

  touchesInner = false
  touchesBorder = false
  touchesViewport = false

  insideBox = false
  insideInner = false
  insideViewport = false

  arrowRect?: Rect
  arrowMatrix = new Matrix()

  blocked: Set<Placement> = new Set()
  collisions: Map<Popup, Point> = new Map()

  placePopup?: (placement: Placement) => [Rect, Rect, Placement]

  scene?: PopupScene

  constructor(popup: Partial<Popup | PopupElement> = {}) {
    this.set(popup)
  }

  toJSON() {
    return pick(this, [
      'id',

      'popupRect',
      'popupDest',

      'arrowMatrix',
    ])
  }

  set(popup: Partial<Popup | PopupElement>) {
    return Object.assign(
      this,
      pick(popup, [
        'id',

        'placement',
        'contain',

        'boxRect',
        'targetRect',
        'viewportRect',

        'popupRect',
        'popupDest',

        'arrowRect',
        'arrowInner',
        'arrowMatrix',
      ])
    )
  }

  put(scene: PopupScene) {
    this.scene = scene

    const $ = createContext<Popup>(this)
    const { effect, reduce } = $

    $.viewportInnerRect = reduce(({ popupRect, viewportRect }) =>
      viewportRect
        .zoomLinear(popupRect.size.scale(2).negate())
    )

    effect(({ popupRect, boxRect, arrowRect, contain }) => {
      $.innerRect = contain
        ? boxRect.zoomLinear(popupRect.size.scale(2)).zoomLinear(arrowRect.size.negate().scaleLinear(0, 9)) // .zoomLinear($.popupRect.size) // 10, 10) // clone()
        : boxRect.zoomLinear(popupRect.size.scale(2))
    })

    $.placePopup = reduce(({ blocked, targetRect, scene, contain }) => ((placement: Placement) => {
      const { popupRect } = $
      if (!popupRect) return [new Rect(), new Rect(), placement]

      const { popups } = scene

      let firstPos!: Rect
      let p!: Rect

      const run = (): void => {
        p = popupRect.place(targetRect, placement)

        firstPos ??= p

        for (const a of popups.values()) {
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
    const placementChoices: Placement[] = ['nwr', 's', 'w', 'e'] // , 'nw', 'ne', 'sw', 'se']

    effect.raf.desync(({ scene, placePopup, innerRect, targetRect, blocked, placement }) => {
      const { popupRect } = $
      if (!popupRect) return

      // const prevPopupDest = $.popupDest?.clone()

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
        // $.placement = placement
      }

      // destination
      // without this we go into infinite loop
      // if (prevPopupDest && prevPopupDest.screen(p.pos).absoluteSum() < 0.00000029) return

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
      const arrowSize = arrowRect.size.scale(3, 2.6)
      const popupOuter = popupRect.zoomLinear(arrowSize.negate()) // .scaleLinear(popupSize.negate()))

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
        const next = new Matrix()
          .translateSelf(arrowRect.x, arrowRect.y)
          .translateSelf(arrowRect.width / 2, arrowRect.height / 2)
          .rotateSelf(rotation as number)
          .translateSelf(-arrowRect.width / 2, -arrowRect.height / 2)
        return next
      } else {
        return $.arrowMatrix
      }
    })

    effect.raf.desync(({ scene, popupRect: _, arrowMatrix: __ }) => {
      scene.core?.updatePopup(this)
    })

    return this
  }
}

export class PopupSceneCore extends EventTarget {
  declare onupdatepopup?: EventHandler<PopupSceneCore, CustomEvent<Popup>>

  async updatePopup(popup: Popup) {
    this.dispatchEvent(new CustomEvent('updatepopup', { detail: popup }))
  }
}

const deserializableClasses = [
  Matrix,
  Popup,
  Rect,
  Point,
]

export const agentOptions = {
  debug: false,
  serializer: (data: any) => serialize(data),
  deserializer: (data: any) => deserialize(data, deserializableClasses),
}

export const createPopupScene = () => {
  // @ts-ignore
  const workerUrl = new URL('./x-popup-worker.js', import.meta.url).href
  const worker = new Worker(workerUrl, { type: 'module' })

  const core = new PopupSceneCore()
  const [coreAgent, scene] = new Alice<PopupSceneCore, PopupScene>(
    data => void worker.postMessage(data),
    core
  ).agents(agentOptions)

  worker.onmessage = ({ data }) => coreAgent.receive(data)

  scene.core = core

  return scene
}
