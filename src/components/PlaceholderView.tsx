interface PlaceholderViewProps {
  title: string;
  message: string;
}

export function PlaceholderView({ title, message }: PlaceholderViewProps) {
  return (
    <section className="placeholder-view">
      <div className="placeholder-view-title">{title}</div>
      <div className="placeholder-view-msg">{message}</div>
    </section>
  );
}
