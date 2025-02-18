import { Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  return (
    <Route path={path}>
      {(params) => <Component {...params} />}
    </Route>
  );
}