# ====== 考研背诵 Web App 打包脚本 ======
# 在本地 Windows 运行，打包项目并上传到服务器
# 用法: .\scripts\package.ps1 -ServerIp "你的服务器IP"

param(
    [Parameter(Mandatory = $true)]
    [string]$ServerIp,
    [string]$User = "root",
    [string]$Port = "22"
)

$ProjectDir = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$PackageName = "tongxiao.tar.gz"
$RemoteDir = "/root/tongxiao"

Write-Host "===== 1. 打包项目 =====" -ForegroundColor Cyan
Set-Location $ProjectDir
$ExcludeItems = @(
    ".venv", "__pycache__", ".git", ".idea",
    "*.db", "scripts", "*.tar.gz", "test_*.py"
)

$tarArgs = @("czf", $PackageName, "--exclude=.venv", "--exclude=__pycache__",
             "--exclude=.git", "--exclude=.idea", "--exclude=scripts",
             "--exclude=*.db", "--exclude=*.tar.gz",
             "main.py", "config.py", "requirements.txt", "server/", "database/", "data/")

& "C:\Program Files\Git\bin\tar.exe" $tarArgs 2>$null
if ($LASTEXITCODE -ne 0) {
    # Fallback: use tar from system if git tar fails
    tar czf $PackageName --exclude=".venv" --exclude="__pycache__" --exclude=".git" --exclude=".idea" --exclude="scripts" --exclude="*.db" *
}

Write-Host "✅ 打包完成: $PackageName ($((Get-Item $PackageName).Length / 1MB -as [int]) MB)"

Write-Host "===== 2. 上传到服务器 =====" -ForegroundColor Cyan
Write-Host "上传到 $User@$ServerIp`:$RemoteDir ..."
scp -P $Port $PackageName "$User`@$ServerIp`:$RemoteDir/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 上传成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "===== 3. 下一步（在服务器上执行）=====" -ForegroundColor Cyan
    Write-Host "ssh $User@$ServerIp"
    Write-Host "cd $RemoteDir"
    Write-Host "tar xzf $PackageName"
    Write-Host "# 然后执行部署脚本"
    Write-Host "bash scripts/deploy.sh"
} else {
    Write-Host "❌ 上传失败，请检查服务器地址和网络" -ForegroundColor Red
}

# 清理本地包
Remove-Item $PackageName -Force -ErrorAction SilentlyContinue
