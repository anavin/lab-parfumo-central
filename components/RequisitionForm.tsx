"use client";
import { useState, useTransition } from "react";
import { searchProducts } from "@/lib/actions/lookups";
import { createRequisition, updateRequisition, type ReqInput } from "@/lib/actions/requisitions";
import { Select } from "@/components/ui/Select";

const STATUS_OPTS = [
  { value: "draft", label: "draft (ร่าง)" },
  { value: "issued", label: "issued (ออกใบเบิก)" },
  { value: "delivered", label: "delivered (ส่งแล้ว)" },
  { value: "closed", label: "closed (ปิด)" },
];

type Branch = { id: number; branch_code: string; store_no: string; receiver: string; phone: string; address: string };
type Item = { key: number; barcode: string; scent: string; size: string; qty: number; product_id?: number | null };
type Prod = { id: number; barcode: string; scent: string; grade: string; size: string; sku: string; price: number };

let seq = 1;
const blank = (): Item => ({ key: seq++, barcode: "", scent: "", size: "", qty: 1, product_id: null });

export function RequisitionForm({
  branches, mode, id, initial,
}: {
  branches: Branch[];
  mode: "new" | "edit";
  id?: number;
  initial?: Partial<ReqInput> & { items?: Item[] };
}) {
  const [form, setForm] = useState({
    order_date: initial?.order_date ?? new Date().toISOString().slice(0, 10),
    branch_label: initial?.branch_label ?? branches[0]?.branch_code ?? "",
    store_no: initial?.store_no ?? "",
    delivery_number: initial?.delivery_number ?? "",
    phone: initial?.phone ?? "",
    shipping_name: initial?.shipping_name ?? "",
    address: initial?.address ?? "",
    remark: initial?.remark ?? "",
    status: initial?.status ?? "issued",
  });
  const [items, setItems] = useState<Item[]>(
    initial?.items?.length ? initial.items.map((i) => ({ ...i, key: seq++ })) : [blank()]);
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const onBranch = (code: string) => {
    const b = branches.find((x) => x.branch_code === code);
    setForm((f) => ({ ...f, branch_label: code,
      store_no: b?.store_no ?? f.store_no, phone: b?.phone ?? f.phone,
      shipping_name: b?.receiver && b.receiver !== "-" ? b.receiver : f.shipping_name,
      address: b?.address && b.address !== "-" ? b.address : f.address }));
  };

  const setItem = (key: number, patch: Partial<Item>) =>
    setItems((arr) => arr.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  const addRow = () => setItems((a) => [...a, blank()]);
  const delRow = (key: number) => setItems((a) => (a.length > 1 ? a.filter((i) => i.key !== key) : a));

  const totalQty = items.reduce((s, i) => s + (Number(i.qty) || 0), 0);

  const submit = () => {
    setErr("");
    const clean = items.filter((i) => i.scent || i.barcode);
    if (!form.branch_label) return setErr("กรุณาเลือกสาขา");
    if (clean.length === 0) return setErr("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ");
    const payload: ReqInput = { ...form, items: clean.map((i) => ({ barcode: i.barcode, scent: i.scent, size: i.size, qty: Number(i.qty) || 0, product_id: i.product_id })) };
    start(async () => {
      try {
        if (mode === "new") await createRequisition(payload);
        else await updateRequisition(id!, payload);
      } catch (e: any) {
        if (e?.message?.includes("NEXT_REDIRECT")) throw e;
        setErr(String(e?.message ?? e));
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* header fields */}
      <div className="card p-5 grid md:grid-cols-2 gap-4">
        <L label="สาขา *">
          <Select value={form.branch_label} onValueChange={onBranch}
            options={branches.map((b) => ({ value: b.branch_code, label: b.branch_code }))} />
        </L>
        <L label="วันที่ *"><input type="date" value={form.order_date} onChange={(e) => set("order_date", e.target.value)} className="inp" /></L>
        <L label="รหัสสาขา"><input value={form.store_no} onChange={(e) => set("store_no", e.target.value)} className="inp" /></L>
        <L label="Delivery No."><input value={form.delivery_number} onChange={(e) => set("delivery_number", e.target.value)} className="inp" /></L>
        <L label="ผู้รับ / Shipping Name"><input value={form.shipping_name} onChange={(e) => set("shipping_name", e.target.value)} className="inp" /></L>
        <L label="โทรศัพท์"><input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="inp" /></L>
        <L label="ที่อยู่จัดส่ง"><input value={form.address} onChange={(e) => set("address", e.target.value)} className="inp" /></L>
        <L label="สถานะ">
          <Select value={form.status} onValueChange={(v) => set("status", v)} options={STATUS_OPTS} />
        </L>
        <L label="หมายเหตุ" full><input value={form.remark} onChange={(e) => set("remark", e.target.value)} className="inp" /></L>
      </div>

      {/* items */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">รายการสินค้า</h3>
          <span className="text-xs text-ink/40">รวม {totalQty} ขวด · {items.filter(i=>i.scent||i.barcode).length} รายการ</span>
        </div>
        <div className="space-y-2">
          {items.map((it, idx) => (
            <ItemRow key={it.key} index={idx} item={it} onChange={(p) => setItem(it.key, p)} onRemove={() => delRow(it.key)} />
          ))}
        </div>
        <button onClick={addRow} className="mt-3 text-sm text-gold-dark font-medium hover:underline">+ เพิ่มรายการ</button>
      </div>

      {err && <div className="text-sm text-danger bg-danger-soft border border-danger/30 rounded-lg px-4 py-2">{err}</div>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={pending} className="px-5 py-2.5 rounded-lg bg-ink text-surface font-medium hover:opacity-90 disabled:opacity-50">
          {pending ? "กำลังบันทึก…" : mode === "new" ? "สร้างใบเบิก" : "บันทึกการแก้ไข"}
        </button>
        <a href={mode === "edit" ? `/requisitions/${id}` : "/requisitions"} className="px-5 py-2.5 rounded-lg border border-line font-medium hover:bg-canvas">ยกเลิก</a>
      </div>
    </div>
  );
}

function L({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <label className={`block ${full ? "md:col-span-2" : ""}`}><span className="text-xs text-ink/50 mb-1 block">{label}</span>{children}</label>;
}

function ItemRow({ index, item, onChange, onRemove }: { index: number; item: Item; onChange: (p: Partial<Item>) => void; onRemove: () => void }) {
  const [results, setResults] = useState<Prod[]>([]);
  const [open, setOpen] = useState(false);
  const onSearch = (v: string) => {
    onChange({ scent: v, product_id: null });
    if (v.trim().length < 1) { setResults([]); setOpen(false); return; }
    searchProducts(v).then((r) => { setResults(r); setOpen(true); });
  };
  const pick = (p: Prod) => { onChange({ scent: p.scent, barcode: p.barcode, size: p.size, product_id: p.id }); setOpen(false); };
  return (
    <div className="flex gap-2 items-start">
      <span className="w-6 pt-2 text-xs text-ink/30 text-right">{index + 1}</span>
      <div className="relative flex-1">
        <input value={item.scent} onChange={(e) => onSearch(e.target.value)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="ค้นหากลิ่น / บาร์โค้ด" className="inp" />
        {open && results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto bg-surface border border-line rounded-lg shadow-lg text-sm">
            {results.map((p) => (
              <button key={p.id} onMouseDown={() => pick(p)} className="block w-full text-left px-3 py-2 hover:bg-gold/10">
                <span className="font-medium">{p.scent}</span> <span className="text-ink/40">{p.size} · {p.grade} · {p.barcode}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <input value={item.barcode} onChange={(e) => onChange({ barcode: e.target.value })} placeholder="Barcode" className="inp !w-40 font-mono text-xs" />
      <input value={item.size} onChange={(e) => onChange({ size: e.target.value })} placeholder="ขนาด" className="inp !w-24" />
      <input type="number" min={0} value={item.qty} onChange={(e) => onChange({ qty: Number(e.target.value) })} className="inp !w-20 text-right" />
      <button onClick={onRemove} className="pt-2 text-ink/30 hover:text-danger" title="ลบ">✕</button>
    </div>
  );
}
