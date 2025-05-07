// React型拡張
import 'react';

declare module 'react' {
  // React.ChangeEventとReact.MouseEvent型を明示的に定義
  export interface ChangeEvent<T = Element> {
    target: T;
    currentTarget: T;
  }

  export interface MouseEvent<T = Element, E = NativeMouseEvent> {
    nativeEvent: E;
    currentTarget: T;
    target: EventTarget;
    bubbles: boolean;
    cancelable: boolean;
    defaultPrevented: boolean;
    eventPhase: number;
    isTrusted: boolean;
    preventDefault(): void;
    isDefaultPrevented(): boolean;
    stopPropagation(): void;
    isPropagationStopped(): boolean;
    persist(): void;
    timeStamp: number;
    type: string;
  }

  // ReactNode型の拡張
  export type FC<P = {}> = FunctionComponent<P>;
  export interface FunctionComponent<P = {}> {
    (props: P): ReactElement<any, any> | null;
    propTypes?: WeakValidationMap<P> | undefined;
    contextTypes?: ValidationMap<any> | undefined;
    defaultProps?: Partial<P> | undefined;
    displayName?: string | undefined;
  }
} 