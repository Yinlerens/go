# 导入 Posh-SSH 模块
Import-Module Posh-SSH 

# ================================
# 配置部分：请根据实际情况修改
# ================================

# 腾讯云容器镜像服务信息
$RegistryURL = "ccr.ccs.tencentyun.com"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"  # 生成时间戳
$Tag = "nextjs-$Timestamp"  # 动态生成唯一 tag
$RegistryUsername = "100006904555" # 腾讯云容器镜像服务的用户名
$RegistryPassword = "kid@1412" # 腾讯云容器镜像服务的密码

# 镜像信息
$Repository = "tpctpc/tpctpc" # 替换为你的仓库名
$FullImageName = "$RegistryURL/${Repository}:$Tag"

# 云服务器信息
$RemoteHost = "111.230.105.184" # 替换为你的云服务器地址或IP
$RemotePort = 22 # SSH 端口
$SSHKeyPath = "C:\Users\mengfei\Downloads\go.pem" # SSH私钥路径
$RemoteContainerName = "nextjs-container" # 容器名称
$password = ConvertTo-SecureString "kid@1412" -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ("root", $password)

# Dockerfile路径
$DockerfilePath = "." # Dockerfile 目录路径

# Kubernetes 命令
$K8sUpdateCommand = "kubectl set image deployment/nextjs-app nextjs-app=$FullImageName --record && kubectl rollout restart deployment nextjs-app"

# ================================
# 脚本主体
# ================================

try {
    # 1. 登录到腾讯云容器镜像服务
    Write-Output "登录到腾讯云容器镜像服务..."
    docker login $RegistryURL --username=$RegistryUsername --password=$RegistryPassword
    if ($LASTEXITCODE -ne 0) {
        throw "Docker 登录失败！请检查登录凭证。"
    }
    Write-Output "腾讯云容器镜像登录成功。"

    # # 2. 构建 Docker 镜像
    # Write-Output "构建 Docker 镜像..."
    # docker build -t $FullImageName $DockerfilePath
    # if ($LASTEXITCODE -ne 0) {
    #     throw "Docker 构建失败！"
    # }
    # Write-Output "Docker 镜像构建成功：$FullImageName"

    # 3. 推送镜像到腾讯云容器镜像服务
    Write-Output "推送镜像到腾讯云容器镜像服务..."
    # docker push $FullImageName
    docker push ccr.ccs.tencentyun.com/tpctpc/tpctpc:nextjs-20250321-163247
    if ($LASTEXITCODE -ne 0) {
        throw "Docker 推送失败！"
    }
    Write-Output "Docker 镜像推送成功。"

    # 4. 建立 SSH 连接
     $sshResult = ssh "root@111.230.105.184" $K8sUpdateCommand

    # 输出命令执行结果
    Write-Host "命令执行成功。" -ForegroundColor Green
    Write-Host "输出：" -ForegroundColor Green
    Write-Host $sshResult
}
catch {
    Write-Error $_.Exception.Message
    exit 1
}
