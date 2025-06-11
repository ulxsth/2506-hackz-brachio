import { Inter, Lusitana } from 'next/font/google';

// subsets: 使用する文字だけを絞り込んで用いる
export const inter = Inter({ subsets: ['latin'] });
export const lusitana = Lusitana({ subsets: ['latin'], weight: ['400', '700'] });