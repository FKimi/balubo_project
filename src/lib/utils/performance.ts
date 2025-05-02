/**
 * パフォーマンス最適化ユーティリティ
 */

/**
 * デバウンス関数
 * 連続して呼び出される関数の実行を遅延させる
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * スロットル関数
 * 関数の実行頻度を制限する
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 非同期処理の中断を管理するためのアボートコントローラーを作成
 */
export function createAbortController(): { 
  controller: AbortController; 
  signal: AbortSignal;
  abort: () => void;
} {
  const controller = new AbortController();
  const signal = controller.signal;
  
  return {
    controller,
    signal,
    abort: () => controller.abort()
  };
}

/**
 * 画像の遅延読み込みを設定
 */
export function setupLazyLoading(): void {
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img.lazy');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const lazyImage = entry.target as HTMLImageElement;
          const dataSrc = lazyImage.getAttribute('data-src');
          
          if (dataSrc) {
            lazyImage.src = dataSrc;
            lazyImage.classList.remove('lazy');
            imageObserver.unobserve(lazyImage);
          }
        }
      });
    });
    
    lazyImages.forEach((image) => {
      imageObserver.observe(image);
    });
  }
}
