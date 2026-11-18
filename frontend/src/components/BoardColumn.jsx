import { useState } from 'react';
import { EyeOff, Plus } from 'lucide-react';
import WishCard from './WishCard';

export default function BoardColumn({
  column,
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
      className="w-[85vw] sm:w-80 shrink-0 snap-center flex flex-col bg-stone-200/70 border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] max-h-[calc(100vh-9.5rem)]"
    >
      <header
        className={`p-3 border-b-2 border-zinc-900 flex items-center justify-between gap-2 ${
          column.is_me ? 'bg-lime-400' : 'bg-white'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{column.avatar_emoji}</span>
          <h2 className="font-black text-base truncate">{column.name}</h2>
        </div>

        {column.is_me ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border-2 border-zinc-900 text-[11px] font-black uppercase shrink-0">
            <EyeOff className="w-3 h-3" />
            Sin spoilers
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-stone-100 border border-zinc-900 text-xs font-bold shrink-0">
            {column.wishes.length}
          </span>
        )}
      </header>

      <div className="p-3 space-y-3 overflow-y-auto flex-1">
        {column.wishes.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-6 font-medium">
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
          className="p-3 bg-white border-t-2 border-zinc-900 space-y-2"
        >
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nuevo deseo (obligatorio)..."
            className="w-full px-2.5 py-1.5 text-sm bg-stone-50 border-2 border-zinc-900 focus:outline-none focus:bg-white font-medium"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enlace (opcional)"
              className="w-full px-2 py-1 text-xs bg-stone-50 border-2 border-zinc-900 focus:outline-none focus:bg-white"
            />
            <input
              type="text"
              value={priceApprox}
              onChange={(e) => setPriceApprox(e.target.value)}
              placeholder="Precio aprox. (ej. 30 €)"
              className="w-full px-2 py-1 text-xs bg-stone-50 border-2 border-zinc-900 focus:outline-none focus:bg-white"
            />
          </div>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas (talla, color, modelo...)"
            className="w-full px-2.5 py-1 text-xs bg-stone-50 border-2 border-zinc-900 focus:outline-none focus:bg-white"
          />
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="w-full py-1.5 px-3 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] text-xs font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {submitting ? 'Añadiendo...' : 'Añadir deseo'}
          </button>
        </form>
      )}
    </section>
  );
}
