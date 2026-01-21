import { readFileSync } from 'fs'
import { join } from 'path'

const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))
export const Version: string = pkg.version
