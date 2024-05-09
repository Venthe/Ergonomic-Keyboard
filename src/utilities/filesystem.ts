import { BinaryLike } from 'crypto';
import fs from 'fs';

export const saveSerializedDesign = (design: Array<ArrayBuffer | BinaryLike | Blob>, filename: string) => {
    new Blob(design).arrayBuffer().then(ab => fs.writeFileSync(filename, Buffer.from(ab)))
}