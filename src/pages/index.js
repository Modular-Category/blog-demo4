import React from "react";
import clsx from "clsx";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import styles from "./index.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faGraduationCap,
  faFileCode,
} from "@fortawesome/free-solid-svg-icons";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">QWorld</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
      </div>
    </header>
  );
}

// 導線を明確にするためのカードコンポーネント
function ActionCard({ to, icon, title, children }) {
  return (
    <div className="col col--4">
      <Link to={to} className={clsx("card-style", styles.actionCard)}>
        <div className="text--center">
          <FontAwesomeIcon
            icon={icon}
            size="3x"
            className={styles.actionIcon}
          />
          <h3 className="margin-top--lg">{title}</h3>
          <p>{children}</p>
        </div>
      </Link>
    </div>
  );
}

function HomepageActions() {
  return (
    <section className={styles.actions}>
      <div className="container">
        <div className="row">
          <ActionCard
            to="/docs/tutorials/basic_elements"
            icon={faGraduationCap}
            title="チュートリアル"
          >
            QWorldの基本的な使い方を、ステップ・バイ・ステップで学びます。まずはここから始めましょう。
          </ActionCard>
          <ActionCard
            to="/docs/guides/monoidal_category"
            icon={faBook}
            title="概念ガイド"
          >
            圏論の概念がQWorldでどう表現されるかを探ります。理論的な背景を理解したい方向けです。
          </ActionCard>
          <ActionCard
            to="/docs/reference/elements/qbox"
            icon={faFileCode}
            title="APIリファレンス"
          >
            全コマンドとオプションの詳細な仕様。特定の機能を探したい時に便利です。
          </ActionCard>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title="ホーム"
      description="QWorld - モノイダル圏のための直感的なLaTeX図式計算パッケージ"
    >
      <HomepageHeader />
      <main>
        <HomepageActions />
      </main>
    </Layout>
  );
}
