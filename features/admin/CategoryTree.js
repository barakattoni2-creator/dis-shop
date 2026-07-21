import { useMemo, useState } from "react";
import styles from "@/styles/CategoryTree.module.css";

function buildTree(flat) {
  const byId = {};
  flat.forEach((c) => (byId[c.id] = { ...c, children: [] }));
  const roots = [];
  flat.forEach((c) => {
    if (c.parentId && byId[c.parentId]) byId[c.parentId].children.push(byId[c.id]);
    else if (!c.parentId) roots.push(byId[c.id]);
  });
  const sortRec = (nodes) => {
    nodes.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

// Prunes the tree to nodes matching the query plus their ancestors, so a
// match deep in the tree stays visible in context instead of orphaned.
function filterTree(nodes, query) {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;
  const walk = (list) =>
    list
      .map((node) => {
        const children = walk(node.children);
        const selfMatch =
          node.name.toLowerCase().includes(q) ||
          (node.nameAr || "").toLowerCase().includes(q) ||
          node.slug.toLowerCase().includes(q);
        if (selfMatch || children.length > 0) {
          return { ...node, children };
        }
        return null;
      })
      .filter(Boolean);
  return walk(nodes);
}

function allIds(nodes, out = []) {
  nodes.forEach((n) => {
    out.push(n.id);
    allIds(n.children, out);
  });
  return out;
}

const LEVEL_LABELS = { 1: "Main", 2: "Sub", 3: "Child" };

function Row({
  node,
  depth,
  expanded,
  onToggleExpand,
  onEdit,
  onRequestDelete,
  onRequestToggleActive,
  onRequestMove,
  onReorder,
  dragState,
  setDragState,
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isDragging = dragState.draggingId === node.id;
  const dropZone = dragState.overId === node.id ? dragState.overZone : null;

  const rowClass = [
    styles.row,
    !node.active ? styles.rowInactive : "",
    isDragging ? styles.rowDragging : "",
    dropZone === "above" ? styles.rowDragOverAbove : "",
    dropZone === "below" ? styles.rowDragOverBelow : "",
    dropZone === "inside" ? styles.rowDragOverInside : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = "move";
    setDragState({ draggingId: node.id, overId: null, overZone: null });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = e.clientY - rect.top;
    const ratio = offset / rect.height;
    const zone = ratio < 0.3 ? "above" : ratio > 0.7 ? "below" : "inside";
    setDragState((prev) => ({ ...prev, overId: node.id, overZone: zone }));
  };

  const handleDragLeave = () => {
    setDragState((prev) => (prev.overId === node.id ? { ...prev, overId: null, overZone: null } : prev));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const draggedId = dragState.draggingId;
    const zone = dragState.overZone;
    setDragState({ draggingId: null, overId: null, overZone: null });
    if (!draggedId || draggedId === node.id) return;

    if (zone === "inside") {
      onRequestMove(draggedId, node.id, node.name);
      return;
    }
    onReorder(draggedId, node, zone);
  };

  return (
    <>
      <div
        className={rowClass}
        style={{ paddingLeft: `${0.9 + depth * 1.4}rem` }}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={() => setDragState({ draggingId: null, overId: null, overZone: null })}
      >
        {hasChildren ? (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => onToggleExpand(node.id)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className={styles.toggleSpacer} />
        )}

        <span className={styles.thumb}>
          {node.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={node.imageUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }}
            />
          ) : (
            node.icon || "📦"
          )}
        </span>

        <span className={styles.names}>
          <span className={styles.name}>{node.name}</span>
          {node.nameAr && <span className={styles.nameAr}>{node.nameAr}</span>}
        </span>

        <span className={styles.meta}>
          <span className={styles.levelTag}>{LEVEL_LABELS[node.level] || node.level}</span>
          <span className={styles.slugTag}>{node.slug}</span>
          {typeof node.productCount === "number" && node.productCount > 0 && (
            <span className={styles.countBadge}>{node.productCount}</span>
          )}
          {!node.active && <span title="Inactive">🚫</span>}
          {!node.showInNav && <span title="Hidden from navigation">🙈</span>}
          {node.showOnHomepage && <span title="Shown on homepage">🏠</span>}
        </span>

        <span className={styles.actions}>
          <a
            className={styles.iconBtn}
            href={`/category/${node.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Preview on storefront"
          >
            Preview
          </a>
          <button type="button" className={styles.iconBtn} onClick={() => onEdit(node)}>
            Edit
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => onRequestToggleActive(node)}
          >
            {node.active ? "Disable" : "Enable"}
          </button>
          <button
            type="button"
            className={styles.dangerIconBtn}
            onClick={() => onRequestDelete(node)}
          >
            Delete
          </button>
        </span>
      </div>

      {isExpanded &&
        node.children.map((child) => (
          <Row
            key={child.id}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            onEdit={onEdit}
            onRequestDelete={onRequestDelete}
            onRequestToggleActive={onRequestToggleActive}
            onRequestMove={onRequestMove}
            onReorder={onReorder}
            dragState={dragState}
            setDragState={setDragState}
          />
        ))}
    </>
  );
}

export default function CategoryTree({
  categories,
  onEdit,
  onRequestDelete,
  onRequestToggleActive,
  onRequestMove,
  onRequestReorder,
}) {
  const [search, setSearch] = useState("");
  const fullTree = useMemo(() => buildTree(categories), [categories]);
  const visibleTree = useMemo(() => filterTree(fullTree, search), [fullTree, search]);
  const [expanded, setExpanded] = useState(() => new Set());
  const [dragState, setDragState] = useState({ draggingId: null, overId: null, overZone: null });

  const isSearching = search.trim().length > 0;
  const effectiveExpanded = isSearching ? new Set(allIds(visibleTree)) : expanded;

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const byId = useMemo(() => {
    const m = {};
    categories.forEach((c) => (m[c.id] = c));
    return m;
  }, [categories]);

  const handleReorder = (draggedId, targetNode, zone) => {
    const dragged = byId[draggedId];
    if (!dragged) return;
    if (dragged.parentId !== targetNode.parentId) {
      // Dropping above/below a category that has a different parent — treat
      // as "move into that parent" rather than silently ignoring the drop.
      onRequestMove(draggedId, targetNode.parentId, targetNode.parentId ? byId[targetNode.parentId]?.name : "Top Level");
      return;
    }
    const siblings = categories
      .filter((c) => c.parentId === targetNode.parentId)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    const withoutDragged = siblings.filter((s) => s.id !== draggedId);
    const targetIndex = withoutDragged.findIndex((s) => s.id === targetNode.id);
    const insertAt = zone === "above" ? targetIndex : targetIndex + 1;
    const reordered = [...withoutDragged];
    reordered.splice(insertAt, 0, dragged);
    onRequestReorder(targetNode.parentId, reordered.map((c) => c.id));
  };

  return (
    <div>
      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by English name, Arabic name or slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className={styles.hint}>{categories.length} categories · drag rows to reorder or drop onto a row to move</span>
      </div>

      {visibleTree.length === 0 ? (
        <p className={styles.hint}>No categories match &quot;{search}&quot;.</p>
      ) : (
        <div className={styles.tree}>
          {visibleTree.map((node) => (
            <Row
              key={node.id}
              node={node}
              depth={0}
              expanded={effectiveExpanded}
              onToggleExpand={toggleExpand}
              onEdit={onEdit}
              onRequestDelete={onRequestDelete}
              onRequestToggleActive={onRequestToggleActive}
              onRequestMove={onRequestMove}
              onReorder={handleReorder}
              dragState={dragState}
              setDragState={setDragState}
            />
          ))}
        </div>
      )}
    </div>
  );
}
