// openapi-typescript needs the JS compiler API, which TS 7 no longer ships: give it its own TS 6.
module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name === 'openapi-typescript') {
        delete pkg.peerDependencies?.typescript
        pkg.dependencies = { ...pkg.dependencies, typescript: '~6.0.3' }
      }
      return pkg
    },
  },
}
