import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
/* import styles from './index.module.css';*/
import styles from './index.module.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faPencilRuler, faSitemap } from '@fortawesome/free-solid-svg-icons';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">圏論の図式計算を、<br/>もっと直感的に、美しく。</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/tutorials/basic_elements">
            5分で使い始める
          </Link>
        </div>
      </div>
    </header>
  );
}

const FeatureList = [
  {
    title: 'シンプルな構文',
    Icon: faCode, 
    description: (
      <>
        <code>\qbox</code> や <code>\qbraid</code> のような直感的なコマンドで、見たままの図式を構成できます。コードの可読性が高く、複雑な図でも管理が容易です。
      </>
    ),
  },
  {
    title: '高いカスタマイズ性',
    Icon: faPencilRuler,
    description: (
      <>
        パワフルなTikZが基盤。色、サイズ、線のスタイルなど、あらゆる要素を細かく調整可能です。あなたの論文やスライドに最適な、一貫性のある美しい図を作成できます。
      </>
    ),
  },
  {
    title: '豊富な圏論的構造',
    Image: 'img/undraw_docusaurus_react.svg',
    description: (
      <>
        フロベニウス則からホップ代数、ピボタル構造まで、多岐にわたる概念をサポート。量子論から計算機科学まで、幅広い分野の研究を加速させます。
      </>
    ),
  },
];

function Feature({Icon, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <FontAwesomeIcon icon={Icon} className={styles.featureIcon} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ExampleGallery() {
    return (
      <section className={clsx('hero', styles.gallerySection)}>
        <div className="container">
          <h2 className="text--center">作例ギャラリー</h2>
          <p className="text--center">QWorldは、シンプルさ と 表現力を両立します。</p>
          <div className="row">
            <div className={clsx('col col--6', styles.galleryItem)}>
                <img src="https://placehold.co/600x400/e0e7ff/3730a3?text=Colorful%20Diagram%201" alt="作例1"/>
                <p>複雑なテンソルネットワークも、色分けして視覚的に表現。</p>
            </div>
            <div className={clsx('col col--6', styles.galleryItem)}>
                <img src="https://placehold.co/600x400/e0e7ff/3730a3?text=Knot%20Diagram%202" alt="作例2"/>
                <p>リボン圏の構造を利用して、結び目理論の図式も描画可能。</p>
            </div>
          </div>
        </div>
      </section>
    );
}


export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`ホーム`}
      description="QWorld - モノイダル圏のための直感的なLaTeX図式計算パッケージ">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <ExampleGallery />
      </main>
    </Layout>
  );
}
