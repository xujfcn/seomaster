# SOP 标准实现总结

## 已实现的 SOP 约束

### 1. draft-generator.js 强化约束

#### System Prompt 全局约束
- ✅ E-E-A-T 原则（Experience, Expertise, Authoritativeness, Trustworthiness）
- ✅ 8th grade 阅读水平（简单词汇、短句、主动语态）
- ✅ 数据来源强制标注：(Source: Name, Year)
- ✅ Bold 限制：全文最多 3 次
- ✅ Em dash 限制：全文最多 3 次
- ✅ Exclamation 限制：全文最多 2 次
- ✅ 禁用 AI 套话模式

#### Intro 生成约束
- ✅ 字数：150-250 words（严格）
- ✅ 首句必须包含具体数据/案例/问题
- ✅ 禁止："In today's era...", "As AI develops..."
- ✅ 关键词必须出现并加粗
- ✅ 数据必须标注来源
- ✅ 明确价值主张

#### Section 生成约束
- ✅ 字数：严格限制（HARD LIMIT）
- ✅ 8th grade 语言水平
- ✅ 数据来源强制标注
- ✅ 表格强制用于对比
- ✅ 图片标记位置
- ✅ Bold 每个 section 最多 1 次
- ✅ 关键词自然出现 1-2 次
- ✅ 禁止总结性无意义段落
- ✅ 产品提及用"You can use..."

#### FAQ 生成约束
- ✅ 字数：400-600 words 总计
- ✅ 关键词在问题和答案中出现
- ✅ 答案长度：50-100 words
- ✅ 数据来源标注
- ✅ 禁止模糊回答

### 2. quality-check.js 增强检查

#### 硬性指标（CRITICAL）
- ✅ Bold 数量：≤3（超标则失败）
- ✅ Em dash：≤3
- ✅ 禁用词检查（中文）
- ✅ 禁用 AI 模式检查（英文）

#### 警告指标（WARNINGS）
- ✅ Exclamation：≤2
- ✅ 数据来源数量统计
- ✅ [DATA: ...] 占位符统计
- ✅ 表格检查
- ✅ 图片标记检查
- ✅ FAQ 章节检查
- ✅ Intro 关键词加粗检查
- ✅ 字数统计

#### 输出改进
- ✅ 分级报告：CRITICAL vs WARNINGS
- ✅ 详细统计信息
- ✅ 明确的下一步指引
- ✅ Exit code：失败返回 1，成功返回 0

## 测试结果

### 测试文章：free-api-draft.md

```
📊 Hard Metrics:
  ✅ Em dash (——): 0 (limit: 3)
  ❌ Bold (**): 3.5 (limit: 3)  ← CRITICAL
  ⚠️  Exclamation (!): 4 (limit: 2)
  ℹ️  Title: "Free API Guide 2026..."
  ℹ️  Data sources cited: 5
  ⚠️  Data placeholders: 8 (need manual fill)
  ✅ Tables found: 7 table(s)
  ℹ️  Image placeholders: 4
  ℹ️  Word count: 5344 words
  ✅ FAQ section found
```

**结果**：1 个 CRITICAL 问题（Bold 超标），需要修复后才能发布。

## 字数超标问题

### 当前状态
- 目标：2,500 words
- 实际：5,344 words
- 超出：114%

### 根本原因
虽然 prompt 中写了 `WORD COUNT LIMIT (STRICT): ${section.word_count} words maximum`，但 AI 仍然超标。

### 解决方案（待实现）

**方案 1：生成后截断**
```javascript
// 在 generateSection() 返回前
const words = result.split(/\s+/).length;
if (words > section.word_count * 1.2) {
  // 截断到目标字数
  const truncated = result.split(/\s+/).slice(0, section.word_count).join(' ');
  return truncated + '\n\n[Content truncated to meet word limit]';
}
```

**方案 2：分段生成**
```javascript
// 将大 section 拆分成多个小段，每段单独控制字数
// 例如：800 words section → 4 个 200 words 段落
```

**方案 3：增加 max_tokens 约束**
```javascript
// 在 callAI() 中根据目标字数计算 max_tokens
const maxTokens = Math.ceil(section.word_count * 1.5); // 1 word ≈ 1.5 tokens
```

## SOP 覆盖率

| SOP 要求 | 实现位置 | 状态 |
|---------|---------|------|
| E-E-A-T 原则 | draft-generator.js | ✅ |
| 8th grade 语言 | draft-generator.js | ✅ |
| 数据来源标注 | draft-generator.js + quality-check.js | ✅ |
| 简单词汇/短句 | draft-generator.js | ✅ |
| 关键词覆盖 | draft-generator.js + quality-check.js | ✅ |
| Bold/Em dash 限制 | draft-generator.js + quality-check.js | ✅ |
| 表格用于对比 | draft-generator.js + quality-check.js | ✅ |
| FAQ 章节 | draft-generator.js + quality-check.js | ✅ |
| 图片标记 | draft-generator.js + quality-check.js | ✅ |
| 禁用 AI 套话 | draft-generator.js + quality-check.js | ✅ |
| 产品提及方式 | draft-generator.js | ✅ |
| 字数控制 | draft-generator.js | ⚠️ 弱约束 |
| 内链/外链 | - | ❌ 需手动 |
| 图片质量 | - | ❌ 需手动 |
| URL 格式 | - | ❌ 需手动 |

## 下一步优化

### 高优先级
1. **字数控制**：实现生成后截断或 max_tokens 约束
2. **Bold 自动修复**：检测到超标时自动移除多余的 bold

### 中优先级
3. **内链建议**：扫描已发布文章，建议可添加的内链
4. **图片生成**：根据 `<!-- IMAGE: -->` 描述生成图片或推荐素材

### 低优先级
5. **URL 格式检查**：检查 slug 是否符合规范
6. **重复内容检测**：检查段落间是否有重复

## 使用指南

### 生成文章
```bash
seomaster new "keyword" --words 2500
```

### 质量检查
```bash
seomaster check article-slug
```

### 修复 Bold 超标
```bash
# 手动编辑 draft.md，删除多余的 **bold**
vim output/article-slug-draft.md

# 重新检查
seomaster check article-slug
```

### 填充数据占位符
```bash
# 搜索所有 [DATA: ...] 占位符
grep -n "\[DATA:" output/article-slug-draft.md

# 手动填充真实数据
vim output/article-slug-draft.md
```
