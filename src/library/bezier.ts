/* eslint-disable @typescript-eslint/no-unused-vars */
import { Vec3 } from '@jscad/modeling/src/maths/types'
import { sphere } from '@jscad/modeling/src/primitives'
import { colorize, RGB } from '@jscad/modeling/src/colors'
import { scale, subtract, add, distance } from './vector3'
import { Geometry } from '@jscad/modeling/src/geometries/types'
import RecursiveArray from '@jscad/modeling/src/utils/recursiveArray'
import { ByteLengthQueuingStrategy } from 'stream/web'

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

const numberSum: (a: number, b: number) => number = (a, b) => a + b

export const bezierLength = (controlPoints: BezierControlPoints, steps: number = 10): number => {
  const generatedPoints = generatePointsForCurve(steps, controlPoints)
  const length = generateLengthsForCurvePoints(generatedPoints)

  return length.map(a => a.distance).reduce(numberSum, 0)
}

export const weightedSteps = (controlPoints: BezierControlPoints[], fidelity: number = 100): number[] => {
  const lengths = controlPoints.map(controlPoint => bezierLength(controlPoint))
  const totalLength = lengths.reduce(numberSum, 0)

  return lengths.map(length => length / totalLength)
    .map(part => part * fidelity)
    .map(part => Math.ceil(part))
    .map(part => Math.max(part, 1))
}

export const mapCurveTrimToStepValues = (
  controlPoints: BezierControlPoints,
  {
    fidelity = 100,
    trim = [0, 0]
  }: { fidelity?: number, trim?: [number, number] } = {}
): [number, number] => {
  const generatedPoints = generatePointsForCurve(fidelity, controlPoints)
  const lengths = generateLengthsForCurvePoints(generatedPoints)

  const totalLength = bezierLength(controlPoints, fidelity)
  // console.log(totalLength, trim)
  const trim2 = [...trim]
  if (trim2[0] < 0)
    trim2[0] = totalLength + trim2[0]
  if (trim[1] < 0)
    trim2[1] = totalLength + trim2[1]

  const result: [number, number] = [
    trim2[0] === 0 ? 0 : getStepForTrim(trim2[0], lengths),
    trim2[1] === 0 ? 1 : getStepForTrim(trim2[1], lengths)
  ]

  if (result[0] > result[1])
    throw new Error("Cannot trim so that start is further than a finish")

  return result
}

export function getStepForTrim(trim: number, lengths: { distance: number, cumulativeDistance: number, steps: [number, number] }[]): number {
  const pickedElements = lengths
    .sort((a, b) => (a.cumulativeDistance > b.cumulativeDistance) ? 1 : -1)
    .filter(l => l.cumulativeDistance >= trim)
    .filter(l => (l.cumulativeDistance - l.distance) <= trim)
  const trimSegment = pickedElements[pickedElements.length - 1]
  if (trimSegment === undefined)
    throw new Error(`${trim}, ${JSON.stringify(lengths[lengths.length - 1])}, ${lengths.map(a => a.distance).reduce((a, b) => a + b, 0)}`)
  // console.log(
  //   lengths,
  //   lengths.length,
  //   trim,
  //   lengths
  //     .sort((a, b) => (a.cumulativeDistance > b.cumulativeDistance) ? 1 : -1)
  //     .filter(l => l.cumulativeDistance >= trim)
  //     .filter(l => (l.cumulativeDistance - l.distance) <= trim)
  // )
  const startDistance = trimSegment.cumulativeDistance - trimSegment.distance
  const stepScale = (trim - startDistance) / (trimSegment.distance)
  const result = (trimSegment.steps[0] + ((trimSegment.steps[1] - trimSegment.steps[0]) * stepScale))
  return result
}

function generatePointsForCurve(steps: number, controlPoints: BezierControlPoints) {
  const generatedPoints: { point: Vec3, step: number }[] = []
  const singleStep = 1 / steps
  for (let i = 0; i <= 1; i += singleStep) {
    generatedPoints.push({ point: bezier3(i, controlPoints), step: i })
  }

  return generatedPoints
}

function generateLengthsForCurvePoints(generatedPoints: { point: Vec3, step: number }[]): { distance: number, cumulativeDistance: number, steps: [number, number] }[] {
  const length: { distance: number, steps: [number, number], cumulativeDistance: number }[] = []
  let cumulativeDistance = 0
  for (let i = 0; i < generatedPoints.length - 1; i++) {
    const d: number = distance(generatedPoints[i].point, generatedPoints[i + 1].point)
    const s: [number, number] = [generatedPoints[i].step, generatedPoints[i + 1].step]
    cumulativeDistance += d
    length.push(
      {
        distance: d,
        steps: s,
        cumulativeDistance: cumulativeDistance
      }
    )
  }

  // console.log(cumulativeDistance, length.reduce((a, b) => a + b.distance, 0))

  return length
}

export const approximateStepToFindPointOnSecondCurveViaNormal: any = (
  targetCurveControlPoints: BezierControlPoints,
  { originalPointOrigin, originalPointTangentVector, iteration },
  bisectMinimum: number = 0, bisectMaximum: number = 1,
  previousResult = undefined,
  precision = 0.05
) => {
  if (iteration > 5) {
    return previousResult
  }

  const guessedStepValue = ((bisectMaximum - bisectMinimum) / 2) + bisectMinimum

  if (guessedStepValue < 0)
    throw new Error("This should never happen - guessed step value < 0: " + guessedStepValue)

  const pointOnSecondCurve = bezier3(guessedStepValue, targetCurveControlPoints)
  const distanceToTangentPlane = originalPointTangentVector[0] * (pointOnSecondCurve[0] - originalPointOrigin[0]) + originalPointTangentVector[1] * (pointOnSecondCurve[1] - originalPointOrigin[1]) + originalPointTangentVector[2] * (pointOnSecondCurve[2] - originalPointOrigin[2])

  const result = { guessedStepValue, distanceToTangentPlane }

  if (Math.abs(distanceToTangentPlane) < precision)
    return result

  const guessBetweenCurrentGuessAndMaximum = approximateStepToFindPointOnSecondCurveViaNormal(targetCurveControlPoints, { originalPointOrigin, originalPointTangentVector, iteration: iteration + 1 }, guessedStepValue, bisectMaximum, result)
  const guessBetweenCurrentGuessAndMinimum = approximateStepToFindPointOnSecondCurveViaNormal(targetCurveControlPoints, { originalPointOrigin, originalPointTangentVector, iteration: iteration + 1 }, bisectMinimum, guessedStepValue, result)
  return [
    guessBetweenCurrentGuessAndMaximum,
    guessBetweenCurrentGuessAndMinimum
  ].reduce((p, c) => Math.abs(p.distanceToTangentPlane) < Math.abs(c.distanceToTangentPlane) ? p : c)
}

// export function bezier_get_point_at_unit(points, distance, segments=20) = calculate_bezier_point_with_normal(distance/polyline_length(get_bezier_points(segment_bezier3(points, segments))), points);
