import path from 'path'
import * as tar from 'tar'

import { Bundle } from './Bundle'
import { Manifest } from './Manifest'

export class Bundler {
  public async fromManifest (manifestPath: string): Promise<Bundle> {
    const manifest = new Manifest(manifestPath)
    const bundle = new Bundle(manifestPath, manifest)
    const fileList = [
      path.basename(manifestPath)
    ].concat(Array.from(manifest.files.keys()))

    await tar.create(
      { gzip: true, file: bundle.tarballPath, cwd: path.dirname(manifestPath) },
      fileList
    )
    return bundle
  }
}
