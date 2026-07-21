import styles from "@/styles/Admin.module.css";

export default function BannerTable({ banners, onEdit, onDelete }) {
  if (banners.length === 0) {
    return <p className={styles.empty}>No banners yet. The homepage will show its default slides.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Order</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {banners.map((b) => (
            <tr key={b.id}>
              <td data-label="Image">
                {b.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.imageUrl} alt={b.title} className={styles.rowThumb} />
                ) : (
                  <span className={styles.rowThumbEmpty}>🖼️</span>
                )}
              </td>
              <td data-label="Title">{b.title}</td>
              <td data-label="Order">{b.order}</td>
              <td data-label="Status">{b.active ? "Active" : "Hidden"}</td>
              <td className={styles.actionsCell}>
                <button className={styles.editBtn} onClick={() => onEdit(b)}>
                  Edit
                </button>
                <button className={styles.deleteBtn} onClick={() => onDelete(b)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
