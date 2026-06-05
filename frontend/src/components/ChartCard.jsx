import React from 'react';

export const ChartCard = ({ title, description, children, className = '' }) => {
  return (
    <div className={`glass rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-dark-700/60 transition-all duration-300 ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-slate-500 dark:text-dark-400 mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="w-full h-72">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
