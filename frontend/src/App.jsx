import { useCallback, useEffect, useMemo, useState } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import {
  authMember,
  clearToken,
  createWish,
  deleteWish,
  getBoard,
  getMembers,
  getToken,
  togglePurchase,
} from './api';
import BoardColumn from './components/BoardColumn';
import PinLogin from './components/PinLogin';
import SnowBackground from './components/SnowBackground';

const FONT_SIZES = [
  { id: 'sm', label: 'A-', px: '14px', title: 'Letra pequeña' },
  { id: 'md', label: 'A', px: '16px', title: 'Letra normal' },
  { id: 'lg', label: 'A+', px: '19px', title: 'Letra grande' },
];

function getDisplayName(memberName, currentMemberName) {
  if (!currentMemberName || currentMemberName.trim().toLowerCase() !== 'mayte') {
    return memberName;
  }
  const normalized = memberName.trim().toLowerCase();
  if (normalized === 'papá' || normalized === 'papa') return 'Suegrito';
  if (normalized === 'mamá' || normalized === 'mama') return 'Suegrita';
  return memberName;
}

function getDaysUntilReyes() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const year = now.getFullYear();
  let target = new Date(year, 0, 6);
  if (now > target) target = new Date(year + 1, 0, 6);
  return Math.round((target - now) / 86400000);
}

export default function App() {
  const [token, setTokenState] = useState(() => getToken());
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(!getToken());
  const [membersError, setMembersError] = useState('');

  const [board, setBoard] = useState(null);
  const [boardLoading, setBoardLoading] = useState(Boolean(getToken()));
  const [boardError, setBoardError] = useState('');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('reyes_font_size') || 'md');

  useEffect(() => {
    const selected = FONT_SIZES.find((f) => f.id === fontSize) || FONT_SIZES[1];
    document.documentElement.style.fontSize = selected.px;
    localStorage.setItem('reyes_font_size', selected.id);
  }, [fontSize]);

  const daysUntilReyes = useMemo(() => getDaysUntilReyes(), []);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    setMembersError('');
    try {
      const data = await getMembers();
      setMembers(data);
    } catch (err) {
      setMembersError(err.message || 'No se pudieron cargar los miembros.');
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const loadBoard = useCallback(async () => {
    setBoardLoading(true);
    setBoardError('');
    try {
      const data = await getBoard();
      setBoard(data);
    } catch (err) {
      if (err.status === 401) {
        setTokenState(null);
        setBoard(null);
      } else {
        setBoardError(err.message || 'Error al cargar el tablero.');
      }
    } finally {
      setBoardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadBoard();
    } else {
      loadMembers();
    }
  }, [token, loadBoard, loadMembers]);

  const handleLogin = async (memberId, pin) => {
    const data = await authMember(memberId, pin);
    setTokenState(data.access_token);
  };

  const handleLogout = () => {
    clearToken();
    setTokenState(null);
    setBoard(null);
  };

  const handleCreateWish = async (payload) => {
    await createWish(payload);
    await loadBoard();
  };

  const handleDeleteWish = async (wishId) => {
    await deleteWish(wishId);
    await loadBoard();
  };

  const handleTogglePurchase = async (wishId) => {
    try {
      await togglePurchase(wishId);
      await loadBoard();
    } catch (err) {
      alert(err.message || 'No se pudo actualizar la reserva.');
      await loadBoard();
    }
  };

  const scrollToColumn = (memberId) => {
    const el = document.getElementById(`col-${memberId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  if (!token) {
    return (
      <PinLogin
        members={members}
        loading={membersLoading}
        error={membersError}
        onLogin={handleLogin}
      />
    );
  }

  const currentColumn = board?.columns?.find((c) => c.is_me);
  const currentMemberName = currentColumn?.name || '';

  const orderedColumns = board
    ? [...board.columns].sort((a, b) => (a.is_me === b.is_me ? 0 : a.is_me ? -1 : 1))
    : [];

  return (
    <div className="min-h-screen relative flex flex-col">
      <SnowBackground />

      <header className="relative z-10 px-4 pt-5 pb-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <svg
              className="w-10 h-10 shrink-0 star-glow"
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
            <div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#F7F9F8] leading-none">
                {board?.family?.name || 'Reyes Magos'}
              </h1>
              <p className="text-xs text-[#F4DC9B] mt-1">
                Tablero familiar · Sin spoilers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              className="hidden sm:inline-flex items-baseline gap-1.5 bg-[#B3202A] text-[#F7F9F8] px-3.5 py-1 rounded-full text-xs font-medium shadow-[0_0_0_2px_#E3B34B]"
              role="status"
            >
              <b className="font-display text-base leading-none">{daysUntilReyes}</b>
              <span>
                {daysUntilReyes === 0
                  ? '¡Hoy llegan los Reyes!'
                  : daysUntilReyes === 1
                    ? 'día para los Reyes'
                    : 'días para los Reyes'}
              </span>
            </div>

            <div className="inline-flex rounded-xl overflow-hidden border border-[#E3B34B]/50 bg-white/10">
              {FONT_SIZES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFontSize(f.id)}
                  title={f.title}
                  className={`px-2 py-1.5 text-xs font-bold cursor-pointer transition-colors ${
                    fontSize === f.id
                      ? 'bg-[#E3B34B] text-[#082519]'
                      : 'text-[#F4DC9B] hover:bg-white/20'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={loadBoard}
              disabled={boardLoading}
              title="Refrescar tablero"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#F4DC9B] border border-[#E3B34B]/50 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${boardLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title="Cambiar de usuario"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E3B34B] hover:bg-[#F4DC9B] text-[#082519] text-xs font-bold uppercase cursor-pointer shadow-[0_3px_0_#b98d2c] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Salir
            </button>
          </div>
        </div>

        {orderedColumns.length > 0 && (
          <nav className="max-w-7xl mx-auto mt-4 flex items-center gap-2 overflow-x-auto pb-1">
            {orderedColumns.map((col) => (
              <button
                key={col.member_id}
                type="button"
                onClick={() => scrollToColumn(col.member_id)}
                className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 cursor-pointer transition-colors border ${
                  col.is_me
                    ? 'bg-[#E3B34B] text-[#082519] border-[#F4DC9B]'
                    : 'bg-white/10 text-[#F7F9F8] border-white/20 hover:bg-white/20'
                }`}
              >
                {col.avatar_emoji} {col.is_me ? 'Tú' : getDisplayName(col.name, currentMemberName)}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="relative z-10 flex-1 px-4 py-3 md:overflow-x-auto">
        {boardLoading && !board ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <p className="font-display text-xl font-bold text-[#F4DC9B] animate-pulse">
              Preparando los camellos...
            </p>
            <p className="text-xs text-[#F7F9F8]/70 mt-1">
              Si el servidor estaba dormido, tardará unos segundos en despertar.
            </p>
          </div>
        ) : boardError ? (
          <div className="max-w-md mx-auto mt-10 p-4 bg-[#f0e1e2] border-2 border-[#B3202A] rounded-xl text-sm font-bold text-[#8C1720]">
            {boardError}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-start gap-5 pb-6">
            {orderedColumns.map((column) => (
              <BoardColumn
                key={column.member_id}
                column={column}
                displayName={getDisplayName(column.name, currentMemberName)}
                currentMemberId={board.current_member_id}
                onCreateWish={handleCreateWish}
                onTogglePurchase={handleTogglePurchase}
                onDeleteWish={handleDeleteWish}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
