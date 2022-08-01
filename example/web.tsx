/** @jsxImportSource sigl */
import $ from 'sigl'

import { filterMap } from 'everyday-utils'
import { Rect } from 'geometrik'
import { SurfaceElement, SurfaceItemElement, SurfaceMoveElement, SurfaceResizeElement } from 'x-surface'
import { PopupElement, PopupSceneLocal } from '..'

interface ItemElement extends $.Element<ItemElement> {}
@$.element()
class ItemElement extends $(SurfaceItemElement) {
  SurfaceMove = $.element(SurfaceMoveElement)
  SurfaceResize = $.element(SurfaceResizeElement)

  @$.attr() label = $.String

  mounted($: ItemElement['$']) {
    $.render(({ host, surface, SurfaceMove, SurfaceResize }) => (
      <>
        <style>
          {/*css*/ `
          :host {
            box-sizing: border-box;
            border: 2px solid pink;
            display: block;
            position: absolute;
          }

          ${SurfaceMove} {
            background: #067;
            width: 100%;
            height: 20px;
            position: absolute;
          }

          ${SurfaceResize} {
            background: #ba2;
            position: absolute;
            right: 0;
            bottom: 0;
            width: 20px;
            height: 20px;
          }
          `}
        </style>
        <SurfaceMove surface={surface} dest={host} />
        <SurfaceResize surface={surface} dest={host} />
      </>
    ))
  }
}

interface SceneElement extends $.Element<SceneElement> {}
@$.element()
class SceneElement extends HTMLElement {
  Surface = $.element(SurfaceElement)
  Item = $.element(ItemElement)
  Popup = $.element(PopupElement)

  surface?: SurfaceElement
  popupScene = $(this).reduce(({ surface }) => new PopupSceneLocal(surface))

  items = new $.RefSet<ItemElement>([
    { rect: new Rect(0, 0, 100, 100), label: 'one' },
    { rect: new Rect(200, 0, 100, 100), label: 'two' },
  ])

  mounted($: SceneElement['$']) {
    const Popups = $.part(({ Popup, popupScene, surface, items }) =>
      filterMap([...items], item => item.ref.current)
        .map(el => (
          <Popup
            scene={popupScene}
            surface={surface}
            // placement="nwr"
            dest={el as unknown as SurfaceItemElement}
          >
            {el.label}
          </Popup>
        ))
    )

    $.render(({ Surface, Item, items }) => (
      <>
        <style>
          {/*css*/ `
          :host {
            display: block;
            width: 100%;
            height: 100%;
            position: fixed;
          }

          [part=popups] {
            position: absolute;
            z-index: 2;
            left: 0;
            top: 0;
            width: 100%;
          }`}
        </style>

        <Surface ref={$.ref.surface}>
          {items.map(item => <Item {...item} />)}
        </Surface>

        <div part="popups">
          <Popups />
        </div>
      </>
    ))
  }
}

const Scene = $.element(SceneElement)

$.render(<Scene />, document.body)
