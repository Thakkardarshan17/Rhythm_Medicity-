import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string | null | undefined;
  className?: string;
  fallback?: React.ReactNode;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name,
  className = 'w-4 h-4',
  fallback,
}) => {
  if (!name) {
    return <>{fallback || <Icons.FileText className={className} />}</>;
  }

  // Look up icon in lucide-react exports
  const IconComponent = (Icons as Record<string, any>)[name];

  if (!IconComponent) {
    return <>{fallback || <Icons.FileText className={className} />}</>;
  }

  return <IconComponent className={className} />;
};
