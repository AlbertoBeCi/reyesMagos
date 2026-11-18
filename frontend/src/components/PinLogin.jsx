import { useState } from 'react';
import { KeyRound, Lock, Sparkles } from 'lucide-react';

export default function PinLogin({ members, loading, error, onLogin }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setPin('');
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;
    if (!/^\d{4}$/.test(pin)) {
      setLocalError('El PIN debe tener exactamente 4 dígitos.');
      return;
    }

    setSubmitting(true);
    setLocalError('');
    try {
      await onLogin(selectedMember.id, pin);
    } catch (err) {
      setLocalError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-2 border-zinc-900 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center justify-center w-9 h-9 bg-lime-400 border-2 border-zinc-900">
            <Sparkles className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-black tracking-tight">Reyes Magos</h1>
        </div>
        <p className="text-sm text-zinc-600 mb-6">
          Elige tu perfil e introduce tu PIN de 4 dígitos para entrar al tablero.
        </p>

        {loading ? (
          <div className="py-10 text-center">
            <p className="font-bold text-zinc-800 animate-pulse">
              Preparando los camellos...
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Conectando con el servidor familiar
            </p>
          </div>
        ) : error ? (
          <div className="p-3 bg-red-100 border-2 border-zinc-900 text-sm font-medium text-red-900">
            {error}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                ¿Quién eres?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {members.map((member) => {
                  const isSelected = selectedMember?.id === member.id;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleSelectMember(member)}
                      className={`flex flex-col items-center gap-1 p-3 border-2 border-zinc-900 transition-transform active:translate-y-0.5 cursor-pointer ${
                        isSelected
                          ? 'bg-lime-400 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] -translate-y-0.5'
                          : 'bg-stone-50 hover:bg-stone-200'
                      }`}
                    >
                      <span className="text-2xl">{member.avatar_emoji}</span>
                      <span className="font-bold text-sm truncate w-full text-center">
                        {member.name}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 border border-zinc-900 bg-white">
                        {member.has_pin ? 'PIN activo' : 'Crear PIN'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedMember && (
              <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t-2 border-zinc-900">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-bold mb-1.5">
                    {selectedMember.has_pin ? (
                      <>
                        <Lock className="w-4 h-4" />
                        Introduce tu PIN ({selectedMember.name})
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        Crea tu PIN de 4 dígitos ({selectedMember.name})
                      </>
                    )}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    pattern="\d{4}"
                    autoFocus
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full px-3 py-2.5 text-center text-2xl tracking-[0.5em] font-black bg-stone-50 border-2 border-zinc-900 focus:outline-none focus:bg-white"
                  />
                  {!selectedMember.has_pin && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Es tu primera vez: este PIN quedará guardado para tus próximos accesos.
                    </p>
                  )}
                </div>

                {localError && (
                  <div className="p-2.5 bg-red-100 border-2 border-zinc-900 text-xs font-bold text-red-900">
                    {localError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || pin.length !== 4}
                  className="w-full py-2.5 px-4 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] font-black text-sm uppercase tracking-wide cursor-pointer"
                >
                  {submitting ? 'Entrando...' : 'Entrar al tablero'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
