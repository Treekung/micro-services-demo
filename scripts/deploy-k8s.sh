#!/bin/bash

echo "Deploying microservices to Kubernetes..."

# Create namespace
echo "Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Deploy PostgreSQL
echo "Deploying PostgreSQL databases..."
kubectl apply -f k8s/postgres-configmap.yaml
kubectl apply -f k8s/postgres-secret.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml

# Deploy RabbitMQ
echo "Deploying RabbitMQ..."
kubectl apply -f k8s/rabbitmq.yaml

# Wait for databases to be ready
echo "Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres-order -n microservices-demo --timeout=300s
kubectl wait --for=condition=ready pod -l app=postgres-product -n microservices-demo --timeout=300s
kubectl wait --for=condition=ready pod -l app=postgres-payment -n microservices-demo --timeout=300s
kubectl wait --for=condition=ready pod -l app=rabbitmq -n microservices-demo --timeout=300s

# Deploy microservices
echo "Deploying microservices..."
kubectl apply -f k8s/microservices.yaml

# Deploy API Gateway
echo "Deploying API Gateway..."
kubectl apply -f k8s/api-gateway.yaml

echo "Deployment completed!"
echo "Check status with: kubectl get pods -n microservices-demo"
