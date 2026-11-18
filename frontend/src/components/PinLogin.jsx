import { useState } from 'react';
import { KeyRound, Lock } from 'lucide-react';
import SnowBackground from './SnowBackground';

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
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <SnowBackground />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <svg
            className="w-16 h-16 mx-auto mb-2 star-glow"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <polygon
              points="50,4 61,37 96,37 68,58 78,92 50,71 22,92 32,58 4,37 39,37"
              fill="#E3B34B"
              stroke="#F4DC9B"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#F7F9F8] tracking-tight">
            Reyes Magos
          </h1>
          <p className="text-sm text-[#F4DC9B] mt-1">
            Elige tu perfil e introduce tu PIN de 4 dígitos para entrar al tablero.
          </p>
        </div>

        <div className="gift-card p-6 pl-8">
          {loading ? (
            <div className="py-10 text-center">
              <p className="font-bold text-[#0F3B2A] animate-pulse">
                Preparando los camellos...
              </p>
              <p className="text-xs text-[#5C6E64] mt-1">
                Conectando con el servidor familiar
              </p>
            </div>
          ) : error ? (
            <div className="p-3 bg-[#f0e1e2] border border-[#B3202A] rounded-lg text-sm font-medium text-[#8C1720]">
              {error}
            </div>
          ) : (
            <>
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#5C6E64] mb-3">
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
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0F3B2A] text-[#F7F9F8] border-[#E3B34B] shadow-md -translate-y-0.5'
                            : 'bg-white text-[#1B2A22] border-[#c9d4ce] hover:border-[#0F3B2A]'
                        }`}
                      >
                        <span className="text-2xl">{member.avatar_emoji}</span>
                        <span className="font-bold text-sm truncate w-full text-center">
                          {member.name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-[#E3B34B] text-[#082519]'
                              : 'bg-[#F7F9F8] text-[#5C6E64] border border-[#c9d4ce]'
                          }`}
                        >
                          {member.has_pin ? 'PIN activo' : 'Crear PIN'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedMember && (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 pt-4 border-t border-dashed border-[#c9d4ce]"
                >
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-bold text-[#0F3B2A] mb-1.5">
                      {selectedMember.has_pin ? (
                        <>
                          <Lock className="w-4 h-4 text-[#B3202A]" />
                          Introduce tu PIN ({selectedMember.name})
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4 text-[#B3202A]" />
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
                      className="w-full px-3 py-2.5 text-center text-2xl tracking-[0.5em] font-bold bg-white text-[#1B2A22] border-2 border-[#c9d4ce] rounded-xl focus:outline-none focus:border-[#0F3B2A]"
                    />
                    {!selectedMember.has_pin && (
                      <p className="text-xs text-[#5C6E64] mt-1">
                        Es tu primera vez: este PIN quedará guardado para tus próximos accesos.
                      </p>
                    )}
                  </div>

                  {localError && (
                    <div className="p-2.5 bg-[#f0e1e2] border border-[#B3202A] rounded-lg text-xs font-bold text-[#8C1720]">
                      {localError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || pin.length !== 4}
                    className="btn-berry w-full py-2.5 px-4 rounded-xl font-bold text-sm uppercase tracking-wide disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Entrando...' : 'Entrar al tablero'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
