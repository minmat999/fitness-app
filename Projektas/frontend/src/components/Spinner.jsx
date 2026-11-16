// Krovimo indikatorius. Sukimasis aprasytas CSS faile (@keyframes spin).
export default function Spinner({ text = "Kraunama..." }) {
  return (
    <div className="spinner-wrap" role="status">
      <span className="spinner" />
      <span>{text}</span>
    </div>
  );
}
