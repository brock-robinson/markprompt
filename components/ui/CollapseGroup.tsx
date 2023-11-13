import * as Accordion from '@radix-ui/react-accordion';
import React, { FC, ReactNode } from 'react';

type CollapseGroupProps = {
  children: ReactNode;
};

export const CollapseGroup: FC<CollapseGroupProps> = ({ children }) => (
  <Accordion.Root className="w-full rounded-md" type="single" collapsible>
    {children}
  </Accordion.Root>
);
