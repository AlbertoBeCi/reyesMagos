import { useCallback, useEffect, useState } from 'react';
import { LogOut, RefreshCw, Sparkles } from 'lucide-react';
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

export default function App() {
  const [token, setTokenState] = useState(() => getToken());
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(!getToken());
  const [membersError, setMembersError] = useState('');

  const [board, setBoard] = useState(null);
  const [boardLoading, setBoardLoading] = useState(Boolean(getToken()));
  const [boardError, setBoardError] = useState('');

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

  const orderedColumns = board
    ? [...board.columns].sort((a, b) => (a.is_me === b.is_me ? 0 : a.is_me ? -1 : 1))
    : [];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <header className="sticky top-0 z-20 bg-white border-b-2 border-zinc-900 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-lime-400 border-2 border-zinc-900">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h1 className="font-black text-lg leading-none">
                {board?.family?.name || 'Reyes Magos'}
              </h1>
              <p className="text-[11px] font-semibold text-zinc-500">
                Tablero familiar · Sin spoilers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadBoard}
              disabled={boardLoading}
              title="Refrescar tablero"
              className="p-2 bg-stone-100 hover:bg-lime-400 border-2 border-zinc-900 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${boardLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title="Cambiar de usuario"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-red-100 border-2 border-zinc-900 text-xs font-black uppercase cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Salir
            </button>
          </div>
        </div>

        {orderedColumns.length > 0 && (
          <nav className="max-w-7xl mx-auto mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            {orderedColumns.map((col) => (
              <button
                key={col.member_id}
                type="button"
                onClick={() => scrollToColumn(col.member_id)}
                className={`px-2.5 py-1 border-2 border-zinc-900 text-xs font-bold shrink-0 cursor-pointer ${
                  col.is_me ? 'bg-lime-400' : 'bg-stone-50 hover:bg-stone-200'
                }`}
              >
                {col.avatar_emoji} {col.is_me ? 'Tú' : col.name}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1 p-4 overflow-x-auto">
        {boardLoading && !board ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <p className="text-lg font-black animate-pulse">Preparando los camellos...</p>
            <p className="text-xs text-zinc-500 mt-1">
              Si el servidor estaba dormido, tardará unos segundos en despertar.
            </p>
          </div>
        ) : boardError ? (
          <div className="max-w-md mx-auto mt-10 p-4 bg-red-100 border-2 border-zinc-900 text-sm font-bold text-red-900">
            {boardError}
          </div>
        ) : (
          <div className="flex items-start gap-4 snap-x snap-mandatory pb-4">
            {orderedColumns.map((column) => (
              <BoardColumn
                key={column.member_id}
                column={column}
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
