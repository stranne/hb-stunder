// openapi-typescript needs the compiler API, which TypeScript 7 no longer exposes.
export const hooks = {
  readPackage(manifest) {
    if (manifest.name === "openapi-typescript") {
      delete manifest.peerDependencies.typescript;
      manifest.dependencies.typescript = "5.9.3";
    }
    return manifest;
  },
};
