#!/bin/bash

# สคริปต์สำหรับตั้งค่า GitHub Secrets สำหรับ Microservices K8s Deployment
# ต้องติดตั้ง GitHub CLI (gh) ก่อนใช้งาน: https://cli.github.com/

set -e

echo "🚀 GitHub Secrets Setup สำหรับ Microservices K8s Deployment"
echo "============================================================"

# ตรวจสอบว่าติดตั้ง GitHub CLI แล้วหรือไม่
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) ไม่ได้ติดตั้ง"
    echo "📥 ติดตั้งจาก: https://cli.github.com/"
    exit 1
fi

# ตรวจสอบว่า login แล้วหรือไม่
if ! gh auth status &> /dev/null; then
    echo "🔐 กรุณา login ก่อน:"
    echo "gh auth login"
    exit 1
fi

# ตรวจสอบว่าอยู่ใน git repository หรือไม่
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ ไม่ได้อยู่ใน git repository"
    exit 1
fi

echo ""
echo "📋 ตรวจสอบข้อมูล repository..."
REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
echo "Repository: $REPO"

echo ""
echo "🔧 การตั้งค่า Secrets:"
echo "1. KUBE_CONFIG - Kubernetes configuration"
echo "2. ตัวเลือกเพิ่มเติม (optional)"

# ฟังก์ชันสำหรับเข้ารหัส base64
encode_base64() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        base64 -i "$1"
    else
        # Linux
        base64 -w 0 "$1"
    fi
}

# ตั้งค่า KUBE_CONFIG
echo ""
echo "🔑 ตั้งค่า KUBE_CONFIG"
echo "====================="

# ตรวจสอบไฟล์ kubeconfig
KUBECONFIG_PATH="$HOME/.kube/config"
if [[ ! -f "$KUBECONFIG_PATH" ]]; then
    echo "❌ ไม่พบไฟล์ kubeconfig ที่ $KUBECONFIG_PATH"
    echo ""
    echo "📝 วิธีสร้าง kubeconfig:"
    echo ""
    echo "Google GKE:"
    echo "gcloud container clusters get-credentials CLUSTER_NAME --zone ZONE --project PROJECT_ID"
    echo ""
    echo "AWS EKS:"
    echo "aws eks update-kubeconfig --region REGION --name CLUSTER_NAME"
    echo ""
    echo "Azure AKS:"
    echo "az aks get-credentials --resource-group RG_NAME --name CLUSTER_NAME"
    echo ""
    read -p "กรุณาสร้าง kubeconfig แล้วกด Enter เพื่อดำเนินการต่อ..."
    
    if [[ ! -f "$KUBECONFIG_PATH" ]]; then
        echo "❌ ยังไม่พบไฟล์ kubeconfig"
        exit 1
    fi
fi

echo "✅ พบไฟล์ kubeconfig"

# แสดงข้อมูล cluster
echo ""
echo "📊 ข้อมูล Kubernetes cluster:"
kubectl config current-context 2>/dev/null || echo "ไม่สามารถแสดงข้อมูล context ได้"

echo ""
read -p "ต้องการใช้ kubeconfig นี้หรือไม่? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ ยกเลิกการตั้งค่า"
    exit 1
fi

# เข้ารหัส kubeconfig
echo "🔐 เข้ารหัส kubeconfig..."
KUBE_CONFIG_BASE64=$(encode_base64 "$KUBECONFIG_PATH")

# ตั้งค่า secret
echo "📤 อัปโหลด KUBE_CONFIG secret..."
echo "$KUBE_CONFIG_BASE64" | gh secret set KUBE_CONFIG

echo "✅ ตั้งค่า KUBE_CONFIG สำเร็จ"

# ตัวเลือกเพิ่มเติม
echo ""
echo "🔧 ตัวเลือกเพิ่มเติม"
echo "=================="

# Docker Registry (ถ้าไม่ใช้ GitHub Container Registry)
echo ""
read -p "ต้องการใช้ Docker Registry อื่นแทน GitHub Container Registry หรือไม่? (y/N): " use_custom_registry
if [[ $use_custom_registry == [yY] ]]; then
    read -p "Registry URL (เช่น docker.io, gcr.io): " registry_url
    read -p "Registry Username: " registry_username
    read -s -p "Registry Password: " registry_password
    echo ""
    
    gh secret set DOCKER_REGISTRY --body "$registry_url"
    gh secret set DOCKER_USERNAME --body "$registry_username"
    echo "$registry_password" | gh secret set DOCKER_PASSWORD
    
    echo "✅ ตั้งค่า Docker Registry secrets สำเร็จ"
fi

# Database passwords (สำหรับ production)
echo ""
read -p "ต้องการตั้งค่า database passwords สำหรับ production หรือไม่? (y/N): " setup_db_passwords
if [[ $setup_db_passwords == [yY] ]]; then
    read -s -p "PostgreSQL Password: " postgres_password
    echo ""
    read -s -p "RabbitMQ Password: " rabbitmq_password
    echo ""
    
    echo "$postgres_password" | gh secret set POSTGRES_PASSWORD
    echo "$rabbitmq_password" | gh secret set RABBITMQ_PASSWORD
    
    echo "✅ ตั้งค่า Database passwords สำเร็จ"
fi

# แสดงรายการ secrets ที่ตั้งค่าแล้ว
echo ""
echo "📋 รายการ Secrets ที่ตั้งค่าแล้ว:"
echo "================================"
gh secret list

echo ""
echo "🎉 การตั้งค่า GitHub Secrets เสร็จสมบูรณ์!"
echo ""
echo "📝 ขั้นตอนถัดไป:"
echo "1. Push code ไป main branch เพื่อ trigger deployment"
echo "2. ตรวจสอบ Actions tab ใน GitHub repository"
echo "3. ดู deployment status ใน Kubernetes cluster"
echo ""
echo "🔗 ลิงก์ที่เป็นประโยชน์:"
echo "- Actions: https://github.com/$REPO/actions"
echo "- Secrets: https://github.com/$REPO/settings/secrets/actions"
echo ""
echo "📚 อ่านเพิ่มเติม: GITHUB-ACTIONS-SETUP.md"
