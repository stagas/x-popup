import { Matrix, Placement, Point, Rect } from 'geometrik'
import { chain, Context, createContext, on, onresize, queue } from 'mixter'
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

export class PopupSceneLocal implements PopupScene {
  popups!: SyncedSet<Popup, {
    targetRect: Rect
    contentsRectSize: Point
    center: boolean
    originalPlacement: Placement
  }>
  remote!: MessagePort

  viewportRect = getViewportRect()
  viewMatrix = new Matrix()

  // @ts-ignore
  context!: Context<PopupSceneLocal>

  constructor(public surface: SurfaceElement) {
    this.create()
  }

  create(this: PopupSceneLocal) {
    // @ts-ignore
    const workerUrl = new URL('./popup-scene-worker.js', import.meta.url).href

    const $ = this.context = createContext<PopupSceneLocal>(this)
    const { effect, reduce } = $

    // start worker remote

    $.remote = reduce(() =>
      new Worker(
        workerUrl,
        { type: 'module' }
      ) as unknown as MessagePort
    )

    // popups synced set

    $.popups = reduce(({ remote }) =>
      new SyncedSet({
        send: queue.raf((payload, cb) => {
          remote.postMessage({ popups: core.serialize(payload) })
          cb()
        }),
        pick: core.pickFromWorker,
        reducer: popup => ({
          targetRect: popup.targetRect.clone(),
          contentsRectSize: popup.contentsRect.size,
          center: popup.center,
          originalPlacement: popup.originalPlacement,
        }),
        equal: (prev, next) =>
          prev.targetRect.equals(next.targetRect)
          && prev.contentsRectSize.equals(next.contentsRectSize)
          && prev.center === next.center
          && prev.originalPlacement === next.originalPlacement,
      })
    )

    effect(({ popups }) =>
      chain(
        on(popups).add(({ detail: popup }) => {
          popup.scene = this as PopupScene
          // popup.context.effect.once(({ place, placement }) => {
          //   popup.rect = popup.destRect = popup.prevRect = place(placement)
          // })
        })
        // on(popups).delete(popup => {
        //   //
        // })
      )
    )

    // receive data from worker

    effect(({ popups, remote }) => {
      remote.onmessage = ({ data }) => {
        if (data.popups) {
          popups.receive(core.deserialize(data.popups))
        }
        // solve local
      }
    })

    // read surface

    effect(({ surface }) =>
      surface.context.effect(({ viewMatrix }) => {
        $.viewMatrix = new Matrix([...viewMatrix.toFloat64Array()])
      })
    )

    effect(({ surface }) =>
      onresize(surface, () => {
        $.viewportRect = getViewportRect()
      })
    )

    // send data to worker

    effect(({ remote, viewportRect }) => {
      remote.postMessage(core.serialize({ viewportRect }))
    })

    effect(({ remote, viewMatrix }) => {
      remote.postMessage(core.serialize({ viewMatrix }))
    })

    //
  }
}
