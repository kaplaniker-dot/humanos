import { useEffect, RefObject } from "react";

/**
 * humanOS — useClickOutside Hook
 *
 * Bir element dışına tıklandığında verilen callback'i çalıştırır.
 * Dropdown'lar, modal'lar, popover'lar için kullanılır.
 *
 * Kullanım:
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * const [isOpen, setIsOpen] = useState(false);
 *
 * useClickOutside(ref, () => setIsOpen(false));
 *
 * return <div ref={ref}>...</div>;
 * ```
 *
 * @param ref - Dışarıyı dinleyeceğimiz element'in ref'i
 * @param handler - Element dışına tıklanınca çalışacak fonksiyon
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void
) {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // Ref henüz mount olmadıysa ya da içeriye tıklandıysa hiçbir şey yapma
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener("mousedown", handleClick);

    // Cleanup — component unmount olunca event listener'ı kaldır (memory leak önle)
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [ref, handler]);
}
