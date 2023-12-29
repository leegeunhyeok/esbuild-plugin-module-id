import type {
  BuildOptions,
  BuildResult,
  PluginBuild,
  OnStartResult,
  OnResolveArgs,
  OnResolveResult,
  OnLoadArgs,
  OnLoadResult,
  OnEndResult,
} from 'esbuild';

type MockedBuildOptions<T extends Pick<BuildOptions, 'plugins'>> = T;
type Promisable<T> = T | Promise<T>;

interface EsbuildPluginHooks {
  onStart: Parameters<PluginBuild['onStart']>[];
  onResolve: Parameters<PluginBuild['onResolve']>[];
  onLoad: Parameters<PluginBuild['onLoad']>[];
  onDispose: Parameters<PluginBuild['onDispose']>[];
  onEnd: Parameters<PluginBuild['onEnd']>[];
}

type EsbuildPluginAdditionalDataStore = Record<string, any>;

export interface MockedEsbuild {
  start(): Promisable<void | OnStartResult | null>;
  resolve(args: OnResolveArgs): Promisable<OnResolveResult | null | undefined>;
  load(args: OnLoadArgs): Promisable<OnLoadResult | null | undefined>;
  dispose(): void;
  end(result: BuildResult): Promisable<void | OnEndResult | null>;
}

export const build = <
  T extends Pick<BuildOptions, 'plugins'>
>(options: MockedBuildOptions<T>): MockedEsbuild => {
  const plugin = options.plugins?.[0];
  const hooks: EsbuildPluginHooks = {
    onStart: [],
    onResolve: [],
    onLoad: [],
    onDispose: [],
    onEnd: [],
  };
  const pluginDataStore: EsbuildPluginAdditionalDataStore= {};

  if (!plugin) throw new Error('plugins cannot be empty');

  plugin.setup({
    // Plugin life cycle hooks.
    onStart: (callback) => hooks.onStart.push([callback]),
    onResolve: (options, callback) => hooks.onResolve.push([options, callback]),
    onLoad: (options, callback) => hooks.onLoad.push([options, callback]),
    onDispose: (callback) => hooks.onDispose.push([callback]),
    onEnd: (callback) => hooks.onEnd.push([callback]),
    // Others
    initialOptions: options,
    esbuild: {} as any,
    resolve: jest.fn(),
  });

  return {
    start() {
      hooks.onStart.forEach(([hook]) => hook());
    },
    resolve(args) {
      return hooks.onResolve.reduce((prev, [options, hook]) => {
        return Promise.resolve(prev).then(async () => {
          let result: OnResolveResult | null | undefined;
          if (
            options.filter.test(args.path) &&
            args.namespace === '' ||
            args.namespace === options.namespace
          ) {
            result = await hook(args);
          }

          if (result?.pluginData) {
            pluginDataStore[args.path] = result.pluginData;
          }

          return { ...prev, ...(result ? result : null) };
        });
      }, Promise.resolve({}) as Promise<OnResolveResult>);
    },
    load(args) {
      return hooks.onLoad.reduce((prev, [options, hook]) => {
        return Promise.resolve(prev).then(async () => {
          let result: OnLoadResult | null | undefined;
          if (
            options.filter.test(args.path) &&
            args.namespace === '' ||
            args.namespace === options.namespace
          ) {
            result = await hook({
              ...args,
              pluginData: pluginDataStore[args.path] ?? args.pluginData,
            });
          }
          return { ...prev, ...(result ? result : null) };
        });
      }, Promise.resolve({}) as Promise<OnLoadResult>);
    },
    dispose() {
      hooks.onDispose.forEach(([hook]) => hook());
    },
    end(result) {
      return hooks.onEnd.reduce((prev, [hook]) => {
        return Promise.resolve(prev).then(async () => {
          await hook(result);
        });
      }, Promise.resolve());
    },
  };
};
