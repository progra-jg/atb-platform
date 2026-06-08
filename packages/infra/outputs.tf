output "vpc_id" {
  value = aws_vpc.main.id
}

output "eks_cluster_name" {
  value = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  value = aws_eks_cluster.main.endpoint
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "s3_buckets" {
  value = {
    uploads     = aws_s3_bucket.uploads.id
    satellite   = aws_s3_bucket.satellite.id
    certificates = aws_s3_bucket.certificates.id
    backups     = aws_s3_bucket.backups.id
  }
}
