import fs from 'fs'
import { debugLog } from './debugLog'

export class Environment extends Map {
  public static CANDIDATE_FILES = [
    '.rstudio-connect.env',
    'rstudio-connect.env',
    'rsconnect/env',
    'rsconnect-python/env'
  ]

  public static ENV_VAR_PREFIX = 'CONNECT_ENV_SET_'

  public load (): void {
    this.loadProcessEnv()
    this.loadFileEnv()
  }

  public loadProcessEnv (): void {
    debugLog(() => [
      'Environment: loading from process env with',
      `prefix=${Environment.ENV_VAR_PREFIX}`
    ].join(' '))

    for (const key in process.env) {
      if (!key.startsWith(Environment.ENV_VAR_PREFIX)) {
        continue
      }
      const cleanedKey = key.replace(Environment.ENV_VAR_PREFIX, '')

      debugLog(() => [
        'Environment: setting var from process.env',
        `key=${cleanedKey}`
      ].join(' '))

      this.set(cleanedKey, process.env[key])
    }
  }

  public loadFileEnv (): string | null {
    const candidateFiles = [
      process.env.CONNECT_ENV_FILE
    ].concat(Environment.CANDIDATE_FILES)

    debugLog(() => [
      'Environment: loading from file env with',
      `candidates=${JSON.stringify(candidateFiles)}`
    ].join(' '))

    let envFile: string | null = null

    for (const candidateFile of candidateFiles) {
      if (candidateFile === undefined) {
        continue
      }

      if (fs.existsSync(candidateFile)) {
        envFile = candidateFile
        debugLog(() => `Environment: found env file=${JSON.stringify(envFile)}`)
        break
      }
    }

    if (envFile === null) {
      debugLog(() => 'Environment: no env file found')
      return null
    }

    let lineNo = 0
    for (let line of fs.readFileSync(envFile).toString().split(/\n/)) {
      lineNo++
      line = line.trim()
      if (line === '' || line.startsWith('#')) {
        debugLog(() => [
          'Environment: skipping empty/comment',
          `line=${lineNo}`,
          'of env',
          `file=${JSON.stringify(envFile)}`
        ].join(' '))
        continue
      }
      if (line.includes('=')) {
        const lineParts = line.split('=', 2)
        const varName = lineParts[0].replace(/^(export|set|)\s+/, '')
        const varValue = lineParts[1].replace(/^['"]/, '').replace(/['"]$/, '')

        debugLog(() => [
          'Environment: setting',
          `key=${varName}`,
          `value=${varValue}`,
          'from env',
          `file=${JSON.stringify(envFile)}`,
          `line=${lineNo}`
        ].join(' '))

        this.set(varName, varValue)
      } else {
        const varName = line.replace(/^(export|set|)\s+/, '')
        const varValue = process.env[varName]

        if (varValue !== undefined) {
          debugLog(() => [
            'Environment: setting',
            `key=${varName}`,
            `value=${JSON.stringify(varValue)}`,
            'from env',
            `file=${JSON.stringify(envFile)}`,
            `line=${lineNo}`,
            'via process.env'
          ].join(' '))

          this.set(varName, varValue)
        }
      }
    }

    return envFile
  }
}
