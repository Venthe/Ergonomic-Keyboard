import { DesignParameters, getDesignParametersDefinitions } from "./design/design.parameters";
import { generateDesign } from "./generate-design";
import { loadParameters } from "./utilities/parameters";

export default {
    main: (parameters: DesignParameters) => generateDesign(loadParameters(parameters)),
    getParameterDefinitions: getDesignParametersDefinitions
}