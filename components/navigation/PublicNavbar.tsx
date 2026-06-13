import Link from "next/link";

export default function PublicNavbar() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 text-sm">
        <Link className="font-bold" href="/">
          AI Phygital Dining
        </Link>
        <div className="flex gap-4 text-neutral-600">
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/staff-signin">Staff</Link>
        </div>
      </nav>
    </header>
  );
}
