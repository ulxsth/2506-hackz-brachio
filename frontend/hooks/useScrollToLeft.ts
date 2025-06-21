import { useEffect, useRef, useCallback } from 'react';

/**
 * 横スクロール可能なコンテナを左端に固定するフック
 * ターミナル風UIで初期表示時に左端から表示するために使用
 */
export function useScrollToLeft<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);

  // 左端にスクロールする関数
  const scrollToLeft = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
  }, []);

  // 初期化時に左端へスクロール
  useEffect(() => {
    scrollToLeft();
  }, [scrollToLeft]);

  // ウィンドウリサイズ時も左端を維持
  useEffect(() => {
    const handleResize = () => {
      scrollToLeft();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [scrollToLeft]);

  return {
    containerRef,
    scrollToLeft
  };
}
