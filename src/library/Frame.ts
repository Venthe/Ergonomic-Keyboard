import { Vec3 } from '@jscad/modeling/src/maths/types'
import { scale, subtract, add, dot, cross, normalize, distance } from './vector3'
import { BezierControlPoints, bezier3, bezierLength, mapCurveTrimToStepValues } from './bezier'

export class FrameContext {
  readonly frames: Frame[] = []
  readonly stepSize: number

  constructor(readonly controlPoints: BezierControlPoints, readonly steps: number, stepSize?: number) {
    this.stepSize = stepSize || 1 / steps
  }

  public getOrigins(): Vec3[] {
    return this.frames.map(f => f.origin)
  }

  public static generateRotationMinimizingFrames(
    controlPoints: BezierControlPoints,
    steps: number,
    originFrame: Frame | undefined = undefined,
    {
      trim = [0, 0]
    }: { trim?: [number, number] } = {}
  ): FrameContext {

    const c = mapCurveTrimToStepValues(controlPoints, { trim, fidelity: 500 })
    const start = c[0]
    const stop = c[1]

    const frameContext = new FrameContext(controlPoints, steps, (stop - start) / steps)

    const firstFrame = Frame.generateFrenetFrame(start, frameContext, originFrame)
    firstFrame.setAsBorder()
    frameContext.frames.push(firstFrame)

    for (let i = 1; i <= steps; i += 1) {
      // console.log(i, frameContext.stepSize, start, stop)
      const previousFrame = frameContext.frames[frameContext.frames.length - 1]
      frameContext.frames.push(previousFrame.generateNextRotationMinimizingFrame())
    }

    frameContext.frames[frameContext.frames.length - 1].setAsBorder()

    // console.log(frameContext.frames.length)

    return frameContext
  }

  public static generateFrenetFrames(controlPoints: BezierControlPoints, steps: number): FrameContext {
    const frameContext = new FrameContext(controlPoints, steps)

    for (let i = 0; i < steps; i += frameContext.stepSize) {
      frameContext.frames.push(Frame.generateFrenetFrame(i, frameContext))
    }
    return frameContext
  }

  lastFrame(): Frame {
    return this.frames[this.frames.length - 1]
  }
}

export class Frame {
  /**
  *
  * @param origin Origin of all vectors, i.e. the on-curve point
  * @param tangent tangent vector
  * @param rotationalAxis rotational axis vector
  * @param normal normal vector
  */
  public constructor(
    readonly origin: Vec3,
    readonly tangent: Vec3,
    readonly rotationalAxis: Vec3,
    readonly normal: Vec3,
    readonly step: number,
    readonly context: FrameContext,
    readonly binormal: Vec3,
    private border: boolean = false
  ) { }

  public generateNextRotationMinimizingFrame(): Frame {
    const nextStep: number = this.step + this.context.stepSize
    const newFrameOrigin: Vec3 = bezier3(nextStep, this.context.controlPoints)
    const newFrameTangent: Vec3 = Frame.frenetTangent(nextStep, this.context.controlPoints)
    const v1: Vec3 = subtract(newFrameOrigin, this.origin)
    const c1: number = dot(v1, v1)
    const previousFrameRotationalAxis: Vec3 = this.rotationalAxis
    const previousFrameTangent: Vec3 = this.tangent
    const riL: Vec3 = subtract(previousFrameRotationalAxis, scale(v1, (2 / c1) * dot(v1, previousFrameRotationalAxis)))
    const tiL: Vec3 = subtract(previousFrameTangent, scale(v1, (2 / c1) * dot(v1, previousFrameTangent)))
    const v2: Vec3 = subtract(newFrameTangent, tiL)
    const c2: number = dot(v2, v2)
    const newFrameRotationalAxis: Vec3 = subtract(riL, scale(v2, 2 / c2 * dot(v2, riL)))
    const newFrameNormal: Vec3 = cross(newFrameRotationalAxis, newFrameTangent)
    const binormal: Vec3 = cross(newFrameTangent, newFrameNormal)

    return new Frame(
      newFrameOrigin,
      newFrameTangent,
      newFrameRotationalAxis,
      newFrameNormal,
      nextStep,
      this.context,
      binormal
    )
  }

  public static generateFrenetFrame(step: number, context: FrameContext, originFrame?: Frame): Frame {
    const origin = bezier3(step, context.controlPoints)
    const tangent = Frame.frenetTangent(step, context.controlPoints)
    const rotationalAxis = originFrame?.rotationalAxis ?? Frame.frenetRotationalAxis(step, context.controlPoints)
    const normal = originFrame?.normal ?? Frame.frenetNormal(step, context.controlPoints)
    const binormal: Vec3 = cross(tangent, normal)

    return new Frame(origin, tangent, rotationalAxis, normal, step, context, binormal)
  }

  /**
    * - 3 * cP[0] * (1 - step) ^ 2
    * + 3 * cP[1] * (3 * step ^ 2 - 4 * step + 1)
    * + 3 * cP[2] * (2 - 3 * step) * step
    * + 3 * cP[3] * step ^ 2
    */
  private static firstDerivative(step: number, controlPoints: BezierControlPoints): Vec3 {
    return add(
      add(
        add(
          scale(controlPoints[0], -3 * Math.pow((1 - step), 2)),
          scale(controlPoints[1], 3 * (3 * Math.pow(step, 2) - 4 * step + 1))
        ),
        scale(controlPoints[2], 3 * (2 - 3 * step) * step)
      ),
      scale(controlPoints[3], 3 * Math.pow(step, 2))
    )
  }

  /**
    * + 6 * cP[0] * (1 - step)
    * + 6 * cP[1] * (3 * step - 2)
    * + 6 * cP[2] * (1 - 3 * step)
    * + 6 * cP[3] * step
    */
  private static secondDerivative(step: number, controlPoints: BezierControlPoints): Vec3 {
    return add(
      add(
        add(
          scale(controlPoints[0], 6 * (1 - step)),
          scale(controlPoints[1], 6 * (3 * step - 2))
        ),
        scale(controlPoints[2], 6 * (1 - 3 * step))
      ),
      scale(controlPoints[3], 6 * step)
    )
  }

  private static frenetTangent(step: number, controlPoints: BezierControlPoints): Vec3 {
    return normalize(Frame.firstDerivative(step, controlPoints))
  }

  private static frenetB(step: number, controlPoints: BezierControlPoints): Vec3 {
    const tangent = Frame.frenetTangent(step, controlPoints)
    const secondDerivative = Frame.secondDerivative(step, controlPoints)
    return normalize(add(tangent, secondDerivative))
  }

  private static frenetRotationalAxis(step: number, controlPoints: BezierControlPoints): Vec3 {
    return normalize(cross(Frame.frenetTangent(step, controlPoints), Frame.frenetB(step, controlPoints)))
  }

  private static frenetNormal(step: number, controlPoints: BezierControlPoints): Vec3 {
    return normalize(cross(Frame.frenetRotationalAxis(step, controlPoints), Frame.frenetTangent(step, controlPoints)))
  }

  setAsBorder() {
    this.border = true
  }

  get isBorder() {
    return this.border
  }
}
