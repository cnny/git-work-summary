# Weekly Report Time Range Configuration Guide

<div align="center">

[🇨🇳 中文](#中文版本) | [🇺🇸 English](#english-version)

</div>

---

## 中文版本

# 周报时间范围配置指南

## 概述

Git Work Summary 扩展支持自定义周报的时间范围，以适应不同公司的开发周期。通过配置 `weekStartDay` 参数，您可以设置周报的起始日期。

## 配置参数

### `weekStartDay`
- **类型**: `number`
- **默认值**: `1` (周一)
- **可选值**: `0-6` (0=周日, 1=周一, 2=周二, 3=周三, 4=周四, 5=周五, 6=周六)
- **描述**: 设置周报的起始日期

## 常见企业周期配置

### 1. 周一到周五工作周 (推荐)
```json
{
  "gitWorkSummary.weekStartDay": 1
}
```
- **适用场景**: 传统企业、大多数公司
- **周报范围**: 周一 00:00 ~ 周日 23:59
- **优点**: 符合大多数人的工作习惯

### 2. 周五到周四工作周
```json
{
  "gitWorkSummary.weekStartDay": 5
}
```
- **适用场景**: 敏捷开发团队、Sprint 周期
- **周报范围**: 周五 00:00 ~ 周四 23:59
- **优点**: 适合以周五为冲刺开始的团队

### 3. 周日到周六工作周
```json
{
  "gitWorkSummary.weekStartDay": 0
}
```
- **适用场景**: 某些国际化公司
- **周报范围**: 周日 00:00 ~ 周六 23:59
- **优点**: 符合国际标准周历

## 配置方法

### 方法1: 通过扩展配置界面
1. 打开 VS Code 命令面板 (`Ctrl+Shift+P` 或 `Cmd+Shift+P`)
2. 输入 `Git Work Summary: Configure Settings`
3. 在配置界面中找到 "周报起始日期" 选项
4. 选择合适的起始日期
5. 点击 "保存配置"

### 方法2: 通过 settings.json
1. 打开 VS Code 设置 (`Ctrl+,` 或 `Cmd+,`)
2. 点击右上角的 "打开设置(JSON)" 图标
3. 添加以下配置：
```json
{
  "gitWorkSummary.weekStartDay": 1
}
```

### 方法3: 通过工作区设置
在项目根目录创建 `.vscode/settings.json` 文件：
```json
{
  "gitWorkSummary.weekStartDay": 1
}
```

## 配置示例对比

假设当前日期是 **2024年1月17日 (周三)**，不同配置下的周报范围：

| 配置值 | 起始日 | 周报范围 | 适用场景 |
|--------|--------|----------|----------|
| 0 | 周日 | 2024/1/14 ~ 2024/1/20 | 国际标准周 |
| 1 | 周一 | 2024/1/15 ~ 2024/1/21 | 传统工作周 |
| 2 | 周二 | 2024/1/16 ~ 2024/1/22 | 特殊需求 |
| 3 | 周三 | 2024/1/17 ~ 2024/1/23 | 特殊需求 |
| 4 | 周四 | 2024/1/11 ~ 2024/1/17 | 特殊需求 |
| 5 | 周五 | 2024/1/12 ~ 2024/1/18 | 敏捷开发 |
| 6 | 周六 | 2024/1/13 ~ 2024/1/19 | 特殊需求 |

## 注意事项

1. **配置生效**: 修改配置后，下次生成周报时即可生效
2. **历史数据**: 配置修改不会影响已生成的历史周报
3. **多项目**: 在多项目模式下，所有项目使用相同的周报时间范围配置
4. **定时任务**: 定时生成的周报也会使用新的时间范围配置

## 实际应用场景

### 场景1: 传统企业
```json
{
  "gitWorkSummary.weekStartDay": 1,
  "gitWorkSummary.weeklyReportDay": 5
}
```
- 周报范围: 周一到周日
- 生成时间: 每周五

### 场景2: 敏捷团队
```json
{
  "gitWorkSummary.weekStartDay": 5,
  "gitWorkSummary.weeklyReportDay": 4
}
```
- 周报范围: 周五到周四
- 生成时间: 每周四

### 场景3: 国际化团队
```json
{
  "gitWorkSummary.weekStartDay": 0,
  "gitWorkSummary.weeklyReportDay": 6
}
```
- 周报范围: 周日到周六
- 生成时间: 每周六

## 故障排除

### 问题1: 配置修改后没有生效
**解决方案**: 
1. 重新加载 VS Code 窗口 (`Ctrl+Shift+P` → `Developer: Reload Window`)
2. 或重启 VS Code

### 问题2: 周报时间范围不符合预期
**解决方案**:
1. 检查 `weekStartDay` 配置值是否正确
2. 确认理解周报范围的计算逻辑
3. 可以通过手动生成周报来验证时间范围

### 问题3: 多项目模式下时间范围不一致
**解决方案**:
1. 确保所有项目使用相同的全局配置
2. 避免在不同项目中设置不同的工作区配置

### 问题4: 周报显示范围异常（如"本周五至本周五"）
**已修复**: 此问题在最新版本中已修复
- **问题原因**: 早期版本中周报结束日期计算错误
- **修复内容**: 现在周报始终显示完整的7天范围
- **验证方法**: 重新生成周报，确认显示为"起始日 ~ 起始日+6天"

## 相关配置

- `gitWorkSummary.weeklyReportDay`: 设置周报自动生成的日期
- `gitWorkSummary.enableWeeklyReport`: 启用/禁用周报功能
- `gitWorkSummary.enableMultiProject`: 启用多项目模式

---

💡 **提示**: 建议根据团队的实际工作周期选择合适的配置，确保周报能够准确反映团队的工作情况。

---

## English Version

# Weekly Report Time Range Configuration Guide

## Overview

The Git Work Summary extension supports customizing weekly report time ranges to adapt to different company development cycles. By configuring the `weekStartDay` parameter, you can set the start date for weekly reports.

## Configuration Parameters

### `weekStartDay`
- **Type**: `number`
- **Default**: `1` (Monday)
- **Options**: `0-6` (0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday)
- **Description**: Set the start date for weekly reports

## Common Enterprise Cycle Configurations

### 1. Monday to Friday Work Week (Recommended)
```json
{
  "gitWorkSummary.weekStartDay": 1
}
```
- **Use Case**: Traditional enterprises, most companies
- **Report Range**: Monday 00:00 ~ Sunday 23:59
- **Advantage**: Aligns with most people's work habits

### 2. Friday to Thursday Work Week
```json
{
  "gitWorkSummary.weekStartDay": 5
}
```
- **Use Case**: Agile development teams, Sprint cycles
- **Report Range**: Friday 00:00 ~ Thursday 23:59
- **Advantage**: Suitable for teams that start sprints on Friday

### 3. Sunday to Saturday Work Week
```json
{
  "gitWorkSummary.weekStartDay": 0
}
```
- **Use Case**: Some international companies
- **Report Range**: Sunday 00:00 ~ Saturday 23:59
- **Advantage**: Aligns with international standard calendar

## Configuration Methods

### Method 1: Through Extension Configuration Interface
1. Open VS Code command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type `Git Work Summary: Configure Settings`
3. Find "Weekly Start Day" option in configuration interface
4. Select appropriate start date
5. Click "Save Configuration"

### Method 2: Through settings.json
1. Open VS Code settings (`Ctrl+,` or `Cmd+,`)
2. Click "Open Settings (JSON)" icon in top right
3. Add the following configuration:
```json
{
  "gitWorkSummary.weekStartDay": 1
}
```

### Method 3: Through Workspace Settings
Create `.vscode/settings.json` file in project root:
```json
{
  "gitWorkSummary.weekStartDay": 1
}
```

## Configuration Examples Comparison

Assuming current date is **January 17, 2024 (Wednesday)**, weekly report ranges under different configurations:

| Config Value | Start Day | Report Range | Use Case |
|--------------|-----------|--------------|----------|
| 0 | Sunday | 2024/1/14 ~ 2024/1/20 | International standard week |
| 1 | Monday | 2024/1/15 ~ 2024/1/21 | Traditional work week |
| 2 | Tuesday | 2024/1/16 ~ 2024/1/22 | Special requirements |
| 3 | Wednesday | 2024/1/17 ~ 2024/1/23 | Special requirements |
| 4 | Thursday | 2024/1/11 ~ 2024/1/17 | Special requirements |
| 5 | Friday | 2024/1/12 ~ 2024/1/18 | Agile development |
| 6 | Saturday | 2024/1/13 ~ 2024/1/19 | Special requirements |

## Important Notes

1. **Configuration Effect**: Configuration takes effect when generating next weekly report
2. **Historical Data**: Configuration changes do not affect already generated historical weekly reports
3. **Multi-Project**: In multi-project mode, all projects use the same weekly report time range configuration
4. **Scheduled Tasks**: Scheduled weekly reports also use the new time range configuration

## Real Application Scenarios

### Scenario 1: Traditional Enterprise
```json
{
  "gitWorkSummary.weekStartDay": 1,
  "gitWorkSummary.weeklyReportDay": 5
}
```
- Report Range: Monday to Sunday
- Generation Time: Every Friday

### Scenario 2: Agile Team
```json
{
  "gitWorkSummary.weekStartDay": 5,
  "gitWorkSummary.weeklyReportDay": 4
}
```
- Report Range: Friday to Thursday
- Generation Time: Every Thursday

### Scenario 3: International Team
```json
{
  "gitWorkSummary.weekStartDay": 0,
  "gitWorkSummary.weeklyReportDay": 6
}
```
- Report Range: Sunday to Saturday
- Generation Time: Every Saturday

## Troubleshooting

### Issue 1: Configuration changes not taking effect
**Solution**: 
1. Reload VS Code window (`Ctrl+Shift+P` → `Developer: Reload Window`)
2. Or restart VS Code

### Issue 2: Weekly report time range doesn't match expectations
**Solution**:
1. Check if `weekStartDay` configuration value is correct
2. Confirm understanding of weekly report range calculation logic
3. Verify time range by manually generating weekly report

### Issue 3: Inconsistent time ranges in multi-project mode
**Solution**:
1. Ensure all projects use same global configuration
2. Avoid setting different workspace configurations in different projects

### Issue 4: Weekly report displays abnormal range (e.g., "This Friday to This Friday")
**Fixed**: This issue has been fixed in the latest version
- **Root Cause**: Incorrect end date calculation in earlier versions
- **Fix Content**: Weekly reports now always display complete 7-day range
- **Verification**: Regenerate weekly report, confirm display as "start day ~ start day+6 days"

## Related Configuration

- `gitWorkSummary.weeklyReportDay`: Set automatic weekly report generation date
- `gitWorkSummary.enableWeeklyReport`: Enable/disable weekly report feature
- `gitWorkSummary.enableMultiProject`: Enable multi-project mode

---

💡 **Tip**: It's recommended to choose appropriate configuration based on your team's actual work cycle to ensure weekly reports accurately reflect team work situations.

---

<div align="center">

**[⬆️ Back to Top](#weekly-report-time-range-configuration-guide)**

</div> 