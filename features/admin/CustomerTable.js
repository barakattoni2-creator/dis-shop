import styles from "@/styles/Admin.module.css";

export default function CustomerTable({ customers, onEdit, onDelete }) {
  if (customers.length === 0) {
    return <p className={styles.empty}>No customers yet.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Orders</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td data-label="Name">{c.name}</td>
              <td data-label="Email">{c.email}</td>
              <td data-label="Phone">{c.phone || "—"}</td>
              <td data-label="Orders">{c.orderCount}</td>
              <td data-label="Joined">
                {new Date(c.createdAt).toLocaleDateString()}
              </td>
              <td className={styles.actionsCell}>
                <button className={styles.editBtn} onClick={() => onEdit(c)}>
                  Edit
                </button>
                <button className={styles.deleteBtn} onClick={() => onDelete(c)}>
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
