declare module 'atomattr/react' {
  import * as React from 'react';
  type P = { [k: string]: any; children?: React.ReactNode; ref?: any };
  export const Box: React.FC<P>; export const Btn: React.FC<P>; export const Row: React.FC<P>; export const Stack: React.FC<P>;
  export const Txt: React.FC<P>; export const Input: React.FC<P>; export const Select: React.FC<P>; export const Option: React.FC<P>;
  export const Badge: React.FC<P>; export const H1: React.FC<P>; export const H2: React.FC<P>;
}
declare module 'atomattr/defaults.css';
