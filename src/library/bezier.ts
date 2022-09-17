/* eslint-disable @typescript-eslint/no-unused-vars */
import { Vec3 } from '@jscad/modeling/src/maths/types'
import { sphere } from '@jscad/modeling/src/primitives'
import { colorize, RGB } from '@jscad/modeling/src/colors'
import { scale, subtract, add, distance } from './vector3'
import { Geometry } from '@jscad/modeling/src/geometries/types'
import RecursiveArray from '@jscad/modeling/src/utils/recursiveArray'

export type BezierControlPoints = [Vec3, Vec3, Vec3, Vec3]

/**
 *   1 * cP[0] * (1-step)^3
 * + 3 * cP[1] * (1-step)^2 * step
 * + 3 * cP[2] * (1-step)   * step^2
 * + 1 * cP[3]              * step^3
 */
export const bezier3 = (step: number, controlPoints: BezierControlPoints): Vec3 =>
  add(
    add(
      add(
        scale(controlPoints[0], (1 * Math.pow((1 - step), 3))),
        scale(controlPoints[1], (3 * Math.pow((1 - step), 2) * step))
      ),
      scale(controlPoints[2], (3 * (1 - step) * Math.pow(step, 2)))
    ),
    scale(controlPoints[3], (1 * Math.pow(step, 3)))
  )

export const joinBezierByTangent = (originalBezierControlPoints: BezierControlPoints, targetBezier: [Vec3, Vec3], scalar: number = 1): BezierControlPoints =>
  [
    originalBezierControlPoints[3],
    add(scale(subtract(originalBezierControlPoints[2], originalBezierControlPoints[3]), -1 * scalar), originalBezierControlPoints[3]),
    targetBezier[0],
    targetBezier[1]
  ]

export const drawBezierControlPoints = (points: BezierControlPoints, size: number = 2): RecursiveArray<Geometry> => {
  const drawSphere = (color: RGB, center: Vec3, radius: number = size): Geometry => colorize(color, sphere({ center, radius }))
  return [
    drawSphere([0, 1, 0], points[0]),
    drawSphere([1, 0, 0], points[1], size * 0.6),
    drawSphere([1, 0, 0], points[2], size * 0.6),
    drawSphere([0, 1, 0], points[3])
  ]
}

export const bezierLength = (controlPoints: BezierControlPoints, steps: number = 10): number => {
  const generatedPoints: Vec3[] = []
  const singleStep = 1 / steps
  for (let i = 0; i < 1; i += singleStep) {
    generatedPoints.push(bezier3(i, controlPoints))
  }

  let length = 0
  for (let i = 0; i < generatedPoints.length - 1; i++) {
    length += distance(generatedPoints[i], generatedPoints[i + 1])
  }

  return length
}

// export function bezier_get_point_at_unit(points, distance, segments=20) = calculate_bezier_point_with_normal(distance/polyline_length(get_bezier_points(segment_bezier3(points, segments))), points);
