import { getPackageJSON, resolvePkgPath, getBaseRollupPlugins } from './utils';

import generatePackageJson from 'rollup-plugin-generate-package-json';

const { name, module } = getPackageJSON('react');
const pkgPath = resolvePkgPath(name);
const pkgDistPath = resolvePkgPath(name, true);

export default [
  // react
  {
    input: `${pkgPath}/${module}`,
    output: {
      file: `${pkgDistPath}/index.js`,
      name: 'React',
      // 同时兼容 commonJs 和 ESM
      format: 'umd'
    },
    plugins: [
      ...getBaseRollupPlugins(),
      generatePackageJson({
        inputFolder: pkgPath,
        outputFolder: pkgDistPath,
        // 选择 package.json 中的指定字段
        baseContents: ({ name, description, version }) => ({
          name,
          description,
          version,
          main: 'index.js'
        })
      })
    ]
  },
  // jsx-runtime
  {
    input: `${pkgPath}/src/jsx.ts`,
    output: [
      // jsx-runtime
      {
        file: `${pkgDistPath}/jsx-runtime.js`,
        name: 'jsx-runtime',
        format: 'umd'
      },
      // jsx-dev-runtime
      {
        file: `${pkgDistPath}/jsx-dev-runtime.js`,
        name: 'jsx-dev-runtime',
        format: 'umd'
      }
    ],
    plugins: getBaseRollupPlugins()
  }
];
