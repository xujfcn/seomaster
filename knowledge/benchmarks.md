# 模型 Benchmark 数据

> 最后更新: 2026-03-05
> 数据来源: 已发布博客 blog-claude-vs-gpt5-vs-gemini-2026.md, blog-best-ai-models-coding-2026.md, blog-deepseek-r1-guide-2026.md
> 注意: Benchmark 数据更新频繁，发布前核实

## 编程 Benchmark

### SWE-Bench Verified (真实 GitHub issue 修复)
| 模型 | 得分 | 备注 |
|------|------|------|
| Claude Sonnet 4.6 | 72.7% | 编程最强 |
| Claude Opus 4.6 | 72.5% | |
| GPT-5 | ~68% | |
| Gemini 2.5 Pro | ~65% | |
| GPT-4.1 | 54.6% | |

### HumanEval (代码生成)
| 模型 | 得分 |
|------|------|
| Claude Opus 4.6 | 92.0% |
| GPT-5 | ~90% |
| Gemini 2.5 Pro | ~88% |

### MBPP+ (Python 编程)
| 模型 | 得分 |
|------|------|
| Claude Opus 4.6 | 87.5% |
| GPT-5 | ~85% |
| Gemini 2.5 Pro | ~83% |

## 推理 Benchmark

### GPQA Diamond (研究生级科学推理)
| 模型 | 得分 |
|------|------|
| Claude Opus 4.6 | 65.0% |
| GPT-5 | ~63% |
| Gemini 2.5 Pro | ~60% |

### MMLU Pro (综合知识)
| 模型 | 得分 |
|------|------|
| Claude Opus 4.6 | 84.5% |
| GPT-5 | ~83% |
| Gemini 2.5 Pro | ~81% |

## 数学 Benchmark

| Benchmark | DeepSeek R1 | OpenAI o1 | Claude Opus 4.6 |
|-----------|------------|-----------|-----------------|
| AIME 2024 | 79.8% | 83.3% | ~65% |
| MATH-500 | 97.3% | 96.4% | ~90% |
| Codeforces Elo | 2,029 | 1,891 | ~1,600 |

## 旗舰模型综合对比

| Benchmark | Claude Opus 4.6 | GPT-5 | Gemini 2.5 Pro | 最强 |
|-----------|-----------------|-------|----------------|------|
| SWE-Bench | 72.5% | ~68% | ~65% | Claude |
| HumanEval | 92.0% | ~90% | ~88% | Claude |
| MBPP+ | 87.5% | ~85% | ~83% | Claude |
| GPQA Diamond | 65.0% | ~63% | ~60% | Claude |
| MMLU Pro | 84.5% | ~83% | ~81% | Claude |
| AIME 2024 | ~65% | — | — | DeepSeek R1 |
| MATH-500 | ~90% | — | — | DeepSeek R1 |

## 编程工具市场数据

| 工具 | 价格 | ARR | 备注 |
|------|------|-----|------|
| Cursor | $20/mo | $500M+ | 最流行 AI IDE |
| GitHub Copilot | $10/mo | $2B+ | 最大用户基数 |
| Claude Code | $17/mo Pro | — | CLI 工具 |
| Kiro (AWS) | $19/mo | — | Spec-driven |
| Windsurf | Free/$15 | — | |
| Gemini CLI | Free | — | |

### 编程场景关键数据
- OpenRouter 编程查询占比: 11% → 50%+（增长最快）
- Claude 在编程支出中占比: 60%+
- 编程是 AI API 最大单一使用场景
