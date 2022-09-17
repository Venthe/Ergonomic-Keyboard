import { BezierControlPoints } from './bezier'
import { FrameContext } from './Frame'
import { toMatchCloseTo } from 'jest-matcher-deep-close-to'

expect.extend({ toMatchCloseTo })

it('FrameContext', () => {
  // Given
  const controlPoints: BezierControlPoints = [
    [0, 0, 0],
    [3, 0, 3],
    [7, 0, 7],
    [10, 10, 10]
  ]

  // when
  const frameContext = FrameContext.generateFramesForBezier(controlPoints, 1)

  // Then
  expect(frameContext.frames).toMatchCloseTo([
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
  ], 5)
  expect(frameContext.frames).toHaveLength(2)
})
