import { DesignParameters, parametersKeys as parametersKeys, getDesignParametersDefinitions, ExtendedParams, deriveDesignParameters, calculatedParameterKeys } from "../design/design.parameters"
import fs from 'fs';

const loadPropertiesOverride = (): Partial<DesignParameters> => {
    try {
        return JSON.parse(fs.readFileSync("parameters.json", 'utf8').toString())
    } catch {
        return {}
    }
}

const validateParameters = (parameters: DesignParameters) => {
    const incorrectKeys = Object.keys(parameters).filter(k => ![...parametersKeys, ...calculatedParameterKeys].includes(k))
    if (incorrectKeys.length > 0) {
        throw new Error(`Incorrect parameters: ${incorrectKeys}`)
    }
}

export const loadParameters = (designParameters?: DesignParameters): ExtendedParams => {
    if (designParameters) {
        const calculatedParameters = deriveDesignParameters(designParameters)
        validateParameters(calculatedParameters)
        return calculatedParameters
    }

    const parameterDefinitions = getDesignParametersDefinitions()

    const initialValues = parameterDefinitions
        .filter(o => !!o.initial)
        .reduce((acc, val) => {
            acc[val.name] = val.initial
            return acc
        }, {})

    const propertiesOverride = loadPropertiesOverride()

    const parameters: ExtendedParams = deriveDesignParameters({ ...initialValues, ...propertiesOverride })
    validateParameters(parameters)
    return parameters
}