interface Parameter<T> {
  caption?: string
  name: string
  type: T
}

interface ParameterValue<T> {
  initial: T
}

export type ParamObject = any

export type MainFunction = (params: ParamObject) => RecursiveArray<Geometry> | Geometry

export interface Entrypoint {
  main: MainFunction
  getParameterDefinitions: () => ParameterDefinitions
}

export interface GroupParameter extends Parameter<'group'> {
}

export interface NumberParameter extends ParameterValue<number>, Parameter<'number'> {
  min: number
  step: number
  max: number
}

export type OtherParameter = {} & Parameter & any

export type ParameterDefinitions = Array<
  GroupParameter | NumberParameter | OtherParameter
>

export type ObjectTree = Geometry | RecursiveArray<Geometry>