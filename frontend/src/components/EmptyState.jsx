import React from 'react';
import { bgImage, OVERLAY_STRONG } from '../utils/media';

/**
 * Shown instead of a blank area whenever there is no data.
 * Pass `image` to render it over a photo with a green overlay.
 */
export default function EmptyState({
  emoji = '📭',
  title,
  description,
  actionLabel,
  onAction,
  image,
}) {
  const style = image
    ? { ...bgImage(image, OVERLAY_STRONG), backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;

  return (
    <div className={`empty-state${image ? ' on-image' : ''}`} style={style}>
      <div className="emoji" aria-hidden="true">{emoji}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          className={image ? 'btn btn-light' : 'btn btn-primary'}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
