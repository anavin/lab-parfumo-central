export const dynamic = "force-static";

export default function Offline() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-nav p-6 text-center">
      <div className="max-w-xs">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white font-bold text-xl shadow">LP</div>
        <h1 className="text-lg font-bold text-white mb-1">ออฟไลน์อยู่</h1>
        <p className="text-sm text-white/60">ยังไม่มีการเชื่อมต่ออินเทอร์เน็ต<br />เชื่อมต่อแล้วลองใหม่อีกครั้ง</p>
        <a href="/" className="btn btn-brand inline-block mt-5">ลองใหม่</a>
      </div>
    </div>
  );
}
