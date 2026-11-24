"use client"

import Image from 'next/image'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion"

interface ImageExample {
  id: string
  image: string
  alt: string
  prompt: string
}

interface BlogImageGridProps {
  examples: ImageExample[]
}

export function BlogImageGrid({ examples }: BlogImageGridProps) {
  return (
    <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
      {examples.map((example) => (
        <div key={example.id} className="space-y-2">
          <div className="relative group overflow-hidden rounded-lg aspect-video">
            <Image 
              src={example.image} 
              alt={example.alt}
              fill
              sizes="(min-width: 768px) 640px, 100vw"
              quality={80}
              className="w-full rounded-lg object-cover shadow-lg transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value={`prompt-${example.id}`} className="border-none">
              <AccordionTrigger className="text-left py-2 text-sm font-medium hover:no-underline">
                View Prompt
              </AccordionTrigger>
              <AccordionContent className="pt-0 pb-2">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700">
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 leading-relaxed">
                    {example.prompt}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ))}
    </div>
  )
} 