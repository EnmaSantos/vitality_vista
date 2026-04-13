// frontend/src/components/ProtectedRoute.tsx
// AUTH BYPASS: design-no-auth branch — always render children

import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return children;
};

export default ProtectedRoute;