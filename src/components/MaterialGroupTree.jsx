import { useState, useRef, useCallback } from 'react';
import {
  TreeStructure, Plus, PencilSimple, Trash,
  CaretRight, CaretDown, DotsSixVertical,
  MagnifyingGlass, ArrowsOutLineVertical, ArrowsInLineVertical,
  Tag, X, Check, Warning, Package,
} from '@phosphor-icons/react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildTree(flatList) {
  const map = {};
  flatList.forEach(item => { map[item._id] = { ...item, children: [] }; });
  const roots = [];
  flatList.forEach(item => {
    const parentId = item.parent_id?._id || item.parent_id;
    if (parentId && map[parentId]) map[parentId].children.push(map[item._id]);
    else roots.push(map[item._id]);
  });
  return roots;
}

function getAllDescendantIds(node) {
  const ids = [node._id];
  node.children?.forEach(c => ids.push(...getAllDescendantIds(c)));
  return ids;
}

function countDescendantMaterials(node) {
  const own = node.material_count || node.materialCount || 0;
  if (!node.children?.length) return own;
  return own + node.children.reduce((s, c) => s + countDescendantMaterials(c), 0);
}

function findNodeInTree(nodes, id) {
  for (const n of nodes) {
    if (n._id === id) return n;
    const f = findNodeInTree(n.children || [], id);
    if (f) return f;
  }
  return null;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function GroupModal({ mode, initial, parentNode, onSave, onClose }) {
  const initCode = initial?.group_code || initial?.code || initial?.category_code || '';
  const [form, setForm] = useState({
    name:        initial?.name || '',
    code:        initCode,          // manual entry, no auto-gen
    description: initial?.description || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Tên nhóm không được trống';
    if (!form.code.trim()) e.code = 'Mã nhóm không được trống';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const title = mode === 'add'
    ? (parentNode ? `Thêm nhóm con vào "${parentNode.name}"` : 'Thêm nhóm gốc')
    : `Sửa nhóm "${initial?.name}"`;

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'var(--bg-2, #0f172a)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TreeStructure size={15} style={{ color: 'var(--accent)' }} weight="fill" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-1)' }}>{title}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '0.2rem' }}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>

          {/* Nhóm cha badge */}
          {parentNode && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.75rem', borderRadius: 8,
              background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)',
            }}>
              <Tag size={13} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>
                Nhóm cha: <strong>{parentNode.name}</strong>
              </span>
            </div>
          )}

          {/* 1. Tên nhóm — FIRST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-3)' }}>
              Tên nhóm <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="VD: Vật tư xây dựng"
              autoFocus
            />
            {errors.name && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#f87171' }}>
                <Warning size={11} />{errors.name}
              </span>
            )}
          </div>

          {/* 2. Mã nhóm — SECOND, manual entry */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-3)' }}>
              Mã nhóm <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              className="input"
              value={form.code}
              onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="VD: VT-XD"
              style={{ fontFamily: 'monospace' }}
            />
            {errors.code && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#f87171' }}>
                <Warning size={11} />{errors.code}
              </span>
            )}
          </div>

          {/* 3. Mô tả */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-3)' }}>Mô tả</label>
            <textarea
              className="input"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Mô tả nhóm vật tư..."
              rows={3}
              style={{ resize: 'none' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: '0.5rem',
          padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)',
        }}>
          <button onClick={onClose} className="btn btn-secondary">Huỷ</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            <Check size={13} weight="bold" />
            {saving ? 'Đang lưu...' : mode === 'add' ? 'Tạo nhóm' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ node, childCount, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'var(--bg-2, #0f172a)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '0.75rem', padding: '1.5rem', textAlign: 'center',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trash size={20} style={{ color: '#f87171' }} weight="fill" />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>
              Xoá nhóm "{node.name}"?
            </p>
            {childCount > 0 && (
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: '#f87171' }}>
                Sẽ xoá luôn {childCount} nhóm con bên trong!
              </p>
            )}
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: 'var(--text-3)' }}>
              Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '0.5rem',
          padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)',
        }}>
          <button onClick={onClose} className="btn btn-secondary">Huỷ</button>
          <button
            onClick={async () => { setLoading(true); try { await onConfirm(); } finally { setLoading(false); } }}
            disabled={loading}
            className="btn btn-danger"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Đang xoá...' : 'Xoá'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tree Row ─────────────────────────────────────────────────────────────────
const INDENT = 24;

function TreeRow({
  node, depth, isExpanded, isDragging, isDragOver, dragOverPosition, isAdmin,
  onToggle, onAddChild, onEdit, onDelete,
  onDragStart, onDragOver, onDragLeave, onDrop, onGroupClick,
}) {
  const hasChildren = node.children?.length > 0;
  const totalMat = countDescendantMaterials(node);
  const rowRef = useRef(null);

  const badgeColors = [
    { bg: 'rgba(14,165,233,0.12)',  color: 'var(--accent)', border: 'rgba(14,165,233,0.3)' },
    { bg: 'rgba(16,185,129,0.12)',  color: '#10b981',       border: 'rgba(16,185,129,0.3)' },
    { bg: 'rgba(168,85,247,0.12)', color: '#a855f7',        border: 'rgba(168,85,247,0.3)' },
    { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b',        border: 'rgba(245,158,11,0.3)' },
  ];
  const bc = badgeColors[Math.min(depth, badgeColors.length - 1)];

  return (
    <div
      ref={rowRef}
      style={{ position: 'relative' }}
      draggable
      onDragStart={e => onDragStart(e, node)}
      onDragOver={e => onDragOver(e, node, rowRef)}
      onDragLeave={onDragLeave}
      onDrop={e => onDrop(e, node)}
    >
      {isDragOver && dragOverPosition === 'before' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent)', zIndex: 10, boxShadow: '0 0 6px rgba(14,165,233,0.8)' }} />
      )}

      <div
        className="group"
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: `0.45rem 0.75rem 0.45rem ${depth * INDENT + 4}px`,
          borderBottom: '1px solid var(--border)',
          background: isDragOver && dragOverPosition === 'inside'
            ? 'rgba(14,165,233,0.07)'
            : depth === 0 ? 'rgba(14,165,233,0.025)' : 'transparent',
          opacity: isDragging ? 0.3 : 1,
          transition: 'background 0.1s, opacity 0.15s',
          cursor: 'default',
        }}
      >
        <span
          className="drag-handle"
          style={{ cursor: 'grab', color: 'var(--text-3)', opacity: 0, transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', flexShrink: 0 }}
        >
          <DotsSixVertical size={14} weight="bold" />
        </span>

        {depth > 0 && (
          <span style={{ color: 'var(--text-3)', fontSize: '0.7rem', flexShrink: 0, marginRight: 2 }}>└</span>
        )}

        <span style={{ width: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {hasChildren ? (
            <button
              onClick={() => onToggle(node._id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}
            >
              {isExpanded ? <CaretDown size={12} weight="bold" /> : <CaretRight size={12} weight="bold" />}
            </button>
          ) : null}
        </span>

        <span style={{
          padding: '0.15rem 0.5rem', borderRadius: 5,
          fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700,
          background: bc.bg, color: bc.color, border: `1px solid ${bc.border}`,
          flexShrink: 0, letterSpacing: '0.03em',
        }}>
          {node.group_code || node.code || node.category_code || '—'}
        </span>

        <span
          onClick={() => onGroupClick?.(node)}
          style={{
            flex: 1, fontSize: '0.845rem',
            fontWeight: depth === 0 ? 700 : 500,
            color: 'var(--text-1)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            cursor: onGroupClick ? 'pointer' : 'default',
          }}
        >
          {node.name}
        </span>

        <span style={{ width: 200, flexShrink: 0, fontSize: '0.78rem', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.description || '—'}
        </span>

        <div style={{ flexShrink: 0, width: 130, display: 'flex', alignItems: 'center' }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '0.2rem 0.6rem', borderRadius: 6,
            background: totalMat > 0 ? 'rgba(14,165,233,0.1)' : 'rgba(148,163,184,0.07)',
            color: totalMat > 0 ? 'var(--accent)' : 'var(--text-3)',
            border: `1px solid ${totalMat > 0 ? 'rgba(14,165,233,0.25)' : 'var(--border)'}`,
            fontSize: '0.78rem', fontWeight: totalMat > 0 ? 600 : 400,
          }}>
            <Package size={12} weight={totalMat > 0 ? 'fill' : 'regular'} />
            {totalMat > 0 ? `${totalMat} sản phẩm` : '—'}
          </span>
        </div>

        <div style={{ flexShrink: 0, width: 110, display: 'flex', alignItems: 'center' }}>
          {hasChildren ? (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '0.2rem 0.6rem', borderRadius: 6,
              background: 'rgba(148,163,184,0.07)', color: 'var(--text-3)',
              fontSize: '0.78rem', border: '1px solid var(--border)',
            }}>
              <TreeStructure size={12} />{node.children.length} nhóm con
            </span>
          ) : (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', paddingLeft: '0.6rem' }}>—</span>
          )}
        </div>

        {isAdmin && (
          <div
            className="row-actions"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' }}
          >
            <button title="Thêm nhóm con" onClick={() => onAddChild(node)} className="btn btn-secondary" style={{ padding: '0.25rem 0.45rem', fontSize: '0.72rem', color: 'var(--accent)' }}>
              <Plus size={12} weight="bold" />
            </button>
            <button title="Sửa" onClick={() => onEdit(node)} className="btn btn-secondary" style={{ padding: '0.25rem 0.45rem', fontSize: '0.72rem' }}>
              <PencilSimple size={12} />
            </button>
            <button title="Xoá" onClick={() => onDelete(node)} className="btn btn-danger" style={{ padding: '0.25rem 0.45rem', fontSize: '0.72rem' }}>
              <Trash size={12} />
            </button>
          </div>
        )}
      </div>

      {isDragOver && dragOverPosition === 'after' && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'var(--accent)', zIndex: 10, boxShadow: '0 0 6px rgba(14,165,233,0.8)' }} />
      )}
    </div>
  );
}

function TreeNodeList({
  nodes, depth, expandedIds, draggingId, dragOverState, isAdmin,
  onToggle, onAddChild, onEdit, onDelete,
  onDragStart, onDragOver, onDragLeave, onDrop, onGroupClick,
}) {
  return nodes.map(node => {
    const isExpanded = expandedIds.has(node._id);
    return (
      <div key={node._id}>
        <TreeRow
          node={node} depth={depth} isExpanded={isExpanded}
          isDragging={draggingId === node._id}
          isDragOver={dragOverState?.nodeId === node._id}
          dragOverPosition={dragOverState?.nodeId === node._id ? dragOverState.position : null}
          isAdmin={isAdmin}
          onToggle={onToggle} onAddChild={onAddChild} onEdit={onEdit} onDelete={onDelete}
          onDragStart={onDragStart} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          onGroupClick={onGroupClick}
        />
        {isExpanded && node.children?.length > 0 && (
          <TreeNodeList
            nodes={node.children} depth={depth + 1}
            expandedIds={expandedIds} draggingId={draggingId} dragOverState={dragOverState} isAdmin={isAdmin}
            onToggle={onToggle} onAddChild={onAddChild} onEdit={onEdit} onDelete={onDelete}
            onDragStart={onDragStart} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            onGroupClick={onGroupClick}
          />
        )}
      </div>
    );
  });
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function MaterialGroupTree({ groups = [], isAdmin, onRefresh, onGroupClick, api }) {
  const [expandedIds, setExpandedIds] = useState(() => {
    const s = new Set();
    groups.filter(g => !g.parent_id).forEach(g => s.add(g._id));
    return s;
  });
  const [search, setSearch]               = useState('');
  const [modal, setModal]                 = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [draggingId, setDraggingId]       = useState(null);
  const [dragOverState, setDragOverState] = useState(null);
  const dragLeaveTimer = useRef(null);

  const filtered = search.trim()
    ? groups.filter(g =>
        g.name?.toLowerCase().includes(search.toLowerCase()) ||
        (g.group_code || g.code || '').toLowerCase().includes(search.toLowerCase())
      )
    : groups;
  const treeRoots = buildTree(filtered);

  const toggleExpand = useCallback(id => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const allExpanded = groups.length > 0 && groups.every(g => expandedIds.has(g._id));
  const expandAll   = () => setExpandedIds(new Set(groups.map(g => g._id)));
  const collapseAll = () => setExpandedIds(new Set());

  const handleSave = async ({ code, name, description }) => {
    try {
      const payload = {
        name,
        group_code:    code,
        group_name:    name,
        code,
        category_code: code,
        category_name: name,
        description,
        ...(modal.parentNode ? { parent_id: modal.parentNode._id } : {}),
      };
      if (modal.mode === 'add') {
        await api.post('/material-groups', payload);
        if (modal.parentNode) setExpandedIds(prev => new Set([...prev, modal.parentNode._id]));
      } else {
        await api.put(`/material-groups/${modal.node._id}`, payload);
      }
      setModal(null);
      onRefresh?.();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const tree = buildTree(groups);
      const treeNode = findNodeInTree(tree, deleteTarget._id);
      const ids = treeNode ? getAllDescendantIds(treeNode) : [deleteTarget._id];
      await Promise.all(ids.map(id => api.delete(`/material-groups/${id}`)));
      setDeleteTarget(null);
      onRefresh?.();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const countChildren = id => groups.filter(g => String(g.parent_id?._id || g.parent_id) === String(id)).length;

  const handleDragStart = (e, node) => { e.dataTransfer.effectAllowed = 'move'; setDraggingId(node._id); };

  const handleDragOver = (e, node, rowRef) => {
    e.preventDefault();
    if (node._id === draggingId) return;
    clearTimeout(dragLeaveTimer.current);
    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rel = e.clientY - rect.top;
    const third = rect.height / 3;
    setDragOverState({
      nodeId: node._id,
      position: rel < third ? 'before' : rel > third * 2 ? 'after' : 'inside',
    });
  };

  const handleDragLeave = () => { dragLeaveTimer.current = setTimeout(() => setDragOverState(null), 80); };

  const handleDrop = async (e, targetNode) => {
    e.preventDefault();
    setDragOverState(null);
    if (!draggingId || draggingId === targetNode._id) return setDraggingId(null);
    const position = dragOverState?.position || 'after';
    const tree = buildTree(groups);
    const draggingNode = findNodeInTree(tree, draggingId);
    if (draggingNode) {
      const desc = new Set(getAllDescendantIds(draggingNode));
      if (desc.has(targetNode._id)) return setDraggingId(null);
    }
    try {
      const newParentId = position === 'inside'
        ? targetNode._id
        : (targetNode.parent_id?._id || targetNode.parent_id || null);
      await api.put(`/material-groups/${draggingId}`, { parent_id: newParentId });
      onRefresh?.();
    } catch (err) { console.error(err); }
    setDraggingId(null);
  };

  const rootCount = groups.filter(g => !g.parent_id).length;
  const totalMat  = groups.reduce((s, g) => s + (g.material_count || g.materialCount || 0), 0);

  return (
    <>
      <style>{`.group:hover .drag-handle { opacity: 1 !important; } .group:hover .row-actions { opacity: 1 !important; }`}</style>

      <div onDragEnd={() => { setDraggingId(null); setDragOverState(null); }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {[
              { label: 'Tổng nhóm',  value: groups.length },
              { label: 'Nhóm gốc',  value: rootCount },
              { label: 'Tổng vật tư', value: totalMat },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-1)' }}>{s.value}</span>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-3)' }}>{s.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <MagnifyingGlass size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input
                className="input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm nhóm..."
                style={{ paddingLeft: '1.9rem', height: '2rem', fontSize: '0.8rem', width: 160 }}
              />
            </div>
            <button
              onClick={allExpanded ? collapseAll : expandAll}
              title={allExpanded ? 'Thu gọn' : 'Mở rộng'}
              className="btn btn-secondary"
              style={{ padding: '0.3rem 0.55rem' }}
            >
              {allExpanded ? <ArrowsInLineVertical size={14} /> : <ArrowsOutLineVertical size={14} />}
            </button>
            {isAdmin && (
              <button
                onClick={() => setModal({ mode: 'add', parentNode: null })}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem' }}
              >
                <Plus size={13} weight="bold" /> Thêm nhóm gốc
              </button>
            )}
          </div>
        </div>

        {/* Column header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.4rem 0.75rem', borderBottom: '1px solid var(--border)',
          fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          <span style={{ width: 14, flexShrink: 0 }} />
          <span style={{ width: 18, flexShrink: 0 }} />
          <span style={{ minWidth: 80 }}>Mã</span>
          <span style={{ flex: 1 }}>Tên Nhóm</span>
          <span style={{ width: 200, flexShrink: 0 }}>Mô Tả</span>
          <span style={{ width: 130, flexShrink: 0 }}>Sản Phẩm</span>
          <span style={{ width: 110, flexShrink: 0 }}>Nhóm Con</span>
          {isAdmin && <span style={{ minWidth: 96 }} />}
        </div>

        {/* Tree */}
        <div>
          {groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
              <TreeStructure size={36} weight="thin" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
              {search ? 'Không tìm thấy nhóm nào' : 'Chưa có nhóm vật tư'}
            </div>
          ) : (
            <TreeNodeList
              nodes={treeRoots} depth={0}
              expandedIds={expandedIds} draggingId={draggingId} dragOverState={dragOverState} isAdmin={isAdmin}
              onToggle={toggleExpand}
              onAddChild={node => setModal({ mode: 'add', parentNode: node })}
              onEdit={node => setModal({ mode: 'edit', node })}
              onDelete={setDeleteTarget}
              onDragStart={handleDragStart} onDragOver={handleDragOver}
              onDragLeave={handleDragLeave} onDrop={handleDrop}
              onGroupClick={onGroupClick}
            />
          )}
        </div>
      </div>

      {modal && (
        <GroupModal
          mode={modal.mode}
          initial={modal.node}
          parentNode={modal.parentNode}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          node={deleteTarget}
          childCount={countChildren(deleteTarget._id)}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}