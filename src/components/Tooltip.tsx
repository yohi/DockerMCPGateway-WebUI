import { ReactNode, useState } from 'react';

interface TooltipProps {
    content: string;
    children: ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    maxWidth?: string;
}

export default function Tooltip({
    content,
    children,
    position = 'top',
    maxWidth = 'max-w-xs'
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    if (!content) {
        return <>{children}</>;
    }

    const positionClasses = {
        top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    };

    const arrowClasses = {
        top: 'top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800',
        bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800',
        left: 'left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-800',
        right: 'right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-800'
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div
                    className={`absolute z-50 ${positionClasses[position]} ${maxWidth} pointer-events-none`}
                    role="tooltip"
                >
                    <div className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 shadow-lg">
                        {content}
                    </div>
                    <div className={`absolute w-0 h-0 ${arrowClasses[position]}`}></div>
                </div>
            )}
        </div>
    );
}
