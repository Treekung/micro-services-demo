# ไฟล์ทดสอบ POST API /api/orders

ไฟล์นี้ใช้สำหรับทดสอบ POST API `/api/orders` เพื่อทดสอบระบบคิวใน RabbitMQ ของ microservices

## ไฟล์ที่เกี่ยวข้อง

- `test-orders-api.js` - ไฟล์ทดสอบหลัก
- `package-test.json` - dependencies สำหรับการทดสอบ

## วิธีการใช้งาน

### 1. เตรียม Environment

```bash
# เริ่มต้น services ทั้งหมด
docker-compose up -d

# รอให้ services พร้อมใช้งาน (ประมาณ 30-60 วินาที)
docker-compose logs -f
```

### 2. ติดตั้ง Dependencies

```bash
# ติดตั้ง axios สำหรับการทดสอบ
npm install axios

# หรือใช้ package-test.json
cp package-test.json package.json
npm install
```

### 3. รันการทดสอบ

```bash
# รันไฟล์ทดสอบ
node test-orders-api.js

# หรือใช้ npm script
npm run test
```

## สิ่งที่ไฟล์ทดสอบจะทำ

### การทดสอบพื้นฐาน
1. **ตรวจสอบการเชื่อมต่อ** - ตรวจสอบว่า API Gateway (port 3000) พร้อมใช้งาน
2. **สร้าง Order เดี่ยว** - ทดสอบสร้าง order ที่มีสินค้า 1 ชิ้น
3. **สร้าง Order หลายสินค้า** - ทดสอบสร้าง order ที่มีสินค้าหลายชิ้น
4. **สร้าง Order ราคาสูง** - ทดสอบสร้าง order ที่มีมูลค่าสูง

### การทดสอบขั้นสูง
1. **ข้อมูลไม่ถูกต้อง** - ทดสอบส่งข้อมูลที่ไม่ครบถ้วนหรือผิดพลาด
2. **Concurrent Orders** - ทดสอบสร้าง order หลายรายการพร้อมกัน
3. **ติดตามสถานะ** - ติดตามการเปลี่ยนแปลงสถานะ order ผ่าน RabbitMQ

## การทำงานของระบบคิว

### Flow การทำงาน
1. **สร้าง Order** → API Gateway → Order Service
2. **บันทึกฐานข้อมูล** → Order Service → PostgreSQL
3. **ส่งไปคิว Payment** → Order Service → RabbitMQ (payment_queue)
4. **ประมวลผล Payment** → Payment Service รับจากคิว
5. **ส่งกลับสถานะ** → Payment Service → RabbitMQ (order_status_queue)
6. **อัพเดทสถานะ** → Order Service รับจากคิวและอัพเดทฐานข้อมูล

### คิวที่เกี่ยวข้อง
- `payment_queue` - ส่งข้อมูล order ไปยัง payment service
- `order_status_queue` - รับสถานะการชำระเงินกลับมา

## การตรวจสอบผลลัพธ์

### 1. ผ่าน Console Output
ไฟล์ทดสอบจะแสดงผลลัพธ์แบบสีสันใน console:
- ✓ สีเขียว = สำเร็จ
- ✗ สีแดง = ผิดพลาด  
- ⚠ สีเหลือง = คำเตือน
- ℹ สีน้ำเงิน = ข้อมูล

### 2. ผ่าน RabbitMQ Management UI
```
URL: http://localhost:15672
Username: admin
Password: admin
```

ตรวจสอบ:
- **Queues** → `payment_queue`, `order_status_queue`
- **Message rates** → ดูการส่งและรับ message
- **Consumers** → ดู service ที่เชื่อมต่อกับคิว

### 3. ผ่าน Docker Logs
```bash
# ดู logs ของ order service
docker-compose logs -f order-service

# ดู logs ของ payment service  
docker-compose logs -f payment-service

# ดู logs ของ api gateway
docker-compose logs -f api-gateway
```

## ตัวอย่างผลลัพธ์ที่คาดหวัง

### การสร้าง Order สำเร็จ
```
ℹ กำลังสร้าง: Order เดี่ยว - สินค้า 1 ชิ้น
✓ สร้าง order สำเร็จ (245ms)
Order ID: 550e8400-e29b-41d4-a716-446655440000
Status: pending
Total Amount: 599.98
```

### การเปลี่ยนแปลงสถานะ
```
ℹ ติดตามการเปลี่ยนแปลงสถานะ Order ID: 550e8400-e29b-41d4-a716-446655440000
✓ สถานะเปลี่ยนเป็น: paid
Payment ID: payment_1703123456789
```

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **ไม่สามารถเชื่อมต่อ API Gateway**
   ```
   ✗ ไม่สามารถเชื่อมต่อ API Gateway ได้ (port 3000)
   ```
   **แก้ไข**: ตรวจสอบว่า services ทำงานอยู่ `docker-compose ps`

2. **Services ยังไม่พร้อม**
   ```
   ⚠ กรุณาตรวจสอบว่า services ทำงานอยู่: docker-compose up -d
   ```
   **แก้ไข**: รอให้ services เริ่มต้นเสร็จสมบูรณ์

3. **RabbitMQ ยังไม่พร้อม**
   ```
   ✗ เกิดข้อผิดพลาด: connect ECONNREFUSED
   ```
   **แก้ไข**: รอให้ RabbitMQ health check ผ่าน

### คำสั่งตรวจสอบ

```bash
# ตรวจสอบสถานะ services
docker-compose ps

# ตรวจสอบ health ของ RabbitMQ
docker-compose logs rabbitmq

# ตรวจสอบการเชื่อมต่อ database
docker-compose logs order-db product-db payment-db

# รีสตาร์ท services
docker-compose restart

# ลบและสร้างใหม่
docker-compose down -v
docker-compose up -d
```

## หมายเหตุ

- ไฟล์ทดสอบจะรอ 3 วินาทีระหว่างการสร้าง order เพื่อให้เห็นการทำงานของคิวชัดเจน
- Payment Service จะจำลองการประมวลผลโดยมี delay 3 วินาที
- Order status จะเปลี่ยนจาก `pending` → `paid` ผ่านระบบคิว
- สามารถปรับแต่งข้อมูลทดสอบใน array `testOrders` ได้ตามต้องการ
