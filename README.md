# WMS - Warehouse Management System

A complete warehouse management system with React frontend and Node.js backend.

## Project Structure

```
Quan_Ly_Kho/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.jsx
│   │   │   ├── routes.jsx
│   │   │   └── providers.jsx
│   │   ├── features/
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── inventory/
│   │   │   └── warehouses/
│   │   └── shared/
│   │       ├── components/
│   │       ├── layouts/
│   │       └── utils/
│   └── package.json
└── backend/
    ├── src/
    │   ├── config/
    │   ├── models/
    │   ├── controllers/
    │   ├── services/
    │   ├── routes/
    │   └── middleware/
    └── package.json
```

## Features

### Backend (Node.js + Express + MongoDB)
- **Products**: CRUD operations, variants, units, prices, suppliers
- **Inventory**: Stock adjustments (in/out/set), transfers, batch tracking
- **Warehouses**: Multi-warehouse support, location management
- **Transaction Safety**: MongoDB sessions for data consistency

### Frontend (React + Vite)
- Dashboard with statistics
- Product management
- Inventory tracking and adjustments
- Warehouse/location management

## API Endpoints

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Inventory
- `POST /api/inventory/adjust` - Adjust stock
- `GET /api/inventory` - List all inventory
- `POST /api/inventory/transfer` - Transfer stock
- `GET /api/inventory/batches` - List batches

### Warehouses
- `GET /api/warehouses` - List warehouses
- `POST /api/warehouses` - Create warehouse
- `GET /api/warehouses/:id/locations` - Get locations

## Development

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Backend `.env`:
```
MONGODB_URI=mongodb://localhost:27017/wms_warehouse
PORT=3001
```

Frontend `.env`:
```
VITE_API_URL=http://localhost:3001/api
```