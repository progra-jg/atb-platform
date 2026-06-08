# Guide de Déploiement

## Prérequis

- Docker & Docker Compose
- Terraform >= 1.5
- kubectl
- Helm >= 3.0
- AWS CLI configuré

## Déploiement Local (Développement)

```bash
make dev
```

Services disponibles :
- API Gateway: http://localhost:8000
- Kong Admin: http://localhost:8001
- PostgreSQL: localhost:5432
- MinIO Console: http://localhost:9001
- RabbitMQ: http://localhost:15672
- Blockchain: http://localhost:8545

## Déploiement Staging (AWS EKS)

```bash
# 1. Provisionner l'infrastructure
cd packages/infra
terraform init
terraform apply -var-file=staging.tfvars

# 2. Configurer kubectl
aws eks update-kubeconfig --name atb-eks --region eu-west-3

# 3. Déployer les namespaces
kubectl apply -f k8s/namespace.yaml

# 4. Déployer les services avec Helm
helm upgrade --install atb-platform ./helm/atb-platform \
  --namespace atb-staging \
  --values ./helm/values-staging.yaml

# 5. Configurer l'ingress
kubectl apply -f k8s/ingress.yaml
```

## Déploiement Production

```bash
make deploy-prod
```

## Seed Data

```bash
make seed
```

## Monitoring

```bash
kubectl apply -f k8s/monitoring/
# Prometheus: port-forward 9090
# Grafana: port-forward 3000 (admin/admin)
```
