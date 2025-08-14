# Microservices Demo

โปรเจกต์นี้เป็นตัวอย่างการสร้าง microservices architecture โดยใช้ NestJS, RabbitMQ, PostgreSQL และ Kubernetes

## โครงสร้างโปรเจกต์

```
micro-services-demo/
├── services/
│   ├── order-service/     # บริการจัดการคำสั่งซื้อ
│   ├── product-service/   # บริการจัดการสินค้า
│   ├── payment-service/   # บริการจัดการการชำระเงิน
│   └── api-gateway/       # API Gateway
├── k8s/                   # Kubernetes manifests
├── shared/                # Shared libraries
└── docker-compose.yml     # Docker Compose สำหรับ development
```

## Services

### 1. Order Service (Port: 3001)
- จัดการคำสั่งซื้อ
- อัพเดทสถานะคำสั่งซื้อ
- ส่ง event ไปยัง Payment Service ผ่าน RabbitMQ

### 2. Product Service (Port: 3002)
- จัดการข้อมูลสินค้า
- จัดการ stock
- รับ event จาก Order Service เพื่ออัพเดท stock

### 3. Payment Service (Port: 3003)
- จัดการการชำระเงิน
- ประมวลผลการชำระเงิน
- ส่ง event กลับไปยัง Order Service

### 4. API Gateway (Port: 3000)
- จุดเข้าถึงหลักสำหรับ client
- route requests ไปยัง services ต่างๆ
- จัดการ authentication และ authorization

## การติดตั้งและรัน

### Development (Docker Compose)

1. ติดตั้ง dependencies:
```bash
# Order Service
cd services/order-service
npm install

# Product Service
cd ../product-service
npm install

# Payment Service
cd ../payment-service
npm install

# API Gateway
cd ../api-gateway
npm install
```

2. รันด้วย Docker Compose:
```bash
docker-compose up -d
```

### Production (Kubernetes)

1. Build Docker images:
```bash
# Build images
docker build -t order-service:latest services/order-service/
docker build -t product-service:latest services/product-service/
docker build -t payment-service:latest services/payment-service/
docker build -t api-gateway:latest services/api-gateway/
```

2. Deploy to Kubernetes:
```bash
# สร้าง namespace
kubectl apply -f k8s/namespace.yaml

# Deploy databases
kubectl apply -f k8s/postgres-configmap.yaml
kubectl apply -f k8s/postgres-secret.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml

# Deploy RabbitMQ
kubectl apply -f k8s/rabbitmq.yaml

# Deploy microservices
kubectl apply -f k8s/microservices.yaml

# Deploy API Gateway
kubectl apply -f k8s/api-gateway.yaml
```

## API Endpoints

### Orders
- `POST /orders` - สร้างคำสั่งซื้อใหม่
- `GET /orders` - ดึงรายการคำสั่งซื้อ
- `GET /orders/:id` - ดึงข้อมูลคำสั่งซื้อ
- `PUT /orders/:id/status` - อัพเดทสถานะคำสั่งซื้อ

### Products
- `POST /products` - สร้างสินค้าใหม่
- `GET /products` - ดึงรายการสินค้า
- `GET /products/:id` - ดึงข้อมูลสินค้า
- `PUT /products/:id/stock` - อัพเดท stock

### Payments
- `POST /payments` - ประมวลผลการชำระเงิน
- `GET /payments` - ดึงรายการการชำระเงิน
- `GET /payments/:id` - ดึงข้อมูลการชำระเงิน
- `PUT /payments/:id/refund` - คืนเงิน

## RabbitMQ Queues

- `payment_queue` - สำหรับส่งข้อมูลการชำระเงิน
- `order_status_queue` - สำหรับอัพเดทสถานะคำสั่งซื้อ
- `stock_update_queue` - สำหรับอัพเดท stock

## การทดสอบ

### สร้างสินค้า
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 15",
    "description": "Latest iPhone model",
    "price": 45000,
    "stock": 10,
    "category": "Electronics"
  }'
```

### สร้างคำสั่งซื้อ
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "items": [
      {
        "productId": "product-id",
        "quantity": 1,
        "price": 45000
      }
    ],
    "totalAmount": 45000
  }'
```

## การ Monitor

- RabbitMQ Management UI: http://localhost:15672
  - Username: admin
  - Password: admin

## เทคโนโลยีที่ใช้

- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL
- **Message Queue**: RabbitMQ
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **API Gateway**: NestJS
