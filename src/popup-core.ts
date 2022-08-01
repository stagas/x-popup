import { Matrix, Point, Rect } from 'geometrik'
import { deobjectify, objectify } from 'json-objectify'
import { replacer, reviver } from 'serialize-whatever'
import { SyncedSet } from 'synced-set'

import { Popup } from './popup'

export interface PopupScene {
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
  pickFromLocal: ['id', 'center', 'originalPlacement', 'contentsRect', 'destRect'] as (keyof Popup)[],
  pickFromWorker: ['id', 'rect'] as (keyof Popup)[],
  serialize: (data: any) => objectify(data, replacer(data)),
  deserialize: (data: any) => deobjectify(data, reviver(deserializableClasses)) as any,
}
