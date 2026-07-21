import styles from "@/styles/Admin.module.css";

export default function BrandTable({ brands, onEdit, onDelete }) {
  if (brands.length === 0) {
    return <p className={styles.empty}>No brands yet.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Logo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {brands.map((b) => (
            <tr key={b.name}>
              <td data-label="Name">{b.name}</td>
              <td data-label="Logo">{b.logoUrl || "—"}</td>
              <td className={styles.actionsCell}>
                {b.id ? (
                  <>
                    <button className={styles.editBtn} onClick={() => onEdit(b)}>
                      Edit
                    </button>
                    <button className={styles.deleteBtn} onClick={() => onDelete(b)}>
                      Delete
                    </button>
                  </>
                ) : (
                  <span className={styles.uploadStatus}>Built-in</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
