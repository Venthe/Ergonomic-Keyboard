import jsonSerializer from '@jscad/json-serializer';
import { generateDesign } from './generate-design';
import { loadParameters } from './utilities/parameters';
import { saveSerializedDesign } from './utilities/filesystem';

const parameters = loadParameters()

const output = jsonSerializer.serialize({ binary: true }, generateDesign(parameters))

saveSerializedDesign(output, "./output/result.jscad.json")
