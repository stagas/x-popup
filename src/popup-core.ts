import { Matrix, Point, Rect } from 'geometrik'
import { Context } from 'mixter'
import { deserialize, serialize } from 'serialize-whatever'
import { SyncedSet } from 'synced-set'
import { Popup } from './popup'

export interface PopupScene {
  context: Context<PopupScene>
  popups: SyncedSet<Popup, any>
  remote: MessagePort
  viewportRect: Rect
  viewMatrix: Matrix
}

const deserializableClasses = [
  Matrix,
  Popup,
  Rect,
  Point,
]

export const core = {
  pickFromLocal: ['id', 'center', 'originalPlacement', 'contentsRect', 'targetRect'] as (keyof Popup)[],
  pickFromWorker: ['id', 'rect'] as (keyof Popup)[],
  serialize: (data: any) => serialize(data),
  deserialize: (data: any) => deserialize(data, deserializableClasses) as any,
}
