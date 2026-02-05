// sample.jsx (no imports: assumes React in scope, common in some setups)
/** @param {{items: {id:string,title:string}[]}} props */
function SimpleGrid(props) {
  const [sort, setSort] = React.useState("title");
  const items = React.useMemo(() => {
    const xs = [...props.items];
    xs.sort((a, b) => {
      if (sort === "id") return a.id.localeCompare(b.id);
      return a.title.localeCompare(b.title);
    });
    return xs;
  }, [props.items, sort]);

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={() => setSort("title")}>Sort by title</button>
        <button onClick={() => setSort("id")}>Sort by id</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {items.map((x) => (
          <div key={x.id} style={{ border: "1px solid #ddd", padding: 10, borderRadius: 8 }}>
            <div style={{ fontWeight: 700 }}>{x.title}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{x.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
