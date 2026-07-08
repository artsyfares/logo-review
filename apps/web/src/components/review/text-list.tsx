export function TextList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5 text-sm leading-relaxed">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
