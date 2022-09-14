export const range = (size: number, startAt: number = 0, incrementBy: number = 1): readonly number[] =>
  [...Array(size).keys()].map(i => i + startAt).map(i => i * incrementBy)
