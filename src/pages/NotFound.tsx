import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/dashboard" className="text-primary hover:underline font-medium">
        Return to Dashboard
      </Link>
    </div>
  );
}
