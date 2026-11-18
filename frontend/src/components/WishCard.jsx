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
      className={`py-2.5 border-b border-dashed border-[#c9d4ce] last:border-b-0 flex flex-col gap-1.5 ${
        isPurchasedByOther ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`font-medium text-sm leading-snug ${
            !isMe && wish.is_purchased ? 'line-through text-[#5C6E64]' : 'text-[#1B2A22]'
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
            className="p-1 text-[#5C6E64] hover:text-[#B3202A] hover:bg-[#f0e1e2] rounded-md cursor-pointer shrink-0 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {wish.notes && (
        <p className="text-xs text-[#5C6E64] whitespace-pre-line">{wish.notes}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {wish.price_approx && (
          <span className="font-bold text-[#B3202A]">
            {wish.price_approx.includes('€') ? wish.price_approx : `${wish.price_approx}€`}
          </span>
        )}
        {wish.url && (
          <a
            href={wish.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[#0F3B2A] underline decoration-[#E3B34B] decoration-2 hover:text-[#B3202A]"
          >
            Ver enlace
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {!isMe && (
        <div className="pt-1">
          {isPurchasedByOther ? (
            <div className="w-full py-1.5 px-2.5 bg-[#e8edea] border border-[#c9d4ce] rounded-lg text-xs font-bold text-[#5C6E64] text-center">
              Cogido ({wish.purchased_by_name})
            </div>
          ) : isPurchasedByMe ? (
            <button
              type="button"
              onClick={handleToggle}
              disabled={busy}
              className="w-full py-1.5 px-2.5 bg-[#0F3B2A] hover:bg-[#1B5A40] text-[#F4DC9B] border border-[#0F3B2A] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Check className="w-3.5 h-3.5 text-[#E3B34B]" />
              Lo compras tú (Cancelar)
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              disabled={busy}
              className="btn-berry w-full py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
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
