import { colorize, RGB, RGBA } from '@jscad/modeling/src/colors'
import { Geometry } from '@jscad/modeling/src/geometries/types'
import { Vec3 } from '@jscad/modeling/src/maths/vec3'
import hulls from '@jscad/modeling/src/operations/hulls'
import { sphere } from '@jscad/modeling/src/primitives'
import RecursiveArray from '@jscad/modeling/src/utils/recursiveArray'
import { BezierControlPoints, drawBezierControlPoints, weightedSteps } from './bezier'
import { FrameContext } from './Frame'
import { add, scale } from './vector3'
import { ExtendedParams } from '../design/design.parameters'

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
  size?: number
  invertNormals?: boolean
  normalSize?: number
  tangentGirth?: number
  normalGirth?: number
  tangentSize?: number
  binormalSize?: number
  binormalGirth?: number
  drawBinormal?: boolean
}

export const drawPoints = (
  frameContext: FrameContext,
  params: ExtendedParams,
  {
    color = [1, 1, 1],
    drawNormal = false,
    drawTangent = false,
    drawControlPoints = false,
    drawControlLine = false,
    size = params.Debug_point_base_size,
    tangentGirth = params.Debug_point_base_size,
    normalGirth = params.Debug_point_base_size,
    invertNormals = false,
    normalSize = 10,
    tangentSize = 10,
    binormalGirth = params.Debug_point_base_size,
    binormalSize = 10,
    drawBinormal = false
  }: DrawPointsOptions = {}
): RecursiveArray<Geometry> | Geometry => {
  const result: RecursiveArray<Geometry> | Geometry = []

  result.push(colorize(color, drawPolyline(frameContext.frames.map(frame => frame.origin), size * 0.4)))

  if (drawBinormal) {
    result.push(colorize([0, 0, 1], frameContext.frames.map(frame => drawLine(frame.origin, add(frame.origin, scale(frame.binormal, binormalSize)), binormalGirth))))
  }

  if (drawNormal) {
    result.push(colorize([1, 0, 1], frameContext.frames.map(frame => drawLine(frame.origin, add(frame.origin, scale(frame.normal, (invertNormals ? -1 : 1) * normalSize)), normalGirth))))
  }

  if (drawTangent) {
    result.push(colorize([0, 0, 0], frameContext.frames.map(frame => drawLine(frame.origin, add(frame.origin, scale(frame.tangent, tangentSize)), tangentGirth))))
  }

  if (drawControlLine) {
    result.push(
      colorize([1, 1, 0, 0.6],
        drawPolyline(frameContext.controlPoints, size * 0.5)
      )
    )
  }

  if (drawControlPoints) {
    result.push(drawBezierControlPoints(frameContext.controlPoints, size * 1.2))
  }

  return result
}

export const drawContinuousPoints = (controlPoints: BezierControlPoints[], { fidelity = 100 }: { color?: RGB | RGBA, fidelity?: number }): FrameContext[] => {
  const weighted = weightedSteps(controlPoints, fidelity)

  const contexts: FrameContext[] = []

  for (let i = 0; i < weighted.length; i++) {
    contexts.push(FrameContext.generateRotationMinimizingFrames(controlPoints[i], weighted[i], i === 0 ? undefined : contexts[i - 1].lastFrame()))
  }

  return contexts
}
