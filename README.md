# expo-modules-autolinking Bug Reproduction

## Issue

When Gradle Buildship runs during Android builds, it creates `.project` metadata files in nested `node_modules` paths. The autolinking algorithm finds these incomplete folders first (because `Module._nodeModulePaths` returns nested paths before hoisted ones), causing valid hoisted packages to be shadowed and lost.

## Error Message

```
unable to resolve class expo.modules.plugin.gradle.ExpoModuleExtension
 @ line 4, column 1.
   import expo.modules.plugin.gradle.ExpoModuleExtension
   ^

unable to resolve class expo.modules.plugin.Version
 @ line 5, column 1.
   import expo.modules.plugin.Version
   ^
```

## Reproduction

```bash
# 1. Clone and install
git clone https://github.com/kimchi-developer/expo-autolinking-bug-repro
cd expo-autolinking-bug-repro
npm install

# 2. Simulate what Gradle Buildship does
node setup-fake-nested.js

# 3. Verify expo-modules-core is MISSING (9 modules)
npx expo-modules-autolinking verify -v

# 4. Run Android build to see the error
npx expo prebuild --platform android --clean
npx expo run:android
```

## Verify Output Comparison

**With fake nested folder (BUG):**
```
🔎  Found 9 modules in dependencies
 - expo@55.0.0-canary-20260128-67ce8d5 (at: node_modules/expo)
 - expo-asset@55.0.3-canary-20260128-67ce8d5 (at: node_modules/expo-asset)
 ...
 (expo-modules-core is MISSING!)
✅ Everything is fine!   ← False positive!
```

**Without fake nested folder (CORRECT):**
```
🔎  Found 10 modules in dependencies
 - expo-modules-core@56.0.0-canary-20260128-67ce8d5 (at: node_modules/expo-modules-core)
 ...
```

## Root Cause

The fake nested folder created by Gradle Buildship:
```
node_modules/expo/node_modules/expo-modules-core/
├── android/.project          ← Only metadata, NO code!
└── expo-module-gradle-plugin/.project
```

`resolveDependency()` in `resolution.ts` finds this folder first (nested paths are searched before hoisted) and returns it because `maybeRealpath()` only checks folder existence, not `package.json` validity.

## Proposed Fix

PR: https://github.com/expo/expo/pull/42812

Add `package.json` validation before returning from `resolveDependency()`.
