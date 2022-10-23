import { colorize } from '@jscad/modeling/src/colors'
import { Vec3 } from '@jscad/modeling/src/maths/vec3'
import { circle, sphere } from '@jscad/modeling/src/primitives'
import { json } from 'stream/consumers'
import { WithAdditionalGeometry } from '../keyboardTypes'
import { generateSurface } from './bezierSurface'
import { BezierSurfaceControlPoints, FaceIndices, Surface, SurfacePoint } from './surface'
import { add, normalize, scale } from './vector3'

export interface ExtrudedPointData extends SurfacePoint {
  originalPointIndex: number
}

type WithData = (ExtrudedPointData & { index: number, faces: FaceIndices[] })
export const moveOriginByExtrusionSize = (point: Vec3, direction: Vec3, size: number): Vec3 =>
  add(point, scale(normalize(direction), size))

export const _extrudeSurface = (originalSurface: WithAdditionalGeometry<Surface<SurfacePoint>>, extrusionSize: number): WithAdditionalGeometry<Surface<SurfacePoint & ExtrudedPointData>> => {

  const result = {
    faces: originalSurface.faces,
    points: originalSurface.points.map<ExtrudedPointData>((originalPoint, originalPointIndex) => ({
      normal: originalPoint.normal,
      origin: moveOriginByExtrusionSize(originalPoint.origin, originalPoint.normal, extrusionSize),
      originalPointIndex: originalPointIndex,
      isEdge: originalPoint.isEdge
    })),
    additionalGeometry: originalSurface.additionalGeometry
  }
  return result
}

export const extrudeSurface = (originalSurface: WithAdditionalGeometry<Surface<SurfacePoint>>, extrusion: number): WithAdditionalGeometry<Surface<SurfacePoint | ExtrudedPointData>> =>
  concatSurface(originalSurface, _extrudeSurface(originalSurface, extrusion))

const concatSurface = (originalSurface: WithAdditionalGeometry<Surface<SurfacePoint>>, extrudedSurface: Surface<ExtrudedPointData>): WithAdditionalGeometry<Surface<SurfacePoint | ExtrudedPointData>> => {

  const concatenatedPoints = concatPoints(originalSurface.points, extrudedSurface.points)
    .map(pointWithIndex)
  const faces = concatExtrudedFaces(originalSurface, extrudedSurface)

  const facesForIndex = (p: (SurfacePoint | ExtrudedPointData) & { index: number }): FaceIndices[] => faces.filter(f => f.includes(p.index))

  const extrudedEdgePoints: WithData[] = concatenatedPoints
    .map(pointWithIndex)
    .filter(p => hasEdge(p))
    .filter(p => isExtrudedPoint(p))
    .map(p => (p as (ExtrudedPointData & { index: number })))
    .map(p => ({ ...p, faces: facesForIndex(p) }))

  function findPointForIndex(idx: number) {
    return extrudedEdgePoints.filter(eep => eep.index === idx)[0]
  }

  const orderedIdsOfLongestEdgePoints = findLongestEdge(extrudedEdgePoints, findPointForIndex, faces)
    .map((idx: number) => findPointForIndex(idx))


  const borderFaces: any[] = []
  for (let i = 0; i < orderedIdsOfLongestEdgePoints.length; i++) {
    let f1 = orderedIdsOfLongestEdgePoints[i].index
    let f2 = (orderedIdsOfLongestEdgePoints[i + 1] || orderedIdsOfLongestEdgePoints[0]).index
    let f3 = orderedIdsOfLongestEdgePoints[i].originalPointIndex
    let f4 = (orderedIdsOfLongestEdgePoints[i + 1] || orderedIdsOfLongestEdgePoints[0]).originalPointIndex

    let face1 = [f2, f1, f3]
    let face2 = [f2, f3, f4]
    borderFaces.push(face1, face2)
  }

  return {
    points: concatenatedPoints,
    faces: faces.concat(borderFaces),
    additionalGeometry: [].concat(originalSurface.additionalGeometry)
  }
}

function findLongestEdge(extrudedEdgePoints: WithData[], findPointForIndex: (idx: number) => WithData, faces: FaceIndices[]): number[] {
  type EdgeTraversalNode = { node: Number, children: EdgeTraversalNode[], seen: number[] }

  const lastNodes: any[] = []

  function getPossiblePaths(point: WithData): WithData[] {
    return point.faces
      .flatMap(face => face.filter(ff => ff != point.index))
      .flatMap(face => extrudedEdgePoints.filter(eep => eep.index === face))
  }

  function taverse(currentPoint: WithData, seenPointIds: number[] = []) {
    const seen = [...seenPointIds, currentPoint.index]
    const currentNode: EdgeTraversalNode = {
      node: currentPoint.index,
      children: getPossiblePaths(findPointForIndex(currentPoint.index))
        .filter(nextPointCandidate => seen.filter(seenId => seenId === nextPointCandidate.index).length === 0)
        .filter(nextPoint => {
          function spansQuad(idx1: number, idx2: number) {
            return faces.filter(face => face.includes(idx1) && face.includes(idx2)).length > 1
          }

          return !spansQuad(currentPoint.index, nextPoint.index)
        })
        .map(nextPoint => taverse(nextPoint, seen)),
      seen: seen
    }
    if (currentNode.children.length === 0)
      lastNodes.push(currentNode)
    return currentNode
  }

  taverse(extrudedEdgePoints[0])

  const toLongest: (previousValue: any, currentValue: any, currentIndex: number, array: any[]) => any = (acc, cur) => {
    if (cur.length > acc.length)
      acc = cur
    return acc
  }

  return lastNodes
    .map(node => node.seen)
    .reduce(toLongest, [] as number[])
}

function concatPoints(originalSurface: SurfacePoint[], extrudedSurface: ExtrudedPointData[]) {
  return ([] as (SurfacePoint | ExtrudedPointData)[]).concat(originalSurface, extrudedSurface)
}

function concatExtrudedFaces(originalSurface: Surface<SurfacePoint>, extrudedSurface: Surface<ExtrudedPointData>) {
  const pointsCount = originalSurface.points.length
  return ([] as FaceIndices[]).concat(
    originalSurface.faces,
    extrudedSurface.faces.map(offsetFace(pointsCount)).map(invertFace)
  )
}

function offsetFace(pointsCount: number): (value: FaceIndices, index: number, array: FaceIndices[]) => number[] {
  return f => [
    f[0] + pointsCount,
    f[1] + pointsCount,
    f[2] + pointsCount
  ]
}

const invertFace = (face: number[]): [number, number, number] => [face[2], face[1], face[0]]
const pointWithIndex = (v: ExtrudedPointData | SurfacePoint, i: number): (ExtrudedPointData | SurfacePoint) & { index: number } => ({ ...v, index: i })
const hasEdge = (vertex: ExtrudedPointData | SurfacePoint): boolean => vertex.isEdge
const isExtrudedPoint = (v: ExtrudedPointData | SurfacePoint): boolean => !((v as ExtrudedPointData & SurfacePoint).originalPointIndex === undefined)

export const generateExtrudedSurface = (
  surfaceControlPoints: BezierSurfaceControlPoints,
  extrusion: number | [number, number],
  {
    surfaceFidelity = 10,
    trim = [0, 0, 0, 0]
  }: { surfaceFidelity?: number, trim?: [number, number, number, number] } = {}
): WithAdditionalGeometry<Surface<SurfacePoint>> => {
  const isExtrusionOneWay: boolean = !Array.isArray(extrusion)
  const extrudeDown: number = -1 * (isExtrusionOneWay ? (extrusion as number) / 2 : ((extrusion as [number, number])[0]))
  const extrudeUp: number = (isExtrusionOneWay ? (extrusion as number) : (extrusion as [number, number])[1] + ((extrusion as [number, number])[0]))

  const primarySurface = generateSurface(surfaceControlPoints, { surfaceFidelity, trim, extrude: extrudeDown })
  const extrudedSurface = extrudeSurface(primarySurface, extrudeUp)
  return extrudedSurface;
}