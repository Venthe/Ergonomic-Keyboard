import { design } from "./design/design";
import { ExtendedParams } from "./design/design.parameters";
import { MainFunction } from "./jscad";
import { useScene } from "./utilities/useScene";

export const generateDesign: MainFunction = (parameters: ExtendedParams) => {
    const { scene, ...sceneManipulation } = useScene(parameters)
    
    if (parameters.Enable_debug) {
        console.debug('Parameters:', parameters)
    }

    design(sceneManipulation)

    return scene;
}