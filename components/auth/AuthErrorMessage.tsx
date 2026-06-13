export default function AuthErrorMessage({ message }: { message: string }) {
  return <p className="text-sm text-red-700">{message}</p>;
}
