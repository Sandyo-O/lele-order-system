import Link from "next/link";
import { logoutAction } from "../actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-neutral-200 bg-white px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="font-semibold text-amber-700">
            菜單管理
          </Link>
          <Link href="/admin/tables" className="text-neutral-600">
            桌號 / QR code
          </Link>
          <Link href="/admin/settings" className="text-neutral-600">
            店家設定
          </Link>
          <Link href="/counter" className="text-neutral-600">
            櫃台訂單
          </Link>
        </nav>
        <form action={logoutAction}>
          <button className="text-sm text-neutral-500 underline">登出</button>
        </form>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  );
}
