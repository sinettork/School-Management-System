export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold text-destructive mb-4">403</h1>
      <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
      </p>
      <a href="/dashboard" className="text-primary hover:underline font-medium">Return to Dashboard</a>
    </div>
  );
}
