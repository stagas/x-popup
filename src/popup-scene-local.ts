import $ from 'sigl'

import { Matrix, Placement, Point, Rect } from 'geometrik'
import { SyncedSet } from 'synced-set'
import { SurfaceElement } from 'x-surface'

import { Popup } from './popup'
import { core, PopupScene } from './popup-core'

const getViewportRect = () =>
  new Rect(
    document.scrollingElement!.scrollLeft,
    document.scrollingElement!.scrollTop,
    window.visualViewport.width,
    window.visualViewport.height
  )

// TODO: @$.reactive()
export class PopupSceneLocal implements PopupScene {
  popups!: SyncedSet<Popup, {
    destRect: Rect
    contentsRectSize: Point
    center: boolean
    originalPlacement: Placement
  }>
  remote!: MessagePort

  viewportRect = getViewportRect()
  viewMatrix = new Matrix()

  // @ts-ignore
  $!: $.Context<PopupSceneLocal> & typeof $
  context!: $.ContextClass<PopupSceneLocal>

  constructor(public surface: SurfaceElement) {
    $.ContextClass.attach(this as any, $)
    this.create()
  }

  destroy() {
    this.context.cleanup()
  }

  create(this: PopupSceneLocal) {
    // @ts-ignore
    const workerUrl = new URL('./popup-scene-worker.js' + '?' + location.hash.slice(1), import.meta.url).href

    //!? 'worker url', workerUrl

    const { $ } = this

    // start worker remote
    $.remote = $.reduce(() =>
      new Worker(
        workerUrl,
        { type: 'module' }
      ) as unknown as MessagePort
    )

    $.effect(({ remote }) =>
      () => {
        ;(remote as unknown as Worker).terminate()
      }
    )

    // popups synced set

    $.popups = $.reduce(({ remote }) =>
      new SyncedSet({
        send: $.queue.throttle(10).last.next((payload, cb) => {
          remote.postMessage({ popups: core.serialize(payload) })
          cb()
        }),
        pick: core.pickFromWorker,
        reducer: popup => ({
          destRect: popup.destRect.clone(),
          contentsRectSize: popup.contentsRect.size,
          center: popup.center,
          originalPlacement: popup.originalPlacement,
        }),
        equal: (prev, next) =>
          prev.destRect.equals(next.destRect)
          && prev.contentsRectSize.equals(next.contentsRectSize)
          && prev.center === next.center
          && prev.originalPlacement === next.originalPlacement,
      })
    )

    $.effect(({ popups }) =>
      $.chain(
        $.on(popups).add(({ detail: popup }) => {
          popup.scene = this as PopupScene
        })
      )
    )

    // receive data from worker

    $.effect(({ popups, remote }) => {
      remote.onmessage = ({ data }) => {
        if (data.popups) {
          popups.receive(core.deserialize(data.popups))
        }
        // solve local
      }
    })

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

    // send data to worker

    $.effect(({ remote, viewportRect }) => {
      remote.postMessage(core.serialize({ viewportRect }))
    })

    $.effect(({ remote, viewMatrix }) => {
      remote.postMessage(core.serialize({ viewMatrix }))
    })

    //
  }
}
