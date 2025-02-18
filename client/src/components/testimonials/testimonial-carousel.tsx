
import React from 'react';
import { motion } from 'framer-motion';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card } from "@/components/ui/card"
import AutoPlay from 'embla-carousel-autoplay'

const testimonials = [
  {
    text: "This AI assistant helped me navigate complex legal docs in minutes! 🤯",
    author: "Sarah M., Senior Associate",
    rating: "⭐⭐⭐⭐⭐",
    institution: {
      name: "Sullivan and Cromwell",
      logo: "https://insol.azureedge.net/cmsstorage/insol/media/companies/sullivan-cromwell.png"
    }
  },
  {
    text: "Got crystal-clear financial advice without the jargon. Love it! 💰",
    author: "Mike R., Vice President",
    rating: "⭐⭐⭐⭐⭐",
    institution: {
      name: "Goldman Sachs",
      logo: "https://www.pngkit.com/png/full/191-1913578_goldman-sachs-goldman-sachs-logo-transparent.png"
    }
  },
  {
    text: "Like having a Wall Street expert in my pocket 24/7! 📱",
    author: "Alex K., Investment Director",
    rating: "⭐⭐⭐⭐⭐",
    institution: {
      name: "Goldman Sachs",
      logo: "https://www.pngkit.com/png/full/191-1913578_goldman-sachs-goldman-sachs-logo-transparent.png"
    }
  }
];

export default function TestimonialCarousel() {
  const plugin = React.useRef(
    AutoPlay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: false })
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl mx-auto px-4 py-12"
    >
      <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent">
        What Our Users Say 🗣️
      </h2>
      <Carousel
        opts={{ loop: true }}
        plugins={[plugin.current]}
        className="w-full"
      >
        <CarouselContent>
          {testimonials.map((testimonial, index) => (
            <CarouselItem key={index}>
              <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm p-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                  <p className="text-xl mb-4">{testimonial.text}</p>
                  <p className="text-gray-400 mb-2">{testimonial.author}</p>
                  <p className="text-lg mb-4">{testimonial.rating}</p>
                  <img
                    src={testimonial.institution.logo}
                    alt={testimonial.institution.name}
                    className="h-8 mx-auto object-contain filter brightness-0 invert opacity-50"
                  />
                </motion.div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="border-gray-700 hover:bg-gray-800/50" />
        <CarouselNext className="border-gray-700 hover:bg-gray-800/50" />
      </Carousel>
    </motion.div>
  )
}
