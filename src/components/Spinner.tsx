/** Small ring spinner used inside buttons and loading areas. */
export default function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      className={`spin inline-block rounded-full border-2 border-current border-t-transparent align-[-2px] ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
