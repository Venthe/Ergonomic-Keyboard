import { colorize, RGB, RGBA } from '@jscad/modeling/src/colors'
import { Geometry } from '@jscad/modeling/src/geometries/types'
import { Vec3 } from '@jscad/modeling/src/maths/vec3'
import hulls from '@jscad/modeling/src/operations/hulls'
import { sphere } from '@jscad/modeling/src/primitives'
import RecursiveArray from '@jscad/modeling/src/utils/recursiveArray'
import { ExtendedParams } from '../keyboardTypes'
import { BezierControlPoints, drawBezierControlPoints } from './bezier'
import { FrameContext } from './Frame'
import { add, scale } from './vector3'

export const drawLine = (a: Vec3, b: Vec3, size = 0.5): Geometry => {
  return hulls.hull(
    sphere({ center: a, radius: size }),
    sphere({ center: b, radius: size })
  )
}

export const drawPolyline = (points: Vec3[], size = 1): RecursiveArray<Geometry> => {
  const result: RecursiveArray<Geometry> = []

  for (let i = 0; i < points.length - 1; i++) {
    result.push(drawLine(points[i], points[i + 1], size))
  }

  return result
}

export interface DrawPointsOptions {
  color?: RGB | RGBA
  drawNormal?: boolean
  drawTangent?: boolean
  drawControlPoints?: boolean
  drawControlLine?: boolean
  steps?: number
}

// TODO: Continuous line between frames
export const drawPoints = (
  points: BezierControlPoints,
  params: ExtendedParams,
  {
    color = [1, 1, 1],
    drawNormal = false,
    drawTangent = false,
    drawControlPoints = false,
    drawControlLine = false,
    steps = 10
  }: DrawPointsOptions
): RecursiveArray<Geometry> | Geometry => {
  const result: RecursiveArray<Geometry> | Geometry = []

  const frameContext = FrameContext.generateRotationMinimizingFrames(points, steps)

  result.push(colorize(color, drawPolyline(frameContext.frames.map(frame => frame.origin), params.Debug_point_base_size * 0.4)))

  if (drawNormal) {
    result.push(colorize([1, 0, 1], frameContext.frames.map(frame => drawLine(frame.origin, add(frame.origin, scale(frame.normal, 50)), params.Debug_point_base_size))))
  }

  if (drawTangent) {
    result.push(colorize([0, 0, 0], frameContext.frames.map(frame => drawLine(frame.origin, add(frame.origin, scale(frame.tangent, 50)), params.Debug_point_base_size))))
  }

  if (drawControlLine) {
    result.push(
      colorize([1, 1, 0, 0.6],
        drawPolyline(frameContext.controlPoints, params.Debug_point_base_size * 0.5)
      )
    )
  }

  if (drawControlPoints) {
    result.push(drawBezierControlPoints(frameContext.controlPoints, 1.2))
  }

  return result
}
