# GitHub Actions Setup สำหรับ Microservices K8s Deployment

## ภาพรวม

GitHub Actions workflow นี้จะทำการ:
1. **Build** Docker images สำหรับทุก microservices
2. **Push** images ไปยัง GitHub Container Registry (ghcr.io)
3. **Deploy** ไปยัง Kubernetes cluster อัตโนมัติเมื่อ push ไป main branch

## การตั้งค่า GitHub Secrets

ก่อนใช้งาน workflow คุณต้องตั้งค่า secrets ใน GitHub repository:

### 1. ไปที่ Repository Settings
- ไปที่ repository ของคุณใน GitHub
- คลิก **Settings** > **Secrets and variables** > **Actions**

### 2. เพิ่ม Required Secrets

#### `KUBE_CONFIG` (จำเป็น)
```bash
# สร้าง base64 encoded kubeconfig
cat ~/.kube/config | base64 -w 0
```
คัดลอกผลลัพธ์และเพิ่มเป็น secret ชื่อ `KUBE_CONFIG`

#### ตัวอย่างการสร้าง kubeconfig สำหรับ cloud providers:

**สำหรับ Google GKE:**
```bash
gcloud container clusters get-credentials YOUR_CLUSTER_NAME --zone YOUR_ZONE --project YOUR_PROJECT
cat ~/.kube/config | base64 -w 0
```

**สำหรับ AWS EKS:**
```bash
aws eks update-kubeconfig --region YOUR_REGION --name YOUR_CLUSTER_NAME
cat ~/.kube/config | base64 -w 0
```

**สำหรับ Azure AKS:**
```bash
az aks get-credentials --resource-group YOUR_RG --name YOUR_CLUSTER_NAME
cat ~/.kube/config | base64 -w 0
```

## Workflow Features

### 🔨 Build Job
- **Matrix Strategy**: Build ทุก services พร้อมกัน (parallel)
- **Multi-platform**: รองรับ AMD64 และ ARM64
- **Caching**: ใช้ GitHub Actions cache เพื่อเร่งการ build
- **Tagging**: สร้าง tags หลายแบบ:
  - `latest` (สำหรับ main branch)
  - `branch-name-commit-sha`
  - `pr-number` (สำหรับ pull requests)

### 🚀 Deploy Job
- **Conditional**: รันเฉพาะเมื่อ push ไป main branch
- **Image Update**: อัปเดต Kubernetes manifests ด้วย image tags ใหม่
- **Health Checks**: รอให้ databases และ services พร้อมใช้งาน
- **Status Report**: แสดงสถานะ deployment

### 🧹 Cleanup Job
- **PR Cleanup**: ทำความสะอาด images ของ pull requests (ถ้าต้องการ)

## การใช้งาน

### 1. Automatic Deployment
```bash
# Push ไป main branch จะ trigger deployment อัตโนมัติ
git push origin main
```

### 2. Pull Request Testing
```bash
# สร้าง PR จะ build images เพื่อ test
git checkout -b feature/new-feature
git push origin feature/new-feature
# สร้าง PR ใน GitHub
```

### 3. Manual Deployment
```bash
# ใช้ GitHub UI ไป Actions tab และคลิก "Run workflow"
```

## การตรวจสอบ Deployment

### ดู Logs ใน GitHub Actions
1. ไปที่ **Actions** tab ใน repository
2. คลิกที่ workflow run ที่ต้องการดู
3. คลิกที่ job และ step ที่ต้องการดู logs

### ตรวจสอบใน Kubernetes
```bash
# ดู pods
kubectl get pods -n microservices-demo

# ดู services
kubectl get services -n microservices-demo

# ดู logs ของ specific pod
kubectl logs -f deployment/order-service -n microservices-demo

# ดู deployment status
kubectl rollout status deployment/order-service -n microservices-demo
```

## การแก้ไขปัญหา

### 1. Build Failures
- ตรวจสอบ Dockerfile ในแต่ละ service
- ดู build logs ใน Actions tab

### 2. Deployment Failures
- ตรวจสอบ `KUBE_CONFIG` secret
- ตรวจสอบว่า Kubernetes cluster เข้าถึงได้
- ดู kubectl logs ใน deployment step

### 3. Image Pull Errors
- ตรวจสอบว่า images ถูก push สำเร็จ
- ตรวจสอบ permissions ของ GitHub Container Registry

## การปรับแต่ง

### เปลี่ยน Registry
แก้ไขใน `.github/workflows/build-and-deploy.yml`:
```yaml
env:
  REGISTRY: your-registry.com  # เปลี่ยนจาก ghcr.io
```

### เพิ่ม Environment Variables
แก้ไข Kubernetes manifests หรือเพิ่ม secrets:
```yaml
- name: NEW_ENV_VAR
  value: "your-value"
# หรือ
- name: SECRET_VAR
  valueFrom:
    secretKeyRef:
      name: your-secret
      key: your-key
```

### เปลี่ยน Deployment Strategy
```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
```

## Security Best Practices

1. **ใช้ least privilege** สำหรับ kubeconfig
2. **Rotate secrets** เป็นระยะ
3. **ใช้ private repositories** สำหรับ sensitive code
4. **Enable branch protection** สำหรับ main branch
5. **Review pull requests** ก่อน merge

## ข้อมูลเพิ่มเติม

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
