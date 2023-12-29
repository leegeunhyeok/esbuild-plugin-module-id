import { faker } from '@faker-js/faker';
import { moduleId } from '../index.ts';
import { DefaultModuleIdGenerator } from '../generator';
import type { ModuleIdGenerator, ModuleIds } from '../types.ts';
import * as esbuild from './mocks/esbuild.ts';

const ENTRY_POINT_NAME = '__entry.ts';

const DEFAULT_RESOLVE_ARGS = {
  importer: '',
  kind: 'import-statement',
  namespace: '',
  pluginData: undefined,
  resolveDir: '.',
} as const;

const DEFAULT_LOAD_ARGS = {
  namespace: '',
  suffix: '',
  pluginData: undefined,
  with: {},
} as const;

const generateMockedModules = (count = 50) => new Array(count)
  .fill('')
  .map((_, index) => faker.string.alpha(16) + `_${index}.ts`); // Add index to avoid duplicate name.

const simulateBuild = (generator: ModuleIdGenerator, modules: string[]) => {
  let result: ModuleIds;

  const allModules = [ENTRY_POINT_NAME, ...modules];
  const mockedEsbuild = esbuild.build({
    plugins: [
      moduleId({
        generator,
        onGenerate: (ids) => (result = ids)
      }),
    ],
  });
  
  return {
    api: mockedEsbuild,
    async build() {
      // onStart
      mockedEsbuild.start();

      // onResolve
      await Promise.all(allModules.map((path) => mockedEsbuild.resolve({
        ...DEFAULT_RESOLVE_ARGS,
        ...(path === ENTRY_POINT_NAME ? { kind: 'entry-point' } : null),
        path,
      })));

      // onLoad
      await Promise.all(allModules.map((path) => mockedEsbuild.load({
        ...DEFAULT_LOAD_ARGS,
        path,
      })));
    },
    async end() {
      await mockedEsbuild.end({
        errors: [],
        warnings: [],
        mangleCache: undefined,
        metafile: undefined,
        outputFiles: undefined,
      });
    },
    getModuleIdMap() {
      return result;
    },
  };
};

describe('esbuild-plugin-module-id', () => {
  let simulate: ReturnType<typeof simulateBuild>;

  beforeAll(async () => {
    simulate = simulateBuild(new DefaultModuleIdGenerator(), generateMockedModules());
    await simulate.build();
    await simulate.end();
  });

  describe('when module is entry-point', () => {
    it('should entry-point module id is always `0`', () => {
      expect(simulate.getModuleIdMap()[ENTRY_POINT_NAME]).toEqual(0);
    });
  });

  it('should each module have unique id', () => {
    const moduleIdMap = simulate.getModuleIdMap();
    const ids = Object.values(moduleIdMap);
    expect(new Set(ids).size).toEqual(ids.length);
  });

  describe('when `onLoad` triggered with a module that already id generated', () => {
    let simulate: ReturnType<typeof simulateBuild>;
    let targetModule: string;
    let prevId: number;
  
    beforeAll(async () => {
      const generator = new DefaultModuleIdGenerator();
      const modules = generateMockedModules();
      targetModule = faker.helpers.arrayElement(modules);
  
      simulate = simulateBuild(generator, modules);
      await simulate.build();

      // 1. Store module id of before re-trigger.
      // 2. Trigger `onLoad` once more with already resolved & loaded module.
      prevId = generator.getIds()[targetModule];
      await simulate.api.load({
        ...DEFAULT_LOAD_ARGS,
        path: targetModule,
      });

      await simulate.end();
    });

    it('should keep the initially generated id', () => {
      expect(simulate.getModuleIdMap()[targetModule]).toEqual(prevId);
    });
  });
});
