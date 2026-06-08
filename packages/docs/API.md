# API Documentation

## Base URL
```
https://api.agritrace.bj
```

## Authentication
Bearer JWT token in Authorization header.

## Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Register user |
| POST | /auth/login | Login |
| POST | /auth/refresh | Refresh token |
| GET | /auth/profile | Get profile |

### Parcelles
| Method | Path | Description |
|--------|------|-------------|
| POST | /parcelles | Create parcelle |
| GET | /parcelles | List parcelles |
| GET | /parcelles/:id | Get parcelle |
| PATCH | /parcelles/:id | Update parcelle |
| DELETE | /parcelles/:id | Delete parcelle |

### Lots (Traceability)
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/lots | Create lot |
| GET | /api/lots/:id | Get lot |
| PATCH | /api/lots/:id/status | Update status |
| POST | /api/transfer | Transfer lot |
| POST | /api/scan | Scan QR code |

### Certificates
| Method | Path | Description |
|--------|------|-------------|
| POST | /certificates/generate | Generate certificate |
| GET | /certificates/:id | Get certificate |

### AI
| Method | Path | Description |
|--------|------|-------------|
| GET | /ai/health | Health check |
| GET | /ai/deforestation/check/:id | Check deforestation |
| POST | /ai/yield/predict | Predict yield |
| POST | /ai/yield/batch-predict | Batch yield prediction |

### Marketplace
| Method | Path | Description |
|--------|------|-------------|
| GET | /marketplace/products | List products |
| POST | /marketplace/orders | Create order |

### Carbon
| Method | Path | Description |
|--------|------|-------------|
| GET | /carbon/balance/:cooperative | Get carbon balance |
| POST | /carbon/mint | Mint carbon credits |
| GET | /carbon/marketplace | List available credits |

## Examples

```bash
# Login
curl -X POST https://api.agritrace.bj/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+22901020304", "password": "secret"}'

# Create lot
curl -X POST https://api.agritrace.bj/api/lots \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"owner": "farmer_01", "culture": "Cacao", "quantite": 1000}'
```
