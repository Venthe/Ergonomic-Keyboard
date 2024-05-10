import { DesignParameters, parametersKeys as parametersKeys, getDesignParametersDefinitions, ExtendedParams, deriveDesignParameters, calculatedParameterKeys } from "../design/design.parameters"
import fs from 'fs';

const loadPropertiesOverride = (): Partial<DesignParameters> => {
    try {
        return JSON.parse(fs.readFileSync("parameters.json", 'utf8').toString())
    } catch {
        return {}
    }
}

const validateParameters = (parameters: string[], log?: string) => {
    const incorrectKeys = parameters.filter(k => ![...parametersKeys, ...calculatedParameterKeys].includes(k))
    if (incorrectKeys.length > 0) {
        throw new Error([log, `Incorrect keys: ${incorrectKeys}`].filter(a => !!a).join(" "))
    }
}

export const loadParameters = (designParameters?: DesignParameters): ExtendedParams => {
    const parameterDefinitions = getDesignParametersDefinitions()
    validateParameters(parameterDefinitions.filter(def => def.type !== 'group').map(def => def.name), "Parameter definition")

    if (designParameters) {
        const calculatedParameters = deriveDesignParameters(designParameters)
        validateParameters(Object.keys(calculatedParameters), "Parameters from JSCAD")
        return calculatedParameters
    }

    const initialValues = parameterDefinitions
        .filter(o => !!o.initial)
        .reduce((acc, val) => {
            acc[val.name] = val.initial
            return acc
        }, {})

    const propertiesOverride = loadPropertiesOverride()

    const parameters: ExtendedParams = deriveDesignParameters({ ...initialValues, ...propertiesOverride })
    validateParameters(Object.keys(parameters), "Merged parameters")
    return parameters
}