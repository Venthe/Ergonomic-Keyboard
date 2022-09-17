import { BezierControlPoints, bezierLength } from './bezier'
import { distance } from './vector3'

it('Length 1', () => {
  // Given
  const controlPoints: BezierControlPoints = [
    [0, 0, 0],
    [3, 3, 3],
    [7, 7, 7],
    [10, 10, 10]
  ]

  // when
  const length = bezierLength(controlPoints)

  // Then
  expect(length).toBeCloseTo(distance(controlPoints[0], controlPoints[3]))
})
