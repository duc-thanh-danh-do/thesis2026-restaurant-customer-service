export default function UserAvatar({ name }: { name: string }) {
  return (
    <div className="grid size-9 place-items-center rounded-full bg-teal-700 text-sm font-bold text-white">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
