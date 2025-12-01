"use client";

export default function AgentsTable({ data }: { data: any[] }) {
  return (
    <>
      <h3>🏆 Top Agents</h3>
      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>Agent</th>
            <th>Orders</th>
            <th>Revenue</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          {data.map((a: any) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.orders}</td>
              <td>{a.revenue}</td>
              <td>{a.profit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
