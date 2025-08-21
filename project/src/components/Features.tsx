import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Globe, Lock, Eye, Server } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: 'Military-Grade Security',
      description: 'Advanced encryption and security protocols protect your browsing data from any threats.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized proxy servers worldwide ensure minimal latency and maximum speed.',
    },
    {
      icon: Globe,
      title: 'Global Network',
      description: 'Access content from anywhere with our distributed network of proxy servers.',
    },
    {
      icon: Lock,
      title: 'Zero Logs',
      description: 'We never store or track your browsing activity. Your privacy is guaranteed.',
    },
    {
      icon: Eye,
      title: 'Anonymous Browsing',
      description: 'Complete anonymity with IP masking and browser fingerprint protection.',
    },
    {
      icon: Server,
      title: 'High Availability',
      description: '99.9% uptime guaranteed with redundant infrastructure and failover systems.',
    },
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the most advanced proxy browsing platform with enterprise-grade features.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-gray-50 rounded-3xl p-8 hover:bg-gray-100 transition-all duration-300"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-green-400 rounded-2xl flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;