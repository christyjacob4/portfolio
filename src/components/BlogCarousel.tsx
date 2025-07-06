"use client"

import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "./ui/carousel"

interface BlogExample {
  id: string
  title: string
  image: string
  alt: string
  prompt: string
}

interface BlogCarouselProps {
  examples: BlogExample[]
}

export function BlogCarousel({ examples }: BlogCarouselProps) {
  return (
    <div className="py-4">
      <Carousel 
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full max-w-6xl mx-auto"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {examples.map((example) => (
            <CarouselItem key={example.id} className="pl-2 md:pl-4 basis-full">
              <div className="relative group cursor-pointer">
                <img 
                  src={example.image} 
                  alt={example.alt} 
                  className="w-full aspect-video rounded-lg object-cover shadow-lg transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* Hover overlay with prompt */}
                <div className="absolute inset-0 bg-black bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex flex-col justify-center p-4">
                  <h3 className="text-white text-sm font-semibold mb-3 text-center">
                    {example.title}
                  </h3>
                  <div className="max-h-32 overflow-y-auto">
                    <p className="text-xs font-mono text-white leading-relaxed">
                      {example.prompt}
                    </p>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )
} 