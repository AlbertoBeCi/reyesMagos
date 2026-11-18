import { useState } from 'react';
import { EyeOff, Plus } from 'lucide-react';
import WishCard from './WishCard';

export default function BoardColumn({
  column,
  displayName,
  currentMemberId,
  onCreateWish,
  onTogglePurchase,
  onDeleteWish,
}) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [priceApprox, setPriceApprox] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onCreateWish({
        title: title.trim(),
        url: url.trim() || null,
        price_approx: priceApprox.trim() || null,
        notes: notes.trim() || null,
      });
      setTitle('');
      setUrl('');
      setPriceApprox('');
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id={`col-${column.member_id}`}
      className="gift-card w-full md:w-80 md:shrink-0 flex flex-col md:max-h-[calc(100vh-14rem)] pl-7 pr-4 py-4"
    >
      <header className="pb-2.5 border-b border-dashed border-[#c9d4ce] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{column.avatar_emoji}</span>
          <h2 className="font-display font-bold text-xl text-[#0F3B2A] truncate">
            {displayName || column.name}
          </h2>
        </div>

        {column.is_me ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#0F3B2A] text-[#F4DC9B] rounded-full text-[11px] font-bold shrink-0">
            <EyeOff className="w-3 h-3 text-[#E3B34B]" />
            Sin spoilers
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-[#e8edea] text-[#5C6E64] rounded-full text-xs font-bold shrink-0">
            {column.wishes.length}
          </span>
        )}
      </header>

      <div className="py-1 overflow-y-auto flex-1">
        {column.wishes.length === 0 ? (
          <p className="text-xs text-[#5C6E64] text-center py-6 font-medium">
            {column.is_me
              ? 'Todavía no has añadido deseos a tu carta.'
              : 'Sin deseos por ahora.'}
          </p>
        ) : (
          column.wishes.map((wish) => (
            <WishCard
              key={wish.id}
              wish={wish}
              isMe={column.is_me}
              currentMemberId={currentMemberId}
              onTogglePurchase={onTogglePurchase}
              onDelete={onDeleteWish}
            />
          ))
        )}
      </div>

      {column.is_me && (
        <form
          onSubmit={handleSubmit}
          className="pt-3 mt-1 border-t border-dashed border-[#c9d4ce] space-y-2"
        >
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nuevo deseo (obligatorio)..."
            className="w-full px-2.5 py-1.5 text-sm bg-white text-[#1B2A22] border-2 border-[#c9d4ce] rounded-lg focus:outline-none focus:border-[#0F3B2A] font-medium"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enlace (opcional)"
              className="w-full px-2 py-1 text-xs bg-white text-[#1B2A22] border-2 border-[#c9d4ce] rounded-lg focus:outline-none focus:border-[#0F3B2A]"
            />
            <input
              type="text"
              value={priceApprox}
              onChange={(e) => setPriceApprox(e.target.value)}
              placeholder="Precio (ej. 30 €)"
              className="w-full px-2 py-1 text-xs bg-white text-[#1B2A22] border-2 border-[#c9d4ce] rounded-lg focus:outline-none focus:border-[#0F3B2A]"
            />
          </div>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas (talla, color, modelo...)"
            className="w-full px-2.5 py-1 text-xs bg-white text-[#1B2A22] border-2 border-[#c9d4ce] rounded-lg focus:outline-none focus:border-[#0F3B2A]"
          />
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="btn-berry w-full py-2 px-3 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {submitting ? 'Añadiendo...' : 'Añadir deseo'}
          </button>
        </form>
      )}
    </section>
  );
}
