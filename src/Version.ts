import { join } from 'path'
const pkg = require(join(__dirname, '..', 'package.json'))
export const Version: string = pkg.version
