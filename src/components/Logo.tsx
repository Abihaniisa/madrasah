export function Logo({ size = 40 }: { size?: number }) {
  return (
    <img
      src="/logo.svg"
      alt=""
      width={size}
      height={size}
      style={{ display: "block", width: size, height: size }}
    />
  );
}
