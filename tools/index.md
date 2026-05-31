---
layout: page
title: Tools
navigation: true
logo: 'assets/images/ghost.png'
current: tools
---

<style>
  .tools-home {
    --tools-ink: #172033;
    --tools-muted: #66758f;
    --tools-faint: #8a98ad;
    --tools-bg: #f7fafc;
    --tools-panel: #ffffff;
    --tools-panel-soft: #f1f6f8;
    --tools-line: #dce7ef;
    --tools-blue: #2563eb;
    --tools-teal: #0f9f8f;
    --tools-amber: #b7791f;
    --tools-rose: #be4b72;
    --tools-shadow: 0 18px 45px rgba(41, 58, 83, .10);
    color: var(--tools-ink);
    margin: -1rem auto 0;
  }

  html[data-theme="dark"] .tools-home {
    --tools-ink: #edf5ff;
    --tools-muted: #a8b8cc;
    --tools-faint: #7f90a8;
    --tools-bg: #0a111d;
    --tools-panel: #101927;
    --tools-panel-soft: #0d1624;
    --tools-line: rgba(167, 190, 216, .18);
    --tools-blue: #7ab4ff;
    --tools-teal: #6ee7cf;
    --tools-amber: #f0bf67;
    --tools-rose: #f08aaa;
    --tools-shadow: 0 20px 55px rgba(0, 0, 0, .28);
  }

  .tools-home * {
    box-sizing: border-box;
  }

  .tools-shell {
    background:
      linear-gradient(135deg, rgba(37, 99, 235, .08), transparent 34%),
      linear-gradient(315deg, rgba(15, 159, 143, .09), transparent 36%),
      var(--tools-bg);
    border: 1px solid var(--tools-line);
    border-radius: 8px;
    padding: 26px;
    box-shadow: var(--tools-shadow);
  }

  .tools-intro {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 22px;
    align-items: end;
    padding-bottom: 22px;
    border-bottom: 1px solid var(--tools-line);
  }

  .tools-kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 10px;
    color: var(--tools-teal);
    font: 700 12px/1 "Open Sans", sans-serif;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  .tools-kicker::before {
    content: "";
    width: 28px;
    height: 2px;
    background: currentColor;
  }

  .tools-title {
    margin: 0 0 10px !important;
    color: var(--tools-ink) !important;
    font-size: clamp(2.8rem, 5vw, 4.5rem) !important;
    line-height: 1.05 !important;
    letter-spacing: 0 !important;
  }

  .tools-subtitle {
    max-width: 680px;
    margin: 0;
    color: var(--tools-muted);
    font-size: 1.55rem;
    line-height: 1.7;
  }

  .tools-counts {
    display: grid;
    grid-template-columns: repeat(2, minmax(92px, 1fr));
    gap: 10px;
    min-width: 220px;
  }

  .tools-count {
    min-height: 78px;
    padding: 13px 14px;
    border: 1px solid var(--tools-line);
    border-radius: 8px;
    background: rgba(255, 255, 255, .56);
  }

  html[data-theme="dark"] .tools-count {
    background: rgba(255, 255, 255, .035);
  }

  .tools-count strong {
    display: block;
    color: var(--tools-ink);
    font: 700 2.4rem/1 "Open Sans", sans-serif;
  }

  .tools-count span {
    display: block;
    margin-top: 7px;
    color: var(--tools-faint);
    font-size: 1.15rem;
  }

  .tools-section {
    margin-top: 26px;
  }

  .tools-section-head {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: baseline;
    margin-bottom: 12px;
  }

  .tools-section h2 {
    margin: 0 !important;
    color: var(--tools-ink) !important;
    font-size: 2rem !important;
    line-height: 1.25 !important;
  }

  .tools-section-note {
    color: var(--tools-faint);
    font-size: 1.2rem;
    white-space: nowrap;
  }

  .tools-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .tool-card {
    position: relative;
    display: flex;
    min-height: 178px;
    flex-direction: column;
    justify-content: space-between;
    gap: 18px;
    padding: 18px;
    border: 1px solid var(--tools-line);
    border-radius: 8px;
    background: var(--tools-panel);
    color: var(--tools-ink) !important;
    text-decoration: none !important;
    transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
    overflow: hidden;
  }

  .tool-card::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: var(--accent);
  }

  .tool-card:hover,
  .tool-card:focus {
    transform: translateY(-2px);
    border-color: var(--accent);
    box-shadow: 0 18px 36px rgba(36, 52, 77, .14);
    outline: none;
  }

  html[data-theme="dark"] .tool-card:hover,
  html[data-theme="dark"] .tool-card:focus {
    box-shadow: 0 20px 40px rgba(0, 0, 0, .32);
  }

  .tool-card[data-accent="blue"] { --accent: var(--tools-blue); }
  .tool-card[data-accent="teal"] { --accent: var(--tools-teal); }
  .tool-card[data-accent="amber"] { --accent: var(--tools-amber); }
  .tool-card[data-accent="rose"] { --accent: var(--tools-rose); }

  .tool-meta {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
    margin-bottom: 13px;
  }

  .tool-type {
    color: var(--accent);
    font: 700 1.05rem/1 "Open Sans", sans-serif;
    letter-spacing: .12em;
    text-transform: uppercase;
  }

  .tool-status {
    color: var(--tools-faint);
    font-size: 1.1rem;
  }

  .tool-card h3 {
    margin: 0 0 8px !important;
    color: var(--tools-ink) !important;
    font-size: 2rem !important;
    line-height: 1.25 !important;
  }

  .tool-card p {
    margin: 0 !important;
    color: var(--tools-muted);
    font-size: 1.35rem;
    line-height: 1.62;
  }

  .tool-open {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--tools-ink);
    font: 700 1.22rem/1 "Open Sans", sans-serif;
  }

  .tool-open::after {
    content: "->";
    color: var(--accent);
    transition: transform .18s ease;
  }

  .tool-card:hover .tool-open::after,
  .tool-card:focus .tool-open::after {
    transform: translateX(3px);
  }

  .tool-card.featured {
    grid-column: span 2;
    min-height: 206px;
    background:
      linear-gradient(135deg, rgba(37, 99, 235, .08), transparent 56%),
      var(--tools-panel);
  }

  .tool-card.featured h3 {
    font-size: 2.45rem !important;
  }

  .tool-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 13px;
  }

  .tool-tag {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 8px;
    border: 1px solid var(--tools-line);
    border-radius: 8px;
    color: var(--tools-muted);
    background: var(--tools-panel-soft);
    font: 600 1.05rem/1 "Open Sans", sans-serif;
  }

  @media (max-width: 760px) {
    .tools-shell {
      padding: 18px;
    }

    .tools-intro {
      grid-template-columns: 1fr;
      align-items: start;
    }

    .tools-counts {
      width: 100%;
      min-width: 0;
    }

    .tools-grid {
      grid-template-columns: 1fr;
    }

    .tool-card,
    .tool-card.featured {
      grid-column: auto;
      min-height: 168px;
    }

    .tools-section-head {
      display: block;
    }

    .tools-section-note {
      display: block;
      margin-top: 5px;
      white-space: normal;
    }
  }
</style>

<div class="tools-home">
  <div class="tools-shell">
    <section class="tools-intro" aria-labelledby="tools-title">
      <div>
        <p class="tools-kicker">Local Web Tools</p>
        <h2 class="tools-title" id="tools-title">小工具</h2>
        <p class="tools-subtitle">纯前端、无后端、数据本地处理。这里收纳常用计算器、AI 架构图解和交互式可视化。</p>
      </div>
      <div class="tools-counts" aria-label="工具数量">
        <div class="tools-count">
          <strong>7</strong>
          <span>个工具</span>
        </div>
        <div class="tools-count">
          <strong>2</strong>
          <span>类场景</span>
        </div>
      </div>
    </section>

    <section class="tools-section" aria-labelledby="tools-core">
      <div class="tools-section-head">
        <h2 id="tools-core">核心工具</h2>
        <span class="tools-section-note">计算、检索、流程理解</span>
      </div>
      <div class="tools-grid">
        <a class="tool-card" data-accent="amber" href="/tools/mortgage-calculator.html">
          <div>
            <div class="tool-meta">
              <span class="tool-type">Finance</span>
              <span class="tool-status">本地计算</span>
            </div>
            <h3>房贷计算器</h3>
            <p>支持等额本息、等额本金、利率调整和多次提前还款，用于快速比较还款路径。</p>
          </div>
          <span class="tool-open">打开工具</span>
        </a>

        <a class="tool-card" data-accent="teal" href="/tools/rag-workflow-visualizer.html">
          <div>
            <div class="tool-meta">
              <span class="tool-type">RAG</span>
              <span class="tool-status">交互演示</span>
            </div>
            <h3>RAG 检索增强生成工作流</h3>
            <p>从文档切分、向量索引、混合检索到上下文生成，拆解 RAG 的完整链路。</p>
          </div>
          <span class="tool-open">查看可视化</span>
        </a>
      </div>
    </section>

    <section class="tools-section" aria-labelledby="tools-ai">
      <div class="tools-section-head">
        <h2 id="tools-ai">AI 可视化</h2>
        <span class="tools-section-note">LLM 架构、推理链路、KV Cache</span>
      </div>
      <div class="tools-grid">
        <a class="tool-card featured" data-accent="blue" href="/tools/llm-panorama.html">
          <div>
            <div class="tool-meta">
              <span class="tool-type">Panorama</span>
              <span class="tool-status">全景演示</span>
            </div>
            <h3>LLM 全景演示</h3>
            <p>全局架构、推理链路、Attention、KV Cache、多卡并行与优化策略的综合视图。</p>
            <div class="tool-tags" aria-label="内容标签">
              <span class="tool-tag">Attention</span>
              <span class="tool-tag">KV Cache</span>
              <span class="tool-tag">Parallelism</span>
            </div>
          </div>
          <span class="tool-open">进入演示</span>
        </a>

        <a class="tool-card" data-accent="blue" href="/tools/llm-exec-view.html">
          <div>
            <div class="tool-meta">
              <span class="tool-type">Execution</span>
              <span class="tool-status">KV 视图</span>
            </div>
            <h3>LLM KV 可视化</h3>
            <p>聚焦推理执行中的 KV Cache 行为，帮助理解 token 生成过程中的状态复用。</p>
          </div>
          <span class="tool-open">查看视图</span>
        </a>

        <a class="tool-card" data-accent="rose" href="/tools/llm-exec-view2.html">
          <div>
            <div class="tool-meta">
              <span class="tool-type">Execution</span>
              <span class="tool-status">流程视图</span>
            </div>
            <h3>LLM Exec 可视化</h3>
            <p>展示一次推理请求从输入、调度、计算到输出的执行路径。</p>
          </div>
          <span class="tool-open">查看视图</span>
        </a>

        <a class="tool-card" data-accent="teal" href="/tools/llm-guide-mobile.html">
          <div>
            <div class="tool-meta">
              <span class="tool-type">Guide</span>
              <span class="tool-status">移动版</span>
            </div>
            <h3>LLM 可视化 Guide</h3>
            <p>适合手机阅读的 LLM 图解入口，用更轻量的版式呈现关键概念。</p>
          </div>
          <span class="tool-open">打开 Guide</span>
        </a>

        <a class="tool-card" data-accent="blue" href="/tools/llm-guide.html">
          <div>
            <div class="tool-meta">
              <span class="tool-type">Guide</span>
              <span class="tool-status">桌面交互</span>
            </div>
            <h3>LLM 物理 × 逻辑全景图解</h3>
            <p>用 8 个 Tab 拆解架构、训练与推理、多卡并行、Attention 和优化全景。</p>
          </div>
          <span class="tool-open">打开 Guide</span>
        </a>
      </div>
    </section>
  </div>
</div>
