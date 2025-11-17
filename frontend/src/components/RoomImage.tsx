import React, { useState } from 'react';

interface RoomImageProps {
  roomId: string;
  roomName: string;
}

// Professional meeting room images from Unsplash
const ROOM_IMAGES: Record<string, string> = {
  '101': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', // Modern office
  '102': 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80', // Conference room
  '103': 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80', // Large conference
  '104': 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80', // Executive room
  '105': 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800&q=80', // Premium suite
};

export const RoomImage: React.FC<RoomImageProps> = ({ roomId, roomName }) => {
  const [imageError, setImageError] = useState(false);
  
  const imageUrl = ROOM_IMAGES[roomId] || ROOM_IMAGES['101'];

  if (imageError) {
    return (
      <div 
        className="room-image" 
        style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '3rem',
          fontWeight: '800'
        }}
      >
        {roomName.charAt(0)}
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={roomName} 
      className="room-image"
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
};