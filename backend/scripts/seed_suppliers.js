/**
 * Script: seed 5 nhà cung cấp mẫu vào hệ thống
 * Chạy: node seed_suppliers.js
 */

const BASE_URL = 'http://localhost:3001/api';

const suppliers = [
  {
    supplier_id: `SUP-${Date.now()}1`,
    code:        `SUP-${Date.now()}1`,
    name:        'Công ty TNHH Thực Phẩm Việt Xanh',
    short_name:  'Việt Xanh Food',
    supplier_type: 'manufacturer',
    status:      'active',
    payment_terms: 'Net30',
    payment_method: 'bank_transfer',
    rating: 5,
    contact: {
      name:     'Nguyễn Văn Minh',
      position: 'Giám đốc kinh doanh',
      phone:    '0912 345 678',
      mobile:   '0912 345 679',
      email:    'minh.nguyen@vietxanh.vn',
      zalo:     '0912345678',
    },
    address: {
      street:   '45 Đường Lê Lợi',
      ward:     'Phường Bến Nghé',
      district: 'Quận 1',
      city:     'TP. Hồ Chí Minh',
      country:  'Vietnam',
    },
    business: {
      tax_id:        '0301234567',
      business_type: 'tndn',
      website:       'https://vietxanh.vn',
      notes:         'NCC uy tín, chuyên cung cấp thực phẩm sạch, giao hàng đúng hạn 98%.',
    },
  },
  {
    supplier_id: `SUP-${Date.now()}2`,
    code:        `SUP-${Date.now()}2`,
    name:        'Công ty Cổ Phần Điện Tử Phương Nam',
    short_name:  'PN Electronics',
    supplier_type: 'distributor',
    status:      'active',
    payment_terms: 'Net15',
    payment_method: 'bank_transfer',
    rating: 4,
    contact: {
      name:     'Trần Thị Lan Anh',
      position: 'Trưởng phòng mua hàng',
      phone:    '0987 654 321',
      mobile:   '0987 654 322',
      email:    'lananh.tran@phuongnam.com.vn',
      zalo:     '0987654321',
    },
    address: {
      street:   '128 Nguyễn Huệ',
      ward:     'Phường Bến Thành',
      district: 'Quận 1',
      city:     'TP. Hồ Chí Minh',
      country:  'Vietnam',
    },
    business: {
      tax_id:        '0302345678',
      business_type: 'ctycp',
      website:       'https://phuongnam-elec.vn',
      notes:         'Phân phối thiết bị điện tử chính hãng Samsung, LG, Sony tại miền Nam.',
    },
  },
  {
    supplier_id: `SUP-${Date.now()}3`,
    code:        `SUP-${Date.now()}3`,
    name:        'Tổng Công Ty Dệt May Hà Nội',
    short_name:  'Hanosimex',
    supplier_type: 'manufacturer',
    status:      'active',
    payment_terms: 'Net45',
    payment_method: 'bank_transfer',
    rating: 4,
    contact: {
      name:     'Phạm Quốc Hùng',
      position: 'Phó Tổng Giám đốc',
      phone:    '024 3862 1234',
      mobile:   '0903 123 456',
      email:    'hung.pham@hanosimex.vn',
      zalo:     '0903123456',
    },
    address: {
      street:   '1 Nguyễn Trãi',
      ward:     'Phường Thượng Đình',
      district: 'Quận Thanh Xuân',
      city:     'Hà Nội',
      country:  'Vietnam',
    },
    business: {
      tax_id:        '0100234567',
      business_type: 'tndn',
      website:       'https://hanosimex.com.vn',
      notes:         'Nhà sản xuất sợi vải và dệt may lớn nhất miền Bắc, xuất khẩu sang EU.',
    },
  },
  {
    supplier_id: `SUP-${Date.now()}4`,
    code:        `SUP-${Date.now()}4`,
    name:        'CTCP Xuất Nhập Khẩu Bình Dương',
    short_name:  'Bình Dương Import',
    supplier_type: 'importer',
    status:      'pending',
    payment_terms: 'COD',
    payment_method: 'cash',
    rating: 3,
    contact: {
      name:     'Lê Thị Hồng Nhung',
      position: 'Kế toán trưởng',
      phone:    '0274 3829 456',
      mobile:   '0909 876 543',
      email:    'nhung.le@binhduong-import.vn',
      zalo:     '0909876543',
    },
    address: {
      street:   '56 Đại lộ Bình Dương',
      ward:     'Phường Hiệp Thành',
      district: 'Thành phố Thủ Dầu Một',
      city:     'Bình Dương',
      country:  'Vietnam',
    },
    business: {
      tax_id:        '3700123456',
      business_type: 'ctycp',
      website:       '',
      notes:         'Đang trong giai đoạn thẩm định hợp đồng khung 2026. Chờ phê duyệt.',
    },
  },
  {
    supplier_id: `SUP-${Date.now()}5`,
    code:        `SUP-${Date.now()}5`,
    name:        'Global Tech Solutions Pte. Ltd.',
    short_name:  'GTS Singapore',
    supplier_type: 'foreign',
    status:      'active',
    payment_terms: 'Net60',
    payment_method: 'bank_transfer',
    rating: 5,
    contact: {
      name:     'Kevin Tan',
      position: 'Regional Sales Manager',
      phone:    '+65 6123 4567',
      mobile:   '+65 9876 5432',
      email:    'kevin.tan@globaltech.sg',
      zalo:     '',
    },
    address: {
      street:   '80 Robinson Road, #08-01',
      ward:     '',
      district: 'Central Business District',
      city:     'Singapore',
      country:  'Singapore',
    },
    business: {
      tax_id:        'SG-T20LC1234A',
      business_type: 'foreign',
      website:       'https://globaltech.sg',
      notes:         'NCC công nghệ từ Singapore. Cung cấp server, thiết bị mạng doanh nghiệp cao cấp.',
    },
  },
];

async function seed() {
  console.log('🚀 Bắt đầu thêm 5 nhà cung cấp mẫu...\n');
  let success = 0;

  for (const sup of suppliers) {
    try {
      const res = await fetch(`${BASE_URL}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sup),
      });
      const data = await res.json();

      if (data.success) {
        console.log(`✅ [${++success}/5] Đã thêm: ${sup.name}`);
      } else {
        console.log(`❌ Lỗi khi thêm ${sup.name}: ${data.error}`);
      }
    } catch (err) {
      console.log(`❌ Lỗi kết nối cho ${sup.name}: ${err.message}`);
    }

    // Delay nhỏ để tránh timestamp trùng
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`\n🎉 Hoàn tất! Đã thêm ${success}/5 nhà cung cấp.`);
}

seed();
