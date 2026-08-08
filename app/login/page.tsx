import { loginAction } from "./actions";
import { PasswordField } from "../_components/PasswordField";

export const dynamic = "force-dynamic";

type Search = Promise<{ from?: string; error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { from, error } = await searchParams;
  const safeFrom =
    typeof from === "string" && from.startsWith("/") && !from.startsWith("//")
      ? from
      : "/";

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Pack</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Enter the password to continue.
        </p>
      </header>

      <form action={loginAction} className="flex flex-col gap-3">
        <input type="hidden" name="from" value={safeFrom} />
        <PasswordField />
        {error ? (
          <p className="text-xs text-red-600 dark:text-red-400">
            Incorrect password.
          </p>
        ) : null}
        <button
          type="submit"
          className="rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-95"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
