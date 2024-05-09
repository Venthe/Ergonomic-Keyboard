import { colorize } from '@jscad/modeling/src/colors'
import { Geom3, Geometry } from '@jscad/modeling/src/geometries/types'
import { Vec3 } from '@jscad/modeling/src/maths/vec3'
import { mirror, translate } from '@jscad/modeling/src/operations/transforms'
import RecursiveArray from '@jscad/modeling/src/utils/recursiveArray'
import { MainFunction, ObjectTree } from '../jscad'
import { BezierControlPoints, joinBezierByTangent } from '../library/bezier'
import { drawSurface, generateSurface } from '../library/bezierSurface'
import { drawContinuousPoints, drawPoints } from '../library/draw'
import { FrameContext } from '../library/Frame'
import { BezierSurfaceControlPoints } from '../library/surface'
import { constructionLine } from '../library/utilities'
import { diagonalStitch, horizontalStitch, mergeSurfaceByDistance, verticalStitch } from '../library/stitching'
import { DesignParameters, ExtendedParams, deriveDesignParameters } from './design.parameters'
import { cube, sphere } from '@jscad/modeling/src/primitives'
import { AddObject } from '../utilities/useScene'

export type SceneManipulation = {
  addObject: AddObject
  addDebugObject: AddObject
}

export const additionalGeometry: RecursiveArray<Geometry | Geom3> = []

const blockKeyboardArc = (params: ExtendedParams): ObjectTree => {
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
// const draw_top_cover = (params) => { }

function blockStraight(params: ExtendedParams): ObjectTree {
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

function arcSurface(params: ExtendedParams): ObjectTree {
  const result: ObjectTree = []

  const bezierSteps = 10

  const middlePointWidest =
    params.baseKeyboardHeight * params.Keyboard_depth_mult + params.Keyboard_arc_origin[1]

  const middleLine1: FrameContext = FrameContext.generateRotationMinimizingFrames([
    params.Keyboard_arc_origin,
    [0, middlePointWidest * 0.65, params.Keyboard_arc_origin[2]],
    [0, middlePointWidest * 0.85, params.Arc_height_max * 0.99],
    [0, middlePointWidest, params.Arc_height_max]
  ], bezierSteps)
  const middleLine2 = FrameContext.generateRotationMinimizingFrames(joinBezierByTangent(middleLine1.controlPoints, [
    [0, (middlePointWidest + 67) * 0.90, params.Arc_height_max * 1.02],
    [0, middlePointWidest + 67, 13.50]
  ], 0.8), bezierSteps, middleLine1.lastFrame())
  const middleLine3 = FrameContext.generateRotationMinimizingFrames(joinBezierByTangent(middleLine2.controlPoints, [
    [0, middleLine2.controlPoints[3][1] + 21, middleLine2.controlPoints[3][2] * 0.3],
    [0, middleLine2.controlPoints[3][1] + 23, 0]
  ], 0.7), bezierSteps, middleLine2.lastFrame())

  const middleLine = [
    drawPoints(middleLine1, params, { color: [1, 0, 0] }),
    drawPoints(middleLine2, params, { color: [0, 0, 1] }),
    drawPoints(middleLine3, params, { color: [0, 1, 1] })
  ]

  const keyboardArcEnd: Vec3 = [params.Arc_width, 0, 0]
  const keyboardArcEnd2: Vec3 = [params.Arc_width, params.baseKeyboardHeight, 0]

  const endLine: FrameContext = FrameContext.generateRotationMinimizingFrames([
    keyboardArcEnd,
    [keyboardArcEnd[0], (keyboardArcEnd2)[1] / 3, (keyboardArcEnd2)[2] / 3],
    [
      keyboardArcEnd2[0], (keyboardArcEnd2)[1] * 2 / 3,
      (keyboardArcEnd2)[2] * 2 / 3
    ],
    keyboardArcEnd2
  ], bezierSteps)

  result.push(drawPoints(endLine, params, { color: [1, 1, 0] }))

  const backLine1Points: BezierControlPoints = [
    middleLine1.controlPoints[0],
    [2, 18.5, middleLine1.controlPoints[0][2]],
    [5, 18.4, middleLine1.controlPoints[0][2]],
    [8, 18, middleLine1.controlPoints[0][2]]
  ]
  const backLine2Points = joinBezierByTangent(backLine1Points, [
    [35, 13, 17.5],
    [48.25, 10.5, 14]
  ], 1)
  const backLine3Points = joinBezierByTangent(backLine2Points, [
    [75, 5.7, 8],
    [85.75, 4.5, 6]
  ], 1)
  const backLine4Points = joinBezierByTangent(backLine3Points, [
    [110, 2, 2.5],
    [123.25, 1.2, 1]
  ])
  const backLine5Points = joinBezierByTangent(backLine4Points, [
    [endLine.controlPoints[0][0] - 18, 0, 0],
    [endLine.controlPoints[0][0] - 16, 0, 0]
  ], 0.5)
  const backLine6Points = joinBezierByTangent(backLine5Points, [
    [endLine.controlPoints[0][0] - 5, 0, endLine.controlPoints[0][2]],
    endLine.controlPoints[0]
  ])

  const backLineFrameContexts = drawContinuousPoints([
    backLine1Points,
    backLine2Points,
    backLine3Points,
    backLine4Points,
    backLine5Points,
    backLine6Points
  ], { fidelity: 50 }
  )
  result.push(
    backLineFrameContexts.map((frameContext, idx) => drawPoints(frameContext, params, { color: [1 - (idx / (backLineFrameContexts.length - 1)), 1 * (idx / (backLineFrameContexts.length - 1)), 1 - 1 * (idx / (backLineFrameContexts.length - 1))] }))
  )

  result.push(middleLine)

  // result.push(
  //   backLineFrameContexts
  //     .map(context => context.frames[0])
  //     .map(frame => {
  //       const ml1 = translate(vector3.subtract([0, 0, 0], middleLine1.controlPoints[0]), middleLine)
  //       const ml2 = rotate(frame.normal, ml1)

  //       return translate(frame.origin, ml2)
  //     })
  // )

  //     // points = [
  //     //   Keyboard_offset,
  //     //   Keyboard_offset + _v_key_small_size,
  //     //   Keyboard_offset + _v_key_small_size
  //     //     + Key_padding,
  //     //   Keyboard_offset + _v_key_small_size
  //     //     + Key_padding + Key_size,
  //     //   Keyboard_offset + _v_key_small_size
  //     //     + Key_padding + Key_size
  //     //     + Key_padding,
  //     //   Keyboard_offset + _v_key_small_size
  //     //     + Key_padding + Key_size
  //     //     + Key_padding + Key_size,
  //     //   Keyboard_offset + _v_key_small_size
  //     //     + Key_padding + Key_size
  //     //     + Key_padding + Key_size
  //     //     + Key_padding,
  //     //   Keyboard_offset + _v_key_small_size
  //     //     + Key_padding + Key_size
  //     //     + Key_padding + Key_s,ize
  //     //     + Key_padding + Key_size,
  //     //   Keyboard_offset + _v_key_small_size
  //     //     + Key_padding + Key_size
  //     //     + Key_padding + Key_size
  //     //     + Key_padding + Key_size
  //     //     + Key_padding,
  //     //   Keyboard_offset + _v_key_small_size
  //     //     + Key_padding + Key_size
  //     //     + Key_padding + Key_size
  //     //     + Key_padding + Key_size
  //     //     + Key_padding + Key_size,
  //     //   Keyboard_offset + _v_key_small_size
  //     //     + Key_padding + Key_size
  //     //     + Key_padding + Key_size
  //     //     + Key_padding + Key_size
  //     //     + Key_padding + Key_size
  //     //     + Key_padding
  //     // ];
  //     // lines_for_keys = [for(p=points) bezier_get_point_at_unit(middle_line,
  //     // p)[0]]; keyboard_arc_end=[Arc_width, 0,0]; for(p = lines_for_keys)
  //     // translate(p) translate(-Keyboard_arc_origin)
  //     // construction_line(Keyboard_arc_origin, keyboard_arc_end);
  //     // mesh_cloud(lines_for_keys);

  //     // _density=3;
  //     // plane = [for(x=[0:_density:Arc_width])
  //     // for(z=[0:_density:_v_base_keyboard_height]) [x, z, 0]]; mesh_cloud(plane);
  // }

  return result
}

export const _generateDesign: MainFunction = (params: DesignParameters) => {
  const scene: ObjectTree = []
  const extendedParamsWithVariables: ExtendedParams = deriveDesignParameters(params)

  if (params.Enable_debug) { console.debug('Parameters:', extendedParamsWithVariables) }

  const fromEdgeOffset = (...p): BezierSurfaceControlPoints => ({}) as any

  const tempParams: any = {}

  const edgeId = {
    top: "top",
    centerCutawayEdge: "centerCutawayEdge"
  }

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

  const functionRowTopOffset = fromEdgeOffset({ edgeId: edgeId.top, distance: tempParams.outerMarginWidth })
  const functionRowBottomOffset = fromEdgeOffset({ edgeId: edgeId.top, distance: tempParams.outerMarginWidth + tempParams.smallKeyHeight })

  const nextFunctionKeyCut = (previousKey) => ({
    ...previousKey.cut,
    left: { ...previousKey.cut.left, distance: previousKey.cut.right.distance + tempParams.keyMarginWidth },
    right: { ...previousKey.cut.left, distance: previousKey.cut.right.distance + tempParams.keyMarginWidth + tempParams.smallKeyWidth }
  })

  if (!tempParams.integratedNumpad) {
    const leftArcSurface = {}
    const rightArcSurface = mergeSurfaceByDistance([arc_0_0, arc_1_0, arc_2_0, arc_3_0, arc_4_0, arc_0_1, arc_0_2, arc_1_1])
    const numpad = {}

    scene.push(rightArcSurface
      .map(s => drawSurface(s, { orientation: 'inward' }))
      .map(s => colorize([Math.random(), Math.random(), Math.random()], s))
    )


    // const f7: cutFrom(rightArcSurface, {
    //   top: functionRowTopOffset,
    //   bottom: functionRowBottomOffset,
    //   left: fromEdgeNormal({ edgeId: edgeId.top, distance: keyOrigin }),
    //   right: fromEdgeNormal({ edgeId: edgeId.top, distance: keyOrigin + tempParams.smallKeyWidth }),
    // })

    // const f8: cutFrom(rightArcSurface, nextFunctionKeyCut(f7))
    // const f9: cutFrom(rightArcSurface, nextFunctionKeyCut(f8))
    // const f10: cutFrom(rightArcSurface, nextFunctionKeyCut(f9))
    // const f11: cutFrom(rightArcSurface, nextFunctionKeyCut(f10))
    // const f12: cutFrom(rightArcSurface, nextFunctionKeyCut(f11))
    // const printScreen: cutFrom(rightArcSurface, nextFunctionKeyCut(f10))
    // const screenLock: cutFrom(rightArcSurface, nextFunctionKeyCut(printScreen))
    // const pause: cutFrom(rightArcSurface, nextFunctionKeyCut(screenLock))
    // const calculator: cutFrom(rightArcSurface, nextFunctionKeyCut(pause))
    // const functionSwitch: cutFrom(rightArcSurface, nextFunctionKeyCut(calculator))
  } else {
    const arc_5_0 = {}
    const arc_5_1 = {}
    const arc_5_2 = {}

    const leftArcSurface = {}
    const rightArcSurface = {}
  }






























  // // // const keyboardArc = blockKeyboardArc(extendedParamsWithVariables)
  // // // scene.push(
  // // //   keyboardArc,
  // // //   mirror({ normal: [1, 0, 0] }, keyboardArc)
  // // // )

  // // // scene.push(
  // // //   translate([params.Arc_width + params.Key_padding, 0, 0], blockStraight(extendedParamsWithVariables))
  // // // )

  // // // const arc = arcSurface(extendedParamsWithVariables)
  // // // scene.push(
  // // //   arc,
  // // //   mirror({ normal: [1, 0, 0] }, arc)
  // // // )
  // // // // TODO: Add join by tangent surface
  // // // //  Target support: 5x3 patches
  // const surface: BezierSurfaceControlPoints = [
  //   [[0, 0, 0], [5, -5, 0], [15, -5, 0], [20, 0, 0]],
  //   [[0, 5, 0], [5, 5, 5], [15, 5, -15], [20, 5, 0]],
  //   [[0, 15, 0], [5, 15, -10], [15, 15, 10], [20, 15, 0]],
  //   [[-10, 40, 0], [5, 45, 0], [15, 45, 0], [20, 40, 0]]
  // ]

  // const transpose = matrix => {
  //   let arr = [];
  //   for (let i = 0; i < matrix.length; i++) {
  //     arr.push([])
  //     for (let j = 0; j < matrix.length; j++) {
  //       arr[i].push(matrix[j][i])
  //     }
  //   }
  //   return arr
  // }

  // const stitchQuadBezierSurfacesByTangent = (data: { topLeft: any, topRight: any, bottomLeft: any, bottomRight: any }) => {
  //   const { topLeft, topRight, bottomLeft, bottomRight } = data

  //   const controlPointsByColumn = (column): BezierControlPoints => ([topLeft[0][column], topLeft[1][column], topLeft[2][column], topLeft[3][column]])
  //   const bottomLeftByColumn = (column): [Vec3, Vec3] => ([bottomLeft[0][column], bottomLeft[1][column]])
  //   const averagePoint = (a: Vec3, b: Vec3) => (vec3.scale([0, 0, 0], vec3.add([0, 0, 0], a, b), 0.5))
  //   const transpose = matrix => matrix[0].map((col, i) => matrix.map(row => row[i]))
  //   const generatedTopRight = [
  //     joinBezierByTangent(topLeft[0], topRight[0]),
  //     joinBezierByTangent(topLeft[1], topRight[1]),
  //     joinBezierByTangent(topLeft[2], topRight[2]),
  //     joinBezierByTangent(topLeft[3], topRight[3])
  //   ]
  //   const generatedBottomLeft: [BezierControlPoints, BezierControlPoints, BezierControlPoints, BezierControlPoints] =
  //     transpose([
  //       joinBezierByTangent(controlPointsByColumn(0), bottomLeftByColumn(0)),
  //       joinBezierByTangent(controlPointsByColumn(1), bottomLeftByColumn(1)),
  //       joinBezierByTangent(controlPointsByColumn(2), bottomLeftByColumn(2)),
  //       joinBezierByTangent(controlPointsByColumn(3), bottomLeftByColumn(3)),
  //     ])
  //   const extSur = [
  //     [
  //       topLeft,
  //       generatedTopRight
  //     ],
  //     [
  //       generatedBottomLeft,
  //       [
  //         [topLeft[3][3], generatedTopRight[3][1], generatedTopRight[3][2], generatedTopRight[3][3]],
  //         [generatedBottomLeft[1][3], averagePoint(mirrorPointAroundCenter(generatedBottomLeft[1][2], generatedBottomLeft[1][3]), mirrorPointAroundCenter(generatedTopRight[2][1], generatedTopRight[3][1])), mirrorPointAroundCenter(generatedTopRight[2][2], generatedTopRight[3][2]), mirrorPointAroundCenter(generatedTopRight[2][3], generatedTopRight[3][3])],
  //         [generatedBottomLeft[2][3], mirrorPointAroundCenter(generatedBottomLeft[2][2], generatedBottomLeft[2][3]), bottomRight[0][0], bottomRight[0][1]],
  //         [generatedBottomLeft[3][3], mirrorPointAroundCenter(generatedBottomLeft[3][2], generatedBottomLeft[3][3]), bottomRight[1][0], bottomRight[1][1]],
  //       ]
  //     ]
  //   ]

  //   return extSur

  // }

  // var _0x = 0;

  // const extSur2 = [];
  // extSur2[0] = [];
  // extSur2[1] = [];
  // extSur2[2] = [];
  // extSur2[3] = [];
  // extSur2[4] = [];
  // extSur2[5] = [];
  // extSur2[0][0] = [
  //   [[_0x, 18.5, 21.25], [3, 18.5, 21.25], [5, 18.2, 21.], [8, 18, 21]],
  //   [[_0x, 18.5 + 80, 21.25], [2, 18.5 + 80, 21], [20, 18.5 + 80, 21], [24, 18.5 + 80, 21.25]],
  //   [[_0x, 18.5 + 120 - 20, 22.5], [10, 18.5 + 120 - 20, 22.25], [24, 18.5 + 120 - 20, 22.25], [28, 134.5 - 20, 22.5]],
  //   [[_0x, 18.5 + 120, 22.5], [12, 18 + 120, 22.25], [25, 18.5 + 117.5, 22.25], [33.85, 134.5, 22.5]]
  // ]
  // extSur2[1][0] = [
  //   [[25, 15, 18.5], [27, 14.5, 18.2]],
  //   [[32, 14.5 + 80, 18.2], [46, 14.5 + 80, 18.2]],
  //   [[40, 14.5 + 100, 23], [51, 130 - 20, 18.2], 0.3],
  //   [[46, 12.5 + 120, 20.5], [56.85, 130, 18.2], 0.3]
  // ]
  // extSur2[2][0] = [
  //   [[50, 10, 14], [64, 7.7, 10.5]],
  //   [[50, 8 + 80, 10.5], [76, 7.7 + 80, 10.5]],
  //   [[60, 110, 10.5], [84.4, 123.5 - 10, 10.5]],
  //   [[70, 127, 15], [84.4, 123.5, 10.5]]
  // ]
  // extSur2[3][0] = [
  //   [[95, 4, 4.5], [100.8, 3.5, 3.8]],
  //   [[95, 4 + 80, 3.8], [110, 3.5 + 80, 3.8]],
  //   [[105, 4 + 100, 3.8], [117, 117 - 20, 3.8]],
  //   [[95, 121, 8], [117, 117, 3.8]]
  // ]
  // extSur2[4][0] = [
  //   [[120, 2, 0], [160, 0, 0]],
  //   [[120, 2 + 80, 0], [160, 0 + 80, 0]],
  //   [[120, 113.85 - 10, 0], [160, 113.85 - 10, 0]],
  //   [[140, 113.85, 0], [160, 113.85, 0]]
  // ]
  // extSur2[0][1] = [
  //   [[_0x, 18.5 + 120 + 20, 22.5], [15, 18.5 + 120 + 20, 22.5], [35, 18.5 + 120 + 20, 22.5], [40, 18.5 + 120 + 20, 22.5]],
  //   [[_0x, 18.5 + 120 + 67, 13.5], [15, 18.5 + 120 + 67, 13.5], [35, 18.5 + 120 + 67, 13.5], [50, 18.5 + 120 + 67, 13.5]]
  // ]
  // extSur2[0][2] = [
  //   [[_0x, 18.5 + 120 + 67 + 23 - (3 * Math.sqrt(3)), 9], [15, 18.5 + 120 + 67 + 23 - (3 * Math.sqrt(3)), 9], [35, 18.5 + 120 + 67 + 23 - (3 * Math.sqrt(3)), 9], [53, 18.5 + 120 + 67 + 23 - (3 * Math.sqrt(3)), 9]],
  //   [[_0x, 18.5 + 120 + 67 + 23, 0], [15, 18.5 + 120 + 67 + 23, 0], [35, 18.5 + 120 + 67 + 23, 0], [56, 18.5 + 120 + 67 + 23, 0]],
  //   [0.3, 0.3, 0.3, 0.3]
  // ]
  // extSur2[1][1] = [
  //   [[70, 15 + 120 + 20, 22.5], [67, 15 + 120 + 20, 22.5]],
  //   [[70, 17 + 120 + 67, 11.5], [82, 15 + 120 + 67, 10.5]]
  // ]

  // // const extSur = stitchQuadBezierSurfacesByTangent(
  // //   {
  // //     topLeft: extSur2[0][0],
  // //     topRight: extSur2[1][0],
  // //     bottomLeft: extSur2[0][1],
  // //     bottomRight: extSur2[1][1]
  // //   }
  // // )


  // const stitch = (vars) => {
  //   const averagePoint = (a: Vec3, b: Vec3) => (vec3.scale([0, 0, 0], vec3.add([0, 0, 0], a, b), 0.5))
  //   const transpose = matrix => matrix[0].map((col, i) => matrix.map(row => row[i]))

  //   const result = [];
  //   for (let i = 0; i < vars.length; i++) {
  //     for (let j = 0; j < vars[i].length; j++) {
  //       (result[i] = result[i] || [])
  //       // first tile
  //       if (i === 0 && j === 0) {
  //         result[i][j] = vars[i][j]
  //         continue
  //       }
  //       // stich horizontal
  //       if (j === 0) {
  //         const previous = result[i - 1][j]
  //         const current = vars[i][j]
  //         const getScale = row => {
  //           if (vars[i][j][row][2] === undefined) {
  //             return 1
  //           }
  //           return vars[i][j][row][2]
  //         }
  //         result[i][j] = [
  //           joinBezierByTangent(previous[0], current[0], getScale(0)),
  //           joinBezierByTangent(previous[1], current[1], getScale(1)),
  //           joinBezierByTangent(previous[2], current[2], getScale(2)),
  //           joinBezierByTangent(previous[3], current[3], getScale(3))
  //         ]
  //         continue
  //       }
  //       // stitch vertical
  //       if (i === 0) {
  //         const oneUp = result[i][j - 1];
  //         const current = vars[i][j];
  //         const byColumn = (c): BezierControlPoints => [oneUp[0][c], oneUp[1][c], oneUp[2][c], oneUp[3][c]]
  //         const bottomLeftByColumn = (column): [Vec3, Vec3] => ([current[0][column], current[1][column]])
  //         const getScale = (col): number => {
  //           if (current[2] === undefined)
  //             return 1
  //           if (current[2][col] === undefined)
  //             return 1
  //           return current[2][col]
  //         };
  //         result[i][j] = transpose([
  //           joinBezierByTangent(byColumn(0), bottomLeftByColumn(0), getScale(0)),
  //           joinBezierByTangent(byColumn(1), bottomLeftByColumn(1), getScale(1)),
  //           joinBezierByTangent(byColumn(2), bottomLeftByColumn(2), getScale(2)),
  //           joinBezierByTangent(byColumn(3), bottomLeftByColumn(3), getScale(3))
  //         ])
  //         continue
  //       }

  //       // stitch diagonal
  //       const upper = result[i][j - 1]
  //       const left = result[i - 1][j]
  //       const diagonal = result[i - 1][j - 1]
  //       const current = vars[i][j]
  //       result[i][j] = [
  //         [diagonal[3][3], upper[3][1], upper[3][2], upper[3][3]],
  //         [left[1][3], averagePoint(mirrorPointAroundCenter(left[1][2], left[1][3]), mirrorPointAroundCenter(upper[2][1], upper[3][1])), mirrorPointAroundCenter(upper[2][2], upper[3][2]), mirrorPointAroundCenter(upper[2][3], upper[3][3])],
  //         [left[2][3], mirrorPointAroundCenter(left[2][2], left[2][3]), current[0][0], current[0][1]],
  //         [left[3][3], mirrorPointAroundCenter(left[3][2], left[3][3]), current[1][0], current[1][1]],
  //       ]

  //     }
  //   }
  //   return result
  // }

  // const stitchedSurface = stitch(extSur2);

  // // scene.push(colorize([0, 0, 1], generateExtrudedSurface(extSur[0][0], 0.2)))
  // // scene.push(colorize([1, 0, 1], generateExtrudedSurface(extSur[0][1], 0.2)))
  // // scene.push(colorize([1, 0, 0], generateExtrudedSurface(extSur[1][0], 0.2)))
  // // scene.push(colorize([0, 1, 0], generateExtrudedSurface(extSur[1][1], 0.2)))
  // for (let i = 0; i < stitchedSurface.length; i++) {
  //   for (let j = 0; j < stitchedSurface[i].length; j++) {
  //     if (stitchedSurface[i][j] === undefined)
  //       continue
  //     scene.push(colorize([Math.random(), Math.random(), Math.random()], generateExtrudedSurface(stitchedSurface[i][j], 2, { surfaceFidelity: 3 })))
  //   }
  // }
  // // TODO: positive second trim is problematic..., as second trim cannot be absolute.
  // //  Suggestion: take a point on starting line on the trim point, take a normal oriented to the next line - the point where crossing occurs, will give us the new trim point
  // //  This should be done by "trim a b c d should be normal based"
  // // const mainBoard = generateExtrudedSurface(surface, 0.2, { trim: [0, 0, 0, 0], surfaceFidelity: 25 })

  // // const { Key_padding: keyPadding, Key_size: keySize, Key_small_size_multiplier: keySmallSizeMultiplier } = extendedParamsWithVariables

  // // const keys = [
  // //   generateExtrudedSurface(surface, [1, 1], { trim: [keyPadding, keyPadding + (keySize * keySmallSizeMultiplier), keyPadding, keySize], surfaceFidelity: 25, normalTrimRight: true }) as Geom3,
  // //   generateExtrudedSurface(surface, [1, 1], { trim: [keyPadding, keyPadding + (keySize * keySmallSizeMultiplier), (1 * keyPadding) + keySize, (1 * keyPadding) + (2 * keySize)], surfaceFidelity: 25, normalTrimRight: true, normalTrimLeft: true }) as Geom3,
  // // ]

  // // scene.push(keys.map(a => colorize([1, 0, 0], a)))

  // // scene.push(subtract([
  // //   mainBoard as Geom3,
  // //   ...keys
  // // ]))

  scene.push(additionalGeometry)

  return mirror({ normal: [1, 0, 0] }, scene)
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
    ...{arc_0_0, arc_0_1, arc_0_2},
    ...{arc_1_0, arc_1_1},
    ...{arc_2_0},
    ...{arc_3_0}
  }
}

export const design = ({ addObject, addDebugObject }: SceneManipulation) => {
  const surfacePatches = prepareSurfacePatches()

  Object.values(surfacePatches)
    .map(patch => generateSurface(patch))
    .map(surface => drawSurface(surface, { orientation: 'inward' }))
    .forEach(surfaceObject => addDebugObject(surfaceObject))

}