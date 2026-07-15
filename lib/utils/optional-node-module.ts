interface NodeModuleLoader {
  createRequire(filename: string): (specifier: string) => unknown
}

type ProcessWithBuiltinModule = NodeJS.Process & {
  getBuiltinModule?: (id: string) => unknown
}

/**
 * Load a Node-only module at runtime without exposing a static import to the bundler.
 * Returns null in browser-like or non-Node runtimes.
 */
export function loadOptionalNodeModule<T>(specifier: string): T | null {
  if (typeof window !== 'undefined') {
    return null
  }

  const getBuiltinModule = (process as ProcessWithBuiltinModule).getBuiltinModule
  if (typeof getBuiltinModule !== 'function') {
    return null
  }

  const moduleLoader = getBuiltinModule('module') as NodeModuleLoader | undefined
  if (!moduleLoader?.createRequire) {
    return null
  }

  try {
    const require = moduleLoader.createRequire(`${process.cwd()}/package.json`)
    return require(specifier) as T
  } catch {
    return null
  }
}
