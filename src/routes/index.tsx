import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-500">
      <p className="text-sm">Your tasks will live here.</p>
    </div>
  );
}
