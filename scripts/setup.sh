#!/bin/bash

# Git Work Summary 扩展设置脚本

echo "🚀 Git Work Summary 扩展设置开始..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

echo "✅ Node.js 和 npm 已安装"

# 安装依赖包
echo "📦 安装依赖包..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖包安装失败"
    exit 1
fi

echo "✅ 依赖包安装成功"

# 编译 TypeScript
echo "🔨 编译 TypeScript..."
npm run compile

if [ $? -ne 0 ]; then
    echo "❌ 编译失败"
    exit 1
fi

echo "✅ 编译成功"

# 创建启动脚本
echo "📝 创建启动脚本..."
cat > start-extension.sh << 'EOF'
#!/bin/bash
echo "🚀 启动 Git Work Summary 扩展..."
echo "请在 Cursor 中按 F5 或使用调试面板启动扩展"
echo "或者使用以下命令打包扩展："
echo "npm install -g vsce"
echo "vsce package"
EOF

chmod +x start-extension.sh

echo "✅ 设置完成！"
echo ""
echo "🎉 Git Work Summary 扩展已准备就绪！"
echo ""
echo "📋 接下来的步骤："
echo "1. 在 Cursor 中打开此项目"
echo "2. 按 F5 启动扩展调试"
echo "3. 在新窗口中配置扩展设置"
echo "4. 开始使用工作总结功能"
echo ""
echo "📖 详细使用说明请查看 README.md"
echo "🐛 如有问题，请检查控制台输出" 