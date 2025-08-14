#!/bin/bash

echo "Building Docker images for microservices..."

# Build Order Service
echo "Building Order Service..."
docker build -t order-service:latest services/order-service/

# Build Product Service
echo "Building Product Service..."
docker build -t product-service:latest services/product-service/

# Build Payment Service
echo "Building Payment Service..."
docker build -t payment-service:latest services/payment-service/

# Build API Gateway
echo "Building API Gateway..."
docker build -t api-gateway:latest services/api-gateway/

echo "All images built successfully!"
