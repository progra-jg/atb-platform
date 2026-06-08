# Architecture Blockchain

## Réseau Hyperledger Besu

- 6 nœuds validateurs (QBFT consensus)
- Permissioned network (permissions_config.toml)
- Chain ID: 1337 (dev)

## Smart Contracts Déployés

| Contrat | Adresse (testnet) | Description |
|---------|-------------------|-------------|
| LotRegistry | 0x... | LotNFT mint/transfer/burn |
| CertificateRegistry | 0x... | Certificats EUDR/GlobalGAP |
| ProductorIdentity | 0x... | DID on-chain |
| MultiSigWallet | 0x... | 3/5 multi-sig |

## Interactions

```solidity
// Mint a lot
LotRegistry.mint(to, uri, culture, quantite, parcelleId, parentLotId)

// Transfer lot
LotRegistry.transferLot(to, tokenId)

// Verify certificate
CertificateRegistry.verify(certId)
```

## Déploiement

```bash
cd packages/blockchain
npx hardhat run scripts/deploy.ts --network besuTestnet
```
