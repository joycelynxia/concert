// MediaSlideshow.tsx
import Slider from 'react-slick';
import { ConcertMemory } from 'types/types';

interface MediaSlideshowProps {
  media: ConcertMemory[];
}

const MediaSlideshow: React.FC<MediaSlideshowProps> = ({ media }) => {
  const settings = {
    dots: true,
    infinite: false,
    speed: 0,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  if (!media || media.length === 0) {
    return <p>No media to show.</p>;
  }

  return (
    <Slider {...settings}>
      {media.map((item, idx) => (
        <div key={item._id || idx}>
          {item.type === 'photo' && (
            <img
              src={`http://localhost:4000${item.content}`}
              alt="concert memory"
              style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
              onError={(e) => console.error('Image failed to load:', item.content)}
            />
          )}
          {item.type === 'video' && (
            <video
              controls
              src={`http://localhost:4000${item.content}`}
              style={{ width: '100%', maxHeight: '500px' }}
            />
          )}
        </div>
      ))}
    </Slider>
  );
};

export default MediaSlideshow;
