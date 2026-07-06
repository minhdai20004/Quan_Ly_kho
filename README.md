# Quan_Ly_kho

Dự án `Quan_Ly_kho` là hệ thống quản lý kho hàng, bao gồm frontend React + Vite và backend Node.js + Express kết nối MongoDB.

## Mục tiêu

- Quản lý vật tư, kho, đối tác và tồn kho.
- Theo dõi phiếu nhập kho và phiếu xuất kho.
- Hiển thị dashboard tổng quan, báo cáo và lịch sử giao dịch.
- Hỗ trợ nhiều loại tài nguyên như sản phẩm, đơn vị, biến thể và nhà cung cấp.

## Cấu trúc dự án

```
Quan_Ly_kho/
├── backend/
│   ├── src/
│   │   ├── config/             # Cấu hình database và môi trường
│   │   ├── controllers/        # Logic xử lý request từ frontend
│   │   ├── middleware/         # Middleware xác thực và xử lý chung
│   │   ├── models/             # Mô hình dữ liệu MongoDB
│   │   ├── routes/             # Các route API
│   │   ├── services/           # Logic nghiệp vụ tách biệt
│   │   ├── utils/              # Helper và tiện ích chung
│   │   ├── app.js              # Khởi tạo Express app
│   │   └── server.js           # Khởi chạy server và kết nối DB
│   └── package.json            # Dependency backend
├── frontend/
│   ├── src/
│   │   ├── app/                # App container, route, provider
│   │   ├── components/         # Component dùng chung
│   │   ├── features/           # Các chức năng/ màn hình chính
│   │   ├── shared/             # Layout và helper dùng chung
│   │   ├── services/           # Gọi API và business logic frontend
│   │   ├── utils/              # Hàm tiện ích frontend
│   │   ├── App.jsx             # Component chính của frontend
│   │   ├── main.jsx            # Điểm vào ứng dụng React
│   │   ├── index.css           # Style global
│   │   └── App.css             # Style layout chung
│   ├── package.json            # Dependency frontend
│   └── vite.config.js          # Cấu hình Vite
├── .gitignore
├── README.md                   # Tài liệu hướng dẫn dự án
├── package.json                # Dependency frontend gốc (nếu có)
├── package-lock.json
└── eslint.config.js            # Cấu hình lint
```

## Mô tả chi tiết từng phần

### Root repository

- `package.json`: Quản lý dependency của frontend và các script chạy dự án.
- `package-lock.json`: Khóa phiên bản package để cài đặt nhất quán.
- `vite.config.js`: Cấu hình Vite cho frontend.
- `index.html`: File HTML gốc, nơi React mount vào DOM.
- `eslint.config.js`: Quy định các rule lint cho code.
- `README.md`: Hướng dẫn dự án và mô tả cấu trúc.

### Frontend

- `frontend/src/main.jsx`: Điểm khởi tạo React, render `App`.
- `frontend/src/App.jsx`: Component chính quản lý giao diện, trạng thái đăng nhập, điều hướng các tab và thông báo toast.
- `frontend/src/App.css`: Style chung cho toàn bộ giao diện.
- `frontend/src/index.css`: Style toàn cục như font, màu nền, reset cơ bản.
- `frontend/src/components/Navbar.jsx`: Thanh điều hướng chính cho phép chuyển giữa các chức năng.
- `frontend/src/features/`: Chứa các module chức năng như dashboard, product, inventory, warehouse.
- `frontend/src/shared/`: Chứa các component, layout và helper dùng chung.
- `frontend/src/services/api.js`: Cấu hình base URL cho API và hàm gọi HTTP.
- `frontend/src/services/productService.js`: Hàm gọi API liên quan sản phẩm/vật tư.
- `frontend/src/services/warehouseService.js`: Hàm gọi API quản lý kho.
- `frontend/src/utils/`: Các hàm tiện ích dùng chung như format, validate.

### Backend

- `backend/src/app.js`: Khởi tạo Express app, đăng ký middleware và route.
- `backend/src/server.js`: Kết nối MongoDB và chạy server trên cổng cấu hình.
- `backend/src/config/db.js`: Cấu hình và kết nối MongoDB.
- `backend/src/middleware/auth.js`: Xác thực token JWT cho các route bảo vệ.
- `backend/src/utils/`: Helper dùng chung, xử lý lỗi, validate input.

#### Controllers

- `backend/src/controllers/authController.js`: Đăng nhập, đăng ký, cấp token và xác thực người dùng.
- `backend/src/controllers/brandController.js`: CRUD thương hiệu.
- `backend/src/controllers/categoryController.js`: CRUD danh mục sản phẩm/vật tư.
- `backend/src/controllers/dashboardController.js`: Tính toán dữ liệu dashboard.
- `backend/src/controllers/inboundReceiptController.js`: Quản lý phiếu nhập kho.
- `backend/src/controllers/materialController.js`: CRUD vật tư/nguyên vật liệu.
- `backend/src/controllers/materialGroupController.js`: Quản lý nhóm vật tư.
- `backend/src/controllers/materialBatchController.js`: Quản lý lô vật tư và batch tồn kho.
- `backend/src/controllers/materialStockController.js`: Xử lý biến động tồn kho.
- `backend/src/controllers/outboundIssueController.js`: Quản lý phiếu xuất kho.
- `backend/src/controllers/partnerController.js`: Quản lý đối tác, nhà cung cấp, khách hàng.
- `backend/src/controllers/warehouseController.js`: Quản lý kho và vị trí kho.

#### Routes

- `backend/src/routes/authRoutes.js`: Route xác thực.
- `backend/src/routes/brandRoutes.js`: Route thương hiệu.
- `backend/src/routes/categoryRoutes.js`: Route danh mục.
- `backend/src/routes/dashboardRoutes.js`: Route dashboard.
- `backend/src/routes/inboundReceiptRoutes.js`: Route phiếu nhập kho.
- `backend/src/routes/inventoryRoutes.js`: Route tồn kho và điều chỉnh.
- `backend/src/routes/materialRoutes.js`: Route vật tư.
- `backend/src/routes/materialGroupRoutes.js`: Route nhóm vật tư.
- `backend/src/routes/materialBatchRoutes.js`: Route lô vật tư.
- `backend/src/routes/materialStockRoutes.js`: Route tồn kho vật tư.
- `backend/src/routes/outboundIssueRoutes.js`: Route phiếu xuất kho.
- `backend/src/routes/partnerRoutes.js`: Route đối tác.
- `backend/src/routes/productRoutes.js`: Route sản phẩm.
- `backend/src/routes/supplierRoutes.js`: Route nhà cung cấp.
- `backend/src/routes/warehouseRoutes.js`: Route kho.

#### Models

- `backend/src/models/User.js`: Model người dùng và phân quyền.
- `backend/src/models/Material.js`: Model vật tư/nguyên vật liệu.
- `backend/src/models/MaterialGroup.js`: Model nhóm vật tư.
- `backend/src/models/MaterialBatch.js`: Model lô vật tư.
- `backend/src/models/MaterialStock.js`: Model tồn kho.
- `backend/src/models/Warehouse.js`: Model kho.
- `backend/src/models/WarehouseLocation.js`: Model vị trí kho chi tiết.
- `backend/src/models/Partner.js`: Model đối tác, khách hàng, nhà cung cấp.
- `backend/src/models/InboundReceipt.js`: Model phiếu nhập.
- `backend/src/models/OutboundIssue.js`: Model phiếu xuất.
- `backend/src/models/StockTransaction.js`: Model giao dịch tồn kho.
- `backend/src/models/Transaction.js`: Model giao dịch tổng quát.
- `backend/src/models/InventoryAudit.js`: Model kiểm kê tồn kho.
- `backend/src/models/Category.js`: Model danh mục.
- `backend/src/models/Brand.js`: Model thương hiệu.
- `backend/src/models/ProductPrice.js`: Model giá sản phẩm.
- `backend/src/models/ProductSupplier.js`: Model quan hệ sản phẩm và nhà cung cấp.
- `backend/src/models/ProductUnit.js`: Model đơn vị tính.
- `backend/src/models/ProductVariant.js`: Model biến thể sản phẩm.
- `backend/src/models/Comment.js`: Model bình luận/ghi chú.
- `backend/src/models/BundleComponent.js`: Model cấu thành gói sản phẩm.

#### Services

- `backend/src/services/inventoryService.js`: Logic tồn kho, nhập xuất, điều chỉnh.
- `backend/src/services/productService.js`: Logic sản phẩm, giá, biến thể, nhà cung cấp.
- `backend/src/services/warehouseService.js`: Logic quản lý kho.

---

## Cách chạy dự án

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

## Biến môi trường

### Backend
Tạo file `.env` chứa:
```
MONGODB_URI=mongodb://localhost:27017/wms_warehouse
PORT=3001
```

### Frontend
Tạo file `.env` chứa:
```
VITE_API_URL=http://localhost:3001/api
```

---

## Tổng kết

Dự án `Quan_Ly_kho` xây dựng một hệ thống quản lý kho đầy đủ với phân tách rõ frontend/backend, giúp quản lý hàng tồn, kho, đối tác và báo cáo. README này đã giải thích chi tiết từng file để người đọc nắm được cấu trúc và chức năng của dự án.
