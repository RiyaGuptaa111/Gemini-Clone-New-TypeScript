import React from 'react';

const Sidebar = ({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  isOpen
}) => {
  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#1e1f20] flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}
    >
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="flex items-center gap-3 px-4 py-3 w-full bg-[#131314] hover:bg-[#2a2b2d] rounded-full text-sm font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        <div className="text-xs font-semibold text-gray-500 uppercase px-4 py-2 mt-4">
          Recent
        </div>

        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`
              flex items-center gap-3 px-4 py-2 w-full text-left rounded-lg text-sm transition-colors group
              ${currentSessionId === session.id ? 'bg-[#37393b]' : 'hover:bg-[#2a2b2d]'}
            `}
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span className="truncate flex-1">
              {session.title || 'Untitled chat'}
            </span>
          </button>
        ))}

        {sessions.length === 0 && (
          <div className="px-4 py-4 text-xs text-gray-500 text-center italic">
            No recent chats
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#3c4043] space-y-2">
        <button className="flex items-center gap-3 px-4 py-2 w-full hover:bg-[#2a2b2d] rounded-lg text-sm transition-colors">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Help
        </button>

        <button className="flex items-center gap-3 px-4 py-2 w-full hover:bg-[#2a2b2d] rounded-lg text-sm transition-colors">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          Settings
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
