interface Props { name: string; color: string; size?: number }
export function Avatar({ name, color, size = 28 }: Props) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold text-white border border-white/10"
      style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}
      aria-label={name}
    >
      {initial}
    </span>
  );
}
