import { Frame, FrameContext } from './Frame'
import { range } from './collections'
import { BezierControlPoints } from './bezier'
import { Vec3 } from '@jscad/modeling/src/maths/vec3'
import RecursiveArray from '@jscad/modeling/src/utils/recursiveArray'
import { Geometry } from '@jscad/modeling/src/geometries/types'
import { colorize, RGB, RGBA } from '@jscad/modeling/src/colors'
import { add, cross, normalize, scale, subtract } from './vector3'
import { polyhedron, sphere } from '@jscad/modeling/src/primitives'
import { BezierSurfaceControlPoints, FaceIndices, Surface, SurfacePoint } from './surface'
import { translate } from '@jscad/modeling/src/operations/transforms'
import { drawLine } from './draw'
import { moveOriginByExtrusionSize, _extrudeSurface } from './surfaceExtrusion'
import { additionalGeometry } from '../keyboard'

interface QuadFace {
  faces: QuadIndices
  points: [Vec3, Vec3, Vec3, Vec3]
  normals: [Vec3, Vec3, Vec3, Vec3]
}

type QuadIndices = [FaceIndices, FaceIndices]

function mapIndicesToSingleFace(allOrigins: Vec3[], quad: QuadIndices): QuadFace {
  // enrich with normals for each vertex
  const v1: Vec3 = allOrigins[quad[0][0]]
  const v2: Vec3 = allOrigins[quad[0][1]]
  const v3: Vec3 = allOrigins[quad[0][2]]
  const v4: Vec3 = allOrigins[quad[1][2]]

  const calculateNormal = (c: Vec3, a: Vec3, b: Vec3): Vec3 => normalize(cross(subtract(b, a), subtract(c, a)))
  const n1 = calculateNormal(v3, v1, v2)
  const n2 = calculateNormal(v1, v2, v4)
  const n3 = calculateNormal(v2, v4, v3)
  const n4 = calculateNormal(v4, v3, v1)

  return {
    faces: quad,
    points: [v1, v2, v3, v4],
    normals: [n1, n2, n3, n4]
  }
}

function calculateNormals(quadFaces: QuadFace[]): { [key: string]: { normal: Vec3 } } {
  return Object.entries(quadFaces.reduce((accumulator: { [origin: string]: { origin: Vec3, normals: Vec3[] } }, current: QuadFace) => {
    for (let i = 0; i < 4; i++) {
      const currentElement: { origin: Vec3, normals: Vec3[] } | undefined = accumulator[current.points[i].toString()]
      const workingElement = currentElement !== undefined ? currentElement : {
        origin: undefined,
        normals: [] as Vec3[]
      }
      workingElement.origin = current.points[i]
      workingElement.normals.push(current.normals[i])
      accumulator[current.points[i].toString()] = workingElement as { origin: Vec3, normals: Vec3[] }
    }

    return accumulator
  }, {}))
    .map(([k, v]) => ({
      origin: v.origin,
      // TODO: calculate normal for the corner point to point more inward
      normal: average(v.normals)
    }))
    .reduce<{ [key: string]: { normal: Vec3 } }>((a, v) => {
      a[v.origin.toString()] = {
        normal: v.normal
      }
      return a
    }, {})
}

function generateQuadFaces(contextsForGeneratedLines: FrameContext[], pointsPerContext: number, uniqueOrigins: Vec3[]) {
  return range(contextsForGeneratedLines.length - 1)
    .map(i => range(pointsPerContext - 1)
      .map(idx => generateQuadIndices(idx, i, pointsPerContext))
      .map((quad: QuadIndices): QuadFace => mapIndicesToSingleFace(uniqueOrigins, quad))
    )
    .flat()
    .flat()
}

export const generateSurface = (
  surfaceControlPoints: BezierSurfaceControlPoints,
  {
    // trim = [0, 0, 0, 0],
    surfaceFidelity = 10,
    // extrude = 0
  }: {
    surfaceFidelity?: number,
    // trim?: [number, number, number, number],
    // extrude?: number
  } = {}
): Surface<SurfacePoint> & { horizontalPoints: [Frame, Frame] } => {
  const contextsForOriginalControlPoints: FrameContext[] = getFramesForOriginalControlPoints(surfaceControlPoints, surfaceFidelity) // , { trim: [trim[0], trim[1]] }
  const pointsPerContext = calculatePointsPerContext(contextsForOriginalControlPoints)
  const contextsForGeneratedLines = generateIntermediateFrames(contextsForOriginalControlPoints, surfaceFidelity) // , { trim: [trim[2], trim[3]] }
  const uniqueOrigins: Vec3[] = getUniqueOriginsFromContext(contextsForGeneratedLines)
  const quadFaces: QuadFace[] = generateQuadFaces(contextsForGeneratedLines, pointsPerContext, uniqueOrigins)

  const result = {
    points: contextsForGeneratedLines.flat().map(f => f.frames).flat().map<SurfacePoint>(f => ({
      origin: f.origin,
      normal: (calculateNormals(quadFaces))[f.origin.toString()].normal,
      // FIXME: isEdge
      isEdge: f.isBorder
    })),
    faces: quadFaces.map(f => f.faces).flat(),
    additionalGeometry: []
  }

  return {
    ...result,
    points: result.points, // s.map(p => ({ ...p, origin: moveOriginByExtrusionSize(p.origin, p.normal, extrude) })),
    horizontalPoints: [contextsForGeneratedLines[0].frames[0], contextsForGeneratedLines[0].frames[surfaceFidelity]]
  }
}

export function drawSurface(
  surfaceData: Surface<SurfacePoint>,
  { drawSurface = true, ...options }: {
    colors?: Array<RGB | RGBA>
    orientation?: 'outward' | 'inward'
    drawNormal?: boolean
    drawBorder?: boolean
    drawSurface?: boolean
    drawPoints?: boolean
  } = {}): Geometry | RecursiveArray<Geometry> {

  const {
    points,
    faces
  }: Surface<SurfacePoint> = surfaceData
  const result = []

  if (drawSurface) {
    const surface = polyhedron({
      points: points.map(p => p.origin),
      faces,
      ...options
    })
    result.push(surface)
  }

  if (options?.drawPoints) {
    const orig = points.map(p => p.origin).map(p => sphere({ center: p, radius: 0.2 }))
    orig.forEach(el => result.push(el))
  }

  if (options?.drawNormal) {
    const drawNormal = (p: SurfacePoint, { invert = false }: { invert?: boolean } = {}): Geometry => translate(p.origin, drawLine([0, 0, 0], scale(p.normal, (invert ? -1 : 1) * 0.3), 0.1))
    const normals = points.map(p => drawNormal(p, { invert: true }))
    result.push(normals)
  }

  if (options?.drawBorder) {
    result.push(surfaceData.points.filter(p => p.isEdge).map(p => sphere({
      center: p.origin,
      radius: 0.2
    })))
  }

  return result
}

const average = (vectors: Vec3[]): Vec3 => scale(vectors.reduce(add, [0, 0, 0]), 1 / vectors.length)

const calculatePointsPerContext = (contextsForOriginalControlPoints: FrameContext[]): number =>
  contextsForOriginalControlPoints[0].frames.length

const getFramesForOriginalControlPoints = (surfaceControlPoints: BezierSurfaceControlPoints, surfaceFidelity: number,
  {
    trim = [0, 0]
  }: { trim?: [number, number] } = {}): FrameContext[] =>
  surfaceControlPoints.map(controlPoints => FrameContext.generateRotationMinimizingFrames(controlPoints, surfaceFidelity, undefined, { trim }))

const generateIntermediateFrames = (contextsForOriginalControlPoints: FrameContext[], surfaceFidelity: number,
  {
    trim = [0, 0]
  }: { trim?: [number, number] } = {}): FrameContext[] => {
  const originForFrameInContexts = (i: number, idx: number): Vec3 => contextsForOriginalControlPoints[i].frames[idx].origin
  const controlPointsForGeneratedLines: BezierControlPoints[] = range(calculatePointsPerContext(contextsForOriginalControlPoints)).map(p => [originForFrameInContexts(0, p), originForFrameInContexts(1, p), originForFrameInContexts(2, p), originForFrameInContexts(3, p)])
  let frameContexts = controlPointsForGeneratedLines.map(controlPointsForGeneratedLine => FrameContext.generateRotationMinimizingFrames(controlPointsForGeneratedLine, surfaceFidelity, undefined, { trim }))
  frameContexts[0].frames.forEach(f => f.setAsBorder())
  frameContexts[frameContexts.length - 1].frames.forEach(f => f.setAsBorder())
  return frameContexts
}

const getUniqueOriginsFromContext = (contexts: FrameContext[]): Vec3[] => [
  ...new Set<Vec3>(
    range(contexts.length)
      .map(i => contexts[i].getOrigins())
      .flat()
  )
]

const generateQuadIndices = (rowOffset: number, colOffset: number, pointsPerContext: number): QuadIndices => {
  const firstInLine = rowOffset
  const secondInLine = firstInLine + 1
  const ppx = (pointsPerContext * (colOffset))
  const ppx2 = (pointsPerContext * (colOffset + 1))

  const v1Idx: number = firstInLine + ppx
  const v2Idx: number = secondInLine + ppx
  const v3Idx: number = firstInLine + ppx2
  const v4Idx: number = secondInLine + ppx2

  // TODO: Orient quad according to the distance between points

  // const v1 = allOrigins[v1Idx]
  // const v2 = allOrigins[v2Idx]
  // const v3 = allOrigins[v3Idx]
  // const v4 = allOrigins[v4Idx]
  // const distV1V3 = distance(v1, v3)
  // const distV2V4 = distance(v2, v4)
  // if (distV1V3 < distV2V4) {
  return [
    [v1Idx, v2Idx, v3Idx],
    [v3Idx, v2Idx, v4Idx]
  ]
  // } else {
  //   return [
  //   [v1Idx, v4Idx, v3Idx],
  //   [v4Idx, v1Idx, v2Idx]
  //   ]
  // }
}
