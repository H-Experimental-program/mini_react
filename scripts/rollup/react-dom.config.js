import alias from '@rollup/plugin-alias';
import { getPackageJSON, resolvePkgPath, getBaseRollupPlugins } from './utils';

import generatePackageJson from 'rollup-plugin-generate-package-json';

const { name, module, peerDependencies } = getPackageJSON('react-dom');
const pkgPath = resolvePkgPath(name);
const pkgDistPath = resolvePkgPath(name, true);

export default [
  // react-dom
  {
    input: `${pkgPath}/${module}`,
    output: [
      {
        file: `${pkgDistPath}/index.js`,
        name: 'index.js',
        format: 'umd'
      },
      {
        file: `${pkgDistPath}/client.js`,
        name: 'client.js',
        format: 'umd'
      }
    ],
    // 数据共享层放在 react 中，不打包进 react-dom
    externals: [...Object.keys(peerDependencies)],
    plugins: [
      ...getBaseRollupPlugins(),
      // webpack resolve alias
      alias({
        entries: {
          // tsconfig 中 path 只处理 ts 类型检查
          // 打包时需要在此处配置
          hostConfig: `${pkgPath}/src/hostConfig.ts`
        }
      }),
      generatePackageJson({
        inputFolder: pkgPath,
        outputFolder: pkgDistPath,
        // 选择 package.json 中的指定字段
        baseContents: ({ name, description, version }) => ({
          name,
          description,
          version,
          // peerDependencies 在 npm install 时不会安装
          // 默认已经存在
          peerDependencies: {
            react: version
          },
          main: 'index.js'
        })
      })
    ]
  }
];
