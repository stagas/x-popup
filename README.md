<h1>
x-popup <a href="https://npmjs.org/package/x-popup"><img src="https://img.shields.io/badge/npm-v1.1.0-F00.svg?colorA=000"/></a> <a href="src"><img src="https://img.shields.io/badge/loc-260-FFF.svg?colorA=000"/></a> <a href="https://cdn.jsdelivr.net/npm/x-popup@1.1.0/dist/x-popup.min.js"><img src="https://img.shields.io/badge/brotli-22.8K-333.svg?colorA=000"/></a> <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-F0B.svg?colorA=000"/></a>
</h1>

<p></p>

Popup Web Component used for tooltips and context menus

<h4>
<table><tr><td title="Triple click to select and copy paste">
<code>npm i x-popup </code>
</td><td title="Triple click to select and copy paste">
<code>pnpm add x-popup </code>
</td><td title="Triple click to select and copy paste">
<code>yarn add x-popup</code>
</td></tr></table>
</h4>

## Examples

<details id="example$web" title="web" open><summary><span><a href="#example$web">#</a></span>  <code><strong>web</strong></code></summary>  <ul>    <details id="source$web" title="web source code" ><summary><span><a href="#source$web">#</a></span>  <code><strong>view source</strong></code></summary>  <a href="example/web.tsx">example/web.tsx</a>  <p>

```tsx
/** @jsxImportSource sigl */
import $ from 'sigl'

import { filterMap } from 'everyday-utils'
import { Rect } from 'sigl'
import { SurfaceElement, SurfaceItemElement, SurfaceMoveElement, SurfaceResizeElement } from 'x-surface'
import { PopupElement, PopupScene } from 'x-popup'

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
  popupScene = $(this).reduce(({ surface }) => new PopupScene(surface))

  items = new $.RefSet<ItemElement>([
    { rect: new Rect(0, 0, 100, 100), label: 'one' },
    { rect: new Rect(200, 0, 100, 100), label: 'two' },
  ])

  mounted($: SceneElement['$']) {
    const Popups = $.part(({ Popup, popupScene, surface, items }) =>
      filterMap([x-popup.items], item => item.ref.current)
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
          {items.map(item => <Item {x-popup.item} />)}
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
```

</p>
</details></ul></details>

## API

<p>  <details id="PopupElement$42" title="Class" open><summary><span><a href="#PopupElement$42">#</a></span>  <code><strong>PopupElement</strong></code>    </summary>  <a href="src/x-popup.tsx#L70">src/x-popup.tsx#L70</a>  <ul>        <p>  <details id="constructor$43" title="Constructor" ><summary><span><a href="#constructor$43">#</a></span>  <code><strong>constructor</strong></code><em>()</em>    </summary>  <a href="node_modules/typescript/lib/lib.dom.d.ts#L6370">node_modules/typescript/lib/lib.dom.d.ts#L6370</a>  <ul>    <p>  <details id="new PopupElement$44" title="ConstructorSignature" ><summary><span><a href="#new PopupElement$44">#</a></span>  <code><strong>new PopupElement</strong></code><em>()</em>    </summary>    <ul><p><a href="#PopupElement$42">PopupElement</a></p>        </ul></details></p>    </ul></details><details id="$$119" title="Property" ><summary><span><a href="#$$119">#</a></span>  <code><strong>$</strong></code>    </summary>  <a href=""></a>  <ul><p><span>Context</span>&lt;<a href="#PopupElement$42">PopupElement</a> &amp; <span>JsxContext</span>&lt;<a href="#PopupElement$42">PopupElement</a>&gt; &amp; <span>Omit</span>&lt;{<p>    <details id="ctor$123" title="Parameter" ><summary><span><a href="#ctor$123">#</a></span>  <code><strong>ctor</strong></code>    </summary>    <ul><p><span>Class</span>&lt;<a href="#T$13">T</a>&gt;</p>        </ul></details>  <p><strong></strong>&lt;<span>T</span>&gt;<em>(ctor)</em>  &nbsp;=&gt;  <ul><span>CleanClass</span>&lt;<a href="#T$13">T</a>&gt;</ul></p>  <details id="ctx$138" title="Parameter" ><summary><span><a href="#ctx$138">#</a></span>  <code><strong>ctx</strong></code>    </summary>    <ul><p><a href="#T$28">T</a> | <span>Class</span>&lt;<a href="#T$28">T</a>&gt;</p>        </ul></details>  <p><strong></strong>&lt;<span>T</span>&gt;<em>(ctx)</em>  &nbsp;=&gt;  <ul><span>Wrapper</span>&lt;<a href="#T$28">T</a>&gt;</ul></p></p>} &amp; <span>__module</span> &amp; {<p>  <details id="Boolean$142" title="Property" ><summary><span><a href="#Boolean$142">#</a></span>  <code><strong>Boolean</strong></code>    </summary>  <a href=""></a>  <ul><p>undefined | boolean</p>        </ul></details><details id="Number$141" title="Property" ><summary><span><a href="#Number$141">#</a></span>  <code><strong>Number</strong></code>    </summary>  <a href=""></a>  <ul><p>undefined | number</p>        </ul></details><details id="String$140" title="Property" ><summary><span><a href="#String$140">#</a></span>  <code><strong>String</strong></code>    </summary>  <a href=""></a>  <ul><p>undefined | string</p>        </ul></details></p>}, <code>"transition"</code>&gt;&gt;</p>        </ul></details><details id="center$47" title="Property" ><summary><span><a href="#center$47">#</a></span>  <code><strong>center</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>false</code></span>  </summary>  <a href="src/x-popup.tsx#L76">src/x-popup.tsx#L76</a>  <ul><p>boolean</p>        </ul></details><details id="contents$64" title="Property" ><summary><span><a href="#contents$64">#</a></span>  <code><strong>contents</strong></code>    </summary>  <a href="src/x-popup.tsx#L83">src/x-popup.tsx#L83</a>  <ul><p><span>HTMLDivElement</span></p>        </ul></details><details id="contentsRect$65" title="Property" ><summary><span><a href="#contentsRect$65">#</a></span>  <code><strong>contentsRect</strong></code>    </summary>  <a href="src/x-popup.tsx#L84">src/x-popup.tsx#L84</a>  <ul><p><span>Rect</span></p>        </ul></details><details id="context$143" title="Property" ><summary><span><a href="#context$143">#</a></span>  <code><strong>context</strong></code>    </summary>  <a href=""></a>  <ul><p><span>ContextClass</span>&lt;<a href="#PopupElement$42">PopupElement</a> &amp; <span>JsxContext</span>&lt;<a href="#PopupElement$42">PopupElement</a>&gt; &amp; <span>Omit</span>&lt;{<p>    <details id="ctor$147" title="Parameter" ><summary><span><a href="#ctor$147">#</a></span>  <code><strong>ctor</strong></code>    </summary>    <ul><p><span>Class</span>&lt;<a href="#T$13">T</a>&gt;</p>        </ul></details>  <p><strong></strong>&lt;<span>T</span>&gt;<em>(ctor)</em>  &nbsp;=&gt;  <ul><span>CleanClass</span>&lt;<a href="#T$13">T</a>&gt;</ul></p>  <details id="ctx$162" title="Parameter" ><summary><span><a href="#ctx$162">#</a></span>  <code><strong>ctx</strong></code>    </summary>    <ul><p><a href="#T$28">T</a> | <span>Class</span>&lt;<a href="#T$28">T</a>&gt;</p>        </ul></details>  <p><strong></strong>&lt;<span>T</span>&gt;<em>(ctx)</em>  &nbsp;=&gt;  <ul><span>Wrapper</span>&lt;<a href="#T$28">T</a>&gt;</ul></p></p>} &amp; <span>__module</span> &amp; {<p>  <details id="Boolean$166" title="Property" ><summary><span><a href="#Boolean$166">#</a></span>  <code><strong>Boolean</strong></code>    </summary>  <a href=""></a>  <ul><p>undefined | boolean</p>        </ul></details><details id="Number$165" title="Property" ><summary><span><a href="#Number$165">#</a></span>  <code><strong>Number</strong></code>    </summary>  <a href=""></a>  <ul><p>undefined | number</p>        </ul></details><details id="String$164" title="Property" ><summary><span><a href="#String$164">#</a></span>  <code><strong>String</strong></code>    </summary>  <a href=""></a>  <ul><p>undefined | string</p>        </ul></details></p>}, <code>"transition"</code>&gt;&gt;</p>        </ul></details><details id="dest$66" title="Property" ><summary><span><a href="#dest$66">#</a></span>  <code><strong>dest</strong></code>    </summary>  <a href="src/x-popup.tsx#L86">src/x-popup.tsx#L86</a>  <ul><p><span>SurfaceItemElement</span></p>        </ul></details><details id="destRect$67" title="Property" ><summary><span><a href="#destRect$67">#</a></span>  <code><strong>destRect</strong></code>    </summary>  <a href="src/x-popup.tsx#L87">src/x-popup.tsx#L87</a>  <ul><p><span>Rect</span></p>        </ul></details><details id="dispatch$104" title="Property" ><summary><span><a href="#dispatch$104">#</a></span>  <code><strong>dispatch</strong></code>    </summary>  <a href=""></a>  <ul><p><span>Dispatch</span>&lt;<details id="__type$105" title="Function" ><summary><span><a href="#__type$105">#</a></span>  <em>(name, detail, init)</em>    </summary>    <ul>    <p>    <details id="name$109" title="Parameter" ><summary><span><a href="#name$109">#</a></span>  <code><strong>name</strong></code>    </summary>    <ul><p><span>Event</span> | <span>Narrow</span>&lt;<a href="#K$107">K</a>, string&gt;</p>        </ul></details><details id="detail$110" title="Parameter" ><summary><span><a href="#detail$110">#</a></span>  <code><strong>detail</strong></code>    </summary>    <ul><p><a href="#E$108">E</a></p>        </ul></details><details id="init$111" title="Parameter" ><summary><span><a href="#init$111">#</a></span>  <code><strong>init</strong></code>    </summary>    <ul><p><span>CustomEventInit</span>&lt;any&gt;</p>        </ul></details>  <p><strong></strong>&lt;<span>K</span>, <span>E</span>&gt;<em>(name, detail, init)</em>  &nbsp;=&gt;  <ul>any</ul></p></p>    </ul></details>&gt;</p>        </ul></details><details id="host$118" title="Property" ><summary><span><a href="#host$118">#</a></span>  <code><strong>host</strong></code>    </summary>  <a href=""></a>  <ul><p><a href="#PopupElement$42">PopupElement</a></p>        </ul></details><details id="hostMatrixString$73" title="Property" ><summary><span><a href="#hostMatrixString$73">#</a></span>  <code><strong>hostMatrixString</strong></code>    </summary>  <a href="src/x-popup.tsx#L96">src/x-popup.tsx#L96</a>  <ul><p>string</p>        </ul></details><details id="onmounted$116" title="Property" ><summary><span><a href="#onmounted$116">#</a></span>  <code><strong>onmounted</strong></code>    </summary>    <ul><p><span>EventHandler</span>&lt;<a href="#PopupElement$42">PopupElement</a>, <span>CustomEvent</span>&lt;any&gt;&gt;</p>        </ul></details><details id="onunmounted$117" title="Property" ><summary><span><a href="#onunmounted$117">#</a></span>  <code><strong>onunmounted</strong></code>    </summary>    <ul><p><span>EventHandler</span>&lt;<a href="#PopupElement$42">PopupElement</a>, <span>CustomEvent</span>&lt;any&gt;&gt;</p>        </ul></details><details id="placed$46" title="Property" ><summary><span><a href="#placed$46">#</a></span>  <code><strong>placed</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>false</code></span>  </summary>  <a href="src/x-popup.tsx#L75">src/x-popup.tsx#L75</a>  <ul><p>boolean</p>        </ul></details><details id="placement$45" title="Property" ><summary><span><a href="#placement$45">#</a></span>  <code><strong>placement</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>'n'</code></span>  </summary>  <a href="src/x-popup.tsx#L74">src/x-popup.tsx#L74</a>  <ul><p><span>Placement</span></p>        </ul></details><details id="popup$68" title="Property" ><summary><span><a href="#popup$68">#</a></span>  <code><strong>popup</strong></code>    </summary>  <a href="src/x-popup.tsx#L89">src/x-popup.tsx#L89</a>  <ul><p><span>Popup</span></p>        </ul></details><details id="pos$70" title="Property" ><summary><span><a href="#pos$70">#</a></span>  <code><strong>pos</strong></code>    </summary>  <a href="src/x-popup.tsx#L91">src/x-popup.tsx#L91</a>  <ul><p><span>Point</span></p>        </ul></details><details id="rect$69" title="Property" ><summary><span><a href="#rect$69">#</a></span>  <code><strong>rect</strong></code>    </summary>  <a href="src/x-popup.tsx#L90">src/x-popup.tsx#L90</a>  <ul><p><span>Rect</span></p>        </ul></details><details id="rigid$48" title="Property" ><summary><span><a href="#rigid$48">#</a></span>  <code><strong>rigid</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>false</code></span>  </summary>  <a href="src/x-popup.tsx#L77">src/x-popup.tsx#L77</a>  <ul><p>boolean</p>        </ul></details><details id="scene$63" title="Property" ><summary><span><a href="#scene$63">#</a></span>  <code><strong>scene</strong></code>    </summary>  <a href="src/x-popup.tsx#L81">src/x-popup.tsx#L81</a>  <ul><p><a href="#PopupScene$1">PopupScene</a></p>        </ul></details><details id="setHostStyleTransform$74" title="Property" ><summary><span><a href="#setHostStyleTransform$74">#</a></span>  <code><strong>setHostStyleTransform</strong></code>    </summary>  <a href="src/x-popup.tsx#L97">src/x-popup.tsx#L97</a>  <ul><p><details id="__type$75" title="Function" ><summary><span><a href="#__type$75">#</a></span>  <em>(matrixString)</em>    </summary>    <ul>    <p>    <details id="matrixString$77" title="Parameter" ><summary><span><a href="#matrixString$77">#</a></span>  <code><strong>matrixString</strong></code>    </summary>    <ul><p>string</p>        </ul></details>  <p><strong></strong><em>(matrixString)</em>  &nbsp;=&gt;  <ul>void</ul></p></p>    </ul></details></p>        </ul></details><details id="surface$62" title="Property" ><summary><span><a href="#surface$62">#</a></span>  <code><strong>surface</strong></code>    </summary>  <a href="src/x-popup.tsx#L80">src/x-popup.tsx#L80</a>  <ul><p><span>SurfaceElement</span></p>        </ul></details><details id="transition$49" title="Property" ><summary><span><a href="#transition$49">#</a></span>  <code><strong>transition</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>SurfaceState.Idle</code></span>  </summary>  <a href="src/x-popup.tsx#L78">src/x-popup.tsx#L78</a>  <ul><p><span>ValuesOf</span>&lt;{<p>  <details id="CenteringItem$53" title="Property" ><summary><span><a href="#CenteringItem$53">#</a></span>  <code><strong>CenteringItem</strong></code>    </summary>  <a href=""></a>  <ul><p><code>"surfacecenteringitem"</code></p>        </ul></details><details id="CenteringView$54" title="Property" ><summary><span><a href="#CenteringView$54">#</a></span>  <code><strong>CenteringView</strong></code>    </summary>  <a href=""></a>  <ul><p><code>"surfacecenteringview"</code></p>        </ul></details><details id="Connecting$55" title="Property" ><summary><span><a href="#Connecting$55">#</a></span>  <code><strong>Connecting</strong></code>    </summary>  <a href=""></a>  <ul><p><code>"surfaceconnecting"</code></p>        </ul></details><details id="FullSize$56" title="Property" ><summary><span><a href="#FullSize$56">#</a></span>  <code><strong>FullSize</strong></code>    </summary>  <a href=""></a>  <ul><p><code>"surfacefullsize"</code></p>        </ul></details><details id="Idle$51" title="Property" ><summary><span><a href="#Idle$51">#</a></span>  <code><strong>Idle</strong></code>    </summary>  <a href=""></a>  <ul><p><code>"surfaceidle"</code></p>        </ul></details><details id="MinimapPanning$57" title="Property" ><summary><span><a href="#MinimapPanning$57">#</a></span>  <code><strong>MinimapPanning</strong></code>    </summary>  <a href=""></a>  <ul><p><code>"surfaceminimappanning"</code></p>        </ul></details><details id="Overlay$52" title="Property" ><summary><span><a href="#Overlay$52">#</a></span>  <code><strong>Overlay</strong></code>    </summary>  <a href=""></a>  <ul><p><code>"surfaceoverlay"</code></p>        </ul></details><details id="Panning$58" title="Property" ><summary><span><a href="#Panning$58">#</a></span>  <code><strong>Panning</strong></code>    </summary>  <a href=""></a>  <ul><p><code>"surfacepanning"</code></p>        </ul></details><details id="Pinching$59" title="Property" ><summary><span><a href="#Pinching$59">#</a></span>  <code><strong>Pinching</strong></code>    </summary>  <a href=""></a>  <ul><p><code>"surfacepinching"</code></p>        </ul></details><details id="Selecting$60" title="Property" ><summary><span><a href="#Selecting$60">#</a></span>  <code><strong>Selecting</strong></code>    </summary>  <a href=""></a>  <ul><p><code>"surfaceselecting"</code></p>        </ul></details><details id="Wheeling$61" title="Property" ><summary><span><a href="#Wheeling$61">#</a></span>  <code><strong>Wheeling</strong></code>    </summary>  <a href=""></a>  <ul><p><code>"surfacewheeling"</code></p>        </ul></details></p>}&gt;</p>        </ul></details><details id="viewMatrix$71" title="Property" ><summary><span><a href="#viewMatrix$71">#</a></span>  <code><strong>viewMatrix</strong></code>    </summary>  <a href="src/x-popup.tsx#L93">src/x-popup.tsx#L93</a>  <ul><p><span>Matrix</span></p>        </ul></details><details id="viewportRect$72" title="Property" ><summary><span><a href="#viewportRect$72">#</a></span>  <code><strong>viewportRect</strong></code>    </summary>  <a href="src/x-popup.tsx#L94">src/x-popup.tsx#L94</a>  <ul><p><span>Rect</span></p>        </ul></details><details id="created$167" title="Method" ><summary><span><a href="#created$167">#</a></span>  <code><strong>created</strong></code><em>(ctx)</em>    </summary>  <a href=""></a>  <ul>    <p>    <details id="ctx$169" title="Parameter" ><summary><span><a href="#ctx$169">#</a></span>  <code><strong>ctx</strong></code>    </summary>    <ul><p><span>Context</span>&lt;<a href="#PopupElement$42">PopupElement</a> &amp; <span>JsxContext</span>&lt;<a href="#PopupElement$42">PopupElement</a>&gt; &amp; <span>Omit</span>&lt;{<p>    <details id="ctor$173" title="Parameter" ><summary><span><a href="#ctor$173">#</a></span>  <code><strong>ctor</strong></code>    </summary>    <ul><p><span>Class</span>&lt;<a href="#T$13">T</a>&gt;</p>        </ul></details>  <p><strong></strong>&lt;<span>T</span>&gt;<em>(ctor)</em>  &nbsp;=&gt;  <ul><span>CleanClass</span>&lt;<a href="#T$13">T</a>&gt;</ul></p>  <details id="ctx$188" title="Parameter" ><summary><span><a href="#ctx$188">#</a></span>  <code><strong>ctx</strong></code>    </summary>    <ul><p><a href="#T$28">T</a> | <span>Class</span>&lt;<a href="#T$28">T</a>&gt;</p>        </ul></details>  <p><strong></strong>&lt;<span>T</span>&gt;<em>(ctx)</em>  &nbsp;=&gt;  <ul><span>Wrapper</span>&lt;<a href="#T$28">T</a>&gt;</ul></p></p>} &amp; <span>__module</span> &amp; {<p>  <details id="Boolean$192" title="Property" ><summary><span><a href="#Boolean$192">#</a></span>  <code><strong>Boolean</strong></code>    </summary>  <a href=""></a>  <ul><p>undefined | boolean</p>        </ul></details><details id="Number$191" title="Property" ><summary><span><a href="#Number$191">#</a></span>  <code><strong>Number</strong></code>    </summary>  <a href=""></a>  <ul><p>undefined | number</p>        </ul></details><details id="String$190" title="Property" ><summary><span><a href="#String$190">#</a></span>  <code><strong>String</strong></code>    </summary>  <a href=""></a>  <ul><p>undefined | string</p>        </ul></details></p>}, <code>"transition"</code>&gt;&gt;</p>        </ul></details>  <p><strong>created</strong><em>(ctx)</em>  &nbsp;=&gt;  <ul>void</ul></p></p>    </ul></details><details id="mounted$78" title="Method" ><summary><span><a href="#mounted$78">#</a></span>  <code><strong>mounted</strong></code><em>($)</em>    </summary>  <a href="src/x-popup.tsx#L99">src/x-popup.tsx#L99</a>  <ul>    <p>    <details id="$$80" title="Parameter" ><summary><span><a href="#$$80">#</a></span>  <code><strong>$</strong></code>    </summary>    <ul><p><span>Context</span>&lt;<a href="#PopupElement$42">PopupElement</a> &amp; <span>JsxContext</span>&lt;<a href="#PopupElement$42">PopupElement</a>&gt; &amp; <span>Omit</span>&lt;{<p>    <details id="ctor$84" title="Parameter" ><summary><span><a href="#ctor$84">#</a></span>  <code><strong>ctor</strong></code>    </summary>    <ul><p><span>Class</span>&lt;<a href="#T$13">T</a>&gt;</p>        </ul></details>  <p><strong></strong>&lt;<span>T</span>&gt;<em>(ctor)</em>  &nbsp;=&gt;  <ul><span>CleanClass</span>&lt;<a href="#T$13">T</a>&gt;</ul></p>  <details id="ctx$99" title="Parameter" ><summary><span><a href="#ctx$99">#</a></span>  <code><strong>ctx</strong></code>    </summary>    <ul><p><a href="#T$28">T</a> | <span>Class</span>&lt;<a href="#T$28">T</a>&gt;</p>        </ul></details>  <p><strong></strong>&lt;<span>T</span>&gt;<em>(ctx)</em>  &nbsp;=&gt;  <ul><span>Wrapper</span>&lt;<a href="#T$28">T</a>&gt;</ul></p></p>} &amp; <span>__module</span> &amp; {<p>  <details id="Boolean$103" title="Property" ><summary><span><a href="#Boolean$103">#</a></span>  <code><strong>Boolean</strong></code>    </summary>  <a href=""></a>  <ul><p>undefined | boolean</p>        </ul></details><details id="Number$102" title="Property" ><summary><span><a href="#Number$102">#</a></span>  <code><strong>Number</strong></code>    </summary>  <a href=""></a>  <ul><p>undefined | number</p>        </ul></details><details id="String$101" title="Property" ><summary><span><a href="#String$101">#</a></span>  <code><strong>String</strong></code>    </summary>  <a href=""></a>  <ul><p>undefined | string</p>        </ul></details></p>}, <code>"transition"</code>&gt;&gt;</p>        </ul></details>  <p><strong>mounted</strong><em>($)</em>  &nbsp;=&gt;  <ul>void</ul></p></p>    </ul></details><details id="on$112" title="Method" ><summary><span><a href="#on$112">#</a></span>  <code><strong>on</strong></code><em>(name)</em>    </summary>  <a href=""></a>  <ul>    <p>    <details id="name$115" title="Parameter" ><summary><span><a href="#name$115">#</a></span>  <code><strong>name</strong></code>    </summary>    <ul><p><a href="#K$114">K</a></p>        </ul></details>  <p><strong>on</strong>&lt;<span>K</span>&gt;<em>(name)</em>  &nbsp;=&gt;  <ul><span>On</span>&lt;<span>Fn</span>&lt;[  <span>EventHandler</span>&lt;<a href="#PopupElement$42">PopupElement</a>, <span>LifecycleEvents</span> &amp; object  [<a href="#K$114">K</a>]&gt;  ], <span>Off</span>&gt;&gt;</ul></p></p>    </ul></details><details id="toJSON$193" title="Method" ><summary><span><a href="#toJSON$193">#</a></span>  <code><strong>toJSON</strong></code><em>()</em>    </summary>  <a href=""></a>  <ul>    <p>      <p><strong>toJSON</strong><em>()</em>  &nbsp;=&gt;  <ul><span>Pick</span>&lt;<a href="#PopupElement$42">PopupElement</a>, keyof     <a href="#PopupElement$42">PopupElement</a>&gt;</ul></p></p>    </ul></details></p></ul></details><details id="PopupScene$1" title="Class" open><summary><span><a href="#PopupScene$1">#</a></span>  <code><strong>PopupScene</strong></code>    </summary>  <a href="src/popup-scene.ts#L17">src/popup-scene.ts#L17</a>  <ul>        <p>  <details id="constructor$2" title="Constructor" ><summary><span><a href="#constructor$2">#</a></span>  <code><strong>constructor</strong></code><em>(surface)</em>    </summary>  <a href="src/popup-scene.ts#L28">src/popup-scene.ts#L28</a>  <ul>    <p>  <details id="new PopupScene$3" title="ConstructorSignature" ><summary><span><a href="#new PopupScene$3">#</a></span>  <code><strong>new PopupScene</strong></code><em>()</em>    </summary>    <ul><p><a href="#PopupScene$1">PopupScene</a></p>      <p>  <details id="surface$4" title="Parameter" ><summary><span><a href="#surface$4">#</a></span>  <code><strong>surface</strong></code>    </summary>    <ul><p><span>SurfaceElement</span></p>        </ul></details></p>  </ul></details></p>    </ul></details><details id="$$10" title="Property" ><summary><span><a href="#$$10">#</a></span>  <code><strong>$</strong></code>    </summary>  <a href="src/popup-scene.ts#L23">src/popup-scene.ts#L23</a>  <ul><p><a href="#PopupScene$1">PopupScene</a> &amp; <span>ContextClass</span>&lt;<a href="#PopupScene$1">PopupScene</a>&gt; &amp; {<p>    <details id="ctor$14" title="Parameter" ><summary><span><a href="#ctor$14">#</a></span>  <code><strong>ctor</strong></code>    </summary>    <ul><p><span>Class</span>&lt;<a href="#T$13">T</a>&gt;</p>        </ul></details>  <p><strong></strong>&lt;<span>T</span>&gt;<em>(ctor)</em>  &nbsp;=&gt;  <ul><span>CleanClass</span>&lt;<a href="#T$13">T</a>&gt;</ul></p>  <details id="ctx$29" title="Parameter" ><summary><span><a href="#ctx$29">#</a></span>  <code><strong>ctx</strong></code>    </summary>    <ul><p><a href="#T$28">T</a> | <span>Class</span>&lt;<a href="#T$28">T</a>&gt;</p>        </ul></details>  <p><strong></strong>&lt;<span>T</span>&gt;<em>(ctx)</em>  &nbsp;=&gt;  <ul><span>Wrapper</span>&lt;<a href="#T$28">T</a>&gt;</ul></p></p>} &amp; <span>__module</span> &amp; {<p>  <details id="Boolean$33" title="Property" ><summary><span><a href="#Boolean$33">#</a></span>  <code><strong>Boolean</strong></code>    </summary>  <a href=""></a>  <ul><p>undefined | boolean</p>        </ul></details><details id="Number$32" title="Property" ><summary><span><a href="#Number$32">#</a></span>  <code><strong>Number</strong></code>    </summary>  <a href=""></a>  <ul><p>undefined | number</p>        </ul></details><details id="String$31" title="Property" ><summary><span><a href="#String$31">#</a></span>  <code><strong>String</strong></code>    </summary>  <a href=""></a>  <ul><p>undefined | string</p>        </ul></details></p>}</p>        </ul></details><details id="context$34" title="Property" ><summary><span><a href="#context$34">#</a></span>  <code><strong>context</strong></code>    </summary>  <a href="src/popup-scene.ts#L24">src/popup-scene.ts#L24</a>  <ul><p><span>ContextClass</span>&lt;<a href="#PopupScene$1">PopupScene</a>&gt;</p>        </ul></details><details id="popups$35" title="Property" ><summary><span><a href="#popups$35">#</a></span>  <code><strong>popups</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>...</code></span>  </summary>  <a href="src/popup-scene.ts#L26">src/popup-scene.ts#L26</a>  <ul><p><span>Set</span>&lt;<span>Popup</span>&gt;</p>        </ul></details><details id="runCollisions$7" title="Property" ><summary><span><a href="#runCollisions$7">#</a></span>  <code><strong>runCollisions</strong></code>    </summary>  <a href="src/popup-scene.ts#L20">src/popup-scene.ts#L20</a>  <ul><p><details id="__type$8" title="Function" ><summary><span><a href="#__type$8">#</a></span>  <em>()</em>    </summary>    <ul>    <p>      <p><strong></strong><em>()</em>  &nbsp;=&gt;  <ul>void</ul></p></p>    </ul></details></p>        </ul></details><details id="surface$36" title="Property" ><summary><span><a href="#surface$36">#</a></span>  <code><strong>surface</strong></code>    </summary>  <a href="src/popup-scene.ts#L28">src/popup-scene.ts#L28</a>  <ul><p><span>SurfaceElement</span></p>        </ul></details><details id="viewMatrix$6" title="Property" ><summary><span><a href="#viewMatrix$6">#</a></span>  <code><strong>viewMatrix</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>...</code></span>  </summary>  <a href="src/popup-scene.ts#L19">src/popup-scene.ts#L19</a>  <ul><p><span>Matrix</span></p>        </ul></details><details id="viewportRect$5" title="Property" ><summary><span><a href="#viewportRect$5">#</a></span>  <code><strong>viewportRect</strong></code>  <span><span>&nbsp;=&nbsp;</span>  <code>...</code></span>  </summary>  <a href="src/popup-scene.ts#L18">src/popup-scene.ts#L18</a>  <ul><p><span>Rect</span></p>        </ul></details><details id="create$39" title="Method" ><summary><span><a href="#create$39">#</a></span>  <code><strong>create</strong></code><em>(this)</em>    </summary>  <a href="src/popup-scene.ts#L37">src/popup-scene.ts#L37</a>  <ul>    <p>    <details id="this$41" title="Parameter" ><summary><span><a href="#this$41">#</a></span>  <code><strong>this</strong></code>    </summary>    <ul><p><a href="#PopupScene$1">PopupScene</a></p>        </ul></details>  <p><strong>create</strong><em>(this)</em>  &nbsp;=&gt;  <ul>void</ul></p></p>    </ul></details><details id="destroy$37" title="Method" ><summary><span><a href="#destroy$37">#</a></span>  <code><strong>destroy</strong></code><em>()</em>    </summary>  <a href="src/popup-scene.ts#L33">src/popup-scene.ts#L33</a>  <ul>    <p>      <p><strong>destroy</strong><em>()</em>  &nbsp;=&gt;  <ul>void</ul></p></p>    </ul></details></p></ul></details></p>

## Credits

- [everyday-utils](https://npmjs.org/package/everyday-utils) by [stagas](https://github.com/stagas) &ndash; Everyday utilities
- [sigl](https://npmjs.org/package/sigl) by [stagas](https://github.com/stagas) &ndash; Web framework
- [x-surface](https://npmjs.org/package/x-surface) by [stagas](https://github.com/stagas) &ndash; Infinitely pannable and zoomable HTML surface as a Web Component.

## Contributing

[Fork](https://github.com/stagas/x-popup/fork) or [edit](https://github.dev/stagas/x-popup) and submit a PR.

All contributions are welcome!

## License

<a href="LICENSE">MIT</a> &copy; 2022 [stagas](https://github.com/stagas)
