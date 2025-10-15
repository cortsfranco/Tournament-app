import React from 'react';

export const TrophyIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.7.3a1 1 0 0 0-1.4 0L8.6 3H1a1 1 0 0 0-1 1v3.6a1 1 0 0 0 .5.9l5.3 2.7-1.2 4.4a1 1 0 0 0 .5 1.2l.1.1 2.5 1.5.1.1a1 1 0 0 0 1 0l.1-.1 2.5-1.5.1-.1a1 1 0 0 0 .5-1.2l-1.2-4.4L22.5 8.5A1 1 0 0 0 23 7.6V4a1 1 0 0 0-1-1h-7.6l-2.7-2.7zM3.4 5H7V3.3l1.2 1.2a1 1 0 0 0 .7.3H15a1 1 0 0 0 .7-.3l1.2-1.2V5h3.6l-4 2H8.4l-4-2H3.4zM12 11.2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM5 20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v2z"/>
  </svg>
);

export const WhistleIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 10.32a9 9 0 0 1 13.54-7.78l-1.88 1.88A6.97 6.97 0 0 0 6 10.32V12h11v-1.68a2.5 2.5 0 0 1 5 0V12a5 5 0 0 1-5 5h-2.18a7 7 0 0 1-13.6-4.68zM4 10.32a7 7 0 0 0 9.24 6.34l-1.58-1.58A5 5 0 0 1 4 10.32z"/>
    </svg>
);

export const EditIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83zM3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>
    </svg>
);

export const TrashIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
);

export const UploadIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
    </svg>
);