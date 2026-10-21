import type { ReactNode, ElementType } from 'react';
import { cn } from '../lib/cn';

type ContainerProps = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
};

export function Container({ as: Tag = 'div', className, children }: ContainerProps) {
  return (
    <Tag className={cn('mx-auto w-full max-w-container px-6', className)}>
      {children}
    </Tag>
  );
}