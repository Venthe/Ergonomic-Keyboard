import { BezierControlPoints } from './bezier'
import { Frame } from './Frame'
import { toBeDeepCloseTo } from 'jest-matcher-deep-close-to'

expect.extend({ toBeDeepCloseTo })

it('frame', () => {
  // Given
  const controlPoints: BezierControlPoints = [
    [0, 0, 0],
    [3, 0, 3],
    [7, 0, 7],
    [10, 10, 10]
  ]

  // when
  const frames = Frame.generateFramesForBezier(controlPoints, 1)

  // Then
  expect(frames).toBeDeepCloseTo([
    {
      step: 0,
      origin: [0, 0, 0],
      tangent: [0.707107, 0, 0.707107],
      rotationalAxis: [0, 0, 0],
      normal: [0, 0, 0]
    },
    {
      step: 1,
      origin: [10, 10, 10],
      tangent: [0.276172, 0.920575, 0.276172],
      rotationalAxis: [0, 0, 0],
      normal: [0, 0, 0]
    }
  ])
  expect(frames).toHaveLength(2)
})
