import { colorize } from '@jscad/modeling/src/colors'
import { Vec3 } from '@jscad/modeling/src/maths/vec3'
import { mirror, translate } from '@jscad/modeling/src/operations/transforms'
import { ObjectTree } from '../jscad'
import { drawControlGrid, drawControlPoints, generateGeometryFromSurface, generateSurface } from '../library/bezierSurface'
import { BezierSurfaceControlPoints } from '../library/surface'
import { constructionLine } from '../library/utilities'
import { diagonalStitch, horizontalStitch, verticalStitch } from '../library/stitching'
import { ExtendedParams } from './design.parameters'
import { AddObject } from '../utilities/useScene'

export type SceneManipulation = {
  addObject: AddObject
  addDebugObject: AddObject
}

const constructionBlockKeyboardArc = (params: ExtendedParams): ObjectTree => {
  // Arc origin
  const keyboardArcEnd: Vec3 = [params.Arc_width, 0, 0]
  const keyboardArcEnd2: Vec3 = [params.Arc_width, params.baseKeyboardHeight, 0]
  const keyboardSpineEnd: Vec3 = [
    0,
    params.baseKeyboardHeight * params.Keyboard_depth_mult + params.Keyboard_arc_origin[1],
    params.Arc_height_max
  ]
  return [
    constructionLine({ start: params.Keyboard_arc_origin, stop: keyboardArcEnd }, params),
    constructionLine({ start: params.Keyboard_arc_origin, stop: keyboardSpineEnd }, params),
    constructionLine({ start: keyboardSpineEnd, stop: keyboardArcEnd2 }, params),
    constructionLine({ start: keyboardArcEnd, stop: keyboardArcEnd2 }, params)
  ]
}
const constructionBlockKeyboardStraight = (params: ExtendedParams): ObjectTree => {
  const result: ObjectTree = []

  const totalArrowBlockWidth = params.Key_size * 3 + params.Key_padding * 2
  result.push(
    constructionLine({
      start: [0, 0, 0],
      stop: [totalArrowBlockWidth, 0, 0]
    }, params),
    constructionLine({
      start: [0, params.baseKeyboardHeight, 0],
      stop: [totalArrowBlockWidth, params.baseKeyboardHeight, 0]
    }, params),
    constructionLine({
      start: [totalArrowBlockWidth, 0, 0],
      stop: [totalArrowBlockWidth, params.baseKeyboardHeight, 0]
    }, params),
    constructionLine({
      start: [0, 0, 0],
      stop: [0, params.baseKeyboardHeight, 0]
    }, params)
  )

  const totalNumpadWidth = params.Key_size * 4 + params.Key_padding * 3
  result.push(
    translate([totalArrowBlockWidth + params.Key_padding, 0, 0],
      constructionLine({
        start: [0, 0, 0],
        stop:
          [totalNumpadWidth, 0, 0]
      }, params),
      constructionLine({
        start: [0, params.baseKeyboardHeight, 0],
        stop: [totalNumpadWidth, params.baseKeyboardHeight, 0]
      }, params),
      constructionLine({
        start: [totalNumpadWidth, 0, 0],
        stop:
          [totalNumpadWidth, params.baseKeyboardHeight, 0]
      }, params),
      constructionLine({
        start: [0, 0, 0],
        stop:
          [0, params.baseKeyboardHeight, 0]
      }, params)
    )
  )

  return result
}

const prepareSurfacePatches = (): Record<string, BezierSurfaceControlPoints> => {
  const arc_0_0: BezierSurfaceControlPoints = [
    [[0, 18.5, 21.25], [3, 18.5, 21.25], [5, 18.2, 21.], [8, 18, 21]],
    [[0, 18.5 + 80, 21.25], [2, 18.5 + 80, 21], [20, 18.5 + 80, 21], [24, 18.5 + 80, 21.25]],
    [[0, 18.5 + 120 - 20, 22.5], [10, 18.5 + 120 - 20, 22.25], [24, 18.5 + 120 - 20, 22.25], [28, 134.5 - 20, 22.5]],
    [[0, 18.5 + 120, 22.5], [12, 18 + 120, 22.25], [25, 18.5 + 117.5, 22.25], [33.85, 134.5, 22.5]]
  ]
  const arc_1_0: BezierSurfaceControlPoints = horizontalStitch([
    [[25, 15, 18.5], [27, 14.5, 18.2]],
    [[32, 14.5 + 80, 18.2], [46, 14.5 + 80, 18.2]],
    [[40, 14.5 + 100, 23], [51, 130 - 20, 18.2], 0.3],
    [[46, 12.5 + 120, 20.5], [56.85, 130, 18.2], 0.3]
  ], arc_0_0)

  const arc_2_0: BezierSurfaceControlPoints = horizontalStitch([
    [[50, 10, 14], [64, 7.7, 10.5]],
    [[50, 8 + 80, 10.5], [76, 7.7 + 80, 10.5]],
    [[60, 110, 10.5], [84.4, 123.5 - 10, 10.5]],
    [[70, 127, 15], [84.4, 123.5, 10.5]]
  ], arc_1_0)

  const arc_3_0: BezierSurfaceControlPoints = horizontalStitch([
    [[95, 4, 4.5], [100.8, 3.5, 3.8]],
    [[95, 4 + 80, 3.8], [110, 3.5 + 80, 3.8]],
    [[105, 4 + 100, 3.8], [117, 117 - 20, 3.8]],
    [[95, 121, 8], [117, 117, 3.8]]
  ], arc_2_0)
  const arc_4_0: BezierSurfaceControlPoints = horizontalStitch([
    [[120, 2, 0], [160, 0, 0]],
    [[120, 2 + 80, 0], [160, 0 + 80, 0]],
    [[120, 113.85 - 10, 0], [160, 113.85 - 10, 0]],
    [[140, 113.85, 0], [160, 113.85, 0]]
  ], arc_3_0)

  const arc_0_1: BezierSurfaceControlPoints = verticalStitch([
    [[0, 18.5 + 120 + 20, 22.5], [15, 18.5 + 120 + 20, 22.5], [35, 18.5 + 120 + 20, 22.5], [40, 18.5 + 120 + 20, 22.5]],
    [[0, 18.5 + 120 + 67, 13.5], [15, 18.5 + 120 + 67, 13.5], [35, 18.5 + 120 + 67, 13.5], [50, 18.5 + 120 + 67, 13.5]]
  ], arc_0_0)

  const arc_1_1: BezierSurfaceControlPoints = diagonalStitch([
    [[70, 15 + 120 + 20, 22.5], [67, 15 + 120 + 20, 22.5]],
    [[70, 17 + 120 + 67, 11.5], [82, 15 + 120 + 67, 10.5]]
  ], { top: arc_1_0, left: arc_0_1, diagonal: arc_0_0 })

  // const arc_2_1: BezierSurfaceControlPoints = diagonalStitch({}, {top: arc_2_0, left: arc_1_1})
  // const arc_3_1: BezierSurfaceControlPoints = {} as
  // const arc_4_1: BezierSurfaceControlPoints = {} as

  const arc_0_2: BezierSurfaceControlPoints = verticalStitch([
    [[0, 18.5 + 120 + 67 + 23 - (3 * Math.sqrt(3)), 9], [15, 18.5 + 120 + 67 + 23 - (3 * Math.sqrt(3)), 9], [35, 18.5 + 120 + 67 + 23 - (3 * Math.sqrt(3)), 9], [53, 18.5 + 120 + 67 + 23 - (3 * Math.sqrt(3)), 9]],
    [[0, 18.5 + 120 + 67 + 23, 0], [15, 18.5 + 120 + 67 + 23, 0], [35, 18.5 + 120 + 67 + 23, 0], [56, 18.5 + 120 + 67 + 23, 0]],
    [0.3, 0.3, 0.3, 0.3]
  ], arc_0_1)

  // const arc_1_2: BezierSurfaceControlPoints = diagonalStitch({}, {top: arc_1_1, left: arc_0_2})
  // const arc_2_2: BezierSurfaceControlPoints = {}
  // const arc_3_2: BezierSurfaceControlPoints = {}
  // const arc_4_2: BezierSurfaceControlPoints = {}

  return {
    ...{ arc_0_0, arc_0_1, arc_0_2 },
    ...{ arc_1_0, arc_1_1 },
    ...{ arc_2_0 },
    ...{ arc_3_0 }
  }
}

const randomColorize = (geometry) => colorize([(Math.random() % 0.3) + 0.5, (Math.random() % 0.3) + 0.5, (Math.random() % 0.3) + 0.5], geometry)

export const design = ({ addObject, addDebugObject }: SceneManipulation) => {
  const surfacePatches = prepareSurfacePatches()
  const undefinedPatches = {
    arc_1_2: undefined,
    arc_2_1: undefined,
    arc_2_2: undefined,
    arc_3_1: undefined,
    arc_3_2: undefined,
    arc_cap_0: undefined,
    arc_cap_1: undefined,
    arc_cap_2: undefined,
    arc_to_straight_connector_0: undefined,
    arc_to_straight_connector_1: undefined,
    arc_to_straight_connector_2: undefined,
    straight_0: undefined,
    straight_1: undefined,
    straight_2: undefined,
  }

  addDebugObject(params => {
    const result = constructionBlockKeyboardArc(params)
    return [result, mirror({ normal: [1, 0, 0] }, result)]
  })
  addDebugObject(params => mirror({ normal: [1, 0, 0] }, translate([params.Arc_width + params.Key_padding, 0, 0], constructionBlockKeyboardStraight(params))))

  const patches = Object.values(surfacePatches)
    .map(patch => generateSurface(patch))
    .map(surface => generateGeometryFromSurface(surface, { orientation: 'inward' }));

  [
    ...patches.map(randomColorize),
    ...mirror({ normal: [1, 0, 0] }, patches).map(randomColorize)
  ].forEach(surfaceObject => addDebugObject(surfaceObject))

  Object.values(surfacePatches).forEach(patch => {
    addDebugObject(drawControlPoints(patch))
    addDebugObject(drawControlGrid(patch))
  })


  

}