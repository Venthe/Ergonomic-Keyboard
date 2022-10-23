import { BezierControlPoints, bezierLength, getStepForTrim } from './bezier'
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

describe("getStepForTrim", () => {
  it('1', () => {
    // Given
    const lengths: { distance: number, cumulativeDistance: number, steps: [number, number] }[] = [
      { distance: 1, cumulativeDistance: 1, steps: [0, 1] }
    ]

    // when
    const step = getStepForTrim(0, lengths)

    // Then
    expect(step).toBeCloseTo(0)
  })
  it('2', () => {
    // Given
    const lengths: { distance: number, cumulativeDistance: number, steps: [number, number] }[] = [
      { distance: 1, cumulativeDistance: 1, steps: [0, 1] }
    ]

    // when
    const step = getStepForTrim(1, lengths)

    // Then
    expect(step).toBeCloseTo(1)
  })
  it('3', () => {
    // Given
    const lengths: { distance: number, cumulativeDistance: number, steps: [number, number] }[] = [
      { distance: 1, cumulativeDistance: 1, steps: [0, 1] }
    ]

    // when
    const step = getStepForTrim(0.5, lengths)

    // Then
    expect(step).toBeCloseTo(0.5)
  })
  it('4', () => {
    // Given
    const lengths: { distance: number, cumulativeDistance: number, steps: [number, number] }[] = [
      { distance: 1, cumulativeDistance: 1, steps: [0, 0.5] },
      { distance: 1, cumulativeDistance: 2, steps: [0.5, 1] }
    ]

    // when
    const step = getStepForTrim(1, lengths)

    // Then
    expect(step).toBeCloseTo(0.5)
  })
  it('5', () => {
    // Given
    const lengths: { distance: number, cumulativeDistance: number, steps: [number, number] }[] = [
      { distance: 1, cumulativeDistance: 1, steps: [0, 0.5] },
      { distance: 1, cumulativeDistance: 2, steps: [0.5, 1] }
    ]

    // when
    const step = getStepForTrim(1.5, lengths)

    // Then
    expect(step).toBeCloseTo(1.5 / 2)
  })
})