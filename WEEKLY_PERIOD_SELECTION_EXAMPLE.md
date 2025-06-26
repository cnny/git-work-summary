# Weekly Period Selection Guide

<div align="center">

[🇨🇳 中文](#中文版本) | [🇺🇸 English](#english-version)

</div>

---

## 中文版本

# 周报指定周期功能使用指南

## 概述

Git Work Summary 扩展现在支持生成指定周期的周报，不再局限于只能生成"本周"的周报。您可以轻松生成上周、上上周、或任意指定日期所在周的周报。

## 功能特点

### 🎯 灵活的周期选择
- **预设周期**：本周、上周、上上周、三周前、四周前
- **自定义日期**：输入任意日期，生成包含该日期的周报
- **智能计算**：自动根据配置的 `weekStartDay` 计算正确的周报范围

### 📅 完全兼容现有配置
- 支持所有 `weekStartDay` 配置（周日到周六）
- 支持单项目和多项目模式
- 与现有的周报时间范围配置完全兼容

## 使用方法

### 方法1: 通过命令面板
1. 打开 VS Code 命令面板 (`Ctrl+Shift+P` 或 `Cmd+Shift+P`)
2. 输入 `Git Work Summary: Generate Weekly Report for Period`
3. 从下拉菜单中选择周期：
   - **本周** - 当前周的工作报告
   - **上周** - 上一周的工作报告
   - **上上周** - 两周前的工作报告
   - **三周前** - 三周前的工作报告
   - **四周前** - 四周前的工作报告
   - **自定义** - 选择具体的日期

### 方法2: 自定义日期输入
1. 在周期选择中选择 "自定义"
2. 输入日期格式：`YYYY-MM-DD`（例如：`2024-01-15`）
3. 系统会自动生成包含该日期的周报

## 使用示例

### 示例1: 生成上周周报
假设今天是 2024年1月17日（周三），`weekStartDay` 配置为 1（周一开始）：

1. 选择 "上周"
2. 系统计算周报范围：**2024/1/8 周一 ~ 2024/1/14 周日**
3. 生成上周的完整工作报告

### 示例2: 生成特定日期的周报
想要生成包含 2024年1月10日的周报：

1. 选择 "自定义"
2. 输入日期：`2024-01-10`
3. 系统计算周报范围：**2024/1/8 周一 ~ 2024/1/14 周日**
4. 生成该周的工作报告

### 示例3: 敏捷团队的周报
如果您的团队使用周五到周四的工作周（`weekStartDay = 5`）：

- **本周**：2024/1/12 周五 ~ 2024/1/18 周四
- **上周**：2024/1/5 周五 ~ 2024/1/11 周四
- **上上周**：2023/12/29 周五 ~ 2024/1/4 周四

## 配置说明

### 周报起始日配置
功能会自动使用您配置的 `weekStartDay` 设置：

```json
{
  "gitWorkSummary.weekStartDay": 1  // 周一开始（默认）
}
```

不同配置的效果：
- `0` (周日): 周日 ~ 周六
- `1` (周一): 周一 ~ 周日 ⭐ 推荐
- `5` (周五): 周五 ~ 周四（敏捷团队）

### 多项目支持
如果启用了多项目功能，指定周期的周报会自动：
- 合并所有配置项目的提交记录
- 生成跨项目的统一分析报告
- 显示各项目的贡献统计

## 实际应用场景

### 场景1: 周报补录
**情况**：上周忘记生成周报，需要补录
**操作**：
1. 使用 "Generate Weekly Report for Period"
2. 选择 "上周"
3. 系统自动生成上周的完整周报

### 场景2: 项目回顾
**情况**：需要回顾三周前的项目进展
**操作**：
1. 选择 "三周前"
2. 查看该周期的工作总结和提交记录
3. 分析项目发展轨迹

### 场景3: 跨周期分析
**情况**：需要分析特定时间段的工作情况
**操作**：
1. 使用自定义日期功能
2. 输入目标时间段内的任意日期
3. 生成该周期的详细报告

### 场景4: 团队汇报
**情况**：月度汇报需要各周的数据
**操作**：
1. 分别生成本月各周的周报
2. 对比不同周期的工作量和进展
3. 形成完整的月度分析

## 注意事项

### 1. 数据完整性
- 周报会包含指定周期内的所有提交记录
- 如果该周期没有提交，会显示相应提示
- 历史数据的准确性取决于 Git 记录的完整性

### 2. 配置一致性
- 所有周报使用相同的 `weekStartDay` 配置
- 确保配置修改前后的一致性
- 多项目模式下所有项目使用统一配置

### 3. 性能考虑
- 较早期的周报可能需要更长的处理时间
- 多项目模式下会依次分析所有项目
- 建议在网络和系统资源充足时使用

## 故障排除

### 问题1: 找不到指定周期的提交记录
**解决方案**：
1. 确认该周期内确实有提交记录
2. 检查 `onlyMyCommits` 配置是否过滤了其他人的提交
3. 验证 `scanAllBranches` 配置是否包含了所有分支

### 问题2: 周报时间范围不符合预期
**解决方案**：
1. 检查 `weekStartDay` 配置是否正确
2. 确认理解周报范围的计算逻辑
3. 参考 [周报时间范围配置指南](./WEEKLY_RANGE_CONFIG_EXAMPLE.md)

### 问题3: 多项目模式下部分项目失败
**解决方案**：
1. 检查项目路径是否正确且可访问
2. 确认所有项目都是有效的 Git 仓库
3. 查看控制台输出的详细错误信息

## 相关命令对比

| 命令 | 功能 | 适用场景 |
|------|------|----------|
| `Generate Weekly Report` | 生成本周周报 | 日常周报生成 |
| `Generate Weekly Report for Period` | 生成指定周期周报 | 补录、回顾、分析 |
| `Generate Multi-Project Weekly Report` | 生成多项目本周周报 | 多项目日常周报 |

## 相关配置

- `gitWorkSummary.weekStartDay`: 周报起始日期
- `gitWorkSummary.enableMultiProject`: 启用多项目功能
- `gitWorkSummary.onlyMyCommits`: 只分析当前用户提交
- `gitWorkSummary.scanAllBranches`: 扫描所有分支

---

💡 **提示**: 使用指定周期功能可以大大提高工作报告的灵活性，特别适合需要补录历史报告或进行工作回顾的场景。

---

## English Version

# Weekly Period Selection Feature Guide

## Overview

The Git Work Summary extension now supports generating weekly reports for specified periods, no longer limited to generating only "current week" reports. You can easily generate reports for last week, two weeks ago, or any week containing a specified date.

## Features

### 🎯 Flexible Period Selection
- **Preset Periods**: This week, last week, two weeks ago, three weeks ago, four weeks ago
- **Custom Dates**: Enter any date to generate a report for the week containing that date
- **Smart Calculation**: Automatically calculate correct weekly report ranges based on configured `weekStartDay`

### 📅 Full Compatibility with Existing Configuration
- Support all `weekStartDay` configurations (Sunday to Saturday)
- Support single-project and multi-project modes
- Full compatibility with existing weekly report time range configurations

## Usage

### Method 1: Through Command Palette
1. Open VS Code command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type `Git Work Summary: Generate Weekly Report for Period`
3. Select period from dropdown menu:
   - **This Week** - Current week's work report
   - **Last Week** - Previous week's work report
   - **Two Weeks Ago** - Two weeks ago work report
   - **Three Weeks Ago** - Three weeks ago work report
   - **Four Weeks Ago** - Four weeks ago work report
   - **Custom** - Select specific date

### Method 2: Custom Date Input
1. Select "Custom" in period selection
2. Enter date format: `YYYY-MM-DD` (e.g., `2024-01-15`)
3. System automatically generates report for the week containing that date

## Usage Examples

### Example 1: Generate Last Week's Report
Assuming today is January 17, 2024 (Wednesday), `weekStartDay` configured as 1 (Monday start):

1. Select "Last Week"
2. System calculates report range: **2024/1/8 Monday ~ 2024/1/14 Sunday**
3. Generate complete work report for last week

### Example 2: Generate Report for Specific Date
Want to generate report containing January 10, 2024:

1. Select "Custom"
2. Enter date: `2024-01-10`
3. System calculates report range: **2024/1/8 Monday ~ 2024/1/14 Sunday**
4. Generate work report for that week

### Example 3: Agile Team Reports
If your team uses Friday to Thursday work weeks (`weekStartDay = 5`):

- **This Week**: 2024/1/12 Friday ~ 2024/1/18 Thursday
- **Last Week**: 2024/1/5 Friday ~ 2024/1/11 Thursday
- **Two Weeks Ago**: 2023/12/29 Friday ~ 2024/1/4 Thursday

## Configuration

### Weekly Start Day Configuration
The feature automatically uses your configured `weekStartDay` setting:

```json
{
  "gitWorkSummary.weekStartDay": 1  // Monday start (default)
}
```

Different configuration effects:
- `0` (Sunday): Sunday ~ Saturday
- `1` (Monday): Monday ~ Sunday ⭐ Recommended
- `5` (Friday): Friday ~ Thursday (Agile teams)

### Multi-Project Support
If multi-project feature is enabled, specified period reports will automatically:
- Merge commit records from all configured projects
- Generate unified cross-project analysis reports
- Display contribution statistics for each project

## Real-World Use Cases

### Scenario 1: Report Backfill
**Situation**: Forgot to generate last week's report, need to backfill
**Action**:
1. Use "Generate Weekly Report for Period"
2. Select "Last Week"
3. System automatically generates complete report for last week

### Scenario 2: Project Review
**Situation**: Need to review project progress from three weeks ago
**Action**:
1. Select "Three Weeks Ago"
2. View work summary and commit records for that period
3. Analyze project development trajectory

### Scenario 3: Cross-Period Analysis
**Situation**: Need to analyze work situation for specific time period
**Action**:
1. Use custom date feature
2. Enter any date within target time period
3. Generate detailed report for that period

### Scenario 4: Team Reporting
**Situation**: Monthly reporting needs data from each week
**Action**:
1. Generate weekly reports for each week of the month
2. Compare workload and progress across different periods
3. Form complete monthly analysis

## Important Notes

### 1. Data Integrity
- Weekly reports include all commit records within specified period
- If no commits exist for that period, appropriate message will be displayed
- Historical data accuracy depends on completeness of Git records

### 2. Configuration Consistency
- All weekly reports use same `weekStartDay` configuration
- Ensure consistency before and after configuration changes
- In multi-project mode, all projects use unified configuration

### 3. Performance Considerations
- Earlier period reports may require longer processing time
- Multi-project mode analyzes all projects sequentially
- Recommended to use when network and system resources are sufficient

## Troubleshooting

### Issue 1: Cannot find commit records for specified period
**Solution**:
1. Confirm there are indeed commit records within that period
2. Check if `onlyMyCommits` configuration filtered out other people's commits
3. Verify `scanAllBranches` configuration includes all branches

### Issue 2: Weekly report time range doesn't match expectations
**Solution**:
1. Check if `weekStartDay` configuration is correct
2. Confirm understanding of weekly report range calculation logic
3. Refer to [Weekly Range Configuration Guide](./WEEKLY_RANGE_CONFIG_EXAMPLE.md)

### Issue 3: Some projects fail in multi-project mode
**Solution**:
1. Check if project paths are correct and accessible
2. Confirm all projects are valid Git repositories
3. View detailed error messages in console output

## Related Commands Comparison

| Command | Function | Use Case |
|---------|----------|----------|
| `Generate Weekly Report` | Generate current week report | Daily weekly report generation |
| `Generate Weekly Report for Period` | Generate specified period report | Backfill, review, analysis |
| `Generate Multi-Project Weekly Report` | Generate multi-project current week report | Multi-project daily weekly reports |

## Related Configuration

- `gitWorkSummary.weekStartDay`: Weekly report start date
- `gitWorkSummary.enableMultiProject`: Enable multi-project feature
- `gitWorkSummary.onlyMyCommits`: Only analyze current user commits
- `gitWorkSummary.scanAllBranches`: Scan all branches

---

💡 **Tip**: Using the specified period feature can greatly improve work report flexibility, especially suitable for scenarios requiring historical report backfilling or work reviews.

---

<div align="center">

**[⬆️ Back to Top](#weekly-period-selection-guide)**

</div> 