
import React from 'react';
import { Activity } from '../types';

interface ActivityFeedProps {
  activities: Activity[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mt-1.5"></div>
            <div className="w-px h-full bg-white/20"></div>
          </div>
          <div>
            <p className="text-white">{activity.description}</p>
            <p className="text-xs text-gray-400">
              {activity.user} em {new Date(activity.timestamp).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;
