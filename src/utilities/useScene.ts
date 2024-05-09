import RecursiveArray from "@jscad/modeling/src/utils/recursiveArray"
import { ExtendedParams } from "../design/design.parameters"
import { Geometry } from "@jscad/modeling/src/geometries/types"

export type Callback = ((parameters: ExtendedParams) => Geometry | RecursiveArray<Geometry>) | Geometry | RecursiveArray<Geometry>
export type AddObject = (callback: Callback) => void

export const useScene = (parameters: ExtendedParams) => {
  const scene: RecursiveArray<Geometry> = []

  const addObjectCallback: AddObject = (callback: Callback) => {
    if (typeof callback === 'function') {
      scene.push(callback?.(parameters))
    } else {
      scene.push(callback)
    }
  }

  const addDebugObjectCallback = (callback: Callback) => {
    if (!parameters.Enable_debug) {
      return []
    }
    return addObjectCallback(callback)
  }

  return {
    scene,
    addObject: addObjectCallback,
    addDebugObject: addDebugObjectCallback
  }
}