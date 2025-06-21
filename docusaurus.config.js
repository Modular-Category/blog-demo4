// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

import {themes} from 'prism-react-renderer';

const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'QWorld',
  tagline: 'モノイダル圏のための直感的なLaTeX図式計算パッケージ',
  url: 'https://qworld-doc.netlify.app', // ★ あなたのサイトのURLに置き換えてください
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico', // ★ ファビコン画像へのパス

  // GitHub pages deployment config.
  organizationName: 'your-github-username', // ★ あなたのGitHubユーザー名
  projectName: 'qworld-docs', // ★ あなたのGitHubリポジトリ名

  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Edit URLをあなたのリポジトリに合わせてください
          editUrl:
            'https://github.com/your-github-username/qworld-docs/tree/main/',
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://github.com/your-github-username/qworld-docs/tree/main/',
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
      navbar: {
        title: 'QWorld',
        logo: {
          alt: 'QWorld Logo',
          src: 'img/logo.svg', // ★ ロゴ画像へのパス
        },
        items: [
          {
            type: 'doc',
            docId: 'tutorials/basic-elements',
            position: 'left',
            label: 'チュートリアル',
          },
          {
            type: 'doc',
            docId: 'guides/monoidal-categories',
            position: 'left',
            label: '概念ガイド',
          },
          {
            type: 'doc',
            docId: 'reference/elements/qbox',
            position: 'left',
            label: 'APIリファレンス',
          },
          {to: '/blog', label: 'ブログ', position: 'left'},
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/your-github-username/qworld-docs', // ★ あなたのGitHubリポジトリURL
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'ドキュメント',
            items: [
              {
                label: 'チュートリアル',
                to: '/docs/tutorials/basic-elements',
              },
              {
                label: '概念ガイド',
                to: '/docs/guides/monoidal-categories',
              },
            ],
          },
          {
            title: 'コミュニティ',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/qworld', // (例)
              },
              {
                label: 'Discord',
                href: 'https://discordapp.com/invite/docusaurus', // (例)
              },
            ],
          },
          {
            title: 'その他',
            items: [
              {
                label: 'ブログ',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/your-github-username/qworld-docs', // ★
              },
               {
                label: 'CTAN',
                href: 'https://ctan.org/pkg/qworld',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Niina Ryota. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['latex'],
      },
      // Algoliaの検索設定（後で設定）
      algolia: {
        appId: 'YOUR_APP_ID',
        apiKey: 'YOUR_SEARCH_API_KEY',
        indexName: 'YOUR_INDEX_NAME',
        contextualSearch: true,
      },
    }),
};

export default config;
