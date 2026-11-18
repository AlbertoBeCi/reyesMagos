import { useState } from 'react';
import { ExternalLink, Trash2, Check, Gift } from 'lucide-react';

export default function WishCard({
  wish,
  isMe,
  currentMemberId,
  onTogglePurchase,
  onDelete,
}) {
  const [busy, setBusy] = useState(false);

  const isPurchasedByMe = !isMe && wish.is_purchased && wish.purchased_by_id === currentMemberId;
  const isPurchasedByOther = !isMe && wish.is_purchased && wish.purchased_by_id !== currentMemberId;

  const handleToggle = async () => {
    setBusy(true);
    try {
      await onTogglePurchase(wish.id);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await onDelete(wish.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`bg-white border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] p-3 flex flex-col gap-2 ${
        isPurchasedByOther ? 'opacity-80 bg-stone-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`font-bold text-sm leading-snug ${
            !isMe && wish.is_purchased ? 'line-through text-zinc-500' : 'text-zinc-900'
          }`}
        >
          {wish.title}
        </h3>

        {isMe && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            title="Eliminar deseo"
            className="p-1 text-zinc-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-zinc-900 cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {wish.notes && (
        <p className="text-xs text-zinc-600 whitespace-pre-line">{wish.notes}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {wish.price_approx && (
          <span className="px-1.5 py-0.5 bg-stone-100 border border-zinc-900 font-bold">
            ~{wish.price_approx}
          </span>
        )}
        {wish.url && (
          <a
            href={wish.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold underline decoration-2 hover:text-lime-700"
          >
            Ver enlace
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {!isMe && (
        <div className="pt-1">
          {isPurchasedByOther ? (
            <div className="w-full py-1.5 px-2.5 bg-zinc-200 border-2 border-zinc-900 text-xs font-bold text-zinc-700 text-center">
              Cogido ({wish.purchased_by_name})
            </div>
          ) : isPurchasedByMe ? (
            <button
              type="button"
              onClick={handleToggle}
              disabled={busy}
              className="w-full py-1.5 px-2.5 bg-lime-400 hover:bg-lime-300 border-2 border-zinc-900 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Lo compras tú (Cancelar)
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              disabled={busy}
              className="w-full py-1.5 px-2.5 bg-white hover:bg-lime-400 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Gift className="w-3.5 h-3.5" />
              Lo pido yo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
