import { PLATFORMS } from '../lib/appealHelpers';

export default function PlatformRow() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none -mx-1 px-1">
      {PLATFORMS.map((p) => (
        <div
          key={p.id}
          className="rg-pill shrink-0 flex items-center gap-2 px-3 py-2"
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-[13px] font-medium text-[#374151]">{p.label}</span>
        </div>
      ))}
    </div>
  );
}
