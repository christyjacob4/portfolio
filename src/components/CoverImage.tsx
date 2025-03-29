import { cn } from "@/lib/utils";

interface CoverImageProps {
  title: string;
  className?: string;
}

export function CoverImage({ title, className }: CoverImageProps) {
  return (
    <div 
      className={cn(
        "w-full h-full flex items-center justify-center bg-white dark:bg-black relative overflow-hidden",
        "transition-colors duration-300 group-hover/image:bg-neutral-50 dark:group-hover/image:bg-neutral-900",
        "bg-[size:40px_40px]",
        "after:absolute after:inset-0 after:bg-[radial-gradient(circle,rgba(0,0,0,0.07)_1px,transparent_1px)] after:bg-[size:40px_40px] dark:after:bg-[radial-gradient(circle,rgba(255,255,255,0.07)_1px,transparent_1px)] after:transition-transform after:duration-500 group-hover/image:after:scale-[0.97]",
        "before:absolute before:inset-0 before:bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] before:bg-[size:40px_40px] dark:before:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] before:transition-transform before:duration-500 group-hover/image:before:scale-[0.97]",
        className
      )}
    >
      {/* Horizontal dashed lines */}
      <div className="absolute inset-0 pointer-events-none transition-transform duration-500 group-hover/image:scale-[1.02]">
        <div className="w-full h-px border-t border-dashed border-neutral-200 dark:border-neutral-800 opacity-40 absolute top-1/2 transform -translate-y-[100px]"></div>
        <div className="w-full h-px border-t border-dashed border-neutral-200 dark:border-neutral-800 opacity-60 absolute top-1/2"></div>
        <div className="w-full h-px border-t border-dashed border-neutral-200 dark:border-neutral-800 opacity-40 absolute top-1/2 transform translate-y-[100px]"></div>
        
        {/* Value indicators on dashed lines */}
        <div className="absolute right-3 top-1/2 transform -translate-y-[100px] font-mono text-[10px] text-neutral-400 dark:text-neutral-600">710</div>
        <div className="absolute right-3 top-1/2 font-mono text-[10px] text-neutral-400 dark:text-neutral-600">530</div>
        <div className="absolute right-3 top-1/2 transform translate-y-[100px] font-mono text-[10px] text-neutral-400 dark:text-neutral-600">350</div>
        
        {/* Vertical axis marker */}
        <div className="absolute h-full w-px border-r border-dashed border-neutral-200 dark:border-neutral-800 opacity-25 left-12"></div>
        <div className="absolute h-full w-px border-r border-dashed border-neutral-200 dark:border-neutral-800 opacity-25 right-12"></div>
      </div>
      
      <div className="p-8 w-full h-full flex items-center justify-center transition-transform duration-300 group-hover/image:scale-105 relative z-10">
        <div className="relative">
          <h3 
            className="text-4xl md:text-5xl lg:text-6xl font-semibold text-black dark:text-white tracking-tight"
            style={{ 
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 600,
              letterSpacing: '-0.025em'
            }}
          >
            {title}
          </h3>
          
          {/* Small marker lines on the sides of text */}
          <div className="absolute -left-4 top-1/2 w-2 h-px bg-neutral-400 dark:bg-neutral-600"></div>
          <div className="absolute -right-4 top-1/2 w-2 h-px bg-neutral-400 dark:bg-neutral-600"></div>
        </div>
      </div>
      
      {/* Bottom right position indicator */}
      <div className="absolute bottom-3 right-3 font-mono text-[10px] text-neutral-400 dark:text-neutral-600">
        0
      </div>
      
      {/* Bottom left indicator */}
      <div className="absolute bottom-3 left-3 font-mono text-[10px] text-neutral-400 dark:text-neutral-600">
        -150
      </div>
    </div>
  );
} 