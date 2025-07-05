"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion"

interface BlogExample {
  id: string
  title: string
  image: string
  alt: string
  prompt: string
}

interface BlogCarouselProps {
  examples: BlogExample[]
  direction: "left" | "right"
}

export function BlogCarousel({ examples, direction }: BlogCarouselProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Create duplicated items for infinite scroll
  const duplicatedExamples = [...examples, ...examples]
  
  // Calculate the width for one set of items (width + gap)
  const itemWidth = 672 + 16 // 42rem (672px) width + 16px gap
  const totalWidth = examples.length * itemWidth
  
  return (
    <div className="relative overflow-hidden py-2">
      <motion.div
        className="flex gap-4"
        initial={{ x: direction === "left" ? 0 : -totalWidth }}
        animate={{
          x: direction === "left" ? [-totalWidth, 0] : [0, -totalWidth],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: isHovered ? 999999 : 30,
            ease: "linear",
          },
        }}
        style={{
          width: `${duplicatedExamples.length * itemWidth}px`,
        }}
      >
        {duplicatedExamples.map((example, index) => (
          <motion.div
            key={`${example.id}-${index}`}
            className="flex-shrink-0 w-[42rem] relative group cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <img 
              src={example.image} 
              alt={example.alt} 
              className="w-full aspect-video rounded-lg object-cover shadow-lg"
            />
            
            {/* Hover overlay with prompt */}
            <div className="absolute inset-0 bg-black bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex flex-col justify-center p-6">
              <h3 className="text-white text-lg font-semibold mb-4 text-center">
                {example.title}
              </h3>
              <div className="max-h-48 overflow-y-auto">
                <p className="text-xs font-mono text-white leading-relaxed">
                  {example.prompt}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
} 