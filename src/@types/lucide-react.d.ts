// Add ReactNode typings for external components
import { SVGProps } from 'react';

declare module 'lucide-react' {
  export type IconNode = React.ReactElement<SVGProps<SVGSVGElement>>;
  
  export interface IconProps extends Partial<SVGProps<SVGSVGElement>> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
  }

  // Declare all icons that are used in the project
  export const Heart: React.FC<IconProps>;
  export const MessageSquare: React.FC<IconProps>;
  export const Plus: React.FC<IconProps>;
  export const X: React.FC<IconProps>;
  export const Sparkles: React.FC<IconProps>;
  
  // Add other icons as needed
  export const ArrowRight: React.FC<IconProps>;
  export const Check: React.FC<IconProps>;
  export const ChevronDown: React.FC<IconProps>;
  export const ChevronLeft: React.FC<IconProps>;
  export const ChevronRight: React.FC<IconProps>;
  export const ChevronUp: React.FC<IconProps>;
  export const Clock: React.FC<IconProps>;
  export const ExternalLink: React.FC<IconProps>;
  export const Eye: React.FC<IconProps>;
  export const File: React.FC<IconProps>;
  export const Filter: React.FC<IconProps>;
  export const Image: React.FC<IconProps>;
  export const Link: React.FC<IconProps>;
  export const Menu: React.FC<IconProps>;
  export const Search: React.FC<IconProps>;
  export const Settings: React.FC<IconProps>;
  export const Share: React.FC<IconProps>;
  export const Star: React.FC<IconProps>;
  export const Trash: React.FC<IconProps>;
  export const User: React.FC<IconProps>;
}
