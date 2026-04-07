/** viewBox width / height from karakeep-full.svg */
const LOGO_ASPECT = 598 / 166;

/**
 * Logo as <img src="/icons/..."> so it works with Turbopack dev (SVGR only runs via webpack).
 */
export default function KarakeepLogo({ height }: { height: number }) {
  const width = Math.round(height * LOGO_ASPECT);
  return (
    <span className="flex items-center">
      <img
        alt="Karakeep"
        className="block max-w-none dark:hidden"
        height={height}
        src="/icons/karakeep-full.svg"
        width={width}
      />
      <img
        alt=""
        aria-hidden
        className="hidden max-w-none dark:block"
        height={height}
        src="/icons/karakeep-full-white.svg"
        width={width}
      />
    </span>
  );
}
