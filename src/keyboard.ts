import { Geometry } from '@jscad/modeling/src/geometries/types'
import { Vec3 } from '@jscad/modeling/src/maths/vec3'
import { mirror, translate } from '@jscad/modeling/src/operations/transforms'
import RecursiveArray from '@jscad/modeling/src/utils/recursiveArray'
import { Entrypoint, MainFunction, ParameterDefinitions } from './jscad'
import { ExtendedParams, Params, Variables } from './keyboardTypes'
import { BezierControlPoints, joinBezierByTangent } from './library/bezier'
import { drawPoints } from './library/draw'
import { constructionLine } from './library/utilities'

const getParameterDefinitions = (): ParameterDefinitions => [
  { name: 'keys', type: 'group', caption: 'Keys' },
  { name: 'Key_padding', type: 'number', initial: 4, min: 0, step: 1, max: 6, caption: 'Distance between keys' },
  { name: 'Key_size', type: 'number', initial: 14.75, min: 4, step: 0.25, max: 20, caption: ' Regular key size' },
  { name: 'Keyboard_offset', type: 'number', initial: 6, min: 0, step: 1, max: 8 },
  { name: 'Key_small_size_multiplier', type: 'number', initial: 0.6, min: 0.5, step: 0.1, max: 1 },

  { name: 'ergonomic', type: 'group', caption: 'Keyboard (Ergonomic)' },
  { name: 'Keyboard_depth_mult', caption: 'How deeper should keyboard be in the middle?', type: 'number', initial: 1.05, min: 1, step: 0.01, max: 1.2 },
  { name: 'Keyboard_arc_origin', caption: 'How deep should keyboard be?', type: 'Vec3', initial: [0, 18.5, 21.25] },
  { name: 'Keyboard_wing_angle', caption: 'How steep keyboard angle should be?', type: 'number', initial: 12.5, min: 0, step: 0.5, max: 45 },
  { name: 'Keyboard_wing_angle_origin_offset', caption: 'Where the angle of keyboard wing should start', type: 'number', initial: -18, min: -20, step: 0.5, max: 20 },
  { name: 'Arc_height_max', type: 'number', initial: 22.5, min: 0, max: 30 },
  { name: 'Arc_width', type: 'number', initial: 160 },

  { name: 'debug', type: 'group', caption: 'Debug' },
  { name: 'Enable_debug', caption: 'Enable all debug methods of showing points', type: 'boolean', initial: true },
  { name: 'Debug_point_base_size', caption: 'How large a base point should be?', type: 'number', initial: 1 }
]

const variables: (params: Params) => Variables = (params) =>
  ((keySmallSize: number): Variables => ({
  // Origin for the sketch
    origin: [0, 0, 0],
    keySmallSize,
    // _v_keyboard_wing_angle_origin=[0, Keyboard_wing_angle_origin_offset, 0];
    baseKeyboardHeight: params.Keyboard_offset * 2 + 5 * params.Key_size + 5 * params.Key_padding + keySmallSize
  }))(params.Key_size * params.Key_small_size_multiplier)

const blockKeyboardArc = (params: ExtendedParams): RecursiveArray<Geometry> | Geometry => {
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

function blockStraight (params: ExtendedParams): RecursiveArray<Geometry> | Geometry {
  const result: RecursiveArray<Geometry> | Geometry = []

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

function arcSurface (params: ExtendedParams): RecursiveArray<Geometry> | Geometry {
  const result: RecursiveArray<Geometry> | Geometry = []
  const middlePointWidest =
    params.baseKeyboardHeight * params.Keyboard_depth_mult + params.Keyboard_arc_origin[1]

  const middleLine1: BezierControlPoints = [
    params.Keyboard_arc_origin,
    [0, middlePointWidest * 0.65, params.Keyboard_arc_origin[2]],
    [0, middlePointWidest * 0.85, params.Arc_height_max * 0.99],
    [0, middlePointWidest, params.Arc_height_max]
  ]
  const middleLine2 = joinBezierByTangent(middleLine1, [
    [0, (middlePointWidest + 67) * 0.90, params.Arc_height_max * 1.02],
    [0, middlePointWidest + 67, 13.50]
  ], 0.8)
  const middleLine3 = joinBezierByTangent(middleLine2, [
    [0, middleLine2[3][1] + 21, middleLine2[3][2] * 0.3],
    [0, middleLine2[3][1] + 23, 0]
  ], 0.7)

  result.push(
    drawPoints(middleLine1, params, { color: [1, 0, 0] }),
    drawPoints(middleLine2, params, { color: [0, 0, 1] }),
    drawPoints(middleLine3, params, { color: [0, 0, 1] })
  )

  const keyboardArcEnd: Vec3 = [params.Arc_width, 0, 0]
  const keyboardArcEnd2: Vec3 = [params.Arc_width, params.baseKeyboardHeight, 0]

  const endLine: BezierControlPoints = [
    keyboardArcEnd,
    [keyboardArcEnd[0], (keyboardArcEnd2)[1] / 3, (keyboardArcEnd2)[2] / 3],
    [
      keyboardArcEnd2[0], (keyboardArcEnd2)[1] * 2 / 3,
      (keyboardArcEnd2)[2] * 2 / 3
    ],
    keyboardArcEnd2
  ]

  result.push(drawPoints(endLine, params, { color: [1, 0, 0] }))

  const backLine1: BezierControlPoints = [
    middleLine1[0],
    [2, 18.5, middleLine1[0][2]],
    [5, 18.4, middleLine1[0][2]],
    [8, 18, middleLine1[0][2]]
  ]
  const backLine2: BezierControlPoints = joinBezierByTangent(backLine1, [
    [35, 13, 17.5],
    [48.25, 10.5, 14]
  ], 1)
  const backLine3: BezierControlPoints = joinBezierByTangent(backLine2, [
    [75, 5.7, 8],
    [85.75, 4.5, 6]
  ], 1)
  const backLine4: BezierControlPoints = joinBezierByTangent(backLine3, [
    [110, 2, 2.5],
    [123.25, 1.2, 1]
  ])
  const backLine5 = joinBezierByTangent(backLine4, [
    [endLine[0][0] - 18, 0, 0],
    [endLine[0][0] - 16, 0, 0]
  ], 0.5)
  const backLine6: BezierControlPoints = joinBezierByTangent(backLine5, [
    [endLine[0][0] - 5, 0, endLine[0][2]],
    endLine[0]
  ])
  const backLines: BezierControlPoints[] = [backLine1, backLine2, backLine3, backLine4, backLine5, backLine6]

  result.push(backLines.map(line => drawPoints(line, params, { color: [1, 0, 0] })))

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

const main: MainFunction = (params: Params) => {
  const scene: RecursiveArray<Geometry> | Geometry = []
  const extendedParamsWithVariables: ExtendedParams = { ...params, ...variables(params) }

  if (params.Enable_debug) { console.debug('Parameters:', extendedParamsWithVariables) }

  const keyboardArc = blockKeyboardArc(extendedParamsWithVariables)
  scene.push(
    keyboardArc,
    mirror({ normal: [1, 0, 0] }, keyboardArc)
  )

  scene.push(
    translate([params.Arc_width + params.Key_padding, 0, 0], blockStraight(extendedParamsWithVariables))
  )

  const arc = arcSurface(extendedParamsWithVariables)
  scene.push(
    arc,
    mirror({ normal: [1, 0, 0] }, arc)
  )

  return mirror({ normal: [1, 0, 0] }, scene)
}

const entrypoint: Entrypoint = {
  main,
  getParameterDefinitions
}

module.exports = entrypoint
