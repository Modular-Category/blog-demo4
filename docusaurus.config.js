// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

import {themes} from 'prism-react-renderer';
const path = require('path');

const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'QWorld',
  tagline: 'モノイダル圏のための直感的な LaTeX 図式計算パッケージ',
  // highlight-start
  url: 'https://Modular-Category.github.io', // ★ あなたのGitHubユーザー名に置き換える
  baseUrl: '/blog-demo4/', // ★ あなたのリポジトリ名に置き換える
  // highlight-end
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // highlight-start
  organizationName: 'Modular-Category', // ★ あなたのGitHubユーザー名
  projectName: 'blog-demo4', // ★ あなたのリポジトリ名
  // highlight-end

  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
  },
  
  // ...（以下の設定は変更なし）...
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/Modular-Category/blog-demo4/tree/main/',
          remarkPlugins: [require('remark-math')],
          rehypePlugins: [[require('rehype-katex'), {strict: false}]],
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://github.com/Modular-Category/blog-demo4/tree/main/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
        // ... themeConfig の中身は変更なし ...
    }),
  plugins: [
    path.resolve(__dirname, './plugins/docusaurus-qworld-plugin'),
  ],
};

module.exports = config;


