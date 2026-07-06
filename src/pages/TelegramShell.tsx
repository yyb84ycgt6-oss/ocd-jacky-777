import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TelegramProvider } from '@/components/telegram/TelegramProvider';
import RoomHub from '@/components/telegram/RoomHub';
import SecurityCenter from '@/components/telegram/SecurityCenter';
import MusicLab from '@/components/telegram/MusicLab';
import CreatureLab from '@/components/telegram/CreatureLab';
import CardArena from '@/components/telegram/CardArena';

type ActiveRoom = 'hub' | 'security' | 'music' | 'creatures' | 'cards' | 'jackie' | 'jade' | 'store' | 'legal';

export default function TelegramShell() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeRoom, setActiveRoom] = useState<ActiveRoom>('hub');

  const handleNavigate = useCallback((roomId: string) => {
    switch (roomId) {
      case 'jackie':
        navigate('/');
        break;
      case 'jade':
      case 'store':
        navigate('/play');
        break;
      case 'security':
        setSearchParams({ room: 'security' }, { replace: true });
        setActiveRoom('security');
        break;
      case 'music':
        setSearchParams({ room: 'music' }, { replace: true });
        setActiveRoom('music');
        break;
      case 'creatures':
        setSearchParams({ room: 'creatures' }, { replace: true });
        setActiveRoom('creatures');
        break;
      case 'cards':
        setSearchParams({ room: 'cards' }, { replace: true });
        setActiveRoom('cards');
        break;
      case 'legal':
        setSearchParams({ room: 'legal' }, { replace: true });
        setActiveRoom('legal');
        break;
      default:
        setSearchParams({ room: 'hub' }, { replace: true });
        setActiveRoom('hub');
    }
  }, [navigate, setSearchParams]);

  useEffect(() => {
    const room = searchParams.get('room');
    if (!room) return;
    if (room === 'security' || room === 'music' || room === 'creatures' || room === 'cards' || room === 'hub' || room === 'legal') {
      setActiveRoom(room);
    }
  }, [searchParams]);

  return (
    <TelegramProvider>
      <div className="h-[100dvh] w-full overflow-hidden bg-background" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {activeRoom === 'hub' && <RoomHub onNavigate={handleNavigate} />}
        {activeRoom === 'security' && <SecurityCenter onBack={() => setActiveRoom('hub')} />}
        {activeRoom === 'music' && <MusicLab onBack={() => setActiveRoom('hub')} />}
        {activeRoom === 'creatures' && <CreatureLab onBack={() => setActiveRoom('hub')} />}
        {activeRoom === 'cards' && <CardArena onBack={() => setActiveRoom('hub')} />}
      </div>
    </TelegramProvider>
  );
}
