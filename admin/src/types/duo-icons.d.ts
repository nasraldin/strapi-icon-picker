declare module 'duo-icons' {
  import { ComponentType, SVGProps } from 'react';

  // duo-icons exports many icon components dynamically
  // Each icon is a React component that accepts SVGProps
  interface DuoIconComponent extends ComponentType<SVGProps<SVGSVGElement>> {}

  // Export all possible icon names as a namespace
  const DuoIcons: Record<string, DuoIconComponent>;

  export = DuoIcons;
}
