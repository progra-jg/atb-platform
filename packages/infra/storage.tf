# S3 Buckets
resource "aws_s3_bucket" "uploads" {
  bucket = "atb-uploads-${var.environment}"
  tags   = { Name = "atb-uploads", Environment = var.environment }
}

resource "aws_s3_bucket" "satellite" {
  bucket = "atb-satellite-${var.environment}"
  tags   = { Name = "atb-satellite", Environment = var.environment }
}

resource "aws_s3_bucket" "certificates" {
  bucket = "atb-certificates-${var.environment}"
  tags   = { Name = "atb-certificates", Environment = var.environment }
}

resource "aws_s3_bucket" "backups" {
  bucket = "atb-backups-${var.environment}"
  tags   = { Name = "atb-backups", Environment = var.environment }
}

# EFS
resource "aws_efs_file_system" "main" {
  creation_token = "atb-efs-${var.environment}"
  tags           = { Name = "atb-efs" }
}

resource "aws_efs_mount_target" "main" {
  count           = 3
  file_system_id  = aws_efs_file_system.main.id
  subnet_id       = aws_subnet.private[count.index].id
  security_groups = [aws_security_group.efs.id]
}

resource "aws_security_group" "efs" {
  name        = "atb-efs-sg"
  description = "EFS NFS"
  vpc_id      = aws_vpc.main.id
  ingress {
    from_port   = 2049
    to_port     = 2049
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
}
