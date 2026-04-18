export default function Home() {
  return (
    <main style={{ padding: "4rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "3rem", fontWeight: "bold" }}>
        Merhaba humanOS 👋
      </h1>
      <p style={{ marginTop: "1rem", fontSize: "1.25rem", color: "#666" }}>
        High-Performance Coaching Platform
      </p>
      <p style={{ marginTop: "2rem", fontSize: "0.9rem", color: "#999" }}>
        İlker Kaplan tarafından inşa ediliyor · {new Date().getFullYear()}
      </p>
    </main>
  );
}