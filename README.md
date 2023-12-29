<div align="center">

  # esbuild-plugin-module-id

  <img src="./banner.png" alt="banner">

</div>

## Installation

```bash
npm install esbuild-plugin-module-id
# or yarn
yarn add esbuild-plugin-module-id
```

## Usage

```ts
import * as esbuild from 'esbuild';
import { moduleId } from 'esbuild-plugin-module-id';

await esbuild.build({
  // ...
  plugins: [
    // ⚠️ `esbuild-plugin-module-id` plugin should be located before transformation plugins.
    moduleId({
      // Required
      onGenerate: (ids) => {
        console.log(ids); // ModuleIds
      },
      // Optional
      generator, // ModuleIdGenerator
      filter, // RegExp
      namespace, // string
    }),
    otherTransformPluginA(),
    otherTransformPluginB(),
    otherTransformPluginC(),
  ],
});

// Type definitions
interface ModuleIdGenerator {
  initialize(): void;
  generateModuleId(args: OnLoadArgs): void;
  getIds(): ModuleIds;
}

// { [path]: ModuleId }
type ModuleIds = Record<string, ModuleId>;
type ModuleId = number;
```

## Preview

```ts
// from `onGenerate`
const ids: ModuleIds = {
  "/path/to/module/index.js": 0,
  "/path/to/module/node_modules/react-native/index.js": 1,
  "/path/to/module/src/App.tsx": 2,
  "/path/to/module/node_modules/react-native/Libraries/Core/InitializeCore.js": 3,
  "/path/to/module/node_modules/react-native-safe-area-context/src/index.tsx": 4,
  "/path/to/module/src/theme/index.ts": 5,
  "/path/to/module/node_modules/react/index.js": 6,
  "/path/to/module/node_modules/@react-navigation/devtools/src/index.tsx": 7,
  "/path/to/module/node_modules/dripsy/src/index.ts": 8,
  "/path/to/module/node_modules/@react-navigation/native/src/index.tsx": 9,
  // ...
  "/path/to/module/node_modules/react-native-svg/node_modules/entities/lib/esm/generated/decode-data-xml.js": 1312,
  "/path/to/module/node_modules/react-native-svg/node_modules/entities/lib/esm/decode_codepoint.js": 1313,
};

// Example
const modulePaths = Object.keys(metafile.inputs); // esbuild.Metafile

const getModuleId = (modulePath: string) => {
  if (typeof ids[modulePath] === 'number') {
    return ids[modulePath];
  }
  throw new Error(`'${modulePath}' module not found`);
};

getModuleId(modulePaths[n]); // number
```

## Development

```bash
# Lint with `oxc`
yarn lint

# Run typescript based unit tests with `swc` + `jest`
yarn test

# Build with `esbuild`
yarn build

# Publish to npm
yarn release
```

## License

[MIT](./LICENSE)
