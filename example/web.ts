import { Point } from 'geometrik'
import { getRelativeMouseFromEvent } from 'relative-mouse'
import { SurfaceElement, SurfaceMoveElement, SurfaceResizeElement } from 'x-surface'
import { createPopupScene, PopupElement } from '..'

const dpr = window.devicePixelRatio

customElements.define('x-surface', SurfaceElement)
customElements.define('x-surface-move', SurfaceMoveElement)
customElements.define('x-surface-resize', SurfaceResizeElement)

customElements.define('x-popup', PopupElement)
document.body.innerHTML = /*html*/ `
<style>
:root {
  --dpr: ${dpr};
  --1px: calc(1px / var(--dpr));
}
html, body {
  width: 100%;
  height: 100%;
  touch-action: none;
  overflow: hidden;
}

body {
  box-sizing: border-box;
}

x-surface {
  display: inline-flex;
  resize: both;
  box-sizing: border-box;
}
x-surface div {
  position: relative;
  box-sizing: border-box;
  display: inline-flex;
  border: 2px solid #aaa;
  width: 70px;
  height: 30px;
  z-index: 1;
  overflow: hidden;
}
x-surface-move {
  display: inline-flex;
  box-sizing: border-box;
  place-items: center;
  justify-content: center;
  background: #04a;
  width: 30px;
  cursor: grab;
}
x-surface-resize {
  position: absolute;
  display: inline-flex;
  box-sizing: border-box;
  place-items: center;
  z-index: 1;
  background: #04a;
  width: 40px;
  height: 40px;
  transform: rotate(45deg);
  right: -20px;
  bottom: -20px;
  cursor: nwse-resize;
}
.target {
  position: absolute;
  left: 50px;
  top: 50px;
  width: 20px;
  height: 20px;
}
#inner {
  position: absolute;
  left: 0;
  top: 0;
}
x-popup::part(contents) {
  box-sizing: border-box;
  white-space: pre;
  font-family: monospace;
}
x-popup.label::part(contents) {
  border: 1px solid #444;
  background: #000;
  padding: 10px 12px;
  cursor: pointer;
}
x-popup.label:hover::part(contents) {
  filter: brightness(1.2) contrast(0.9);
}
x-popup.contextmenu::part(arrow) {
  z-index: 10;
}
x-popup.contextmenu::part(contents) {
  padding: 12px;
  border-color: #fff;
}
.popups {
  position: absolute;
  left: 0;
  top: 0;
}
.menubutton {
  position: absolute;
  left: 0;
  top: 0;
  background: red;
  width: 30px;
  height: 30px;
}
.menu {
  position: relative;
  display: inline-flex;
  padding: 0px;
  box-sizing: border-box;
  background: #000;
  box-shadow: 4px 4px rgba(0,0,0,.3);
}
.menu-inner {
  position: relative;
  display: inline-flex;
  border: 1px solid #fff;
  margin: 14.5px;
  padding: 6px 0px;
  flex-flow: column nowrap;
  z-index: 2;
}

.menu button {
  background: #000;
  color: #fff;
  padding: 3px 8.5px;
  font-size: 9.5pt;
  font-family: monospace;
  border: none;
}
.menu button:hover {
  color: #000;
  background: #fff;
}
.contextmenu-target {
  position: absolute;
  width: 1px;
  height: 1px;
  border: none;
  background: transparent;
}
</style>

<x-surface id="surface">
<div id="tl" class="target tl" data-x="0" data-y="0" data-width="160" data-height="160"><div class="target menubutton">@</div><x-surface-move>=</x-surface-move><x-surface-resize>:</x-surface-resize>hello</div>
<div id="tr" class="target tr" data-x="0" data-y="-160" data-width="160" data-height="160"><x-surface-move>=</x-surface-move><x-surface-resize>:</x-surface-resize>world</div>
<div id="br" class="target br" data-x="160" data-y="0" data-width="160" data-height="160"><x-surface-move>=</x-surface-move><x-surface-resize>:</x-surface-resize>world</div>
<div id="bl" class="target bl" data-x="160" data-y="-160" data-width="160" data-height="160"><x-surface-move>=</x-surface-move><x-surface-resize>:</x-surface-resize>world</div>
<div id="c" class="target c" data-x="320" data-y="-80" data-width="160" data-height="160"><x-surface-move>=</x-surface-move><x-surface-resize>:</x-surface-resize>world</div>
</x-surface>

<div class="popups" onwheel="surface.dispatchEvent(new WheelEvent('wheel', event))">
<x-popup class="tl label" arrowinner placement="n" visible onclick="surface.centerItem(tl)">bass</x-popup>
<x-popup class="tr label" arrowinner placement="n" visible onclick="surface.centerItem(tr)">kick</x-popup>
<x-popup class="br label" arrowinner placement="n" visible onclick="surface.centerItem(br)">filter</x-popup>
<x-popup class="bl label" arrowinner placement="n" visible onclick="surface.centerItem(bl)">synth</x-popup>
<x-popup class="c label" arrowinner placement="n" visible onclick="surface.centerItem(c)">output</x-popup>
<x-popup class="m popup-menu" placement="s" visible>
  <div class="menu">
    <button>menu</button>
    <button>with</button>
    <button>selections</button>
  </div>
</x-popup>
</div>
`

// fixDpr()
// Dynamic write style
// docEl.firstElementChild.appendChild(fontEl);
// fontEl.innerHTML = 'html{font-size:' + rem + 'px!important;}';

const popupsDiv = document.querySelector('.popups') as HTMLDivElement
const labelScene = createPopupScene()
const menuScene = createPopupScene()
const surface = document.querySelector(`x-surface`) as SurfaceElement
for (const pos of 'tl tr br bl c'.split(' ')) {
  try {
    const popup = document.querySelector(`x-popup.${pos}`) as PopupElement
    popup.scene = labelScene
    popup.box = surface
    popup.target = document.querySelector(`.target.${pos}`) as HTMLElement
  } catch {}
}

document.body.oncontextmenu = e => {
  e.preventDefault()
}

let cp: PopupElement
let cpDiv: HTMLDivElement
const cpRemove = () => {
  if (cpDiv) {
    setTimeout(x => x.remove(), 50, cpDiv)
  }
  if (cp) {
    setTimeout(x => x.remove(), 50, cp)
  }
  window.removeEventListener('pointerup', cpRemove, { capture: true })
}
const putMenu = (pos: Point) => {
  cpRemove()

  const div = cpDiv = document.createElement('div')
  // console.log(pos, other)
  div.classList.add('contextmenu-target')
  // const w = (20 / surface.matrix!.a)
  // const h = (20 / surface.matrix!.d)
  // const w = (20 / surface.matrix!.a)
  // const h = (20 / surface.matrix!.d)
  // div.dataset.x = '' + (pos.x - 10 / surface.matrix!.a)
  // div.dataset.y = '' + (pos.y - 10 / surface.matrix!.d)
  // div.dataset.width = '' + w
  // div.dataset.height = '' + h
  const w = 2 // Math.max(2, 5 / surface.matrix!.a)
  const h = 2 // Math.max(2, 5 / surface.matrix!.d)
  // const w = Math.max(2, 20 / surface.matrix!.a)
  // const h = Math.max(2, 20 / surface.matrix!.d)

  div.dataset.x = '' + Math.round(pos.x - (surface.matrix!.a)) // - 0.5 * surface.matrix!.a)
  div.dataset.y = '' + Math.round(pos.y - (surface.matrix!.d)) // + 0 / surface.matrix!.d)
  div.dataset.width = '' + w
  div.dataset.height = '' + h
  // console.log(div.dataset)
  div.style.left = pos.x + 'px'
  div.style.top = pos.y + 'px'
  surface.appendChild(div)

  cp = new PopupElement()
  popupsDiv.appendChild(cp)
  cp.classList.add('contextmenu')
  cp.placement = 'w'
  cp.contain = true
  cp.innerHTML = /*html*/ `
    <div class="menu">
      <div class="menu-inner">
        <button>menu</button>
        <button>with</button>
        <button>selections</button>
      </div>
    </div>
  `

  cp.scene = menuScene // createPopupScene()
  cp.box = surface
  cp.target = div
  // setTimeout(() => {
  cp.visible = false
  // }, 2000)

  window.addEventListener('pointerup', () => {
    window.addEventListener('pointerup', cpRemove, { once: true, capture: true })
  }, { once: true, capture: true })
}

popupsDiv.oncontextmenu = surface.oncontextmenu = e => {
  e.preventDefault()
  e.stopPropagation()
  // const offset = getElementOffset(surface)
  // const pos = e.new Rect(getRelativeMouseFromEvent(surface, e)).transformSelf(surface.matrix) // { x: e.offsetX, y: e.offsetY }
  const pos = new Point(getRelativeMouseFromEvent(surface, e)).transformSelf(surface.matrix!.inverse()) // { x: e.offsetX, y: e.offsetY } // getRelativeMouseFromEvent(surface, e) // { x: e.offset, y: e.pageY }

  putMenu(pos)
}

{
  const popup = document.querySelector(`x-popup.m`) as PopupElement
  popup.visible = false
  // popup.scene = scene
  // popup.scene = null menuScene
  popup.box = document.querySelector(`x-surface`) as any
  popup.target = document.querySelector(`.target.menubutton`) as HTMLElement
}

setTimeout(() => {
  putMenu(new Point(100, -50))
}, 100)

// setTimeout(() => {
//   const s = document.querySelector('x-surface') as SurfaceElement // .scrollTo(window.visualViewport.width + 650, window.visualViewport.height + 270)
//   s.matrix!.e = 840
//   s.matrix!.f = 850
//   s.matrix = new DOMMatrix(s.matrix!)
// }, 100)
