const OutboundIssue = require('../models/OutboundIssue');
const MaterialStock  = require('../models/MaterialStock');
const Material       = require('../models/Material');
const BundleComponent = require('../models/BundleComponent'); // Import BundleComponent
const Transaction    = require('../models/Transaction'); // Import Transaction

// Tự sinh mã phiếu: PX-YYYYMMDD-001
const genIssueCode = async () => {
  const today = new Date();
  const prefix = `PX-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
  const count = await OutboundIssue.countDocuments({ issue_code: { $regex: `^${prefix}` } });
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
};

// Helper ghi log giao dịch tồn kho
const logStockTransaction = async (materialId, warehouseId, type, quantity, quantityBefore, quantityAfter, user, note, partnerId = null, partnerName = null, referenceId = null) => {
  await Transaction.create({
    material_id: materialId,
    warehouse_id: warehouseId,
    transaction_type: type,
    quantity: quantity,
    quantity_before: quantityBefore,
    quantity_after: quantityAfter,
    performed_by: user || 'system',
    note: note,
    partner_id: partnerId,
    partner_name: partnerName,
    reference_id: referenceId,
  });
};

// Lấy danh sách phiếu xuất
exports.getAll = async (req, res) => {
  try {
    const { status, warehouse_id, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status)       filter.status = status;
    if (warehouse_id) filter.warehouse_id = warehouse_id;
    if (search)       filter.issue_code = { $regex: search, $options: 'i' };

    const total = await OutboundIssue.countDocuments(filter);
    const items = await OutboundIssue.find(filter)
      .populate('warehouse_id', 'warehouse_code warehouse_name')
      .populate('customer_id',  'object_code object_name')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.json({ data: items, pagination: { total, pages: Math.ceil(total / limit), page: Number(page) } });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Lấy 1 phiếu xuất
exports.getById = async (req, res) => {
  try {
    const item = await OutboundIssue.findById(req.params.id)
      .populate('warehouse_id', 'warehouse_code warehouse_name')
      .populate('customer_id',  'object_code object_name phone')
      .populate('items.material_id', 'material_code material_name unit')
      .populate('items.location_id', 'location_code location_name')
      .lean();
    if (!item) return res.status(404).json({ message: 'Không tìm thấy phiếu xuất' });
    res.json({ data: item });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Tạo phiếu xuất mới (status = draft)
exports.create = async (req, res) => {
  try {
    const { warehouse_id, items, issue_date } = req.body;
    if (!warehouse_id) return res.status(400).json({ message: 'Thiếu kho xuất' });
    if (!items?.length) return res.status(400).json({ message: 'Phiếu xuất phải có ít nhất 1 dòng hàng' });

    // Kiểm tra tồn kho trước khi tạo
    for (const it of items) {
      const stock = await MaterialStock.findOne({ material_id: it.material_id, warehouse_id });
      const available = stock?.quantity_available || 0;
      if ((it.quantity_issued || 0) > available) {
        const mat = await Material.findById(it.material_id).lean();
        return res.status(400).json({
          message: `Không đủ tồn kho: ${mat?.material_name || it.material_id} (tồn: ${available}, cần xuất: ${it.quantity_issued})`
        });
      }
    }

    // Tính lại total_price
    let total_amount = 0;
    const processedItems = items.map(it => {
      const total_price = (it.quantity_issued || 0) * (it.unit_price || 0);
      total_amount += total_price;
      return { ...it, total_price };
    });

    const issue_code = await genIssueCode();
    const issue = await OutboundIssue.create({
      ...req.body,
      issue_code,
      items: processedItems,
      total_amount,
      issue_date: issue_date || new Date(),
      created_by: req.user?.username || 'system',
      status: 'draft',
    });

    res.status(201).json({ data: issue, message: `Tạo phiếu xuất ${issue_code} thành công` });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Cập nhật phiếu (chỉ khi còn draft)
exports.update = async (req, res) => {
  try {
    const issue = await OutboundIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Không tìm thấy phiếu' });
    if (issue.status !== 'draft') return res.status(400).json({ message: 'Chỉ sửa được phiếu đang ở trạng thái draft' });

    let total_amount = 0;
    const processedItems = (req.body.items || issue.items).map(it => {
      const total_price = (it.quantity_issued || 0) * (it.unit_price || 0);
      total_amount += total_price;
      return { ...it, total_price };
    });

    const updated = await OutboundIssue.findByIdAndUpdate(
      req.params.id,
      { ...req.body, items: processedItems, total_amount },
      { new: true }
    );
    res.json({ data: updated, message: 'Cập nhật phiếu thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Xác nhận phiếu xuất → trừ tồn kho MaterialStock
exports.confirm = async (req, res) => {
  try {
    const issue = await OutboundIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Không tìm thấy phiếu' });
    if (issue.status === 'completed') return res.status(400).json({ message: 'Phiếu đã hoàn thành rồi' });
    if (issue.status === 'cancelled') return res.status(400).json({ message: 'Phiếu đã bị huỷ' });

    const user = req.user?.username || 'system';
    const partnerId = issue.partner_id; // Sử dụng partner_id từ phiếu xuất
    const partnerName = issue.partner_id?.partner_name;

    // Danh sách các điều chỉnh tồn kho cần thực hiện
    const stockAdjustments = []; // { material_id, quantity_to_deduct }

    // 1. Thu thập tất cả các vật tư/linh kiện cần trừ và số lượng
    for (const it of issue.items) {
      const material = await Material.findById(it.material_id).lean();
      if (!material) {
        return res.status(404).json({ message: `Vật tư ${it.material_id} không tồn tại.` });
      }

      if (material.is_bundle) {
        // Nếu là Bundle, lấy các linh kiện cấu thành
        const bundleComponents = await BundleComponent.find({ bundle_id: material._id }).lean();
        if (bundleComponents.length === 0) {
          return res.status(400).json({ message: `Bundle "${material.material_name}" chưa có linh kiện cấu thành.` });
        }

        for (const bc of bundleComponents) {
          const componentMaterial = await Material.findById(bc.component_id).lean();
          if (!componentMaterial) {
            return res.status(404).json({ message: `Linh kiện ${bc.component_id} của bundle không tồn tại.` });
          }
          const quantityToDeduct = it.quantity_issued * bc.quantity;
          stockAdjustments.push({
            material_id: bc.component_id,
            material_name: componentMaterial.material_name,
            quantity: quantityToDeduct,
            is_bundle_component: true,
            bundle_name: material.material_name,
          });
        }
      } else {
        // Nếu là vật tư thông thường
        stockAdjustments.push({
          material_id: it.material_id,
          material_name: material.material_name,
          quantity: it.quantity_issued,
          is_bundle_component: false,
        });
      }
    }

    // 2. Kiểm tra tồn kho tổng hợp cho tất cả các điều chỉnh
    const aggregatedDeductions = {}; // { material_id: total_deduction_quantity }
    for (const adj of stockAdjustments) {
      aggregatedDeductions[adj.material_id.toString()] = (aggregatedDeductions[adj.material_id.toString()] || 0) + adj.quantity;
    }

    for (const matId in aggregatedDeductions) {
      const requiredQuantity = aggregatedDeductions[matId];
      const stock = await MaterialStock.findOne({ material_id: matId, warehouse_id: issue.warehouse_id }).lean();
      const material = await Material.findById(matId).lean();

      if (!stock || stock.quantity_available < requiredQuantity) {
        return res.status(400).json({
          message: `Không đủ tồn kho cho ${material?.material_name || matId} tại kho ${issue.warehouse_id?.warehouse_name || issue.warehouse_id} (tồn: ${stock?.quantity_available || 0}, cần xuất: ${requiredQuantity})`
        });
      }
    }

    // 3. Thực hiện trừ tồn kho và ghi log giao dịch
    for (const adj of stockAdjustments) {
      const stock = await MaterialStock.findOne({ material_id: adj.material_id, warehouse_id: issue.warehouse_id });
      if (stock) {
        const quantityBefore = stock.quantity_on_hand;
        stock.quantity_on_hand -= adj.quantity;
        stock.quantity_available -= adj.quantity;
        stock.last_outbound_date = new Date();

        // Cập nhật cảnh báo tồn thấp
        const material = await Material.findById(adj.material_id).lean();
        if (material) {
          stock.low_stock_alert = stock.quantity_on_hand < (material.min_stock || 0);
        }
        stock.total_cost = stock.quantity_on_hand * stock.unit_cost;

        await stock.save();

        // Ghi log giao dịch
        const note = adj.is_bundle_component
          ? `Xuất linh kiện "${adj.material_name}" của Bundle "${adj.bundle_name}" trong phiếu xuất ${issue.issue_code}`
          : `Xuất vật tư "${adj.material_name}" trong phiếu xuất ${issue.issue_code}`;
        await logStockTransaction(adj.material_id, issue.warehouse_id, 'outbound', adj.quantity, quantityBefore, stock.quantity_on_hand, user, note, partnerId, partnerName, issue._id);
      } else {
        // Trường hợp không tìm thấy stock, mặc dù đã kiểm tra ở bước 2.
        // Điều này không nên xảy ra nếu bước 2 được thực hiện đúng.
        console.warn(`Không tìm thấy MaterialStock cho material_id: ${adj.material_id} tại warehouse_id: ${issue.warehouse_id} trong quá trình trừ kho.`);
      }
    }

    // Cập nhật trạng thái phiếu xuất
    issue.status       = 'completed';
    issue.confirmed_by = req.user?.username || 'system';
    await issue.save();

    res.json({ message: `Xác nhận phiếu ${issue.issue_code} thành công — đã trừ tồn kho` });
  } catch (err) {
    console.error('Lỗi khi xác nhận phiếu xuất:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Huỷ phiếu
exports.cancel = async (req, res) => {
  try {
    const issue = await OutboundIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Không tìm thấy phiếu' });
    if (issue.status === 'completed') return res.status(400).json({ message: 'Phiếu đã hoàn thành, không thể huỷ' });

    issue.status = 'cancelled';
    await issue.save();
    res.json({ message: 'Huỷ phiếu thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};