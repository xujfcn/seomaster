# SEOMaster 工作流详细指南

本文档详细说明 SEOMaster 的完整工作流程，包括每个阶段的输入、输出和决策点。

## 工作流概览

```
Research → Thesis确认 → Concept → Write → Review → Rewrite → Publish
```

**核心原则：** Research 决定 Concept 的天花板，Concept 决定文章的天花板。上游的匮乏无法在下游弥补。

---

## 阶段 1: Research（研究）

### 目标
收集可验证的数据，了解竞品策略，为 Thesis 提供素材。

### 输入
- 文章主题
- 目标关键词
- 竞品列表

### 执行者
🟢 AI 自主执行

### 任务清单
- [ ] 竞品关键词分析
- [ ] 价格数据收集（标注日期和来源）
- [ ] 性能数据收集（标注测试条件）
- [ ] 用户案例收集（可核实的）
- [ ] 行业报告整合
- [ ] Google Trends 分析
- [ ] Reddit/HN/知乎 热门讨论

### 输出
`research-notes.md` 包含：
- 竞品数据对比表
- 价格趋势图
- 用户痛点总结
- 关键词搜索量和难度
- 参考文章列表

### 质量标准
- ✅ 所有数据标注来源和日期
- ✅ 价格数据来自官网或实测
- ✅ 用户案例可核实（公司名/时间）
- ✅ 至少 10 个数据点

---

## 阶段 2: Thesis 确认

### 目标
确定文章的核心论点，一句话说清「读完后读者会记住什么」。

### 输入
- Research 阶段的数据
- 产品核心价值主张
- 目标读者痛点

### 执行者
🔴 人工决策（AI 提供 2-3 个候选）

### AI 生成 Thesis 候选

AI 根据 Research 数据和 `project-config.yaml` 生成 2-3 个 Thesis 候选：

**示例：**
1. "用 LemonData 一个 API Key 接入 300+ 模型，比逐个配置官方 API 省 90% 时间"
2. "LemonData 让 AI 开发者用统一 API 访问所有模型，价格比官方低 40%"
3. "从 OpenRouter 迁移到 LemonData，5 分钟完成，每月省 $200"

### 人工选择标准

**检验标准：**
1. 删掉所有数据和案例，只留论点，论点本身是否有价值？
2. 目标读者是否已经在别处看过类似内容？增量是什么？
3. 读者看完会采取什么行动？（注册/迁移/分享）

**选择原则：**
- ✅ 具体（有数字、有动作）
- ✅ 可验证（数据真实）
- ✅ 有增量（不是老生常谈）
- ✅ 导向行动（读者知道下一步做什么）

### 输出
确定的 Thesis，写入 `article-task.yaml`：

```yaml
thesis:
  final: "用 LemonData 一个 API Key 接入 300+ 模型，比逐个配置官方 API 省 90% 时间"
```

---

## 阶段 3: Concept（立意）

### 目标
设计文章结构，确保每个部分都服务于 Thesis。

### 输入
- 确定的 Thesis
- Research 数据
- 内容类型规范（`content-types.yaml`）

### 执行者
🟡 AI 建议 + 人工快速确认

### 使用脚本自动生成 Concept

```bash
# 基本用法（英文关键词，美国市场）
node scripts/generate-concept.js --keyword "openrouter alternative"

# 中文关键词
node scripts/generate-concept.js --keyword "AI API 聚合平台" --lang zh --market cn

# 自定义输出目录
node scripts/generate-concept.js --keyword "llm proxy" --out articles/blog
```

脚本自动完成以下工作：
1. 搜索 Google 前 10 条结果（Apify API）
2. 并发抓取每篇文章 H1-H4 大纲（cheerio）
3. AI 分析竞品大纲 → 生成本文大纲（「是什么→为什么→怎么做」逻辑）
4. H1-H4 每层包含关键词的不同角度/变体
5. 标注 1-2 处配图位置（`image_needed: true`）
6. 输出 `{slug}-concept.yaml` 和 `{slug}-research.json`

脚本生成后，人工需要确认：
- [ ] `thesis.final` 是否清晰？（一句话读完后记住什么）
- [ ] `competitor_analysis.gap_opportunities` 是否可作为差异化亮点？
- [ ] 配图位置是否合理？图片描述是否清晰？
- [ ] 各 section 的 `evidence` 字段是否补充了真实数据？

### 人工确认要点

- [ ] 每个 section 的 keyPoint 是否服务于 Thesis？
- [ ] 是否有足够的证据支撑每个 keyPoint？
- [ ] 文章结构是否符合目标读者的阅读习惯？
- [ ] 是否包含必要的元素（代码/数据/CTA）？

### 输出
确认的 `article-concept.yaml`

---

## 阶段 4: Write（写作）

### 目标
根据 Concept 生成初稿。

### 输入
- `article-concept.yaml`
- `project-config.yaml`（品牌声音）
- `quality-standards.yaml`（写作规范）

### 执行者
🟢 AI 自主执行

### AI 写作指令

```
根据 article-concept.yaml 生成初稿，遵循以下规范：

1. 开篇：使用 Concept 中定义的开篇方式
2. 结构：严格按照 sections 顺序
3. 证据：每个 keyPoint 必须有数据支撑
4. 代码：code_example: true 的 section 必须包含可运行代码
5. 标记：使用 <!-- HOOK -->、<!-- CODE --> 等标记
6. 声音：遵循 project-config.yaml 中的 voice 定义
7. 禁忌：避免 quality-standards.yaml 中的所有禁用词

输出格式：Markdown
```

### 输出
`article-draft.md`

---

## 阶段 5: Review（审阅）

### 目标
检查文章质量，输出评分和修改清单。

### 输入
- `article-draft.md`
- `quality-standards.yaml`

### 执行者
🟢 AI 自主执行（硬指标）+ 🔴 人工（软指标）

### 硬指标检查（AI）

运行 `quality-check.js`：

```bash
node scripts/quality-check.js article-draft.md
```

**检查项：**
- [ ] 标点符号（—— ≤3, ** ≤3）
- [ ] 禁用词（路标词、揭示类、元叙事、营销腔）
- [ ] AI 句式（"这不是X，这是Y"、"在当今...时代"）
- [ ] 开篇规范（是否使用禁止句式）
- [ ] 结尾规范（是否有 CTA）
- [ ] 字数（是否在目标范围内）

**输出示例：**
```
✅ 硬指标通过
❌ 发现 2 处「本文」，需要修复
❌ 发现 1 处「值得注意的是」，需要删除
✅ 字数 2,150（目标 2,000）
✅ 代码示例 3 个
✅ 数据表格 2 个

硬指标得分：35/40
```

### 软指标检查（人工）

- [ ] **Thesis 清晰度** - 读完后能一句话总结吗？
- [ ] **证据充分性** - 每个判断都有数据支撑吗？
- [ ] **数据准确性** - 价格/性能数据已验证吗？
- [ ] **可读性** - 开发者能快速理解吗？
- [ ] **行动号召** - 读者知道下一步做什么吗？

**输出：**
```
软指标得分：50/60

总分：85/100（及格线 80）

修改建议：
1. 第 2 节缺少数据支撑，补充价格对比表
2. 第 4 节代码示例缺少注释
3. CTA 不够明确，建议改为「立即注册，5 分钟完成部署」
```

---

## 阶段 6: Rewrite（重写）

### 目标
修复所有未通过项，达到发布标准。

### 输入
- `article-draft.md`
- Review 阶段的修改清单

### 执行者
🟢 AI 自主执行（硬指标修复）+ 🔴 人工（软指标修复）

### AI 修复硬指标

```bash
node scripts/fix-hard-metrics.js article-draft.md
```

AI 自动修复：
- 删除所有禁用词
- 替换 AI 句式
- 调整标点符号
- 规范开篇和结尾

### 人工修复软指标

根据 Review 建议：
- 补充缺失的数据
- 验证数据准确性
- 优化代码示例
- 强化 CTA

### 输出
`article-final.md`

---

## 阶段 7: Publish（发布）

### 目标
多渠道分发，跟踪效果。

### 输入
- `article-final.md`
- `project-config.yaml`（发布渠道配置）

### 执行者
🔴 人工决策（发布时机和平台）

### 发布节奏（单篇内容）

```
D+0  官网博客上线
D+1  知乎/掘金（中文版）
D+2  Twitter Thread（英文版）
D+3  小红书（配图版）
D+7  dev.to/Reddit（英文版）
```

### 平台适配

不同平台需要调整：

**知乎：**
- 开篇更口语化
- 先回答问题，最后引出产品
- 避免硬广

**小红书：**
- 必须配图（价格对比/截图）
- 标题党（但不夸张）
- 多用 emoji

**dev.to：**
- 英文版
- 代码示例完整
- 添加 tags

**Twitter：**
- Thread 形式
- 每条 1 个要点
- 配图/GIF

### 发布脚本

```bash
# 翻译成英文
node scripts/translate.js article-final.md --to en

# 发布到官网博客（自动）
node scripts/publish.js article-final.md --platform blog

# 发布到知乎（手动）
# 复制内容，调整格式，手动发布

# 发布到 Twitter（脚本辅助）
node scripts/generate-thread.js article-final.md
# 输出 Twitter Thread 文本，手动发布
```

### 发布后跟踪

在 `article-task.yaml` 中记录：

```yaml
post_publish:
  analytics:
    views: 1250
    engagement_rate: 8.5%
    conversion_rate: 2.3%

  feedback:
    - source: "知乎评论"
      content: "教程很详细，但缺少 Windows 部署说明"
      action: "补充 Windows 部署章节"
```

---

## 决策分层总结

### 🔴 必须人工决策
- **Thesis 方向** - AI 提供候选，人工选择
- **核心卖点表述** - 确保准确传达产品价值
- **数据准确性** - 验证价格/性能数据
- **发布决定** - 何时发布、发布到哪些平台

### 🟡 AI 建议 + 人工快速确认
- **文章结构** - AI 生成 Concept，人工确认
- **开篇角度** - AI 提供选项，人工选择
- **SEO 关键词** - AI 研究，人工确认
- **竞品对比角度** - AI 分析，人工确认

### 🟢 AI 自主执行
- **硬指标修复** - 删除禁用词、调整标点
- **AI 句式替换** - 自动识别和替换
- **翻译** - 中英互译
- **格式规范化** - Markdown 格式统一

---

## 常见问题

### Q: 如果 Research 阶段数据不足怎么办？
A: 不要强行进入 Concept 阶段。补充 Research，或调整文章主题。上游的匮乏无法在下游弥补。

### Q: Thesis 确认阶段，3 个候选都不满意怎么办？
A: 让 AI 重新生成，或人工修改候选。不要妥协，Thesis 决定文章天花板。

### Q: Review 阶段评分不及格怎么办？
A: 回到 Concept 阶段，检查结构是否合理。如果 Concept 没问题，进入 Rewrite 修复。

### Q: 发布后效果不好怎么办？
A: 分析数据，找出问题（标题不吸引人？开篇不够强？CTA 不明确？），更新文章或用于下一篇改进。

---

## 最佳实践

1. **不要跳过 Research** - 数据不足的文章没有说服力
2. **Thesis 必须人工确认** - 这是最重要的决策点
3. **Concept 阶段多花时间** - 结构决定文章质量
4. **硬指标零容忍** - 所有禁用词必须删除
5. **数据必须可验证** - 标注来源和日期
6. **发布后持续优化** - 根据反馈更新文章

---

**下一步：** 查看 [质量检查清单](quality-checklist.md) 了解详细的质量标准。
