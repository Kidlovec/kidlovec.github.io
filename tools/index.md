---
layout: page
title: Tools
navigation: true
logo: 'assets/images/ghost.png'
current: tools
---

<style>
  .tools-page {
    --tools-text: #3A4145;
    --tools-muted: #7d8a93;
    --tools-faint: #a2adb5;
    --tools-line: #e5edf2;
    --tools-soft: #f7fafb;
    --tools-accent: #4a90c2;
    max-width: 760px;
    margin: -1rem auto 0;
    color: var(--tools-text);
  }

  html[data-theme="dark"] .tools-page {
    --tools-text: #dbe7f3;
    --tools-muted: #9badbf;
    --tools-faint: #718398;
    --tools-line: rgba(255, 255, 255, .12);
    --tools-soft: rgba(255, 255, 255, .035);
    --tools-accent: #75f0c6;
  }

  .tools-intro {
    margin-bottom: 3.4rem;
    padding-bottom: 2.8rem;
    border-bottom: 1px solid var(--tools-line);
  }

  .tools-intro p {
    margin: 0;
    color: var(--tools-muted);
    font-size: 1.65rem;
    line-height: 1.75;
  }

  .tools-section {
    margin: 0 0 4.2rem;
  }

  .tools-section-title {
    margin: 0 0 1.6rem !important;
    color: var(--tools-text) !important;
    font-family: "Open Sans", sans-serif;
    font-size: 1.45rem !important;
    font-weight: 700 !important;
    letter-spacing: .08em;
    line-height: 1.2 !important;
    text-transform: uppercase;
  }

  .tools-list {
    display: grid;
    gap: 1.2rem;
  }

  .tool-entry {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 1.6rem;
    align-items: center;
    padding: 1.8rem 0;
    border-top: 1px solid var(--tools-line);
    color: inherit !important;
    text-decoration: none !important;
  }

  .tool-entry:last-child {
    border-bottom: 1px solid var(--tools-line);
  }

  .tool-entry:hover .tool-title,
  .tool-entry:focus .tool-title {
    color: var(--tools-accent) !important;
  }

  .tool-entry:focus {
    outline: 2px solid var(--tools-accent);
    outline-offset: 6px;
  }

  .tool-meta {
    display: flex;
    flex-wrap: wrap;
    gap: .7rem;
    margin-bottom: .7rem;
  }

  .tool-label,
  .tool-status {
    display: inline-flex;
    align-items: center;
    min-height: 2.2rem;
    padding: 0 .75rem;
    border-radius: 999px;
    font-family: "Open Sans", sans-serif;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1;
  }

  .tool-label {
    background: var(--tools-soft);
    color: var(--tools-accent);
    letter-spacing: .06em;
    text-transform: uppercase;
  }

  .tool-status {
    color: var(--tools-faint);
    border: 1px solid var(--tools-line);
  }

  .tool-title {
    margin: 0 0 .55rem !important;
    color: var(--tools-text) !important;
    font-family: "Open Sans", sans-serif;
    font-size: 2rem !important;
    font-weight: 700 !important;
    line-height: 1.28 !important;
    transition: color .18s ease;
  }

  .tool-desc {
    margin: 0 !important;
    color: var(--tools-muted);
    font-size: 1.42rem;
    line-height: 1.65;
  }

  .tool-open {
    color: var(--tools-faint);
    font-family: "Open Sans", sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .tool-entry:hover .tool-open,
  .tool-entry:focus .tool-open {
    color: var(--tools-accent);
  }

  .tool-feature {
    margin-bottom: 1.2rem;
    padding: 2.2rem;
    border: 1px solid var(--tools-line);
    border-radius: 8px;
    background: var(--tools-soft);
  }

  .tool-feature .tool-entry {
    padding: 0;
    border: 0;
  }

  @media (max-width: 640px) {
    .tools-page {
      margin-top: 0;
    }

    .tool-entry {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .tool-open {
      justify-self: start;
    }

    .tool-feature {
      padding: 1.7rem;
    }
  }
</style>

<div class="tools-page">
  <div class="tools-intro">
    <p>一些自己用得上的小工具。数据优先在浏览器或本机处理；偏计算、图解和交互式可视化。</p>
  </div>

  <section class="tools-section" aria-labelledby="daily-tools">
    <h2 class="tools-section-title" id="daily-tools">Daily Tools</h2>
    <div class="tools-list">
      <a class="tool-entry" href="/tools/weread/">
        <div>
          <div class="tool-meta">
            <span class="tool-label">Reading</span>
            <span class="tool-status">本地私密</span>
          </div>
          <h3 class="tool-title">读迹 · 微信读书轨迹</h3>
          <p class="tool-desc">从年度时长、书架、笔记与六维画像回看自己的微信读书历程；支持演示数据，连接真实数据需启动本机连接器。</p>
        </div>
        <span class="tool-open">Open</span>
      </a>

      <a class="tool-entry" href="/tools/mortgage-calculator.html">
        <div>
          <div class="tool-meta">
            <span class="tool-label">Finance</span>
            <span class="tool-status">本地计算</span>
          </div>
          <h3 class="tool-title">房贷计算器</h3>
          <p class="tool-desc">支持等额本息、等额本金、利率调整和多次提前还款，用于快速比较还款路径。</p>
        </div>
        <span class="tool-open">Open</span>
      </a>
    </div>
  </section>

  <section class="tools-section" aria-labelledby="ai-visuals">
    <h2 class="tools-section-title" id="ai-visuals">AI Visualizations</h2>

    <div class="tool-feature">
      <a class="tool-entry" href="/tools/rag-workflow-visualizer.html">
        <div>
          <div class="tool-meta">
            <span class="tool-label">RAG</span>
            <span class="tool-status">交互演示</span>
          </div>
          <h3 class="tool-title">RAG 检索增强生成工作流</h3>
          <p class="tool-desc">从文档切分、向量索引、混合检索到上下文生成，拆解 RAG 的完整链路。</p>
        </div>
        <span class="tool-open">Open</span>
      </a>
    </div>

    <div class="tools-list">
      <a class="tool-entry" href="/tools/llm-panorama.html">
        <div>
          <div class="tool-meta">
            <span class="tool-label">Panorama</span>
            <span class="tool-status">全景演示</span>
          </div>
          <h3 class="tool-title">LLM 全景演示</h3>
          <p class="tool-desc">全局架构、推理链路、Attention、KV Cache、多卡并行与优化策略的综合视图。</p>
        </div>
        <span class="tool-open">Open</span>
      </a>

      <a class="tool-entry" href="/tools/llm-exec-view.html">
        <div>
          <div class="tool-meta">
            <span class="tool-label">Execution</span>
            <span class="tool-status">KV 视图</span>
          </div>
          <h3 class="tool-title">LLM KV 可视化</h3>
          <p class="tool-desc">聚焦推理执行中的 KV Cache 行为，帮助理解 token 生成过程中的状态复用。</p>
        </div>
        <span class="tool-open">Open</span>
      </a>

      <a class="tool-entry" href="/tools/llm-exec-view2.html">
        <div>
          <div class="tool-meta">
            <span class="tool-label">Execution</span>
            <span class="tool-status">流程视图</span>
          </div>
          <h3 class="tool-title">LLM Exec 可视化</h3>
          <p class="tool-desc">展示一次推理请求从输入、调度、计算到输出的执行路径。</p>
        </div>
        <span class="tool-open">Open</span>
      </a>

      <a class="tool-entry" href="/tools/llm-guide-mobile.html">
        <div>
          <div class="tool-meta">
            <span class="tool-label">Guide</span>
            <span class="tool-status">移动版</span>
          </div>
          <h3 class="tool-title">LLM 可视化 Guide</h3>
          <p class="tool-desc">适合手机阅读的 LLM 图解入口，用更轻量的版式呈现关键概念。</p>
        </div>
        <span class="tool-open">Open</span>
      </a>

      <a class="tool-entry" href="/tools/llm-guide.html">
        <div>
          <div class="tool-meta">
            <span class="tool-label">Guide</span>
            <span class="tool-status">桌面交互</span>
          </div>
          <h3 class="tool-title">LLM 物理 × 逻辑全景图解</h3>
          <p class="tool-desc">用 8 个 Tab 拆解架构、训练与推理、多卡并行、Attention 和优化全景。</p>
        </div>
        <span class="tool-open">Open</span>
      </a>
    </div>
  </section>
</div>
