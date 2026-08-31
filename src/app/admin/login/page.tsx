import { loginAction } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <form action={loginAction} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-center">後台登入</h1>
        {error && <p className="text-red-600 text-sm text-center">密碼錯誤，請再試一次</p>}
        <input type="hidden" name="next" value={next ?? "/admin"} />
        <input
          type="password"
          name="password"
          placeholder="請輸入管理密碼"
          className="w-full border border-neutral-300 rounded-lg px-3 py-2"
          required
          autoFocus
        />
        <button
          type="submit"
          className="w-full bg-amber-600 text-white py-2.5 rounded-lg font-medium"
        >
          登入
        </button>
      </form>
    </div>
  );
}
