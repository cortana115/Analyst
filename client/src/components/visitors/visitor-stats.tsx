
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from "@/components/ui/card";

const cities = [
  "New York 🗽", "London 🇬🇧", "Tokyo 🗼", "Paris 🗼", "Sydney 🦘", 
  "Singapore 🇸🇬", "Dubai 🌇", "Toronto 🍁", "Berlin 🍺", "Mumbai 🎭"
];

export function VisitorStats() {
  const [popup, setPopup] = useState<{ city: string; show: boolean }>({ city: '', show: false });
  const [count, setCount] = useState(() => {
    const saved = localStorage.getItem('visitorCount');
    return saved ? parseInt(saved, 10) : 69;
  });

  useEffect(() => {
    localStorage.setItem('visitorCount', count.toString());
  }, [count]);

  useEffect(() => {
    const popupInterval = setInterval(() => {
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      setPopup({ city: randomCity, show: true });
      setTimeout(() => setPopup(prev => ({ ...prev, show: false })), 3000);
    }, 8000);

    const countInterval = setInterval(() => {
      if (Math.random() < 0.5) {
        setCount(prev => prev + 1);
      }
    }, 4000);

    return () => {
      clearInterval(popupInterval);
      clearInterval(countInterval);
    };
  }, []);

  return (
    <>
      <Card className="relative mx-auto max-w-md bg-gray-900/90 border-gray-800 p-4 my-8">
        <div className="text-center">
          <span className="text-sm text-gray-400">👥 Associant Tasks Completed:</span>
          <div className="relative h-12 overflow-hidden mt-1">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={count}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent"
              >
                {count} 🎉
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {popup.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 20 }}
            exit={{ opacity: 0, y: -50, x: 20 }}
            className="fixed bottom-4 left-0 z-50"
          >
            <Card className="bg-gray-900/90 border-gray-800 p-3">
              <span className="text-sm text-gray-200">
                ✨ New visitor from {popup.city}
              </span>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
