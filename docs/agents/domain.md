# Domain Docs

本文件说明 engineering skills 在探索代码库时如何使用本仓库的领域文档。

## 探索前读取

- 根目录的 `CONTEXT.md`，仅在其存在时读取。
- `docs/adr/` 下与当前工作相关的 ADRs。

若这些文件尚不存在，静默继续。`/domain-modeling` skill 会在需要记录术语或决策时创建它们。

## 文件结构

本仓库采用单上下文布局：

```text
/
├── CONTEXT.md
├── docs/adr/
└── src/
```

## 使用 glossary 中的词汇

在 issue title、refactor proposal、hypothesis 或 test 中命名领域概念时，使用 `CONTEXT.md` 已定义的术语。若术语缺失，先确认项目是否已有不同叫法；如确有空缺，记录给 `/domain-modeling`。

## 标出 ADR 冲突

若输出与已有 ADR 冲突，必须明确指出该冲突，而不是静默覆盖原有决策。
