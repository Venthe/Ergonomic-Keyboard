import vec3, { Vec3 } from '@jscad/modeling/src/maths/vec3'
import { joinBezierByTangent, BezierControlPoints, mirrorPointAroundCenter } from "./bezier"
import { BezierSurfaceControlPoints, Surface, SurfacePoint } from "./surface"
import { generateSurface } from './bezierSurface'
import { Frame, FrameContext } from './Frame'
import { average, distance as dist, dot } from './vector3'

type HorizontalControlPoints = [
    [x: Vec3, y: Vec3, scale?: number],
    [x: Vec3, y: Vec3, scale?: number],
    [x: Vec3, y: Vec3, scale?: number],
    [x: Vec3, y: Vec3, scale?: number]
]

export const horizontalStitch = (controlPoints: HorizontalControlPoints, left: BezierSurfaceControlPoints): BezierSurfaceControlPoints => {
    const getScale = row => controlPoints[row][2] ?? 1
    const provideParams = (row): [Vec3, Vec3] => [controlPoints[row][0], controlPoints[row][1]]
    return [
        joinBezierByTangent(left[0], provideParams(0), getScale(0)),
        joinBezierByTangent(left[1], provideParams(1), getScale(1)),
        joinBezierByTangent(left[2], provideParams(2), getScale(2)),
        joinBezierByTangent(left[3], provideParams(3), getScale(3))
    ]
}

type VerticalControlPoints = [
    cp: [x: Vec3, a: Vec3, b: Vec3, y: Vec3],
    ep: [x: Vec3, a: Vec3, b: Vec3, y: Vec3],
    scales?: [x?: number, a?: number, b?: number, y?: number]
]

export const verticalStitch = (controlPoints: VerticalControlPoints, top: BezierSurfaceControlPoints): BezierSurfaceControlPoints => {
    const transpose = matrix => matrix[0].map((col, i) => matrix.map(row => row[i]))
    const getScale = (col: number) => controlPoints[2]?.[col] ?? 1
    const byColumn = (c): BezierControlPoints => [top[0][c], top[1][c], top[2][c], top[3][c]]
    const provideParams = (column): [Vec3, Vec3] => ([controlPoints[0][column], controlPoints[1][column]])

    return transpose([
        joinBezierByTangent(byColumn(0), provideParams(0), getScale(0)),
        joinBezierByTangent(byColumn(1), provideParams(1), getScale(1)),
        joinBezierByTangent(byColumn(2), provideParams(2), getScale(2)),
        joinBezierByTangent(byColumn(3), provideParams(3), getScale(3))
    ])
}

type DiagonalControlPoints = [
    [Vec3, Vec3],
    [Vec3, Vec3]
]

export const diagonalStitch = (controlPoints: DiagonalControlPoints, props: { diagonal: BezierSurfaceControlPoints, top: BezierSurfaceControlPoints, left: BezierSurfaceControlPoints }): BezierSurfaceControlPoints => {
    const averagePoint = (a: Vec3, b: Vec3) => (vec3.scale([0, 0, 0], vec3.add([0, 0, 0], a, b), 0.5))

    const upper = props.top
    const left = props.left
    const diagonal = props.diagonal
    const current = controlPoints
    return [
        [diagonal[3][3], upper[3][1], upper[3][2], upper[3][3]],
        [left[1][3], averagePoint(mirrorPointAroundCenter(left[1][2], left[1][3]), mirrorPointAroundCenter(upper[2][1], upper[3][1])), mirrorPointAroundCenter(upper[2][2], upper[3][2]), mirrorPointAroundCenter(upper[2][3], upper[3][3])],
        [left[2][3], mirrorPointAroundCenter(left[2][2], left[2][3]), current[0][0], current[0][1]],
        [left[3][3], mirrorPointAroundCenter(left[3][2], left[3][3]), current[1][0], current[1][1]],
    ]
}

export const mergeSurfaceByDistance = (surfaceControlPoints: BezierSurfaceControlPoints[], distance: number = 0.1) => {
    const surfaces = surfaceControlPoints.map(s => generateSurface(s, { surfaceFidelity: 10 }))

    const buckets = {}
    const faces = []
    let sIndex = 1

    for (const surface of surfaces) {
        const remapList = []
        surface.points.map((p, i) => ({ index: `${sIndex}_${i}`, ...p }))
            .forEach(el => {
                const hash = el.origin.reduce((acc, val) => acc + (~~val), 0)
                if (buckets[hash]) {
                    const foundDuplicate = buckets[hash].filter(existingElement => dist(existingElement.origin, el.origin) < distance)[0]
                    if (foundDuplicate) {
                        const remap = { from: el.index, to: foundDuplicate.index }
                        // console.log("Duplicate", remap)
                        foundDuplicate.normal = average(foundDuplicate.normal, el.normal)
                        remapList.push(remap)
                        return
                    }
                }
                else {
                    buckets[hash] = []
                }

                buckets[hash].push(el)
            })

        surface.faces.map(f => f.map(e => `${sIndex}_${e}`)).map(el2 => {
            return el2.map(el => {
                const newFaceId = remapList.filter(ell => el === ell.from)[0]?.to
                return newFaceId ?? el
            })
        }).forEach(e => faces.push(e))

        sIndex++
    }

    const b = Object.keys(buckets).flatMap(k => buckets[k])
    const mp = b.map((e, idx) => ({index: idx, stringIndex: e.index})).reduce((acc, val) => {
        acc[val.stringIndex] = val.index
        return acc
    }, {}) 
    const newFaces = faces.map(face => face.map(vertexIndex => mp[vertexIndex]))

    return [
        {
            faces: newFaces,
            points: b
        }
    ]
}