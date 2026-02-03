# expo-modules-autolinking Bug Reproduction

## Issue

When Gradle Buildship runs during Android builds, it creates `.project` metadata files in nested `node_modules` paths. The autolinking algorithm finds these incomplete folders first (because `Module._nodeModulePaths` returns nested paths before hoisted ones), causing valid hoisted packages to be shadowed and lost.

## Bug Location

`expo-modules-autolinking/src/dependencies/resolution.ts` - `resolveDependency` function

The function uses `maybeRealpath` which only checks if a folder exists, not if it contains a valid `package.json`. When the nested incomplete folder exists, it returns that path immediately without checking the hoisted version.

## Reproduction

```bash
# 1. Install dependencies
npm install

# 2. Simulate what Gradle Buildship does
node setup-fake-nested.js

# 3. Run verify to see expo-modules-core is MISSING
npx expo-modules-autolinking verify -v
```

## Expected vs Actual

**Expected:** `expo-modules-core` should be found at `node_modules/expo-modules-core`

**Actual:** `expo-modules-core` is missing from the verify output because:
1. `resolveDependency` finds `expo/node_modules/expo-modules-core` first
2. `maybeRealpath` returns success (folder exists)
3. Returns this path without checking for `package.json`
4. Later `recurse()` fails because no `package.json`
5. Module is lost (no fallback to hoisted version)

## Folder Structure After Gradle Build

```
node_modules/
├── expo/
│   └── node_modules/
│       └── expo-modules-core/     ← Fake (Gradle Buildship)
│           ├── android/.project
│           └── expo-module-gradle-plugin/.project
│           (NO package.json!)
│
└── expo-modules-core/              ← Real (npm installed)
    ├── package.json
    ├── android/
    ├── ios/
    └── ...
```

## Proposed Fix

Add `package.json` validation in `resolveDependency` before returning:

```typescript
const resolveDependency = async (dependencyName) => {
  for (const nodeModulePath of nodeModulePaths) {
    const originPath = fastJoin(nodeModulePath, dependencyName);
    const resolvedPath = await maybeRealpath(originPath);
    if (resolvedPath != null) {
      // Validate package.json exists
      const packageJson = await loadPackageJson(fastJoin(resolvedPath, 'package.json'));
      if (packageJson == null) {
        continue;  // Try next path
      }
      return { ... };
    }
  }
};
```

## Related

- PR: https://github.com/expo/expo/pull/42812
