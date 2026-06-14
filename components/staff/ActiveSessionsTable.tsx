export default function ActiveSessionsTable() {
  const rows = [
    ["Table 1", "active", "AI chat"],
    ["Table 2", "waiting_staff", "Staff help"],
  ];

  return (
    <section className="surface overflow-hidden">
      <div className="border-b border-neutral-200 p-4">
        <h2 className="font-semibold">Active customer sessions</h2>
      </div>
      <table className="w-full text-left text-sm">
        <tbody>
          {rows.map(([table, status, channel]) => (
            <tr className="border-b border-neutral-100 last:border-0" key={table}>
              <td className="p-4 font-medium">{table}</td>
              <td className="p-4 text-neutral-600">{status}</td>
              <td className="p-4 text-neutral-600">{channel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
