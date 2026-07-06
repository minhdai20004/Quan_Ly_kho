# Tài liệu mô tả chi tiết các file chính của dự án Quan_Ly_kho

Tài liệu này tổng hợp ý nghĩa, vai trò và phạm vi sử dụng của các file quan trọng trong dự án để người mới tiếp cận có thể hiểu nhanh cấu trúc hệ thống.

---

## 1. Các file ở thư mục gốc

### package.json
- File quản lý các dependency và script chạy dự án frontend.
- Chứa các thư viện như React, Vite, Recharts, Sonner và các script dev/build/lint.

### package-lock.json
- File khóa phiên bản dependency để đảm bảo môi trường cài đặt nhất quán giữa các máy.
- Giúp tránh sự khác biệt khi cài đặt lại package.

### vite.config.js
- Cấu hình cho Vite, bao gồm đường dẫn alias, proxy cho API và môi trường phát triển.

### index.html
- File HTML gốc của ứng dụng, nơi React mount vào DOM thông qua thẻ div có id="root".

### eslint.config.js
- Quy định các rule kiểm tra code, giúp giữ chuẩn chất lượng và style lập trình thống nhất.

### README.md
- Tài liệu hướng dẫn cài đặt, khởi chạy và giới thiệu tổng quan về hệ thống.

### THAY_DOI_23042026.md
- Tệp ghi chú các thay đổi hoặc cập nhật quan trọng trong quá trình phát triển.

---

## 2. Cấu trúc frontend

### src/main.jsx
- Điểm khởi tạo ứng dụng React.
- Nạp ReactDOM và render component App vào DOM.

### src/App.jsx
- Component chính điều phối toàn bộ giao diện.
- Quản lý trạng thái đăng nhập, chuyển tab, điều hướng giữa các màn hình và tích hợp toast thông báo.

### src/App.css
- File CSS chung cho toàn bộ giao diện ứng dụng.

### src/index.css
- File CSS nền cho thư viện và cấu hình chung của ứng dụng.

### src/components/Navbar.jsx
- Thanh điều hướng chính ở đầu giao diện.
- Cho phép chuyển đổi giữa các chức năng như Dashboard, Kho, Đối tác, Nhập/Xuất, Báo cáo.

### src/views/Dashboard.jsx
- Màn hình tổng quan thống kê.
- Hiển thị dữ liệu chính về kho, tồn kho, giao dịch và tình trạng hoạt động.

### src/views/Materials.jsx
- Quản lý danh sách vật tư/nguyên vật liệu.
- Có thể thêm, sửa, xóa và lọc vật tư.

### src/views/Warehouses.jsx
- Quản lý kho hàng và các thông tin liên quan.

### src/views/Partners.jsx
- Quản lý thông tin đối tác, nhà cung cấp, khách hàng hoặc nhân viên.

### src/views/InboundReceipts.jsx
- Màn hình quản lý phiếu nhập kho.
- Cho phép theo dõi và xử lý các giao dịch nhập hàng.

### src/views/OutboundIssues.jsx
- Màn hình quản lý phiếu xuất kho.

### src/views/Inventory.jsx
- Theo dõi tình trạng tồn kho và biến động hàng tồn.

### src/views/Reports.jsx
- Cung cấp báo cáo và thống kê cho người dùng.

### src/views/Users.jsx
- Quản lý người dùng trong hệ thống.

### src/views/Login.jsx
- Giao diện đăng nhập.
- Xử lý thông tin người dùng và gọi API xác thực.

### src/views/Register.jsx
- Màn hình đăng ký tài khoản cho người dùng mới.

### src/views/Transactions.jsx
- Màn hình hiển thị lịch sử giao dịch kho.

### src/services/api.js
- File cấu hình base URL cho API và các tiện ích gọi HTTP.

### src/services/productService.js
- Cung cấp các hàm giao tiếp với API liên quan đến sản phẩm hoặc vật tư.

### src/utils
- Chứa các hàm tiện ích dùng chung như format dữ liệu, xử lý chuỗi, validate.

---

## 3. Cấu trúc backend

### backend/src/app.js
- File khởi tạo ứng dụng Express.
- Cấu hình middleware, định tuyến và tích hợp các route chính.

### backend/src/server.js
- File chạy server chính.
- Kết nối tới database và lắng nghe trên cổng được cấu hình.

### backend/src/config/db.js
- File quản lý kết nối MongoDB.
- Cung cấp kết nối chung cho toàn bộ hệ thống.

---

## 4. Backend controllers

### backend/src/controllers/authController.js
- Xử lý đăng nhập, đăng ký, xác thực token và phân quyền người dùng.

### backend/src/controllers/brandController.js
- Quản lý dữ liệu nhãn hiệu/thương hiệu.

### backend/src/controllers/categoryController.js
- Quản lý danh mục nhóm sản phẩm hoặc vật tư.

### backend/src/controllers/dashboardController.js
- Tổng hợp số liệu cho màn hình dashboard.

### backend/src/controllers/inboundReceiptController.js
- Quản lý nghiệp vụ phiếu nhập kho.

### backend/src/controllers/materialController.js
- CRUD cho dữ liệu vật tư/nguyên vật liệu.

### backend/src/controllers/materialGroupController.js
- Quản lý nhóm vật tư để phân loại và tổ chức dữ liệu.

### backend/src/controllers/materialBatchController.js
- Quản lý lô hàng, batch và thông tin liên quan đến tồn kho.

### backend/src/controllers/materialStockController.js
- Xử lý biến động tồn kho, cập nhật số lượng hiện có.

### backend/src/controllers/outboundIssueController.js
- Quản lý nghiệp vụ xuất kho.

### backend/src/controllers/partnerController.js
- Quản lý đối tượng liên quan như nhà cung cấp, khách hàng, nhân viên.

### backend/src/controllers/warehouseController.js
- Quản lý thông tin kho và vị trí kho.

---

## 5. Backend routes

### backend/src/routes/authRoutes.js
- Route dành cho đăng nhập, đăng ký và xác thực người dùng.

### backend/src/routes/brandRoutes.js
- Route quản lý thương hiệu.

### backend/src/routes/categoryRoutes.js
- Route cho danh mục.

### backend/src/routes/dashboardRoutes.js
- Route cung cấp dữ liệu tổng quan dashboard.

### backend/src/routes/inboundReceiptRoutes.js
- Route cho phiếu nhập kho.

### backend/src/routes/inventoryRoutes.js
- Route cho các nghiệp vụ tồn kho và điều chỉnh kho.

### backend/src/routes/materialRoutes.js
- Route cho CRUD vật tư.

### backend/src/routes/materialGroupRoutes.js
- Route cho nhóm vật tư.

### backend/src/routes/materialBatchRoutes.js
- Route cho lô vật tư.

### backend/src/routes/materialStockRoutes.js
- Route cho tồn kho vật tư.

### backend/src/routes/outboundIssueRoutes.js
- Route cho phiếu xuất kho.

### backend/src/routes/partnerRoutes.js
- Route cho đối tác và nhà cung cấp.

### backend/src/routes/productRoutes.js
- Route cho sản phẩm hoặc vật tư liên quan.

### backend/src/routes/supplierRoutes.js
- Route cho nhà cung cấp.

### backend/src/routes/warehouseRoutes.js
- Route cho quản lý kho hàng.

---

## 6. Backend models

### backend/src/models/User.js
- Model người dùng, lưu thông tin tài khoản và phân quyền.

### backend/src/models/Material.js
- Model vật tư/nguyên vật liệu chính.

### backend/src/models/MaterialGroup.js
- Model nhóm vật tư.

### backend/src/models/MaterialBatch.js
- Model lô vật tư và thông tin batch.

### backend/src/models/MaterialStock.js
- Model tồn kho hiện có.

### backend/src/models/Warehouse.js
- Model thông tin kho.

### backend/src/models/WarehouseLocation.js
- Model vị trí, tầng, khu vực lưu trữ trong kho.

### backend/src/models/Partner.js
- Model đối tượng liên quan như nhà cung cấp hay khách hàng.

### backend/src/models/InboundReceipt.js
- Model phiếu nhập kho.

### backend/src/models/OutboundIssue.js
- Model phiếu xuất kho.

### backend/src/models/StockTransaction.js
- Model ghi nhận các giao dịch kho.

### backend/src/models/Transaction.js
- Model giao dịch tổng quát trong hệ thống.

### backend/src/models/InventoryAudit.js
- Model kiểm kê và điều chỉnh tồn kho.

### backend/src/models/Category.js
- Model danh mục.

### backend/src/models/Brand.js
- Model thương hiệu.

### backend/src/models/ProductPrice.js
- Model giá sản phẩm hoặc vật tư.

### backend/src/models/ProductSupplier.js
- Model quan hệ giữa sản phẩm và nhà cung cấp.

### backend/src/models/ProductUnit.js
- Model đơn vị tính.

### backend/src/models/ProductVariant.js
- Model biến thể sản phẩm.

### backend/src/models/Comment.js
- Model bình luận hoặc ghi chú hệ thống.

### backend/src/models/BundleComponent.js
- Model cấu thành gói/bundle sản phẩm.

---

## 7. Backend services

### backend/src/services/inventoryService.js
- Chứa logic nghiệp vụ liên quan đến điều chỉnh kho, xuất nhập và cập nhật tồn kho.

### backend/src/services/productService.js
- Logic xử lý sản phẩm, giá, biến thể và nhà cung cấp.

### backend/src/services/warehouseService.js
- Logic nghiệp vụ về quản lý kho và địa điểm lưu trữ.

---

## 8. Backend middleware và utils

### backend/src/middleware/auth.js
- Middleware kiểm tra token và xác thực người dùng trước khi truy cập route.

### backend/src/utils
- Chứa các helper, hàm phụ trợ và tiện ích dùng chung cho backend.

---

## 9. Ý nghĩa chung của hệ thống
- Dự án này là một hệ thống quản lý kho thông minh, hỗ trợ các nghiệp vụ nhập kho, xuất kho, kiểm kê, theo dõi tồn kho, quản lý đối tác và báo cáo.
- Frontend dùng React + Vite để tạo giao diện người dùng hiện đại.
- Backend dùng Node.js + Express + MongoDB để xử lý dữ liệu và API.
