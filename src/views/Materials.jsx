import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package, Plus, PencilSimple, Trash,
  MagnifyingGlass, Tag, X, Check, Warning,
  ArrowLeft, SortAscending, SortDescending,
  CaretLeft, CaretRight, CaretUpDown, Minus, Scales,
} from '@phosphor-icons/react';
import api from '../services/api';
import MaterialGroupTree from '../components/MaterialGroupTree';

const PAGE_SIZE = 15;

// ─── Random unique code gen ───────────────────────────────────────────────────
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function genCode(prefix = 'VT') {
  let rand = '';
  for (let i = 0; i < 4; i++) rand += CHARS[Math.floor(Math.random() * CHARS.length)];
  return `${prefix.toUpperCase()}-${rand}`;
}

/**
 * Gen mã unique: dùng prefix từ group.code, loop cho đến khi không trùng existingCodes
 * Tối đa 50 lần thử, sau đó thêm suffix số
 */
function genUniqueCode(prefix = 'VT', existingCodes = new Set()) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const code = genCode(prefix);
    if (!existingCodes.has(code)) return code;
  }
  // fallback: thêm timestamp suffix
  return `${prefix.toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
}

// ─── UoM Editor (collapsible) ────────────────────────────────────────────────
function UomEditor({ form, setForm }) {
  const [open, setOpen] = useState(false);
  const baseUnit   = form.units.find(u => u.is_base);
  const otherUnits = form.units.filter(u => !u.is_base && u.name && u.ratio > 1);

  const summary = form.units.length
    ? baseUnit?.name
      ? otherUnits.length
        ? `${baseUnit.name} · ${otherUnits.map(o => `1 ${o.name} = ${o.ratio} ${baseUnit.name}`).join(', ')}`
        : baseUnit.name
      : `${form.units.length} đơn vị`
    : 'Chưa thiết lập';

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <button type="button" onClick={() => setOpen(p => !p)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.55rem 0.75rem', background: 'rgba(14,165,233,0.04)',
        border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Scales size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-2)' }}>Đơn vị tính</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', background: 'var(--bg-3, rgba(148,163,184,0.1))', padding: '0.1rem 0.45rem', borderRadius: 4, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {summary}
          </span>
        </div>
        <CaretRight size={13} style={{ color: 'var(--text-3)', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button"
              onClick={() => setForm(p => ({ ...p, units: [...p.units, { name: '', ratio: 1, is_base: false }] }))}
              className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Plus size={11} weight="bold" /> Thêm đơn vị
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 72px 28px', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 600, padding: '0 0.1rem' }}>
            <span>Tên đơn vị</span><span>= bao nhiêu gốc</span><span style={{ textAlign: 'center' }}>Gốc</span><span></span>
          </div>
          {form.units.map((u, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 72px 28px', gap: '0.4rem', alignItems: 'center' }}>
              <input className="input" value={u.name}
                onChange={e => setForm(p => { const units = [...p.units]; units[i] = { ...units[i], name: e.target.value }; return { ...p, units }; })}
                placeholder={u.is_base ? 'gói, cái, kg...' : 'thùng, lốc, két...'}
                style={{ fontSize: '0.82rem', padding: '0.35rem 0.6rem' }} />
              <input className="input" type="number" min={1} value={u.ratio}
                disabled={u.is_base}
                onChange={e => setForm(p => { const units = [...p.units]; units[i] = { ...units[i], ratio: Number(e.target.value) || 1 }; return { ...p, units }; })}
                style={{ fontSize: '0.82rem', padding: '0.35rem 0.5rem', opacity: u.is_base ? 0.4 : 1, textAlign: 'center' }} />
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <input type="radio" name="base_unit" checked={u.is_base}
                  onChange={() => setForm(p => ({ ...p, units: p.units.map((uu, ii) => ({ ...uu, is_base: ii === i, ratio: ii === i ? 1 : uu.ratio })) }))}
                  style={{ accentColor: 'var(--accent)', cursor: 'pointer', width: 16, height: 16 }} />
              </div>
              <button type="button" disabled={form.units.length <= 1}
                onClick={() => setForm(p => {
                  const units = p.units.filter((_, ii) => ii !== i);
                  if (!units.some(u => u.is_base) && units.length) units[0] = { ...units[0], is_base: true, ratio: 1 };
                  return { ...p, units };
                })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', opacity: form.units.length <= 1 ? 0.3 : 1, padding: '0.2rem', display: 'flex', alignItems: 'center' }}>
                <Minus size={14} weight="bold" />
              </button>
            </div>
          ))}
          {(() => {
            const base   = form.units.find(u => u.is_base);
            const others = form.units.filter(u => !u.is_base && u.name.trim() && u.ratio > 1);
            if (!base?.name || !others.length) return null;
            return (
              <div style={{ padding: '0.5rem 0.75rem', borderRadius: 8, fontSize: '0.75rem', background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.2)', color: 'var(--text-3)', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {others.map(o => <span key={o.name}>1 <strong style={{ color: 'var(--accent)' }}>{o.name}</strong>{' = '}{o.ratio} <strong style={{ color: 'var(--accent)' }}>{base.name}</strong></span>)}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Modal Thêm / Sửa Vật Tư ─────────────────────────────────────────────────
function MaterialModal({ mode, initial, groups, existingCodes, onSave, onClose }) {
  const flatGroups = useMemo(() => {
    const result = [];
    function flatten(list, depth = 0) {
      list.forEach(g => {
        result.push({ ...g, _depth: depth });
        const children = groups.filter(c => String(c.parent_id?._id || c.parent_id) === String(g._id));
        if (children.length) flatten(children, depth + 1);
      });
    }
    flatten(groups.filter(g => !g.parent_id));
    return result;
  }, [groups]);

  // Lấy prefix từ group.code (field được set khi tạo nhóm vật tư)
  const getPrefixFromGroup = (groupId) => {
    if (!groupId) return 'VT';
    const g = flatGroups.find(g => g._id === groupId);
    // Dùng g.code (prefix đã đặt trong nhóm), fallback sang 'VT'
    return (g?.code || g?.prefix || 'VT').toUpperCase();
  };

  const [form, setForm] = useState(() => {
    const initGroupId = initial?.group_id?._id || initial?.group_id || initial?.category_id?._id || initial?.category_id || '';
    const existingCode = initial?.material_code || initial?.product_code || '';

    // Edit mode: giữ nguyên mã, không gen lại
    // Add mode: gen mã unique dựa theo prefix của nhóm
    const initialCode = mode === 'edit'
      ? existingCode
      : genUniqueCode(getPrefixFromGroup(initGroupId), existingCodes);

    return {
      material_code: initialCode,
      material_name: initial?.material_name || initial?.product_name || '',
      group_id:      initGroupId,
      unit:          initial?.unit || '',
      units:         initial?.units?.length ? initial.units : [{ name: '', ratio: 1, is_base: true }],
      description:   initial?.description || '',
      status:        initial?.status || 'active',
    };
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Khi đổi nhóm → gen mã mới dựa theo prefix của nhóm đó
  const handleGroupChange = (groupId) => {
    const prefix = getPrefixFromGroup(groupId);
    // Exclude mã hiện tại khỏi set để tránh tự block
    const codesWithoutCurrent = new Set([...existingCodes].filter(c => c !== form.material_code));
    const newCode = genUniqueCode(prefix, codesWithoutCurrent);
    setForm(p => ({ ...p, group_id: groupId, material_code: newCode }));
  };

  // Sinh lại mã (nút ↻)
  const regenCode = () => {
    const prefix = getPrefixFromGroup(form.group_id);
    const codesWithoutCurrent = new Set([...existingCodes].filter(c => c !== form.material_code));
    setForm(p => ({ ...p, material_code: genUniqueCode(prefix, codesWithoutCurrent) }));
  };

  const validate = () => {
    const e = {};
    if (!form.material_code.trim()) e.material_code = 'Mã không được trống';
    if (!form.material_name.trim()) e.material_name = 'Tên không được trống';
    // Check duplicate (chỉ add mode hoặc edit mà đổi mã)
    const currentOriginalCode = initial?.material_code || initial?.product_code || '';
    if (form.material_code.trim() !== currentOriginalCode && existingCodes.has(form.material_code.trim())) {
      e.material_code = `Mã "${form.material_code}" đã tồn tại`;
    }
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  // Prefix hint để hiển thị cho user biết nhóm đang dùng prefix nào
  const currentPrefix = getPrefixFromGroup(form.group_id);

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{ width: '100%', maxWidth: 480, background: 'var(--bg-2, #0f172a)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 24px 48px rgba(0,0,0,0.4)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={15} style={{ color: 'var(--accent)' }} weight="fill" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-1)' }}>
              {mode === 'add' ? 'Thêm Vật Tư Mới' : 'Sửa vật tư'}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={15} /></button>
        </div>

        <div style={{ overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Nhóm vật tư */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-3)' }}>Nhóm vật tư</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <select
                className="input"
                value={form.group_id}
                onChange={e => handleGroupChange(e.target.value)}
                style={{ flex: 1, paddingRight: form.group_id ? '2.2rem' : undefined }}
              >
                <option value="">— Chưa phân nhóm —</option>
                {flatGroups.map(g => {
                  const isRoot = g._depth === 0;
                  return (
                    <option key={g._id} value={g._id} disabled={isRoot}
                      style={isRoot ? { color: '#64748b', fontWeight: 700 } : {}}>
                      {'　'.repeat(g._depth)}{g._depth > 0 ? '└ ' : ''}{g.name}{isRoot ? ' ──' : ''}
                    </option>
                  );
                })}
              </select>

              {/* Nút X để bỏ chọn nhóm */}
              {form.group_id && (
                <button
                  type="button"
                  title="Bỏ chọn nhóm"
                  onClick={() => {
                    setForm(p => ({ ...p, group_id: '', material_code: genUniqueCode('VT', existingCodes) }));
                  }}
                  style={{
                    position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)',
                    borderRadius: '50%', width: 18, height: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#f87171', padding: 0, flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; }}
                >
                  <X size={10} weight="bold" />
                </button>
              )}
            </div>
          </div>

          {/* Mã vật tư */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-3)' }}>
                Mã vật tư <span style={{ color: '#f87171' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Hiển thị prefix đang dùng */}
                {form.group_id && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 4, padding: '0.1rem 0.4rem', fontFamily: 'monospace' }}>
                    prefix: <strong style={{ color: 'var(--accent)' }}>{currentPrefix}</strong>
                  </span>
                )}
                <button type="button" onClick={regenCode}
                  style={{ fontSize: '0.68rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                  ↻ Sinh lại
                </button>
              </div>
            </div>
            <input className="input" value={form.material_code}
              onChange={e => setForm(p => ({ ...p, material_code: e.target.value.toUpperCase() }))}
              placeholder={`VD: ${currentPrefix}-AB3X`}
              style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }} />
            {errors.material_code && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#f87171' }}>
                <Warning size={11} />{errors.material_code}
              </span>
            )}
          </div>

          {/* Tên vật tư */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-3)' }}>
              Tên vật tư <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input className="input" value={form.material_name}
              onChange={e => setForm(p => ({ ...p, material_name: e.target.value }))}
              placeholder="VD: Galaxy S24 Ultra" />
            {errors.material_name && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#f87171' }}>
                <Warning size={11} />{errors.material_name}
              </span>
            )}
          </div>

          {/* Đơn vị tính */}
          <UomEditor form={form} setForm={setForm} />

          {/* Mô tả */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-3)' }}>Mô tả</label>
            <textarea className="input" rows={2} value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Mô tả vật tư..." style={{ resize: 'none' }} />
          </div>

          {/* Trạng thái */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-3)' }}>Trạng thái</label>
            <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngừng</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button onClick={onClose} className="btn btn-secondary">Huỷ</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
            <Check size={13} weight="bold" />
            {saving ? 'Đang lưu...' : mode === 'add' ? 'Tạo vật tư' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '1.25rem 0 0.5rem' }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem', opacity: page === 1 ? 0.4 : 1 }}>
        <CaretLeft size={13} weight="bold" />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e-${i}`} style={{ padding: '0 0.25rem', color: 'var(--text-3)', fontSize: '0.8rem' }}>···</span>
        ) : (
          <button key={p} onClick={() => onChange(p)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: p === page ? 700 : 400, fontFamily: 'var(--font)', background: p === page ? 'var(--accent)' : 'transparent', color: p === page ? '#fff' : 'var(--text-3)', transition: 'all 0.15s' }}>{p}</button>
        )
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem', opacity: page === totalPages ? 0.4 : 1 }}>
        <CaretRight size={13} weight="bold" />
      </button>
    </div>
  );
}

// ─── Sort Dropdown ────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'name_asc',   label: 'Tên A → Z',          icon: <SortAscending size={13} /> },
  { value: 'name_desc',  label: 'Tên Z → A',          icon: <SortDescending size={13} /> },
  { value: 'code_asc',   label: 'Mã A → Z',           icon: <SortAscending size={13} /> },
  { value: 'code_desc',  label: 'Mã Z → A',           icon: <SortDescending size={13} /> },
  { value: 'stock_asc',  label: 'Tồn kho ít nhất',    icon: <SortAscending size={13} /> },
  { value: 'stock_desc', label: 'Tồn kho nhiều nhất', icon: <SortDescending size={13} /> },
];

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find(o => o.value === value) || SORT_OPTIONS[0];
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(p => !p)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', height: '2.25rem', paddingInline: '0.75rem' }}>
        {current.icon}{current.label}<CaretUpDown size={12} style={{ color: 'var(--text-3)' }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 30, background: 'var(--bg-2, #0f172a)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', minWidth: 190, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
            {SORT_OPTIONS.map(o => (
              <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.875rem', border: 'none', cursor: 'pointer', background: o.value === value ? 'rgba(14,165,233,0.1)' : 'transparent', color: o.value === value ? 'var(--accent)' : 'var(--text-2)', fontSize: '0.8rem', fontFamily: 'var(--font)', textAlign: 'left', transition: 'background 0.1s' }}>
                {o.icon} {o.label}
                {o.value === value && <Check size={12} style={{ marginLeft: 'auto' }} weight="bold" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const Materials = ({ user }) => {
  const [materials, setMaterials]             = useState([]);
  const [groups, setGroups]                   = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [search, setSearch]                   = useState('');
  const [filterGroup, setFilterGroup]         = useState('');
  const [filterGroupName, setFilterGroupName] = useState('');
  const [activeTab, setActiveTab]             = useState('list');
  const [sortBy, setSortBy]                   = useState('name_asc');
  const [page, setPage]                       = useState(1);
  const [modal, setModal]                     = useState(null);
  const isAdmin = user?.role === 'admin';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, gRes] = await Promise.all([api.get('/materials'), api.get('/material-groups')]);
      setMaterials(mRes.data?.data || mRes.data || []);
      setGroups(gRes.data?.data   || gRes.data   || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const fetchGroups = useCallback(async () => {
    try { const r = await api.get('/material-groups'); setGroups(r.data?.data || r.data || []); }
    catch (err) { console.error(err); }
  }, []);

  const fetchMaterials = useCallback(async () => {
    try { const r = await api.get('/materials'); setMaterials(r.data?.data || r.data || []); }
    catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, filterGroup, sortBy]);

  const handleGroupClick = useCallback((group) => {
    setFilterGroup(group._id);
    setFilterGroupName(group.name);
    setActiveTab('list');
    setSearch('');
    setPage(1);
  }, []);

  const clearGroupFilter = () => { setFilterGroup(''); setFilterGroupName(''); setPage(1); };

  const normalize = m => ({
    ...m,
    _name:    m.material_name || m.product_name || '—',
    _code:    m.material_code || m.product_code || '—',
    _group:   m.group_id?.name || m.category_id?.name || m.group_name || '—',
    _groupId: m.group_id?._id || m.group_id || m.category_id?._id || m.category_id || '',
    _unit:    m.unit || '—',
    _stock:   m.totalStock || 0,
  });

  const flatGroupOptions = useMemo(() => {
    const result = [];
    function flatten(list, depth = 0) {
      list.forEach(g => {
        result.push({ ...g, _depth: depth });
        const children = groups.filter(c => String(c.parent_id?._id || c.parent_id) === String(g._id));
        if (children.length) flatten(children, depth + 1);
      });
    }
    flatten(groups.filter(g => !g.parent_id));
    return result;
  }, [groups]);

  const getDescendantIds = useCallback((groupId) => {
    const ids = new Set([String(groupId)]);
    const queue = [String(groupId)];
    while (queue.length) {
      const current = queue.shift();
      groups.forEach(g => {
        const pid = String(g.parent_id?._id || g.parent_id || '');
        if (pid === current) {
          const sid = String(g._id);
          if (!ids.has(sid)) { ids.add(sid); queue.push(sid); }
        }
      });
    }
    return ids;
  }, [groups]);

  // Set các mã đã tồn tại — dùng để gen mã unique
  const existingCodes = useMemo(() => {
    const codes = new Set();
    materials.forEach(m => {
      const code = m.material_code || m.product_code;
      if (code) codes.add(code.trim().toUpperCase());
    });
    return codes;
  }, [materials]);

  const allFiltered = useMemo(() => {
    const normalized = materials.map(normalize);
    const q = search.toLowerCase();
    const descendantIds = filterGroup ? getDescendantIds(filterGroup) : null;
    const base = normalized.filter(m => {
      const matchSearch = !search || m._name.toLowerCase().includes(q) || m._code.toLowerCase().includes(q);
      const matchGroup  = !filterGroup || (m._groupId && descendantIds.has(String(m._groupId)));
      return matchSearch && matchGroup;
    });
    return [...base].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':   return a._name.localeCompare(b._name, 'vi');
        case 'name_desc':  return b._name.localeCompare(a._name, 'vi');
        case 'code_asc':   return a._code.localeCompare(b._code);
        case 'code_desc':  return b._code.localeCompare(a._code);
        case 'stock_asc':  return a._stock - b._stock;
        case 'stock_desc': return b._stock - a._stock;
        default:           return 0;
      }
    });
  }, [materials, search, filterGroup, sortBy, getDescendantIds]);

  const totalPages = Math.max(1, Math.ceil(allFiltered.length / PAGE_SIZE));
  const paginated  = allFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const matCountByGroup = useMemo(() => {
    const directMap = {};
    materials.map(normalize).forEach(m => {
      if (m._groupId) directMap[String(m._groupId)] = (directMap[String(m._groupId)] || 0) + 1;
    });
    const totalMap = { ...directMap };
    groups.forEach(g => {
      let current = g;
      const count = directMap[String(g._id)] || 0;
      if (!count) return;
      const visited = new Set();
      while (current.parent_id) {
        const parentId = String(current.parent_id?._id || current.parent_id);
        if (visited.has(parentId)) break;
        visited.add(parentId);
        totalMap[parentId] = (totalMap[parentId] || 0) + count;
        current = groups.find(g2 => String(g2._id) === parentId) || {};
        if (!current._id) break;
      }
    });
    return totalMap;
  }, [materials, groups]);

  const groupsWithCount = useMemo(() =>
    groups.map(g => ({ ...g, material_count: matCountByGroup[String(g._id)] || 0 })),
  [groups, matCountByGroup]);

  const handleSaveMaterial = async (form) => {
    try {
      const code = form.material_code.trim();
      const name = form.material_name.trim();
      const payload = {
        material_code: code,
        material_name: name,
        product_code:  code,
        product_name:  name,
        unit:          form.units.find(u => u.is_base)?.name || form.unit || '',
        units:         form.units.filter(u => u.name.trim()),
        description:   form.description,
        status:        form.status,
        ...(form.group_id ? { group_id: form.group_id, category_id: form.group_id } : {}),
      };
      if (modal.mode === 'add') await api.post('/materials', payload);
      else await api.put(`/materials/${modal.initial._id}`, payload);
      setModal(null);
      fetchMaterials();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Xóa vật tư này?')) return;
    try {
      await api.delete(`/materials/${id}`);
      setMaterials(p => p.filter(m => m._id !== id));
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="view">
      <div className="page-header">
        <div>
          <div className="page-title">Vật Tư</div>
          <div className="page-subtitle">
            {activeTab === 'list' ? `${allFiltered.length} / ${materials.length} vật tư` : `${groups.length} nhóm vật tư`}
          </div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => activeTab === 'list' && setModal({ mode: 'add' })}>
            <Plus size={14} weight="bold" />
            {activeTab === 'list' ? 'Thêm Vật Tư' : 'Thêm Nhóm'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        {[
          { key: 'list',   label: 'Danh Sách Vật Tư', icon: <Package size={14} /> },
          { key: 'groups', label: 'Nhóm Vật Tư',      icon: <Tag size={14} /> },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.625rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: activeTab === t.key ? '600' : '400', color: activeTab === t.key ? 'var(--accent)' : 'var(--text-3)', borderBottom: activeTab === t.key ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: '-1px', transition: 'color 0.15s ease', fontFamily: 'var(--font)' }}>{t.icon}{t.label}</button>
        ))}
      </div>

      {activeTab === 'list' && (
        <>
          <div className="filter-bar" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <MagnifyingGlass size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input className="input" style={{ paddingLeft: '2.25rem', width: '100%' }} placeholder="Tìm tên hoặc mã vật tư..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {filterGroupName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', borderRadius: 8, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 500, flexShrink: 0 }}>
                <Tag size={13} />{filterGroupName}
                <button onClick={clearGroupFilter} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center' }}><X size={13} /></button>
              </div>
            ) : (
              <select className="input" style={{ width: 'auto', minWidth: 180, flexShrink: 0 }} value={filterGroup}
                onChange={e => { const g = flatGroupOptions.find(g => g._id === e.target.value); setFilterGroup(e.target.value); setFilterGroupName(g?.name || ''); }}>
                <option value="">Tất cả nhóm</option>
                {flatGroupOptions.map(g => (
                  <option key={g._id} value={g._id}>{'　'.repeat(g._depth)}{g._depth > 0 ? '└ ' : ''}{g.name}</option>
                ))}
              </select>
            )}
            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>

          {filterGroupName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.78rem', color: 'var(--text-3)' }}>
              <button onClick={() => setActiveTab('groups')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '0.78rem', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ArrowLeft size={13} /> Nhóm Vật Tư
              </button>
              <span>·</span><strong style={{ color: 'var(--text-2)' }}>{filterGroupName}</strong>
              <span>·</span><span>{allFiltered.length} vật tư</span>
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã</th><th>Tên Vật Tư</th><th>Nhóm</th><th>Số Lượng</th><th>Trạng Thái</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Thao Tác</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i}>{[...Array(isAdmin ? 6 : 5)].map((_, j) => <td key={j}><div style={{ height: 12, background: 'var(--border)', borderRadius: 4 }} /></td>)}</tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
                    {filterGroupName ? `Nhóm "${filterGroupName}" chưa có vật tư` : search ? 'Không tìm thấy kết quả' : 'Chưa có vật tư nào'}
                  </td></tr>
                ) : paginated.map(m => (
                  <tr key={m._id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{m._code}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-1)' }}>{m._name}</td>
                    <td>
                      {m._group !== '—' ? (
                        <button onClick={() => { const g = groups.find(g => String(g._id) === String(m._groupId)); if (g) handleGroupClick(g); }}
                          style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 6, padding: '0.15rem 0.5rem', fontSize: '0.78rem', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit' }}>
                          {m._group}
                        </button>
                      ) : <span style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>—</span>}
                    </td>
                    <td>
                      {(() => {
                        const stock = m.totalStock || m.total_stock || 0;
                        const units = m.units || [];
                        const base = units.find(u => u.is_base);
                        const biggest = [...units].filter(u => !u.is_base && u.ratio > 1).sort((a, b) => b.ratio - a.ratio)[0];
                        if (!units.length) return <span style={{ fontWeight: 600, color: stock ? 'var(--text-1)' : 'var(--text-3)' }}>{stock || '—'}</span>;
                        const bigQty = biggest ? Math.floor(stock / biggest.ratio) : 0;
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.85rem' }}>
                              {biggest && bigQty > 0
                                ? <>{bigQty} <span style={{ color: 'var(--accent)' }}>{biggest.name}</span></>
                                : <>{stock} <span style={{ color: 'var(--accent)' }}>{base?.name || ''}</span></>}
                            </span>
                            {biggest && bigQty > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>= {stock} {base?.name}</span>}
                          </div>
                        );
                      })()}
                    </td>
                    <td>
                      <span className={`badge ${m.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                        {m.status === 'active' ? 'Hoạt động' : 'Ngừng'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', marginRight: '0.4rem', fontSize: '0.75rem' }} onClick={() => setModal({ mode: 'edit', initial: m })}><PencilSimple size={12} /></button>
                        <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleDelete(m._id)}><Trash size={12} /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && allFiltered.length > 0 && (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-3)', paddingTop: '1.25rem' }}>
                Trang {page}/{totalPages} · {allFiltered.length} kết quả
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </>
      )}

      {activeTab === 'groups' && (
        <MaterialGroupTree groups={groupsWithCount} isAdmin={isAdmin} onRefresh={fetchGroups} onGroupClick={handleGroupClick} api={api} />
      )}

      {modal && (
        <MaterialModal
          mode={modal.mode}
          initial={modal.initial}
          groups={groups}
          existingCodes={existingCodes}
          onSave={handleSaveMaterial}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

export default Materials;