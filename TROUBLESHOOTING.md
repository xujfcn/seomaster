# Troubleshooting Guide

## AI 返回空响应

### 症状
```
❌ Error: AI returned empty content
```

### 原因
1. **Prompt 太长**：竞品数据过多导致 prompt 超过模型限制
2. **内容过滤**：某些关键词触发了 API 的内容过滤
3. **模型错误**：临时性的 API 错误

### 解决方案

#### 1. 自动优化（已实现）
系统已自动限制：
- 最多 5 个竞品（原来 10 个）
- 只包含 H1-H3 标题（跳过 H4）
- 每篇文章最多 25 个标题

#### 2. 减少搜索结果数
```bash
seomaster concept "keyword" --results 5
```

#### 3. 检查 Debug 文件
```bash
# 查看完整 API 响应
cat output/debug-api-full-response.json

# 查看 AI 返回内容
cat output/debug-ai-response.txt

# 检查 prompt tokens
grep "prompt_tokens" output/debug-api-full-response.json
```

#### 4. 手动重试
```bash
# 删除旧文件重新生成
rm output/keyword-concept.yaml
seomaster concept "keyword"
```

## 其他常见问题

### Q: 生成速度慢
A: 正常情况下 concept 生成需要 1-2 分钟：
- 搜索：10-20 秒
- 抓取：30-60 秒
- AI 生成：20-40 秒

### Q: 抓取失败
A: 部分网站可能阻止爬虫，只要成功抓取 3+ 篇文章即可继续。

### Q: 字数超标
A: 目前 AI 仍可能超出目标字数 30-60%，需要手动编辑或在 draft 阶段控制。

### Q: 语言混杂
A: 已在 prompt 中强制语言纯净，如仍出现请报告。

## 获取帮助

1. 检查 `output/debug-*.json` 文件
2. 查看完整错误信息
3. 提供关键词和错误日志
