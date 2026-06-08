.PHONY: dev dev-build test lint clean seed deploy-staging deploy-prod

dev:
	docker-compose up -d

dev-local:
	powershell -ExecutionPolicy Bypass -File scripts/dev.ps1

dev-build:
	docker-compose up -d --build

test:
	cd packages/blockchain && npx hardhat test
	cd packages/backend && npm test
	cd packages/satellite-ai && pytest
	cd packages/iot-bridge && pytest

lint:
	cd packages/backend && npm run lint
	cd packages/satellite-ai && ruff check .
	cd packages/blockchain && npx solhint contracts/**/*.sol

seed:
	cd packages/blockchain && npx hardhat run scripts/seed.ts
	./scripts/create-admin.sh
	./scripts/init-blockchain.sh

deploy-staging:
	cd packages/infra && terraform apply -var-file=staging.tfvars -auto-approve

deploy-prod:
	cd packages/infra && terraform apply -var-file=prod.tfvars -auto-approve

deploy-prod-full:
	powershell -ExecutionPolicy Bypass -File scripts/deploy-prod.ps1

deploy-prod-dry-run:
	powershell -ExecutionPolicy Bypass -File scripts/deploy-prod.ps1 -DryRun

bootstrap-state:
	powershell -ExecutionPolicy Bypass -File scripts/bootstrap-state.ps1

clean:
	docker-compose down -v
	cd packages/infra && terraform destroy -auto-approve 2>/dev/null || true
