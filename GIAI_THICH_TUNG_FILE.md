# Tài liệu mô tả chi tiết các file của dự án Quan_Ly_kho

Tài liệu này giải thích chi tiết vai trò của từng file và thư mục chính trong dự án `Quan_Ly_kho`, giúp người mới tiếp cận hiểu rõ cấu trúc frontend và backend.

---

## 1. Root của repository

### package.json
- Quản lý dependency cho toàn bộ ứng dụng frontend.
- Liệt kê các thư viện như `react`, `react-dom`, `vite`, `recharts`, `sonner`.
- Chứa các script phát triển và build: `npm run dev`, `npm run build`, `npm run lint`.

### package-lock.json
- Khóa phiên bản chính xác của tất cả package đã cài.
- Giúp đảm bảo môi trường cài đặt giống nhau giữa các máy và tránh xung đột dependency.

### vite.config.js
- Cấu hình cho Vite, bao gồm alias, port và proxy API nếu cần.
- Quyết định cách build và phục vụ ứng dụng frontend.

### index.html
- File HTML chính của frontend.
- Làm điểm mount cho React app thông qua `div#root`.
- Chứa metadata, favicon và cấu hình tải script.

### eslint.config.js
- Cấu hình các quy tắc lint cho toàn bộ dự án.
- Giúp duy trì style code nhất quán và bắt lỗi sớm.

### README.md
- Tài liệu hướng dẫn chung cho người dùng và nhà phát triển.
- Mô tả mục đích dự án, cách cài đặt và cách chạy ứng dụng.

### THAY_DOI_23042026.md
- File ghi lại các thay đổi quan trọng theo từng thời điểm.
- Dùng để lưu note về cập nhật, sửa lỗi và tính năng mới.

### .gitignore
- Chỉ định các file/thư mục không được thêm vào Git.
- Thường loại trừ `node_modules`, log, build output, cấu hình IDE.

---

## 2. Cấu trúc frontend

### frontend/src/main.jsx
- Điểm vào chính của ứng dụng React.
- Render component gốc `App` vào DOM.
- Có thể cấu hình provider, router hoặc theme nếu cần.

### frontend/src/App.jsx
- Component chính quản lý toàn bộ layout ứng dụng.
- Chịu trách nhiệm chuyển tab giữa các view: Dashboard, Materials, Warehouses, Partners, Inbound, Outbound, Inventory, Reports, Users, Register.
- Quản lý trạng thái người dùng, đăng nhập, đăng xuất và lưu localStorage.
- Tích hợp `Toaster` để hiển thị thông báo toast.

### frontend/src/App.css
- Chứa style chung cho layout ứng dụng.
- Điều chỉnh bố cục container, spacing, màu nền và font.

### frontend/src/index.css
- Style toàn cục cho HTML/Body và các thành phần cơ bản.
- Thiết lập font-family, màu nền mặc định và reset CSS cơ bản.

### frontend/src/app/App.jsx
- Nếu có, đây là component app dành cho cấu trúc module hoá trong `frontend/src/app`.
- Quản lý routing, providers hoặc trạng thái global.

### frontend/src/app/routes.jsx
- Khai báo các route chính cho ứng dụng nếu frontend dùng router.
- Xác định path và component tương ứng.

### frontend/src/app/providers.jsx
- Cấu hình các provider chung như ThemeProvider, QueryClientProvider hoặc Context.
- Đảm bảo toàn bộ app nhận các provider cần thiết.

### frontend/src/components/Navbar.jsx
- Thành phần điều hướng chính hiển thị menu các chức năng.
- Cho phép chuyển sang các màn hình khác và hiển thị thông tin người dùng.

### frontend/src/components/*
- Chứa các component dùng chung hoặc chuyên biệt.
- Bao gồm các phần tử UI, bảng, form, popup, toolbar.

### frontend/src/features/*
- Chứa các màn hình, module và chức năng chính của ứng dụng.
- Các thư mục và file bên trong thường nhóm theo feature: dashboard, inventory, products, warehouses.

### frontend/src/shared/*
- Chứa component, layout và helper dùng chung giữa nhiều phần của app.
- Bao gồm các thành phần tái sử dụng, style, util helper.

### frontend/src/services/api.js
- File cấu hình API chung cho frontend.
- Thường tạo axios instance hoặc hàm fetch với base URL và header mặc định.

### frontend/src/services/productService.js
- Định nghĩa các hàm gọi API liên quan đến sản phẩm, vật tư.
- Giúp tách logic HTTP ra khỏi component.

### frontend/src/services/warehouseService.js
- Định nghĩa các hàm gọi API liên quan đến kho.
- Cung cấp phương thức lấy dữ liệu và thao tác kho.

### frontend/src/utils
- Chứa các helper functions, format date, format tiền, validate form.
- Dùng chung cho nhiều component, tránh lặp mã.

---

## 3. Cấu trúc backend

### backend/src/app.js
- Khởi tạo ứng dụng Express.
- Cấu hình middleware cơ bản như JSON parser và CORS.
- Đăng ký các route của backend.
- Dùng để export app hoặc chạy server trong `server.js`.

### backend/src/server.js
- File khởi chạy server Node.
- Kết nối tới MongoDB trước khi lắng nghe cổng.
- Gọi hàm `app.listen()` và xử lý lỗi kết nối.

### backend/src/config/db.js
- Quản lý kết nối tới MongoDB.
- Cấu hình URI, tùy chọn và tái sử dụng kết nối trong toàn bộ backend.

### backend/src/middleware/auth.js
- Middleware xác thực JWT hoặc token người dùng.
- Chặn request không hợp lệ và chỉ cho phép truy cập các route bảo vệ.

### backend/src/utils
- Chứa các hàm tiện ích dùng chung cho backend.
- Bao gồm helper validate, tạo mã, xử lý lỗi hoặc format dữ liệu.

---

## 4. Backend controllers

### backend/src/controllers/authController.js
- Xử lý đăng nhập, đăng ký người dùng.
- Tạo token, xác thực credential và trả về thông tin user.

### backend/src/controllers/brandController.js
- Quản lý CRUD cho thương hiệu.
- Gồm các thao tác tạo, đọc, sửa, xóa brand.

### backend/src/controllers/categoryController.js
- Quản lý CRUD cho danh mục sản phẩm/vật tư.
- Hỗ trợ phân loại sản phẩm theo category.

### backend/src/controllers/dashboardController.js
- Tổng hợp số liệu hiển thị trên dashboard.
- Lấy dữ liệu tồn kho, giao dịch, phiếu nhập/xuất.

### backend/src/controllers/inboundReceiptController.js
- Quản lý phiếu nhập kho.
- Thực hiện tạo, xem, cập nhật, xóa phiếu nhập.

### backend/src/controllers/materialController.js
- Quản lý CRUD cho vật tư/nguyên vật liệu.
- Xử lý tìm kiếm, lọc và phân trang (nếu có).

### backend/src/controllers/materialGroupController.js
- Quản lý nhóm vật tư.
- Phân loại và tổ chức các vật tư theo nhóm.

### backend/src/controllers/materialBatchController.js
- Quản lý lô hàng và batch tồn kho.
- Theo dõi số lượng, hạn dùng và vị trí lô.

### backend/src/controllers/materialStockController.js
- Xử lý biến động tồn kho.
- Thực hiện cập nhật số lượng khi nhập, xuất, điều chỉnh.

### backend/src/controllers/outboundIssueController.js
- Quản lý phiếu xuất kho.
- Thực hiện tạo, xem, cập nhật và xóa phiếu xuất.

### backend/src/controllers/partnerController.js
- Quản lý thông tin đối tác, nhà cung cấp và khách hàng.
- Hỗ trợ lọc theo type, tìm kiếm theo mã/tên/điện thoại.

### backend/src/controllers/warehouseController.js
- Quản lý thông tin kho, vị trí và cấu trúc kho.
- Hỗ trợ tạo, cập nhật và truy vấn kho.

---

## 5. Backend routes

### backend/src/routes/authRoutes.js
- Định nghĩa endpoint liên quan đến xác thực: login, register, logout.
- Gắn với controller auth.

### backend/src/routes/brandRoutes.js
- Định tuyến CRUD brand.
- Kết nối với brandController.

### backend/src/routes/categoryRoutes.js
- Định tuyến CRUD category.
- Kết nối với categoryController.

### backend/src/routes/dashboardRoutes.js
- Định tuyến các API trả dữ liệu dashboard.
- Kết nối với dashboardController.

### backend/src/routes/inboundReceiptRoutes.js
- Định tuyến các API cho phiếu nhập kho.
- Kết nối với inboundReceiptController.

### backend/src/routes/inventoryRoutes.js
- Định tuyến các API xử lý tồn kho, điều chỉnh, chuyển kho.
- Kết nối với inventory service hoặc controller.

### backend/src/routes/materialRoutes.js
- Định tuyến CRUD vật tư.
- Kết nối với materialController.

### backend/src/routes/materialGroupRoutes.js
- Định tuyến CRUD nhóm vật tư.
- Kết nối với materialGroupController.

### backend/src/routes/materialBatchRoutes.js
- Định tuyến API quản lý lô vật tư.
- Kết nối với materialBatchController.

### backend/src/routes/materialStockRoutes.js
- Định tuyến API tồn kho vật tư.
- Kết nối với materialStockController.

### backend/src/routes/outboundIssueRoutes.js
- Định tuyến API cho phiếu xuất kho.
- Kết nối với outboundIssueController.

### backend/src/routes/partnerRoutes.js
- Định tuyến API cho đối tác và nhà cung cấp.
- Kết nối với partnerController.

### backend/src/routes/productRoutes.js
- Định tuyến API sản phẩm/vật tư.
- Kết nối với product controller.

### backend/src/routes/supplierRoutes.js
- Định tuyến API cho nhà cung cấp.
- Kết nối với supplier controller.

### backend/src/routes/warehouseRoutes.js
- Định tuyến API quản lý kho và vị trí kho.
- Kết nối với warehouseController.

---

## 6. Backend models

### backend/src/models/User.js
- Model người dùng và phân quyền.
- Lưu các trường như username, password, email, role.

### backend/src/models/Material.js
- Model vật tư/nguyên vật liệu chính.
- Chứa thông tin tên, mã, đơn vị, nhóm, trạng thái.

### backend/src/models/MaterialGroup.js
- Model nhóm vật tư.
- Dùng để phân loại vật tư theo nhóm / loại.

### backend/src/models/MaterialBatch.js
- Model lô vật tư.
- Chứa số lượng, ngày sản xuất, hạn dùng, kho chứa.

### backend/src/models/MaterialStock.js
- Model tồn kho hiện có.
- Lưu giá trị số lượng theo kho và vật tư.

### backend/src/models/Warehouse.js
- Model kho hàng.
- Chứa tên kho, địa chỉ, mô tả và tình trạng.

### backend/src/models/WarehouseLocation.js
- Model vị trí kho chi tiết.
- Lưu thông tin khu vực, kệ, tầng.

### backend/src/models/Partner.js
- Model đối tác như nhà cung cấp, khách hàng, nhân viên.
- Chứa mã đối tượng, tên, loại, điện thoại, mã số thuế.

### backend/src/models/InboundReceipt.js
- Model phiếu nhập kho.
- Ghi nhận thông tin đơn nhập và chi tiết hàng hóa.

### backend/src/models/OutboundIssue.js
- Model phiếu xuất kho.
- Ghi nhận thông tin đơn xuất và chi tiết hàng hóa.

### backend/src/models/StockTransaction.js
- Model giao dịch tồn kho.
- Lưu các biến động nhập/xuất/chuyển/kho.

### backend/src/models/Transaction.js
- Model giao dịch tổng quát.
- Dùng để ghi lại lịch sử hành động hoặc thay đổi.

### backend/src/models/InventoryAudit.js
- Model kiểm kê tồn kho.
- Ghi lại sự khác biệt giữa số lượng thực tế và số lượng hệ thống.

### backend/src/models/Category.js
- Model danh mục sản phẩm.
- Dùng để phân loại theo loại hàng.

### backend/src/models/Brand.js
- Model thương hiệu.
- Chứa tên và thông tin mô tả brand.

### backend/src/models/ProductPrice.js
- Model giá sản phẩm hoặc vật tư.
- Dùng để lưu nhiều giá theo đơn vị hoặc biến thể.

### backend/src/models/ProductSupplier.js
- Model quan hệ sản phẩm và nhà cung cấp.
- Lưu nhà cung cấp cung cấp sản phẩm nào.

### backend/src/models/ProductUnit.js
- Model đơn vị tính.
- Chứa các đơn vị như cái, bộ, thùng, mét.

### backend/src/models/ProductVariant.js
- Model biến thể sản phẩm.
- Hỗ trợ các option như màu sắc, kích thước, mẫu mã.

### backend/src/models/Comment.js
- Model bình luận hoặc ghi chú trong hệ thống.
- Dùng để lưu nhận xét, ghi chú liên quan đến sản phẩm hoặc giao dịch.

### backend/src/models/BundleComponent.js
- Model thành phần của gói hàng/bundle.
- Dùng để quản lý các sản phẩm kết hợp thành một bộ.

---

## 7. Backend services

### backend/src/services/inventoryService.js
- Chứa logic nghiệp vụ về tồn kho.
- Xử lý các trường hợp nhập kho, xuất kho, điều chỉnh và chuyển kho.

### backend/src/services/productService.js
- Chứa logic xử lý sản phẩm.
- Quản lý giá, biến thể, đơn vị và quan hệ nhà cung cấp.

### backend/src/services/warehouseService.js
- Chứa logic nghiệp vụ kho hàng.
- Quản lý thông tin kho, vị trí, và các thao tác liên quan.

---

## 8. Backend middleware và utils

### backend/src/middleware/auth.js
- Middleware kiểm tra JWT hoặc token.
- Bảo vệ các route cần xác thực và chặn request trái phép.

### backend/src/utils
- Chứa helper chung như format dữ liệu, xử lý lỗi, validate input.
- Dùng lại trong nhiều nơi của backend.

---

## 9. Giải thích chung về hệ thống
- `Quan_Ly_kho` là hệ thống quản lý kho hàng với chức năng nhập kho, xuất kho, quản lý vật tư, kho, đối tác và báo cáo.
- Frontend xây dựng bằng React + Vite, đảm bảo giao diện SPA nhanh và mượt.
- Backend xây dựng bằng Node.js + Express + MongoDB, xử lý API, nghiệp vụ và lưu trữ dữ liệu.
- Cấu trúc code tách rõ frontend/backend để dễ bảo trì và mở rộng.
