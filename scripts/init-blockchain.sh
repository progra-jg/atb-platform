#!/bin/bash
# Script d'initialisation de la blockchain ATB AgriTrace

echo "Initializing blockchain network..."

# 1. Start Besu node
docker-compose up -d besu-node
echo "Waiting for Besu node to be ready..."
sleep 10

# 2. Deploy smart contracts
cd packages/blockchain
npx hardhat run scripts/deploy.ts --network localhost

# 3. Save deployment addresses
echo "✓ Smart contracts deployed successfully"
cat deployment.json

# 4. Seed test data
echo "Seeding test data..."
npx hardhat run scripts/seed.ts --network localhost
echo "✓ Test data created"

echo ""
echo "Blockchain initialization complete!"
echo "Network: http://localhost:8545"
echo "Contracts: $(cat deployment.json | grep -E '"lotRegistry"|"certificateRegistry"|"productorIdentity"')"
