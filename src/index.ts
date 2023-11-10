import keyboard from './keyboard'
import fs from 'fs';
import jsonSerializer from '@jscad/json-serializer';


const parameters = keyboard.getParameterDefinitions().filter(o => !!o.initial).reduce((acc, val) => {
    acc[val.name] = val.initial
    return acc
}, {})

const output = new Blob(jsonSerializer.serialize({binary: true}, keyboard.main(parameters)))

output.arrayBuffer().then(ab => fs.writeFileSync("./output/result.jscad.json", Buffer.from(ab )))
